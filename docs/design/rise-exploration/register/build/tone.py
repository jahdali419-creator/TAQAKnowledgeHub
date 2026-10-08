"""One TAQA teal tone for every area photo, so pictures from different cameras read as one set.
Writes img/tone/<same name>. Luminance mapped onto a night → TAQA teal → mint ramp, with a little of the original colour kept."""
import os, glob
from PIL import Image, ImageOps
HERE = os.path.dirname(os.path.abspath(__file__)); IMG = os.path.join(HERE, '..', 'img'); OUT = os.path.join(IMG, 'tone')
os.makedirs(OUT, exist_ok=True)
STOPS = [(0, (5, 15, 15)), (.4, (12, 66, 66)), (.75, (92, 150, 144)), (1, (232, 244, 240))]
def ramp():
    lut = []
    for i in range(256):
        t = i / 255
        for (a, ca), (b, cb) in zip(STOPS, STOPS[1:]):
            if a <= t <= b:
                u = (t - a) / (b - a); lut.append(tuple(round(ca[k] + (cb[k] - ca[k]) * u) for k in range(3))); break
    return lut
LUT = ramp()
def tone(src, dst, keep=.3):
    im = Image.open(src).convert('RGB')
    g = ImageOps.autocontrast(im.convert('L'), cutoff=1)
    r = Image.merge('RGB', [g.point([c[k] for c in LUT]) for k in range(3)])
    out = Image.blend(r, im, keep)
    ext = os.path.splitext(dst)[1].lower()
    out.save(dst, quality=86) if ext != '.webp' else out.save(dst, 'WEBP', quality=84)
if __name__ == '__main__':
    n = 0
    for f in sorted(glob.glob(os.path.join(IMG, '*'))):
        if os.path.isfile(f):
            tone(f, os.path.join(OUT, os.path.basename(f))); n += 1
    print('toned', n)
