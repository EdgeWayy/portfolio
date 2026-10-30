"""Export the dot-portrait assets to public/img/.  PYTHONPATH=tools/photo python tools/photo/export.py
Only star/dot renderings leave this script: no real photo is published.
  tools/_work/portrait-tone.from-photo.webp  96x120 tone grid, private; the site uses portrait-tone-dots.webp (from_dots.py)
  portrait-halftone-*.webp  lapis stars on transparent (hero fallback, OG image)"""
import numpy as np
from pathlib import Path
from PIL import Image, ImageFilter
from stylize import load, khatam, W

OUT = Path("public/img"); OUT.mkdir(parents=True, exist_ok=True)

def soft_tone(g, m):
    gi = Image.fromarray((g * 255).astype(np.uint8))
    blur = np.asarray(gi.filter(ImageFilter.GaussianBlur(30)), np.float32) / 255
    t = np.clip(g + (g - blur) * .9, 0, 1)
    t = np.clip((t - .04) / .9, 0, 1) ** .62
    return t * m + (1 - m)

def save(im, name, widths):
    for w in widths:
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(OUT / f"{name}-{w}.webp", quality=82, method=6)

rgb, mask, g, m = load((1200, 1500))
t = soft_tone(g, m)
tone = Image.fromarray((t * 255).astype(np.uint8))
small = np.asarray(tone.resize((96, 120), Image.BOX), np.float32) / 255
small = np.round(small * 7) / 7                          # posterize: 8 levels
# private: this grid comes from the photo, so it stays out of public/ (the site uses portrait-tone-dots.webp, see from_dots.py)
Image.fromarray((small * 255).astype(np.uint8)).save(Path("tools/_work/portrait-tone.from-photo.webp"), lossless=True)
save(khatam(t, cell=15, bg=None), "portrait-halftone", [480, 640, 900])
print(sorted(p.name for p in OUT.iterdir() if p.is_file()))
