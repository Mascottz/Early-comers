"""Shared attendance service for Attendance by ProofsTech."""

from __future__ import annotations

import csv
import io
import os
import sqlite3
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

import qrcode
import qrcode.image.svg
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
DB = DATA / "attendance.db"
PUBLIC = ROOT / "public"
OFFICE_CODE = os.getenv("OFFICE_CODE", "PROOFSTECH-HQ-2026")

app = FastAPI(title="Attendance by ProofsTech", version="1.0.0")


class CheckIn(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    worker_id: str
    occurred_at: int
    source: str = "Office QR"
    offline_id: str | None = None
    local_date: str | None = None
    local_time: str | None = None


class NewWorker(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    title: str = Field(min_length=2, max_length=80)


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB)
    connection.row_factory = sqlite3.Row
    return connection


def worker_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "title": row["title"],
        "initials": row["initials"],
        "color": row["color"],
        "avatar": row["avatar"],
        "active": bool(row["active"]),
    }


def entry_dict(row: sqlite3.Row) -> dict:
    local_time = datetime.fromtimestamp(row["occurred_at"] / 1000)
    return {
        "id": row["id"],
        "workerId": row["worker_id"],
        "date": row["work_date"],
        "time": row["clock"] or local_time.strftime("%H:%M"),
        "timestamp": row["occurred_at"],
        "source": row["source"],
        "synced": True,
    }


def initialise() -> None:
    DATA.mkdir(exist_ok=True)
    with connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS workers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                title TEXT NOT NULL,
                initials TEXT NOT NULL,
                color TEXT NOT NULL,
                avatar INTEGER NOT NULL,
                active INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS entries (
                id TEXT PRIMARY KEY,
                worker_id TEXT NOT NULL,
                occurred_at INTEGER NOT NULL,
                source TEXT NOT NULL,
                work_date TEXT NOT NULL,
                clock TEXT,
                UNIQUE(worker_id, work_date)
            );
            """
        )
        columns = {row["name"] for row in db.execute("PRAGMA table_info(entries)")}
        if "clock" not in columns:
            db.execute("ALTER TABLE entries ADD COLUMN clock TEXT")
            db.execute("UPDATE entries SET clock = strftime('%H:%M', occurred_at / 1000, 'unixepoch', 'localtime')")
        if db.execute("SELECT COUNT(*) FROM workers").fetchone()[0] == 0:
            workers = [
                ("w1", "Amara Okafor", "Product Designer", "AO", "#e4774f", 1),
                ("w2", "Tobi Adeyemi", "Engineering", "TA", "#9aaf83", 2),
                ("w3", "Zainab Bello", "Operations", "ZB", "#d3a74e", 3),
                ("w4", "Kelechi Eze", "Engineering", "KE", "#809fa3", 4),
                ("w5", "Maya Nwosu", "People and Culture", "MN", "#bd8b83", 5),
                ("w6", "David Kalu", "Finance", "DK", "#8f9b70", 6),
                ("w7", "Sade Alabi", "Customer Experience", "SA", "#c1785d", 3),
                ("w8", "Femi Ojo", "Partnerships", "FO", "#7d9c8b", 2),
            ]
            db.executemany(
                "INSERT INTO workers VALUES (?, ?, ?, ?, ?, ?, 1)", workers
            )
        if db.execute("SELECT COUNT(*) FROM entries").fetchone()[0] == 0:
            schedule = [
                ("w2", "07:56"), ("w6", "08:04"), ("w3", "08:18"),
                ("w5", "08:27"), ("w4", "08:36"), ("w8", "08:51"),
                ("w7", "09:06"),
            ]
            for day_offset in range(7, 0, -1):
                workday = date.today() - timedelta(days=day_offset)
                if workday.weekday() >= 5:
                    continue
                for worker_id, clock in schedule:
                    if worker_id == "w7" and day_offset % 3 == 0:
                        continue
                    occurred = datetime.combine(
                        workday, datetime.strptime(clock, "%H:%M").time()
                    )
                    entry_id = f"seed-{workday.isoformat()}-{worker_id}"
                    db.execute(
                        "INSERT OR IGNORE INTO entries VALUES (?, ?, ?, ?, ?, ?)",
                        (entry_id, worker_id, int(occurred.timestamp() * 1000),
                         "Office QR", workday.isoformat(), clock),
                    )
                if day_offset % 2 == 1:
                    occurred = datetime.combine(
                        workday, datetime.strptime("08:42", "%H:%M").time()
                    )
                    db.execute(
                        "INSERT OR IGNORE INTO entries VALUES (?, ?, ?, ?, ?, ?)",
                        (f"seed-{workday.isoformat()}-w1", "w1",
                         int(occurred.timestamp() * 1000), "Office QR",
                         workday.isoformat(), "08:42"),
                    )
            for worker_id, clock in schedule:
                occurred = datetime.combine(
                    date.today(), datetime.strptime(clock, "%H:%M").time()
                )
                db.execute(
                    "INSERT OR IGNORE INTO entries VALUES (?, ?, ?, ?, ?, ?)",
                    (f"seed-{date.today().isoformat()}-{worker_id}", worker_id,
                     int(occurred.timestamp() * 1000), "Office QR",
                     date.today().isoformat(), clock),
                )


@app.on_event("startup")
def startup() -> None:
    initialise()


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "Attendance by ProofsTech"}


@app.get("/api/state")
def state() -> dict:
    with connect() as db:
        workers = db.execute(
            "SELECT * FROM workers WHERE active = 1 ORDER BY name"
        ).fetchall()
        entries = db.execute(
            "SELECT * FROM entries ORDER BY occurred_at DESC LIMIT 1500"
        ).fetchall()
    return {
        "workers": [worker_dict(row) for row in workers],
        "entries": [entry_dict(row) for row in entries],
        "officeCode": OFFICE_CODE,
    }


@app.post("/api/checkin", status_code=201)
def checkin(check_in: CheckIn) -> dict:
    occurred = datetime.fromtimestamp(check_in.occurred_at / 1000)
    work_date = check_in.local_date or occurred.date().isoformat()
    clock = check_in.local_time or occurred.strftime("%H:%M")
    with connect() as db:
        worker = db.execute(
            "SELECT * FROM workers WHERE id = ? AND active = 1", (check_in.worker_id,)
        ).fetchone()
        if worker is None:
            raise HTTPException(status_code=404, detail="Worker not found")
        existing = db.execute(
            "SELECT * FROM entries WHERE worker_id = ? AND work_date = ?",
            (check_in.worker_id, work_date),
        ).fetchone()
        if existing is not None:
            return entry_dict(existing)
        try:
            db.execute(
                "INSERT INTO entries VALUES (?, ?, ?, ?, ?, ?)",
                (check_in.id, check_in.worker_id, check_in.occurred_at,
                 check_in.source, work_date, clock),
            )
        except sqlite3.IntegrityError:
            pass
        row = db.execute("SELECT * FROM entries WHERE id = ?", (check_in.id,)).fetchone()
        if row is None:
            row = existing
    return entry_dict(row)


@app.post("/api/workers", status_code=201)
def create_worker(worker: NewWorker) -> dict:
    names = worker.name.strip().split()
    initials = "".join(part[0] for part in names[:2]).upper()
    worker_id = f"w-{uuid.uuid4()}"
    palette = ["#e4774f", "#9aaf83", "#d3a74e", "#809fa3", "#bd8b83"]
    with connect() as db:
        count = db.execute("SELECT COUNT(*) FROM workers").fetchone()[0]
        db.execute(
            "INSERT INTO workers VALUES (?, ?, ?, ?, ?, ?, 1)",
            (worker_id, worker.name.strip(), worker.title.strip(), initials,
             palette[count % len(palette)], count % 6 + 1),
        )
        row = db.execute("SELECT * FROM workers WHERE id = ?", (worker_id,)).fetchone()
    return worker_dict(row)


@app.get("/api/export.csv")
def export_csv() -> StreamingResponse:
    with connect() as db:
        rows = db.execute(
            """SELECT workers.name, workers.title, entries.work_date,
               entries.occurred_at, entries.clock, entries.source
               FROM entries JOIN workers ON workers.id = entries.worker_id
               ORDER BY entries.occurred_at DESC"""
        ).fetchall()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Role", "Date", "Time", "Source"])
    for row in rows:
        writer.writerow([
            row["name"], row["title"], row["work_date"],
            row["clock"] or datetime.fromtimestamp(row["occurred_at"] / 1000).strftime("%H:%M"),
            row["source"],
        ])
    return StreamingResponse(
        iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance.csv"},
    )


@app.get("/invite")
def invite_page() -> FileResponse:
    return FileResponse(PUBLIC / "invite.html")


@app.get("/api/qr.svg")
def office_qr() -> Response:
    payload = f"proofstech://attendance?office={OFFICE_CODE}"
    image = qrcode.make(payload, image_factory=qrcode.image.svg.SvgPathImage, box_size=14)
    buffer = io.BytesIO()
    image.save(buffer)
    return Response(buffer.getvalue(), media_type="image/svg+xml")


app.mount("/", StaticFiles(directory=PUBLIC, html=True), name="app")
