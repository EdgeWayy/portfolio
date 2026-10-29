"""Crop the original portrait (never modified) and cut out the background with rembg.
Run with a Python that has rembg installed:  python tools/photo/cutout.py my-photo.png
Writes tools/_work/crop.png (RGB) and tools/_work/mask.png (L)."""
import sys
from pathlib import Path
from PIL import Image
from rembg import remove, new_session

src = Path(sys.argv[1] if len(sys.argv) > 1 else "my-photo.png")
out = Path("tools/_work"); out.mkdir(parents=True, exist_ok=True)
im = Image.open(src).convert("RGB")
# 4:5 crop: from above the hair down to just above the shirt logo
crop = im.crop((0, 300, 1840, 2600))
crop.save(out / "crop.png")
cut = remove(crop, session=new_session("u2net_human_seg"), alpha_matting=False)
cut.getchannel("A").save(out / "mask.png")
print("ok", crop.size)
