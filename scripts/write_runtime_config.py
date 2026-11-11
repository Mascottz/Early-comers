"""Write public Supabase browser configuration during local or Vercel builds."""

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "public" / "runtime-config.js"
url = os.getenv("SUPABASE_URL", "").strip()
key = os.getenv("SUPABASE_PUBLISHABLE_KEY", "").strip()
office_code = os.getenv("OFFICE_CODE", "PROOFSTECH-HQ-2026").strip() or "PROOFSTECH-HQ-2026"

if url and key:
    config = {"supabaseUrl": url, "supabaseKey": key, "officeCode": office_code}
    TARGET.write_text(f"window.ATTENDANCE_CONFIG = {json.dumps(config)}\n")
elif os.getenv("VERCEL") == "1":
    raise SystemExit("Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the Vercel project.")
else:
    config = {"supabaseUrl": "", "supabaseKey": "", "officeCode": office_code}
    TARGET.write_text(f"window.ATTENDANCE_CONFIG = {json.dumps(config)}\n")
