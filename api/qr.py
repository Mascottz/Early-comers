"""Vercel Python function for the office attendance QR."""

from http.server import BaseHTTPRequestHandler
import io
import os

import qrcode
import qrcode.image.svg


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        office_code = os.getenv("OFFICE_CODE", "PROOFSTECH-HQ-2026")
        payload = f"proofstech://attendance?office={office_code}"
        image = qrcode.make(payload, image_factory=qrcode.image.svg.SvgPathImage, box_size=14)
        buffer = io.BytesIO()
        image.save(buffer)
        content = buffer.getvalue()
        self.send_response(200)
        self.send_header("Content-Type", "image/svg+xml")
        self.send_header("Cache-Control", "public, max-age=3600")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)
