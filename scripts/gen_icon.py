#!/usr/bin/env python3
"""Generate the Ana Gonda Calculator icon set.

Bangladesh-flag palette: bottle green #006A4E (field) + red #F42A41 (the share),
cream #FBF3E0 (the ana mark). The diagonal seam is the ana slash (16-ana division)
and the conversion arrow at once; the Bengali currency mark U+09F8 (15/16) sits
at the pivot.
"""
import os, struct, zlib
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen

GREEN = (0, 106, 78)
RED = (244, 42, 65)
CREAM = (251, 243, 224)
FONT = "assets/fonts/NotoSansBengali[wght].ttf"
PIVOT_CP = 0x09F8


def write_png(path, w, h, pixels):
    def chunk(typ, data):
        c = typ + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w):
            r, g, b, a = pixels[y * w + x]
            raw += bytes((r, g, b, a))
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", zlib.compress(bytes(raw), 9)))
        f.write(chunk(b"IEND", b""))


class Flatten(BasePen):
    def __init__(self, gs):
        super().__init__(gs)
        self.contours, self.cur = [], []
    def _moveTo(self, p): self._flush(); self.cur = [p]
    def _lineTo(self, p): self.cur.append(p)
    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for i in range(1, 9):
            t = i / 8; u = 1 - t
            self.cur.append((u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0],
                             u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]))
    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for i in range(1, 9):
            t = i / 8; u = 1 - t
            self.cur.append((u*u*p0[0] + 2*u*t*p1[0] + t*t*p2[0],
                             u*u*p0[1] + 2*u*t*p1[1] + t*t*p2[1]))
    def _closePath(self): self._flush()
    def _flush(self):
        if len(self.cur) > 2: self.contours.append(self.cur)
        self.cur = []


def glyph_contours(cp):
    f = TTFont(FONT)
    cmap = f.getBestCmap()
    gs = f.getGlyphSet()
    pen = Flatten(gs)
    gs[cmap[cp]].draw(pen)
    pen._flush()
    return pen.contours


def scale_contours(contours, scale, tx, ty):
    out = []
    for c in contours:
        out.append([(tx + (p[0] * scale), ty - (p[1] * scale)) for p in c])
    return out


def winding(px, py, contours):
    w = 0
    for c in contours:
        for i in range(len(c)):
            x1, y1 = c[i]; x2, y2 = c[(i + 1) % len(c)]
            if y1 <= py:
                if y2 > py and (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1) > 0:
                    w += 1
            else:
                if y2 <= py and (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1) < 0:
                    w -= 1
    return w


def in_poly(px, py, poly):
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]; xj, yj = poly[j]
        if ((yi > py) != (yj > py)) and (px < (xj - xi) * (py - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def dist_seg(px, py, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return ((px - x1) ** 2 + (py - y1) ** 2) ** 0.5
    t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return ((px - (x1 + t * dx)) ** 2 + (py - (y1 + t * dy)) ** 2) ** 0.5


RAW = glyph_contours(PIVOT_CP)
xs = [p[0] for c in RAW for p in c]; ys = [p[1] for c in RAW for p in c]
GX0, GX1 = min(xs), max(xs); GY0, GY1 = min(ys), max(ys)
GW, GH = GX1 - GX0, GY1 - GY0


def render(size, mode):
    pivot_scale = (0.30 * size) / GH
    pivot_tx = size / 2 - (GX0 + GW / 2) * pivot_scale
    pivot_ty = size / 2 + (GY0 + GH / 2) * pivot_scale
    pivot_contours = scale_contours(RAW, pivot_scale, pivot_tx, pivot_ty)

    seam_x1, seam_y1 = 0.16 * size, 0.84 * size
    seam_x2, seam_y2 = 0.84 * size, 0.16 * size
    seam_half = 0.0275 * size
    sh = [(0.293 * size, 0.707 * size), (0.334 * size, 0.693 * size), (0.307 * size, 0.666 * size)]
    eh = [(0.707 * size, 0.293 * size), (0.666 * size, 0.307 * size), (0.693 * size, 0.334 * size)]

    pixels = []
    for y in range(size):
        for x in range(size):
            r, g, b, a = 0, 0, 0, 0
            if mode == "icon":
                r, g, b, a = GREEN[0], GREEN[1], GREEN[2], 255
            red_half = (x + y) > size
            if mode in ("icon", "fg", "mono"):
                if red_half:
                    if mode == "icon":
                        r, g, b = RED
                    elif mode == "fg":
                        r, g, b, a = RED[0], RED[1], RED[2], 255
                    else:
                        r, g, b, a = CREAM[0], CREAM[1], CREAM[2], 255
            on_seam = dist_seg(x + 0.5, y + 0.5, seam_x1, seam_y1, seam_x2, seam_y2) <= seam_half
            on_head = in_poly(x + 0.5, y + 0.5, sh) or in_poly(x + 0.5, y + 0.5, eh)
            on_pivot = winding(x + 0.5, y + 0.5, pivot_contours) != 0
            mark = on_seam or on_head or on_pivot

            if mode == "icon":
                if mark: r, g, b = CREAM
            elif mode in ("fg", "mono"):
                if mark: r, g, b, a = CREAM[0], CREAM[1], CREAM[2], 255
            elif mode == "splash":
                if mark: r, g, b, a = CREAM[0], CREAM[1], CREAM[2], 255
                else: r, g, b, a = 0, 0, 0, 0

            if mode in ("fg", "mono", "splash"):
                if not (mark or (mode in ("fg", "mono") and red_half)):
                    r, g, b, a = 0, 0, 0, 0
            pixels.append((r, g, b, a))
    return pixels


def main():
    out = "assets/images"
    os.makedirs(out, exist_ok=True)
    write_png(f"{out}/icon.png", 1024, 1024, render(1024, "icon"))
    write_png(f"{out}/android-icon-foreground.png", 1024, 1024, render(1024, "fg"))
    write_png(f"{out}/android-icon-background.png", 1024, 1024,
              [(GREEN[0], GREEN[1], GREEN[2], 255)] * (1024 * 1024))
    write_png(f"{out}/android-icon-monochrome.png", 1024, 1024, render(1024, "mono"))
    write_png(f"{out}/splash-icon.png", 512, 512, render(512, "splash"))
    write_png(f"{out}/icon_1024_tmp.png", 1024, 1024, render(1024, "icon"))
    print("rendered base assets")


if __name__ == "__main__":
    main()
