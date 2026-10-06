#!/usr/bin/env python3
"""Generates the extension icons (16/32/48/128 px PNGs): a claymorphic rounded
tile in Jira blues holding a white clipboard, with a Jira-style stack of
diamonds on the clipboard face. Pure stdlib (zlib PNG, RGBA), rendered at 4x
and box-downsampled for smooth edges.
Run: python3 icons/generate_icons.py
"""
import os
import struct
import zlib

TILE_TOP = (167, 139, 250)     # #A78BFA light violet (matches the page)
TILE_BOTTOM = (124, 58, 237)   # #7C3AED vivid violet
CLIP_BODY = (255, 255, 255)
CLIP_TAB = (216, 205, 247)     # pale violet clip
CLIP_SHADOW = (76, 29, 149)    # soft shadow the clipboard casts on the tile
DIAMOND_LIGHT = (133, 184, 255)  # #85B8FF
DIAMOND_MID = (87, 157, 255)     # #579DFF
DIAMOND_MAIN = (12, 102, 228)    # #0C66E4
SS = 4


def write_png(path, size, pixels):
    raw = b''.join(
        b'\x00' + b''.join(struct.pack('BBBB', *pixels[y][x]) for x in range(size))
        for y in range(size)
    )
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c))
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)))
        f.write(chunk(b'IDAT', zlib.compress(raw, 9)))
        f.write(chunk(b'IEND', b''))


def rounded_rect(x, y, x0, y0, x1, y1, r):
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def diamond(x, y, cx, cy, r):
    return abs(x - cx) + abs(y - cy) <= r


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def render_hi(n):
    tile_radius = 0.30 * n

    # clipboard body and clip tab
    bx0, by0, bx1, by1 = 0.26 * n, 0.22 * n, 0.74 * n, 0.84 * n
    body_r = 0.07 * n
    tx0, ty0, tx1, ty1 = 0.39 * n, 0.14 * n, 0.61 * n, 0.27 * n
    tab_r = 0.05 * n
    shadow_off = 0.030 * n

    # Jira-style diamond stack marching up-left, lightest at the back
    dr = 0.072 * n
    diamonds = [
        (0.40 * n, 0.415 * n, DIAMOND_LIGHT),
        (0.50 * n, 0.525 * n, DIAMOND_MID),
        (0.60 * n, 0.635 * n, DIAMOND_MAIN),
    ]

    def clipboard_hit(x, y):
        return (rounded_rect(x, y, bx0, by0, bx1, by1, body_r)
                or rounded_rect(x, y, tx0, ty0, tx1, ty1, tab_r))

    rows = []
    for yi in range(n):
        row = []
        for xi in range(n):
            x, y = xi + 0.5, yi + 0.5
            if not rounded_rect(x, y, 0, 0, n, n, tile_radius):
                row.append((0, 0, 0, 0))
                continue
            # tile gradient, light top-left to saturated bottom-right
            t = (x + y) / (2 * n)
            color = lerp(TILE_TOP, TILE_BOTTOM, t)
            # clay rim light top-left, shading bottom
            rim = n * 0.06
            edge = min(x, y)
            if edge < rim * 2:
                color = lerp(color, (255, 255, 255), max(0.0, 1 - edge / (rim * 2)) * 0.35)
            bottom_edge = n - y
            if bottom_edge < rim * 2:
                color = lerp(color, (60, 20, 120), max(0.0, 1 - bottom_edge / (rim * 2)) * 0.25)

            if clipboard_hit(x, y):
                if rounded_rect(x, y, tx0, ty0, tx1, ty1, tab_r) and not rounded_rect(x, y, bx0, by0 + 0.03 * n, bx1, by1, body_r):
                    color = CLIP_TAB
                else:
                    color = CLIP_BODY
                # diamonds sit on the clipboard face only
                for cx, cy, dcol in diamonds:
                    if diamond(x, y, cx, cy, dr):
                        color = dcol
            elif clipboard_hit(x - shadow_off, y - shadow_off):
                color = lerp(color, CLIP_SHADOW, 0.45)

            row.append(color + (255,))
        rows.append(row)
    return rows


def downsample(hi, size):
    out = []
    for y in range(size):
        row = []
        for x in range(size):
            r = g = b = a = 0
            for dy in range(SS):
                for dx in range(SS):
                    pr, pg, pb, pa = hi[y * SS + dy][x * SS + dx]
                    r += pr * pa; g += pg * pa; b += pb * pa; a += pa
            if a == 0:
                row.append((0, 0, 0, 0))
            else:
                row.append((round(r / a), round(g / a), round(b / a), round(a / SS ** 2)))
        out.append(row)
    return out


def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    for size in (16, 32, 48, 128):
        hi = render_hi(size * SS)
        write_png(os.path.join(out_dir, f'icon{size}.png'), size, downsample(hi, size))
        print(f'wrote icon{size}.png')


if __name__ == '__main__':
    main()
