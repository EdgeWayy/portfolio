"""Export final optimized portrait assets to public/img/.  PYTHONPATH=tools/photo python tools/photo/export.py"""
import numpy as np
from pathlib import Path
from PIL import Image, ImageFilter
from stylize import load, khatam, duotone_suzani, W

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
tone.resize((720, 900), Image.LANCZOS).save(OUT / "portrait-tone.webp", quality=90, method=6)
save(rgb, "portrait-photo", [480, 900])
save(duotone_suzani(rgb, soft_tone(g, m) ** 1.3, m), "portrait-suzani", [480, 900])
half = khatam(soft_tone(g, m), cell=15); half.save(W / "final_halftone.png")
save(half, "portrait-halftone", [480, 900])
print(sorted(p.name for p in OUT.iterdir()))
