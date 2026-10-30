"""Rebuild the hero assets from the published dot portrait only (never from the original photo).
python tools/photo/from_dots.py
  in:  public/img/portrait-halftone-900.webp   dots on transparent
  out: public/img/portrait-dots-{480,640,900}.webp   the same dots in the site's print ink (navy)
       public/img/portrait-tone-dots.webp           96x120 tone grid for the WebGL shader, read from dot coverage"""
import numpy as np
from pathlib import Path
from PIL import Image, ImageFilter

IMG = Path("public/img")
INK = (0x1D, 0x2B, 0x3A)  # --print-ink in src/styles/main.css

src = Image.open(IMG / "portrait-halftone-900.webp").convert("RGBA")
alpha = src.getchannel("A")

# recolor: keep every dot exactly where it is, only the ink changes
dots = Image.new("RGBA", src.size, INK + (0,))
dots.putalpha(alpha)
for w in (480, 640, 900):
    h = round(src.height * w / src.width)
    dots.resize((w, h), Image.LANCZOS).save(IMG / f"portrait-dots-{w}.webp", quality=82, method=6)

# tone: dot coverage per cell -> darkness. Blur first so the dot grid does not alias at 96x120.
cov = np.asarray(alpha.filter(ImageFilter.GaussianBlur(4)).resize((96, 120), Image.BOX), np.float32) / 255
cov = np.clip(cov / max(np.percentile(cov, 99.5), 1e-3), 0, 1)
tone = 1 - cov ** 0.8
tone = np.round(tone * 7) / 7                              # posterize: 8 levels, like the old grid
Image.fromarray((tone * 255).astype(np.uint8)).save(IMG / "portrait-tone-dots.webp", lossless=True)
print("ok", tone.min(), tone.max())
