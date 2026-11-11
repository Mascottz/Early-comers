"""Create local PWA icons without external design tools."""

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public"


def chunk(kind, data):
    return struct.pack("!I", len(data)) + kind + data + struct.pack("!I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def write_icon(size, filename):
    pixels = bytearray()
    for y in range(size):
        pixels.append(0)
        for x in range(size):
            nx = (x - size / 2) / size
            ny = (y - size / 2) / size
            inside = (abs(nx) ** 2.7 + abs(ny) ** 2.7) < 0.235
            color = (23, 63, 53) if inside else (245, 241, 232)
            orange = ((nx + 0.015) / 0.29) ** 2 + ((ny + 0.005) / 0.27) ** 2 < 1
            if inside and orange:
                color = (238, 120, 79)
            # A hand drawn rising tick, built as two rounded strokes.
            first = abs(ny - (0.62 * nx + 0.035)) < 0.027 and -0.19 < nx < -0.005
            second = abs(ny - (-0.94 * nx + 0.015)) < 0.027 and -0.01 < nx < 0.20
            if inside and orange and (first or second):
                color = (245, 241, 232)
            pixels.extend(color)
    header = struct.pack("!2I5B", size, size, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(bytes(pixels), 9)) + chunk(b"IEND", b"")
    (ROOT / filename).write_bytes(png)


if __name__ == "__main__":
    write_icon(180, "apple-touch-icon.png")
    write_icon(192, "pwa-192.png")
    write_icon(512, "pwa-512.png")
