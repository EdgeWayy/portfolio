"""Convert tools/_work/shots/<slug>-desktop.png / -mobile.png (from tools/shots.mjs)
into the case-study images public/img/work/<slug>-720.webp, -1200.webp, -m.webp.
python tools/photo/shots_to_webp.py [slug ...]   (no args = every screenshot found)"""
import sys
from pathlib import Path
from PIL import Image

src = Path("tools/_work/shots"); out = Path("public/img/work"); out.mkdir(parents=True, exist_ok=True)
slugs = sys.argv[1:] or sorted({p.name.rsplit("-", 1)[0] for p in src.glob("*-desktop.png")})
for slug in slugs:
    d = Image.open(src / f"{slug}-desktop.png").convert("RGB")
    for w in (720, 1200):
        d.resize((w, round(d.height * w / d.width)), Image.LANCZOS).save(out / f"{slug}-{w}.webp", quality=80, method=6)
    m = Image.open(src / f"{slug}-mobile.png").convert("RGB")
    m.resize((360, round(m.height * 360 / m.width)), Image.LANCZOS).save(out / f"{slug}-m.webp", quality=80, method=6)
    print("ok", slug)
