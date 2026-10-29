"""Refined tone map + final variants. python tools/photo/refine.py"""
import numpy as np
from PIL import Image, ImageFilter
from stylize import load, khatam, duotone_suzani, W, LAPIS, PAPER, SAFFRON

def tone(g, m):
    gi = Image.fromarray((g * 255).astype(np.uint8))
    blur = np.asarray(gi.filter(ImageFilter.GaussianBlur(28)), np.float32) / 255
    t = np.clip(g + (g - blur) * 1.6, 0, 1)          # local contrast
    t = np.clip((t - .08) / .8, 0, 1) ** .75         # lighten mid tones
    return t * m + (1 - m)

if __name__ == "__main__":
    rgb, mask, g, m = load()
    t = tone(g, m)
    Image.fromarray((t * 255).astype(np.uint8)).save(W / "tone.png")
    a = khatam(t, cell=12); a.save(W / "r_khatam.png")
    b = duotone_suzani(rgb, t, m); b.save(W / "r_suzani.png")
    s = Image.new("RGB", (1840, 1150)); s.paste(a, (0, 0)); s.paste(b, (920, 0)); s.save(W / "r_sheet.png")
