"""Dump the attendance tables to CSV so the record survives outside Supabase.

Run by .github/workflows/monthly-backup.yml, but works locally too:

    SUPABASE_URL=https://xxxx.supabase.co \
    SUPABASE_SERVICE_ROLE_KEY=... \
    python3 scripts/backup_records.py

Reads every row in pages, so the dump is complete regardless of PostgREST's
1000-row page size. Writes into backups/ (git-ignored).
"""

import csv
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

PAGE = 1000
TABLES = {
    "attendance_entries": ["id", "worker_id", "occurred_at", "local_date", "local_time", "source", "created_at"],
    "staff_profiles": ["id", "nickname", "title", "initials", "color", "avatar", "active", "created_at"],
}
OUT_DIR = Path(__file__).resolve().parent.parent / "backups"


def fetch_page(base_url, key, table, offset):
    query = urllib.parse.urlencode(
        {
            "select": ",".join(TABLES[table]),
            "order": "created_at.asc" if table == "attendance_entries" else "nickname.asc",
            "limit": PAGE,
            "offset": offset,
        }
    )
    request = urllib.request.Request(
        f"{base_url}/rest/v1/{table}?{query}",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
            "Prefer": "count=none",
        },
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def dump_table(base_url, key, table, target):
    rows = []
    offset = 0
    while True:
        page = fetch_page(base_url, key, table, offset)
        rows.extend(page)
        if len(page) < PAGE:
            break
        offset += PAGE
        if offset > 500_000:
            raise SystemExit(f"{table}: refusing to page past 500k rows")
    with target.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=TABLES[table], extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    return len(rows)


def main():
    base_url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not base_url or not key:
        raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")

    OUT_DIR.mkdir(exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for table in TABLES:
        target = OUT_DIR / f"{table}-{stamp}.csv"
        try:
            count = dump_table(base_url, key, table, target)
        except urllib.error.HTTPError as error:
            raise SystemExit(f"{table}: HTTP {error.code} — {error.read()[:300]!r}")
        print(f"{table}: {count} rows -> {target}")
        if count == 0:
            print(f"::warning::{table} came back empty; check the service role key.", file=sys.stderr)


if __name__ == "__main__":
    main()
