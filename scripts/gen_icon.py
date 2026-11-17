import struct, zlib, os

W, H = 1024, 1024

def write_png(path, pixels):
    # pixels: list of (r,g,b,a) length W*H
    def chunk(typ, data):
        c = typ + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    raw = bytearray()
    for y in range(H):
        raw.append(0)  # filter 0
        for x in range(W):
            r, g, b, a = pixels[y*W + x]
            raw += bytes((r, g, b, a))
    ihdr = struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", idat))
        f.write(chunk(b"IEND", b""))

def in_rect(x, y, rx0, ry0, rw, rh):
    return rx0 <= x < rx0 + rw and ry0 <= y < ry0 + rh

def dist_to_segment(px, py, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return ((px-x1)**2 + (py-y1)**2) ** 0.5
    t = ((px-x1)*dx + (py-y1)*dy) / (dx*dx + dy*dy)
    t = max(0.0, min(1.0, t))
    cx = x1 + t*dx
    cy = y1 + t*dy
    return ((px-cx)**2 + (py-cy)**2) ** 0.5

def point_in_tri(px, py, ax, ay, bx, by, cx, cy):
    def sign(p1x, p1y, p2x, p2y, p3x, p3y):
        return (p1x - p3x)*(p2y - p3y) - (p2x - p3x)*(p1y - p3y)
    d1 = sign(px, py, ax, ay, bx, by)
    d2 = sign(px, py, bx, by, cx, cy)
    d3 = sign(px, py, cx, cy, ax, ay)
    has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
    has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
    return not (has_neg and has_pos)

def render(bg, mark, share, outline, share_alpha=0.55, mono=False):
    # bg: (r,g,b) or None for transparent
    # mark: (r,g,b) for arrow + plot outline
    # share: (r,g,b) for share half (or None to skip)
    pixels = []
    # plot rect
    PX0, PY0, PW, PH = 160, 160, 704, 704
    PX1, PY1 = PX0 + PW, PY0 + PH
    # arrow segment
    AX1, AY1, AX2, AY2 = 300, 724, 724, 300
    HALF_W = 30
    # arrowheads
    start_head = [(300,724), (342,710), (314,682)]
    end_head   = [(724,300), (682,314), (710,342)]
    # share triangle: (PX0,PY1)-(PX1,PY0)-(PX1,PY1)
    for y in range(H):
        for x in range(W):
            if bg is None:
                r, g, b, a = 0, 0, 0, 0
            else:
                r, g, b, a = bg[0], bg[1], bg[2], 255
            # share half
            if share is not None and point_in_tri(x, y, PX0, PY1, PX1, PY0, PX1, PY1) and in_rect(x, y, PX0, PY0, PW, PH):
                sr, sg, sb = share
                alpha = int(255 * share_alpha)
                # blend
                r = (r*(255-alpha) + sr*alpha)//255
                g = (g*(255-alpha) + sg*alpha)//255
                b = (b*(255-alpha) + sb*alpha)//255
            # plot outline (stroke 28, centered on boundary)
            if in_rect(x, y, PX0-14, PY0-14, PW+28, PH+28) and not in_rect(x, y, PX0+14, PY0+14, PW-28, PH-28):
                r, g, b = mark
            # arrow shaft
            d = dist_to_segment(x+0.5, y+0.5, AX1, AY1, AX2, AY2)
            if d <= HALF_W:
                # check within segment bounds (with small cap)
                t = ((x+0.5-AX1)*(AX2-AX1) + (y+0.5-AY1)*(AY2-AY1)) / ((AX2-AX1)**2 + (AY2-AY1)**2)
                if -0.05 <= t <= 1.05:
                    r, g, b = mark
            # arrowheads
            if point_in_tri(x+0.5, y+0.5, *sum(start_head, ())) or point_in_tri(x+0.5, y+0.5, *sum(end_head, ())):
                pass
            if point_in_tri(x+0.5, y+0.5, start_head[0][0], start_head[0][1], start_head[1][0], start_head[1][1], start_head[2][0], start_head[2][1]):
                r, g, b = mark
            if point_in_tri(x+0.5, y+0.5, end_head[0][0], end_head[0][1], end_head[1][0], end_head[1][1], end_head[2][0], end_head[2][1]):
                r, g, b = mark
            # for transparent bg, set alpha 0 outside any mark
            if bg is None:
                # determine if pixel is part of mark
                is_mark = False
                if in_rect(x, y, PX0-14, PY0-14, PW+28, PH+28) and not in_rect(x, y, PX0+14, PY0+14, PW-28, PH-28):
                    is_mark = True
                if d <= HALF_W:
                    t = ((x+0.5-AX1)*(AX2-AX1) + (y+0.5-AY1)*(AY2-AY1)) / ((AX2-AX1)**2 + (AY2-AY1)**2)
                    if -0.05 <= t <= 1.05:
                        is_mark = True
                if point_in_tri(x+0.5, y+0.5, start_head[0][0], start_head[0][1], start_head[1][0], start_head[1][1], start_head[2][0], start_head[2][1]):
                    is_mark = True
                if point_in_tri(x+0.5, y+0.5, end_head[0][0], end_head[0][1], end_head[1][0], end_head[1][1], end_head[2][0], end_head[2][1]):
                    is_mark = True
                if share is not None and point_in_tri(x, y, PX0, PY1, PX1, PY0, PX1, PY1) and in_rect(x, y, PX0, PY0, PW, PH):
                    is_mark = True
                a = 255 if is_mark else 0
                if not is_mark:
                    r, g, b = 0, 0, 0
            pixels.append((r, g, b, a))
    return pixels

# icon.png (opaque)
icon = render((30,107,60), (255,255,255), (46,139,80), (255,255,255))
write_png("/tmp/opencode/icon/icon_1024.png", icon)

# android foreground (transparent, white mark)
fg = render(None, (255,255,255), (255,255,255), (255,255,255))
write_png("/tmp/opencode/icon/fg_1024.png", fg)

# android background (solid green)
bg = render((30,107,60), (30,107,60), (30,107,60), (30,107,60))
# make bg fully opaque solid (render with bg set already does that; but mark pixels are white currently). redo: solid green.
bg_pixels = [(30,107,60,255)] * (W*H)
write_png("/tmp/opencode/icon/bg_1024.png", bg_pixels)

# monochrome (transparent, white silhouette)
mono = render(None, (255,255,255), (255,255,255), (255,255,255))
# make share half solid too (already is_mark True -> alpha 255, color white). good.
write_png("/tmp/opencode/icon/mono_1024.png", mono)

# splash (512, transparent, white mark) -- render at 512 by scaling coords
# We'll just downscale icon foreground later; for splash use white mark on transparent at 512.
# Re-render at 512x512 quickly by scaling all coords.
def render_scaled(size, bg, mark, share):
    global W, H
    W0, H0 = W, H
    W, H = size, size
    s = size / 1024.0
    # scale constants
    PX0 = int(160*s); PY0 = int(160*s); PW = int(704*s); PH = int(704*s)
    AX1 = int(300*s); AY1 = int(724*s); AX2 = int(724*s); AY2 = int(300*s)
    HW = max(4, int(30*s))
    sh = [(int(300*s), int(724*s)), (int(342*s), int(710*s)), (int(314*s), int(682*s))]
    eh = [(int(724*s), int(300*s)), (int(682*s), int(314*s)), (int(710*s), int(342*s))]
    pixels = []
    for y in range(H):
        for x in range(W):
            if bg is None:
                r,g,b,a = 0,0,0,0
            else:
                r,g,b,a = bg[0],bg[1],bg[2],255
            # share half
            if share is not None:
                if point_in_tri(x, y, int(PX0*s*0+PX0), int(PY1 if False else PY0+PH), PX0+PW, PY0, PX0+PW, PY0+PH) and (PX0 <= x < PX0+PW and PY0 <= y < PY0+PH):
                    sr,sg,sb = share
                    alpha = int(255*0.55)
                    r = (r*(255-alpha)+sr*alpha)//255
                    g = (g*(255-alpha)+sg*alpha)//255
                    b = (b*(255-alpha)+sb*alpha)//255
            # plot outline
            outer = (PX0-14*s, PY0-14*s, PW+28*s, PH+28*s)
            inner = (PX0+14*s, PY0+14*s, PW-28*s, PH-28*s)
            in_outer = (outer[0] <= x < outer[0]+outer[2]) and (outer[1] <= y < outer[1]+outer[3])
            in_inner = (inner[0] <= x < inner[0]+inner[2]) and (inner[1] <= y < inner[1]+inner[3])
            if in_outer and not in_inner:
                r,g,b = mark
            # arrow shaft
            d = dist_to_segment(x+0.5, y+0.5, AX1, AY1, AX2, AY2)
            if d <= HW:
                t = ((x+0.5-AX1)*(AX2-AX1)+(y+0.5-AY1)*(AY2-AY1))/((AX2-AX1)**2+(AY2-AY1)**2)
                if -0.05 <= t <= 1.05:
                    r,g,b = mark
            # arrowheads
            if point_in_tri(x+0.5,y+0.5, sh[0][0],sh[0][1],sh[1][0],sh[1][1],sh[2][0],sh[2][1]):
                r,g,b = mark
            if point_in_tri(x+0.5,y+0.5, eh[0][0],eh[0][1],eh[1][0],eh[1][1],eh[2][0],eh[2][1]):
                r,g,b = mark
            # alpha for transparent bg
            if bg is None:
                is_mark = False
                if in_outer and not in_inner: is_mark = True
                if d <= HW:
                    t = ((x+0.5-AX1)*(AX2-AX1)+(y+0.5-AY1)*(AY2-AY1))/((AX2-AX1)**2+(AY2-AY1)**2)
                    if -0.05 <= t <= 1.05: is_mark = True
                if point_in_tri(x+0.5,y+0.5,sh[0][0],sh[0][1],sh[1][0],sh[1][1],sh[2][0],sh[2][1]): is_mark=True
                if point_in_tri(x+0.5,y+0.5,eh[0][0],eh[0][1],eh[1][0],eh[1][1],eh[2][0],eh[2][1]): is_mark=True
                if point_in_tri(x,y,PX0,PY0+PH,PX0+PW,PY0,PX0+PW,PY0+PH) and (PX0<=x<PX0+PW and PY0<=y<PY0+PH): is_mark=True
                a = 255 if is_mark else 0
                if not is_mark: r,g,b = 0,0,0
            pixels.append((r,g,b,a))
    return pixels

splash = render_scaled(512, None, (255,255,255), (255,255,255))
write_png("/tmp/opencode/icon/splash_512.png", splash) if False else None

# write splash manually with W,H=512
W,H = 512,512
splash_pixels = render_scaled(512, None, (255,255,255), (255,255,255))
write_png("/tmp/opencode/icon/splash_512.png", splash_pixels)

W,H = 1024,1024
print("done")
