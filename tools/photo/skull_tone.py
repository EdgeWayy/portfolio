"""One-time generator for public/img/skull-tone.webp: the ACID portrait's tone map.

Traces the halftone skull out of reference-hell.png into a smooth grayscale image (white = no dot, black = solid),
which the star shader (js/hero-gl.js) and the no-WebGL fallback (js/skull.js) turn back into dots at any resolution.
  1. crop the skull (4:5, same as the portrait tone map),
  2. paint over the role sticker with the mirrored left side of the jaw,
  3. blur away the printed dots, so only their coverage (the shading) is left, then sharpen the teeth and crack again,
  4. convert coverage to darkness and blank everything outside the skull outline.
Run from the repo root: python tools/photo/skull_tone.py
"""
from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = "reference-hell.png"
OUT = "public/img/skull-tone.webp"
SCALE = 2557 / 2000            # the coordinates below were read at 2000 px wide
X0, Y0 = 1020 * SCALE, 90 * SCALE   # origin of the working crop
AXIS = 400                     # the skull's vertical axis in working-crop pixels
SIZE = (576, 720)

# the skull's outline in working-crop pixels, clockwise from the crown
OUTLINE = [
    (400, 14), (470, 26), (540, 60), (604, 118), (646, 190), (674, 270), (678, 342), (658, 410), (656, 470),
    (630, 514), (590, 540), (590, 604), (576, 650), (570, 720), (556, 772), (514, 834), (452, 880), (400, 890),
    (340, 876), (288, 834), (258, 772), (236, 720), (224, 640), (218, 544), (186, 534), (160, 492), (146, 404),
    (130, 334), (130, 258), (146, 196), (186, 126), (246, 66), (318, 30),
]


def main():
    im = Image.open(SRC).convert("L")
    crop = im.crop((round(X0), round(Y0), round(X0 + 843), round(Y0 + 946)))

    # the sticker covers the right of the jaw: take that part from the left side, mirrored about the axis
    x1, y1, x2, y2 = 425, 712, 600, 806
    left = crop.crop((2 * AXIS - x2, y1, 2 * AXIS - x1, y2)).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    crop.paste(left, (x1, y1))

    # dots -> coverage: paper is about 245 here and ink about 26
    soft = crop.filter(ImageFilter.GaussianBlur(2.8)).filter(ImageFilter.UnsharpMask(radius=7, percent=90, threshold=0))
    dark = soft.point(lambda v: max(0, min(255, round((245 - v) / (245 - 26) * 255))))

    # nothing outside the skull (the blob's outline and the lime around it are not part of the tone)
    mask = Image.new("L", crop.size, 0)
    ImageDraw.Draw(mask).polygon(OUTLINE, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(2))
    dark = ImageChops.multiply(dark, mask)

    tone = ImageChops.invert(dark)
    side = 720                 # 4:5 window around the axis
    out = tone.crop((AXIS - side // 2, 0, AXIS + side // 2, 900)).resize(SIZE, Image.Resampling.LANCZOS)
    out.save(OUT, quality=88, method=6)
    print("wrote", OUT, out.size)


if __name__ == "__main__":
    main()
