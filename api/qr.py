"""Vercel Python function for the office attendance QR."""

from http.server import BaseHTTPRequestHandler
from datetime import datetime, timedelta, timezone
import io
import os

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover
    ZoneInfo = None

import qrcode
import qrcode.image.svg


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        office_code = os.getenv("OFFICE_CODE", "PROOFSTECH-HQ-2026")
        try:
            now = datetime.now(ZoneInfo("Africa/Lagos")) if ZoneInfo else None
        except Exception:
            now = None
        if now is None:
            now = datetime.now(timezone.utc) + timedelta(hours=1)
        payload = f"proofstech://attendance?office={office_code}&day={now.date().isoformat()}"
        image = qrcode.make(payload, image_factory=qrcode.image.svg.SvgPathImage, box_size=14)
        buffer = io.BytesIO()
        image.save(buffer)
        content = buffer.getvalue()
        self.send_response(200)
        self.send_header("Content-Type", "image/svg+xml")
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)
