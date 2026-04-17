#!/usr/bin/env python3
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
ART_PATH = ROOT / 'public/art/ggol-base-plate.jpg'
LAYOUT_PATH = ROOT / 'public/data/layout.json'
MASKS_DIR = ROOT / 'public/masks'
AUDIT_PATH = ROOT / 'mask-trace-audit.png'

SEGMENTS = {
    0: [],
    1: [('l', 'b')],
    2: [('b', 'r')],
    3: [('l', 'r')],
    4: [('t', 'r')],
    5: [('t', 'l'), ('b', 'r')],
    6: [('t', 'b')],
    7: [('t', 'l')],
    8: [('t', 'l')],
    9: [('t', 'b')],
    10: [('t', 'r'), ('l', 'b')],
    11: [('t', 'r')],
    12: [('l', 'r')],
    13: [('b', 'r')],
    14: [('l', 'b')],
    15: [],
}

# Global component groups discovered from the debug overlay / image audit.
# Coordinates are on the source 1280x720 plate.
MODULE_COMPONENT_BOXES = {
    'module-left-a': [(25, 29, 94, 46), (24, 50, 94, 68)],
    'module-left-b': [(26, 591, 132, 634), (240, 591, 343, 625)],
    'module-right-a': [(1002, 36, 1135, 45), (1002, 46, 1156, 70), (1001, 91, 1160, 134), (1001, 142, 1155, 174)],
    'module-right-b': [(802, 591, 903, 634), (1093, 591, 1195, 634)],
}


def edge_point(edge: str, x: int, y: int) -> tuple[float, float]:
    return {
        't': (x + 0.5, y),
        'r': (x + 1, y + 0.5),
        'b': (x + 0.5, y + 1),
        'l': (x, y + 0.5),
    }[edge]


def marching_segments(mask: np.ndarray) -> list[tuple[tuple[float, float], tuple[float, float]]]:
    raster = np.pad(mask.astype(np.uint8), 1)
    segments: list[tuple[tuple[float, float], tuple[float, float]]] = []
    for y in range(raster.shape[0] - 1):
        for x in range(raster.shape[1] - 1):
            tl, tr, br, bl = raster[y, x], raster[y, x + 1], raster[y + 1, x + 1], raster[y + 1, x]
            key = (tl << 3) | (tr << 2) | (br << 1) | bl
            for edge_a, edge_b in SEGMENTS[key]:
                segments.append((edge_point(edge_a, x - 1, y - 1), edge_point(edge_b, x - 1, y - 1)))
    return segments


def longest_loop(segments: list[tuple[tuple[float, float], tuple[float, float]]]) -> list[tuple[float, float]]:
    def round_point(point: tuple[float, float]) -> tuple[float, float]:
        return (round(point[0], 2), round(point[1], 2))

    adjacency: dict[tuple[float, float], list[tuple[float, float]]] = {}
    for a, b in segments:
        a = round_point(a)
        b = round_point(b)
        adjacency.setdefault(a, []).append(b)
        adjacency.setdefault(b, []).append(a)

    start = min(adjacency, key=lambda point: (point[1], point[0]))
    loop = [start]
    previous = None
    current = start

    for _ in range(len(segments) + 50):
        neighbors = adjacency[current]
        candidates = [neighbor for neighbor in neighbors if neighbor != previous] if previous is not None else neighbors
        if not candidates:
            break

        if previous is None:
            next_point = min(
                candidates,
                key=lambda point: math.atan2(point[1] - current[1], point[0] - current[0]) % (2 * math.pi),
            )
        else:
            base_angle = math.atan2(current[1] - previous[1], current[0] - previous[0])
            next_point = min(
                candidates,
                key=lambda point: (math.atan2(point[1] - current[1], point[0] - current[0]) - base_angle) % (2 * math.pi),
            )

        previous, current = current, next_point
        if current == start:
            break
        loop.append(current)

    return loop


def rdp(points: list[tuple[float, float]], epsilon: float) -> list[tuple[float, float]]:
    if len(points) < 3:
        return points

    pts = np.array(points, dtype=float)
    start = pts[0]
    end = pts[-1]
    line = end - start
    line_norm = np.linalg.norm(line)

    if line_norm == 0:
        distances = np.linalg.norm(pts - start, axis=1)
    else:
        offsets = pts - start
        distances = np.abs(line[0] * offsets[:, 1] - line[1] * offsets[:, 0]) / line_norm

    index = int(np.argmax(distances))
    max_distance = float(distances[index])

    if max_distance > epsilon:
        return rdp(points[: index + 1], epsilon)[:-1] + rdp(points[index:], epsilon)

    return [points[0], points[-1]]


def contour_polygon(mask: np.ndarray, epsilon: float) -> list[tuple[float, float]]:
    loop = longest_loop(marching_segments(mask))
    if not loop:
        raise RuntimeError('Failed to extract contour loop')
    simplified = rdp(loop + [loop[0]], epsilon)[:-1]
    return simplified


def normalize_polygon(points: list[tuple[float, float]], width: int, height: int) -> list[list[float]]:
    return [[round(x / width, 4), round(y / height, 4)] for x, y in points]


def bounds_from_polygon(points: list[tuple[float, float]], width: int, height: int) -> dict[str, float]:
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return {
        'x': round(min(xs) / width, 4),
        'y': round(min(ys) / height, 4),
        'w': round((max(xs) - min(xs)) / width, 4),
        'h': round((max(ys) - min(ys)) / height, 4),
    }


def polygon_to_svg(points: list[tuple[float, float]], width: int, height: int) -> str:
    point_string = ' '.join(f"{round(x)},{round(y)}" for x, y in points)
    return (
        f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" fill="none" xmlns="http://www.w3.org/2000/svg">\n'
        f'  <polygon points="{point_string}" fill="white" />\n'
        '</svg>\n'
    )


def main() -> None:
    image = Image.open(ART_PATH).convert('L')
    width, height = image.size
    grayscale = np.array(image)

    dark_mask = grayscale < 140
    labeled, component_count = ndimage.label(dark_mask)
    components: list[tuple[int, int]] = []
    for component_index in range(1, component_count + 1):
        area = int((labeled == component_index).sum())
        if area > 1000:
            components.append((area, component_index))
    components.sort(reverse=True)

    region_masks: dict[str, np.ndarray] = {
        'hero-right': labeled == components[0][1],
        'hero-left': labeled == components[1][1],
    }

    for region_id, boxes in MODULE_COMPONENT_BOXES.items():
        mask = np.zeros((height, width), dtype=bool)
        for x0, y0, x1, y1 in boxes:
            mask[y0 : y1 + 1, x0 : x1 + 1] = True
        mask = ndimage.binary_dilation(mask, iterations=8)
        mask = ndimage.binary_fill_holes(mask)
        region_masks[region_id] = mask

    polygons = {
        'hero-left': contour_polygon(region_masks['hero-left'], epsilon=1),
        'hero-right': contour_polygon(region_masks['hero-right'], epsilon=1),
        'module-left-a': contour_polygon(region_masks['module-left-a'], epsilon=2),
        'module-left-b': contour_polygon(region_masks['module-left-b'], epsilon=2),
        'module-right-a': contour_polygon(region_masks['module-right-a'], epsilon=2),
        'module-right-b': contour_polygon(region_masks['module-right-b'], epsilon=2),
    }

    layout = json.loads(LAYOUT_PATH.read_text())
    for region in layout['regions']:
        region_id = region['id']
        if region_id not in polygons:
            continue
        points = polygons[region_id]
        region['polygon'] = normalize_polygon(points, width, height)
        region['bounds'] = bounds_from_polygon(points, width, height)
        if region_id.startswith('hero'):
            region['note'] = 'Perfectionist retrace from extracted glyph contour via marching-squares debug pipeline.'
        else:
            region['note'] = 'Perfectionist retrace from grouped margin text-block components via debug-audited extraction pipeline.'
        svg_width = layout['viewport']['baseWidth']
        svg_height = layout['viewport']['baseHeight']
        scale_x = svg_width / width
        scale_y = svg_height / height
        svg_points = [(x * scale_x, y * scale_y) for x, y in points]
        (MASKS_DIR / f'{region_id}.svg').write_text(polygon_to_svg(svg_points, svg_width, svg_height))

    LAYOUT_PATH.write_text(json.dumps(layout, indent=2) + '\n')

    audit = Image.open(ART_PATH).convert('RGB')
    draw = ImageDraw.Draw(audit, 'RGBA')
    colors = {
        'hero-left': (255, 120, 0),
        'hero-right': (255, 80, 80),
        'module-left-a': (0, 180, 255),
        'module-left-b': (50, 220, 160),
        'module-right-a': (255, 0, 220),
        'module-right-b': (220, 220, 0),
    }
    for region_id, points in polygons.items():
        draw.polygon(points, outline=colors[region_id] + (255,), fill=colors[region_id] + (44,))
        xs = [point[0] for point in points]
        ys = [point[1] for point in points]
        centroid_x = sum(xs) / len(xs)
        centroid_y = sum(ys) / len(ys)
        draw.ellipse((centroid_x - 5, centroid_y - 5, centroid_x + 5, centroid_y + 5), fill=(255, 255, 255, 220))
        draw.text((min(xs), max(0, min(ys) - 14)), region_id, fill=(255, 255, 255, 255))
    audit.save(AUDIT_PATH)

    summary = {region_id: len(points) for region_id, points in polygons.items()}
    print(json.dumps({'updated': str(LAYOUT_PATH), 'audit': str(AUDIT_PATH), 'vertices': summary}, indent=2))


if __name__ == '__main__':
    main()
