"""Narzędzia do generowania ilustracji (abstrakcyjnych grafik) dla artykułów.

Grafiki są generowane deterministycznie z adresu (sluga) artykułu, więc
każdy wpis ma własną, stałą ilustrację. Każdy portal komponuje z tych
prymitywów własny styl graficzny w swoim ``theme.py``.
"""
from __future__ import annotations

import hashlib
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT_DIRS = [Path("/usr/share/fonts/truetype/dejavu"), Path("/usr/share/fonts/truetype/liberation")]


def rng(seed: str) -> random.Random:
    return random.Random(int(hashlib.sha256(seed.encode()).hexdigest()[:16], 16))


def hex2rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t: float):
    a, b = hex2rgb(a) if isinstance(a, str) else a, hex2rgb(b) if isinstance(b, str) else b
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def linear_gradient(size, c1, c2, vertical=True) -> Image.Image:
    w, h = size
    base = Image.new("RGB", (1, 256) if vertical else (256, 1))
    px = base.load()
    for i in range(256):
        col = mix(c1, c2, i / 255)
        if vertical:
            px[0, i] = col
        else:
            px[i, 0] = col
    return base.resize(size, Image.BILINEAR)


def font(name="DejaVuSans-Bold.ttf", size=40):
    for d in FONT_DIRS:
        p = d / name
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def blur(img: Image.Image, r: float) -> Image.Image:
    return img.filter(ImageFilter.GaussianBlur(r))


def save(img: Image.Image, path: Path, quality=78):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(path, "JPEG", quality=quality, optimize=True, progressive=True)


def logo_png(path: Path, lines: list[tuple[str, str, int, str]], bg: str, size=(600, 600)):
    """lines: (tekst, kolor, rozmiar, plik fontu) – logo wyśrodkowane."""
    img = Image.new("RGB", size, hex2rgb(bg))
    d = ImageDraw.Draw(img)
    fonts = [font(f, s) for _, _, s, f in lines]
    heights = [d.textbbox((0, 0), t, font=f)[3] for (t, _, _, _), f in zip(lines, fonts)]
    y = (size[1] - sum(heights) - 20 * (len(lines) - 1)) // 2
    for (text, color, _, _), f, h in zip(lines, fonts, heights):
        w = d.textlength(text, font=f)
        d.text(((size[0] - w) / 2, y), text, fill=hex2rgb(color), font=f)
        y += h + 20
    img.save(path, "PNG")


__all__ = ["Image", "ImageDraw", "rng", "hex2rgb", "mix", "linear_gradient", "font", "blur", "save", "logo_png"]
