"""Stylized portrait variants. Input: tools/_work/crop.png + mask.png (see cutout.py).
python tools/photo/stylize.py  -> tools/_work/v_*.png and contact.png"""
import math, random
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

W = Path("tools/_work")
PAPER = (243, 238, 228); INK = (18, 18, 18); LAPIS = (27, 59, 209); SAFFRON = (255, 90, 31)

def load(size=(920, 1150)):
    rgb = Image.open(W / "crop.png").convert("RGB").resize(size, Image.LANCZOS)
    mask = Image.open(W / "mask.png").convert("L").resize(size, Image.LANCZOS)
    g = np.asarray(ImageOps.grayscale(rgb), dtype=np.float32) / 255
    m = np.asarray(mask, dtype=np.float32) / 255
    lo, hi = np.percentile(g[m > .5], [2, 98])
    g = np.clip((g - lo) / (hi - lo), 0, 1) ** 1.15
    g = g * m + (1 - m)                  # background -> white
    return rgb, mask, g, m

def star(d, cx, cy, r, fill, rot=0.0):
    pts = []
    for i in range(16):
        a = rot + i * math.pi / 8
        rr = r if i % 2 == 0 else r * 0.62
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=fill)

def khatam(g, cell=14, color=LAPIS, bg=PAPER, ss=3):
    h, w = g.shape
    im = Image.new("RGB", (w * ss, h * ss), bg); d = ImageDraw.Draw(im)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            v = 1 - g[y:y + cell, x:x + cell].mean()
            if v < .04: continue
            star(d, (x + cell / 2) * ss, (y + cell / 2) * ss, cell * ss * .78 * math.sqrt(v), color)
    return im.resize((w, h), Image.LANCZOS)

def duotone_suzani(rgb, g, m):
    h, w = g.shape
    t = np.clip(g, 0, 1)[..., None]
    a = np.array(LAPIS, np.float32); b = np.array(PAPER, np.float32)
    img = Image.fromarray((a * (1 - t) + b * t).astype(np.uint8))
    bg = Image.new("RGB", (w, h), SAFFRON); d = ImageDraw.Draw(bg)
    for y in range(0, h + 80, 80):
        for x in range(0, w + 80, 80):
            ox = 40 if (y // 80) % 2 else 0
            star(d, x + ox, y, 26, PAPER); d.ellipse((x + ox - 8, y - 8, x + ox + 8, y + 8), fill=SAFFRON)
    mm = Image.fromarray((m * 255).astype(np.uint8))
    return Image.composite(img, bg, mm)

def ikat(g, m, bands=110):
    h, w = g.shape; rng = random.Random(7)
    out = np.zeros((h, w, 3), np.uint8); out[:] = PAPER
    bh = h / bands
    for i in range(bands):
        y0, y1 = int(i * bh), int((i + 1) * bh)
        shift = rng.randint(-6, 6)
        row = np.roll(g[y0:y1], shift, axis=1)
        jitter = np.array([rng.uniform(-.06, .06) for _ in range(w)])[None, :]
        dark = row + jitter < .45; mid = (row + jitter < .7) & ~dark
        out[y0:y1][mid] = SAFFRON; out[y0:y1][dark] = LAPIS
    return Image.fromarray(out).filter(ImageFilter.GaussianBlur(.6))

def ascii_art(g, cell=12):
    h, w = g.shape
    chars = " .·:-=+*#%@"
    im = Image.new("RGB", (w, h), INK); d = ImageDraw.Draw(im)
    try: f = ImageFont.truetype("consola.ttf", cell)
    except OSError: f = ImageFont.load_default()
    for y in range(0, h, cell):
        for x in range(0, w, int(cell * .6)):
            v = 1 - g[y:y + cell, x:x + int(cell * .6)].mean()
            ch = chars[min(len(chars) - 1, int(v * len(chars)))]
            d.text((x, y), ch, fill=SAFFRON if v > .75 else PAPER, font=f)
    return im

def mosaic(g, cell=23):
    h, w = g.shape
    pal = [INK, LAPIS, SAFFRON, PAPER]
    im = Image.new("RGB", (w, h), PAPER); d = ImageDraw.Draw(im)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            v = g[y:y + cell, x:x + cell].mean()
            c = pal[min(3, int(v * 4))]
            d.rectangle((x + 1, y + 1, x + cell - 2, y + cell - 2), fill=c)
            if c != PAPER: star(d, x + cell / 2, y + cell / 2, cell * .3, PAPER if c != SAFFRON else INK)
    return im

if __name__ == "__main__":
    rgb, mask, g, m = load()
    vs = {"khatam": khatam(g), "suzani": duotone_suzani(rgb, g, m), "ikat": ikat(g, m),
          "ascii": ascii_art(g), "mosaic": mosaic(g)}
    for k, v in vs.items(): v.save(W / f"v_{k}.png")
    sheet = Image.new("RGB", (460 * 5, 575), "white")
    for i, v in enumerate(vs.values()): sheet.paste(v.resize((460, 575)), (460 * i, 0))
    sheet.save(W / "contact.png"); print("ok")
