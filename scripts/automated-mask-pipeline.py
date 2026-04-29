#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

try:
    from skimage import measure
except Exception:  # pragma: no cover - optional local dependency guard
    measure = None

try:
    import cv2
except Exception:  # pragma: no cover - optional local dependency guard
    cv2 = None

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_ROOT = ROOT / 'tmp' / 'automated-mask-generations'


@dataclass
class Artifact:
    id: str
    label: str
    kind: str
    artifact_type: str
    bounds: dict
    polygon: list[list[float]]


def load_json(path: Path):
    return json.loads(path.read_text())


def pil_font(size: int):
    candidates = [
        '/System/Library/Fonts/Supplemental/Arial.ttf',
        '/System/Library/Fonts/Supplemental/Helvetica.ttc',
    ]
    for candidate in candidates:
        p = Path(candidate)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def smoothstep(arr: np.ndarray) -> np.ndarray:
    arr = np.clip(arr, 0.0, 1.0)
    return arr * arr * (3 - 2 * arr)


def normalized(arr: np.ndarray) -> np.ndarray:
    arr = arr.astype(np.float32)
    lo = float(arr.min())
    hi = float(arr.max())
    if hi - lo < 1e-6:
        return np.zeros_like(arr, dtype=np.float32)
    return (arr - lo) / (hi - lo)


def rgb_to_gray(rgb: np.ndarray) -> np.ndarray:
    return (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]).astype(np.float32)


def estimate_depth_map(rgb: np.ndarray) -> np.ndarray:
    gray = normalized(rgb_to_gray(rgb))
    h, w = gray.shape
    yy = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    xx = np.linspace(0, 1, w, dtype=np.float32)[None, :]
    vertical_bias = 1.0 - yy
    vignette = 1.0 - np.sqrt((xx - 0.5) ** 2 + (yy - 0.55) ** 2)
    vignette = normalized(vignette)
    texture = normalized(ndimage.gaussian_gradient_magnitude(gray, sigma=3))
    depth = 0.52 * vertical_bias + 0.28 * vignette + 0.20 * (1.0 - texture)
    return normalized(ndimage.gaussian_filter(depth, sigma=6))


def artifact_seed_mask(bounds: dict, width: int, height: int, expand: float = 0.08) -> np.ndarray:
    x0 = clamp(int((bounds['x'] - expand) * width), 0, width - 1)
    y0 = clamp(int((bounds['y'] - expand) * height), 0, height - 1)
    x1 = clamp(int((bounds['x'] + bounds['w'] + expand) * width), 1, width)
    y1 = clamp(int((bounds['y'] + bounds['h'] + expand) * height), 1, height)
    mask = np.zeros((height, width), dtype=bool)
    mask[y0:y1, x0:x1] = True
    return mask


def polygon_mask(points: list[list[float]], width: int, height: int) -> np.ndarray:
    canvas = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(canvas)
    xy = [(x * width, y * height) for x, y in points]
    draw.polygon(xy, fill=255)
    return np.array(canvas) > 0


def pick_largest_component(mask: np.ndarray, preference_seed: np.ndarray) -> np.ndarray:
    labeled, count = ndimage.label(mask)
    if count == 0:
        return mask
    best_component = None
    best_score = -1.0
    for idx in range(1, count + 1):
        comp = labeled == idx
        area = float(comp.sum())
        overlap = float((comp & preference_seed).sum())
        score = overlap * 4.0 + area
        if score > best_score:
            best_score = score
            best_component = comp
    return best_component if best_component is not None else mask


def candidate_contour_tight(gray: np.ndarray, seed: np.ndarray, artifact_mask: np.ndarray) -> np.ndarray:
    local = ndimage.gaussian_filter(gray, sigma=1.2)
    high = np.percentile(local[seed], 68)
    low = np.percentile(local[seed], 24)
    center_pref = np.abs(local - np.median(local[artifact_mask]))
    near = center_pref < max(0.08, (high - low) * 0.9)
    edges = ndimage.gaussian_gradient_magnitude(local, sigma=1.0)
    edge_gate = edges < np.percentile(edges[seed], 72)
    mask = near & edge_gate & seed
    mask = ndimage.binary_closing(mask, iterations=2)
    mask = ndimage.binary_fill_holes(mask)
    return pick_largest_component(mask, artifact_mask)


def candidate_silhouette_soft(gray: np.ndarray, seed: np.ndarray, artifact_mask: np.ndarray) -> np.ndarray:
    blur = ndimage.gaussian_filter(gray, sigma=3.2)
    seed_median = np.median(blur[artifact_mask])
    distance = np.abs(blur - seed_median)
    threshold = np.percentile(distance[seed], 55)
    mask = distance < max(threshold, 0.06)
    mask &= seed
    mask = ndimage.binary_dilation(mask, iterations=2)
    mask = ndimage.binary_closing(mask, iterations=4)
    mask = ndimage.binary_fill_holes(mask)
    return pick_largest_component(mask, artifact_mask)


def candidate_semantic_object(rgb: np.ndarray, depth: np.ndarray, seed: np.ndarray, artifact_mask: np.ndarray) -> np.ndarray:
    rgb_n = normalized(rgb)
    inside_mean = rgb_n[artifact_mask].mean(axis=0)
    ring = ndimage.binary_dilation(seed, iterations=18) & ~ndimage.binary_erosion(seed, iterations=4)
    if ring.sum() < 10:
        ring = seed & ~artifact_mask
    outside_mean = rgb_n[ring].mean(axis=0) if ring.sum() else np.array([0.5, 0.5, 0.5], dtype=np.float32)
    fg_dist = np.linalg.norm(rgb_n - inside_mean[None, None, :], axis=2)
    bg_dist = np.linalg.norm(rgb_n - outside_mean[None, None, :], axis=2)
    color_score = smoothstep(normalized(bg_dist - fg_dist))
    seed_depth = np.median(depth[artifact_mask])
    depth_score = 1.0 - np.clip(np.abs(depth - seed_depth) / 0.18, 0.0, 1.0)
    combined = 0.72 * color_score + 0.28 * depth_score
    mask = combined > 0.54
    mask &= ndimage.binary_dilation(seed, iterations=4)
    mask = ndimage.binary_opening(mask, iterations=1)
    mask = ndimage.binary_closing(mask, iterations=3)
    mask = ndimage.binary_fill_holes(mask)
    return pick_largest_component(mask, artifact_mask)


def erode_or_original(mask: np.ndarray, iterations: int) -> np.ndarray:
    eroded = ndimage.binary_erosion(mask, iterations=iterations)
    return eroded if eroded.sum() else mask


def foreground_core_prompt(mask: np.ndarray) -> np.ndarray:
    distance = ndimage.distance_transform_edt(mask)
    values = distance[mask]
    if values.size == 0:
        return mask
    threshold = max(1.0, float(np.percentile(values, 72)))
    core = distance >= threshold
    if core.sum() < 8:
        return erode_or_original(mask, iterations=2)
    return core


def candidate_grabcut_prompted(rgb: np.ndarray, seed: np.ndarray, artifact_mask: np.ndarray) -> np.ndarray:
    if cv2 is None or artifact_mask.sum() < 8 or seed.sum() < 16:
        return artifact_mask

    h, w = seed.shape
    image = np.ascontiguousarray(rgb.astype(np.uint8))
    grabcut_mask = np.full((h, w), cv2.GC_BGD, dtype=np.uint8)

    # The expanded artifact region is the promptable foreground zone; the seed
    # ring gives GrabCut room to find the actual edge without swallowing the page.
    prompt_region = ndimage.binary_dilation(artifact_mask, iterations=3) & seed
    definite_fg = foreground_core_prompt(artifact_mask)
    grabcut_mask[seed] = cv2.GC_PR_BGD
    grabcut_mask[prompt_region] = cv2.GC_PR_FGD
    grabcut_mask[definite_fg] = cv2.GC_FGD

    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(image, grabcut_mask, None, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_MASK)
    except Exception:
        return artifact_mask

    mask = (grabcut_mask == cv2.GC_FGD) | (grabcut_mask == cv2.GC_PR_FGD)
    mask &= ndimage.binary_dilation(seed, iterations=1)
    mask = ndimage.binary_opening(mask, iterations=1)
    mask = ndimage.binary_closing(mask, iterations=2)
    mask = ndimage.binary_fill_holes(mask)
    return pick_largest_component(mask, artifact_mask)


def read_prompted_mask(mask_dir: Path | None, edition_name: str, artifact_id: str, width: int, height: int) -> np.ndarray | None:
    if mask_dir is None:
        return None
    candidates = [
        mask_dir / edition_name / f'{artifact_id}.png',
        mask_dir / f'{edition_name}--{artifact_id}.png',
        mask_dir / f'{artifact_id}.png',
    ]
    for candidate in candidates:
        if not candidate.exists():
            continue
        try:
            img = Image.open(candidate).convert('L').resize((width, height), Image.Resampling.LANCZOS)
            mask = np.array(img) >= 128
            if mask.sum() >= 8:
                mask = ndimage.binary_closing(mask, iterations=1)
                mask = ndimage.binary_fill_holes(mask)
                return mask
        except Exception:
            continue
    return None


def candidate_depth_aware(mask: np.ndarray, depth: np.ndarray, artifact_mask: np.ndarray, seed: np.ndarray) -> np.ndarray:
    seed_depth = float(np.median(depth[artifact_mask]))
    depth_band = np.abs(depth - seed_depth) < 0.14
    refined = mask & depth_band & ndimage.binary_dilation(seed, iterations=6)
    refined = ndimage.binary_closing(refined, iterations=2)
    refined = ndimage.binary_fill_holes(refined)
    return pick_largest_component(refined, artifact_mask)


def candidate_open_book_split(gray: np.ndarray, seed: np.ndarray, artifact_mask: np.ndarray) -> np.ndarray:
    blur = ndimage.gaussian_filter(gray, sigma=1.0)
    ys, xs = np.where(seed)
    if len(xs) == 0:
        return artifact_mask
    x0, x1 = xs.min(), xs.max() + 1
    y0, y1 = ys.min(), ys.max() + 1
    roi = blur[y0:y1, x0:x1]
    col_profile = roi.mean(axis=0)
    center = int(np.argmin(col_profile))
    valley_half = max(1, roi.shape[1] // 18)

    base = blur > np.percentile(blur[seed], 58)
    base &= seed
    valley_mask = np.zeros_like(base)
    valley_x0 = max(x0, x0 + center - valley_half)
    valley_x1 = min(x1, x0 + center + valley_half + 1)
    valley_mask[y0:y1, valley_x0:valley_x1] = True
    page_mask = base & ~valley_mask
    page_mask = ndimage.binary_closing(page_mask, iterations=2)
    page_mask = ndimage.binary_fill_holes(page_mask)
    return pick_largest_component(page_mask, artifact_mask)



def candidate_lamp_glow_suppression(gray: np.ndarray, seed: np.ndarray, artifact_mask: np.ndarray) -> np.ndarray:
    blur = ndimage.gaussian_filter(gray, sigma=1.4)
    seed_values = blur[seed]
    bright_core = blur >= np.percentile(seed_values, 82)
    support = blur >= np.percentile(seed_values, 68)
    distance = ndimage.distance_transform_edt(~bright_core)
    halo_gate = distance <= max(3, int(math.sqrt(float(artifact_mask.sum())) / 3.5))
    mask = support & halo_gate & ndimage.binary_dilation(seed, iterations=2)
    mask = ndimage.binary_closing(mask, iterations=2)
    mask = ndimage.binary_fill_holes(mask)
    return pick_largest_component(mask, artifact_mask)



def candidate_foliage_dehalo(gray: np.ndarray, seed: np.ndarray, artifact_mask: np.ndarray) -> np.ndarray:
    blur = ndimage.gaussian_filter(gray, sigma=1.1)
    texture = ndimage.gaussian_gradient_magnitude(blur, sigma=0.9)
    tone_gate = blur > np.percentile(blur[seed], 60)
    texture_gate = texture > np.percentile(texture[seed], 55)
    mask = tone_gate & texture_gate & seed
    mask = ndimage.binary_opening(mask, iterations=1)
    mask = ndimage.binary_dilation(mask, iterations=1)
    mask = ndimage.binary_closing(mask, iterations=2)
    mask = ndimage.binary_fill_holes(mask)
    return pick_largest_component(mask, artifact_mask)



def candidate_bright_core_subtraction(gray: np.ndarray, seed: np.ndarray, artifact_mask: np.ndarray) -> np.ndarray:
    blur = ndimage.gaussian_filter(gray, sigma=1.2)
    seed_values = blur[seed]
    core = blur >= np.percentile(seed_values, 84)
    support = blur >= np.percentile(seed_values, 70)
    core_distance = ndimage.distance_transform_edt(~core)
    limit = max(3, int(math.sqrt(float(max(1, artifact_mask.sum()))) / 2.5))
    mask = support & (core_distance <= limit) & seed
    mask = ndimage.binary_closing(mask, iterations=2)
    mask = ndimage.binary_fill_holes(mask)
    return pick_largest_component(mask, artifact_mask)



def candidate_local_watershed_split(gray: np.ndarray, seed: np.ndarray, artifact_mask: np.ndarray) -> np.ndarray:
    blur = ndimage.gaussian_filter(gray, sigma=1.0)
    base = blur > np.percentile(blur[seed], 60)
    base &= seed
    distance = ndimage.distance_transform_edt(base)
    peaks = distance >= max(2.0, float(distance[base].max()) * 0.55 if base.any() else 2.0)
    markers, count = ndimage.label(peaks)
    if count <= 1:
        return pick_largest_component(base, artifact_mask)
    labels, label_count = ndimage.label(base)
    best = None
    best_score = -1.0
    for idx in range(1, label_count + 1):
        comp = labels == idx
        score = float((comp & artifact_mask).sum()) * 4.0 + float(comp.sum())
        if score > best_score:
            best_score = score
            best = comp
    return pick_largest_component(best if best is not None else base, artifact_mask)



def candidate_saliency_core(gray: np.ndarray, seed: np.ndarray, artifact_mask: np.ndarray) -> np.ndarray:
    blur = ndimage.gaussian_filter(gray, sigma=1.0)
    local_mean = ndimage.uniform_filter(blur, size=7)
    contrast = np.clip(blur - local_mean, 0.0, None)
    ys, xs = np.where(seed)
    if len(xs) == 0:
        return artifact_mask
    cx = xs.mean()
    cy = ys.mean()
    yy, xx = np.indices(gray.shape)
    radial = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    center_bias = 1.0 - normalized(radial)
    saliency = normalized(contrast) * 0.78 + center_bias * 0.22
    mask = saliency > np.percentile(saliency[seed], 78)
    mask &= seed
    mask = ndimage.binary_opening(mask, iterations=1)
    mask = ndimage.binary_closing(mask, iterations=2)
    mask = ndimage.binary_fill_holes(mask)
    return pick_largest_component(mask, artifact_mask)



def mask_to_points(mask: np.ndarray, epsilon: float = 4.0) -> list[tuple[float, float]]:
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return []
    if measure is not None:
        contours = measure.find_contours(mask.astype(np.uint8), 0.5)
        if contours:
            contour = max(contours, key=len)
            pts = [(float(col), float(row)) for row, col in contour]
            if len(pts) >= 3:
                simplified = rdp(pts, epsilon)
                if len(simplified) >= 3:
                    return simplified

    pts = np.column_stack([xs, ys]).astype(np.float32)
    hull = convex_hull(pts)
    if len(hull) < 3:
        return [(float(xs.min()), float(ys.min())), (float(xs.max()), float(ys.min())), (float(xs.max()), float(ys.max())), (float(xs.min()), float(ys.max()))]
    simplified = rdp(hull, epsilon)
    return [(float(x), float(y)) for x, y in simplified]


def normalized_polygon(points: list[tuple[float, float]], width: int, height: int) -> list[list[float]]:
    normalized_points = []
    for x, y in points:
        normalized_points.append([
            round(float(np.clip(x / max(1, width), 0.0, 1.0)), 4),
            round(float(np.clip(y / max(1, height), 0.0, 1.0)), 4),
        ])
    return normalized_points


def normalized_polygon_to_points(points: list[list[float]], width: int, height: int) -> list[tuple[float, float]]:
    pixel_points = []
    for point in points:
        if not isinstance(point, (list, tuple)) or len(point) < 2:
            continue
        x = float(np.clip(float(point[0]), 0.0, 1.0)) * width
        y = float(np.clip(float(point[1]), 0.0, 1.0)) * height
        pixel_points.append((x, y))
    return pixel_points


def normalized_bounds(mask: np.ndarray, width: int, height: int, padding_px: int = 3) -> dict:
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return {'x': 0.0, 'y': 0.0, 'w': 0.0, 'h': 0.0}
    x0 = max(0, int(xs.min()) - padding_px)
    x1 = min(width, int(xs.max()) + padding_px + 1)
    y0 = max(0, int(ys.min()) - padding_px)
    y1 = min(height, int(ys.max()) + padding_px + 1)
    return {
        'x': round(x0 / width, 4),
        'y': round(y0 / height, 4),
        'w': round(max(1, x1 - x0) / width, 4),
        'h': round(max(1, y1 - y0) / height, 4),
    }


def bounds_area(bounds: dict) -> float:
    return max(0.0, float(bounds.get('w', 0.0))) * max(0.0, float(bounds.get('h', 0.0)))


def normalized_polygon_area(points: list[list[float]]) -> float:
    return polygon_area([(float(x), float(y)) for x, y in points])


def should_apply_contour_polygon(artifact: Artifact, mask: np.ndarray, polygon: list[tuple[float, float]], width: int, height: int) -> bool:
    if len(polygon) < 5:
        return False
    original_area = bounds_area(artifact.bounds)
    candidate_bounds = normalized_bounds(mask, width, height, padding_px=0)
    candidate_area = bounds_area(candidate_bounds)
    if original_area <= 0 or candidate_area <= 0:
        return False
    if candidate_area > original_area * 1.08:
        return False
    min_ratio = 0.08 if artifact.kind == 'hero' else 0.035
    min_absolute_area = 0.0012 if artifact.kind == 'hero' else 0.00045
    if candidate_area < max(original_area * min_ratio, min_absolute_area):
        return False
    return True


def write_svg_mask(mask_path: Path, points: list[tuple[float, float]], width: int, height: int) -> None:
    mask_path.parent.mkdir(parents=True, exist_ok=True)
    if len(points) < 3:
        points_attr = f'0,0 {width},0 {width},{height} 0,{height}'
    else:
        points_attr = ' '.join(f'{round(x, 2)},{round(y, 2)}' for x, y in points)
    mask_path.write_text(
        '\n'.join([
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">',
            f'  <polygon points="{points_attr}" fill="white"/>',
            '</svg>',
            '',
        ]),
        encoding='utf8',
    )


def convex_hull(points: np.ndarray) -> list[tuple[float, float]]:
    pts = sorted({(float(x), float(y)) for x, y in points.tolist()})
    if len(pts) <= 1:
        return pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def rdp(points: list[tuple[float, float]], epsilon: float) -> list[tuple[float, float]]:
    if len(points) < 3:
        return points
    start = np.array(points[0], dtype=np.float32)
    end = np.array(points[-1], dtype=np.float32)
    line = end - start
    norm = float(np.linalg.norm(line))
    max_distance = -1.0
    split = 0
    for i in range(1, len(points) - 1):
        p = np.array(points[i], dtype=np.float32)
        if norm == 0:
            distance = float(np.linalg.norm(p - start))
        else:
            offset = p - start
            distance = float(abs(line[0] * offset[1] - line[1] * offset[0]) / norm)
        if distance > max_distance:
            max_distance = distance
            split = i
    if max_distance > epsilon:
        left = rdp(points[: split + 1], epsilon)
        right = rdp(points[split:], epsilon)
        return left[:-1] + right
    return [points[0], points[-1]]


def polygon_area(points: Iterable[tuple[float, float]]) -> float:
    pts = list(points)
    if len(pts) < 3:
        return 0.0
    acc = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        acc += x1 * y2 - x2 * y1
    return abs(acc) * 0.5


def extract_geometry(mask: np.ndarray, polygon_pts: list[tuple[float, float]]) -> dict:
    ys, xs = np.where(mask)
    centroid = [float(xs.mean()), float(ys.mean())] if len(xs) else [0.0, 0.0]
    if len(xs):
        x0, x1 = float(xs.min()), float(xs.max())
        y0, y1 = float(ys.min()), float(ys.max())
    else:
        x0 = x1 = y0 = y1 = 0.0
    coords = np.column_stack([xs, ys]).astype(np.float32)
    if len(coords) >= 2:
        centered = coords - coords.mean(axis=0)
        _, _, vh = np.linalg.svd(centered, full_matrices=False)
        axis = vh[0]
        normal = np.array([-axis[1], axis[0]])
    else:
        axis = np.array([1.0, 0.0])
        normal = np.array([0.0, -1.0])
    top_band = coords[coords[:, 1] <= np.percentile(coords[:, 1], 15)] if len(coords) else np.empty((0, 2))
    top_edge = [float(top_band[:, 0].mean()), float(top_band[:, 1].mean())] if len(top_band) else [centroid[0], y0]
    safe_core = ndimage.binary_erosion(mask, iterations=8)
    core_ys, core_xs = np.where(safe_core)
    safe_center = [float(core_xs.mean()), float(core_ys.mean())] if len(core_xs) else centroid
    label_zone = {
        'x': safe_center[0] - max(18.0, (x1 - x0) * 0.18),
        'y': safe_center[1] - max(16.0, (y1 - y0) * 0.12),
        'w': max(36.0, (x1 - x0) * 0.36),
        'h': max(28.0, (y1 - y0) * 0.18),
    }
    hover_origin = [centroid[0] + normal[0] * 28.0, centroid[1] + normal[1] * 28.0]
    stage_window_origin = [centroid[0] + normal[0] * 84.0, centroid[1] + normal[1] * 84.0]
    preferred_expansion_direction = 'left' if normal[0] < -0.35 else 'right' if normal[0] > 0.35 else 'up' if normal[1] < 0 else 'down'
    return {
        'centroid_px': [round(centroid[0], 2), round(centroid[1], 2)],
        'weighted_visual_center_px': [round(safe_center[0], 2), round(safe_center[1], 2)],
        'dominant_axis': [round(float(axis[0]), 4), round(float(axis[1]), 4)],
        'local_normal': [round(float(normal[0]), 4), round(float(normal[1]), 4)],
        'top_edge_anchor_px': [round(top_edge[0], 2), round(top_edge[1], 2)],
        'bbox_px': [round(x0, 2), round(y0, 2), round(x1, 2), round(y1, 2)],
        'safe_label_zone_px': {k: round(v, 2) for k, v in label_zone.items()},
        'safe_hover_origin_px': [round(hover_origin[0], 2), round(hover_origin[1], 2)],
        'safe_stage_window_origin_px': [round(stage_window_origin[0], 2), round(stage_window_origin[1], 2)],
        'preferred_expansion_direction': [round(float(normal[0]), 4), round(float(normal[1]), 4)],
        'preferred_expansion_label': preferred_expansion_direction,
        'polygon_area_px': round(polygon_area(polygon_pts), 2),
        'vertex_count': len(polygon_pts),
    }


def score_candidate(mask: np.ndarray, artifact_mask: np.ndarray, seed: np.ndarray, depth: np.ndarray, gray: np.ndarray, artifact_type: str) -> dict:
    if mask.sum() == 0:
        return {'total': -999.0}
    area = float(mask.sum())
    overlap = float((mask & artifact_mask).sum()) / max(1.0, float(artifact_mask.sum()))
    coverage = float((mask & seed).sum()) / max(1.0, float(seed.sum()))
    leak = float((mask & ~seed).sum()) / max(1.0, area)
    edges = normalized(ndimage.gaussian_gradient_magnitude(gray, sigma=1.2))
    boundary = mask ^ ndimage.binary_erosion(mask, iterations=1)
    edge_align = float(edges[boundary].mean()) if boundary.any() else 0.0
    seed_depth = float(np.median(depth[artifact_mask]))
    depth_values = depth[mask]
    depth_consistency = 1.0 - min(1.0, float(np.abs(depth_values - seed_depth).mean()) / 0.18)
    depth_span_penalty = min(1.0, float(np.std(depth_values)) / 0.16)
    clickability = min(1.0, area / (gray.shape[0] * gray.shape[1] * 0.018))
    compactness = area / max(1.0, float(ndimage.binary_dilation(mask, iterations=2).sum()))
    ys, xs = np.where(mask)
    if len(xs):
        bbox_fill = area / max(1.0, float((xs.max() - xs.min() + 1) * (ys.max() - ys.min() + 1)))
    else:
        bbox_fill = 0.0
    perimeter = float(boundary.sum())
    circularity = (4.0 * math.pi * area / (perimeter * perimeter)) if perimeter > 0 else 0.0
    shape_prior_bonus = 0.0
    artifact_family_bonus = 0.0
    oversized_soft_penalty = 0.0
    type_bonus = 0.0
    if len(xs):
        w = float(xs.max() - xs.min() + 1)
        h = float(ys.max() - ys.min() + 1)
        aspect_ratio = w / max(1.0, h)
        bbox_mask = mask[int(ys.min()) : int(ys.max()) + 1, int(xs.min()) : int(xs.max()) + 1]
    else:
        w = h = 0.0
        aspect_ratio = 0.0
        bbox_mask = np.zeros((1, 1), dtype=bool)
    if artifact_type in {'paper-slip', 'reading-sheet'}:
        type_bonus = bbox_fill * 0.08
    elif artifact_type in {'glass-cabinet', 'device-cluster', 'altar-cluster'}:
        type_bonus = (1.0 - bbox_fill) * 0.04
    elif artifact_type in {'chart-disk', 'dish', 'orb'}:
        shape_prior_bonus = max(0.0, circularity - 0.55) * 0.16
    elif artifact_type == 'open-book':
        col_profile = bbox_mask.sum(axis=0).astype(np.float32)
        if len(col_profile) >= 3:
            middle_band = col_profile[len(col_profile) // 2 - 1 : len(col_profile) // 2 + 1].mean()
            side_band = max(col_profile[: max(1, len(col_profile) // 3)].mean(), col_profile[-max(1, len(col_profile) // 3) :].mean())
            valley = max(0.0, (side_band - middle_band) / max(1.0, float(bbox_mask.shape[0])))
        else:
            valley = 0.0
        wide_bonus = min(1.0, aspect_ratio / 1.6) * 0.08
        valley_bonus = min(1.0, valley * 1.8) * 0.12
        shape_prior_bonus = wide_bonus + valley_bonus
    elif artifact_type in {'book-stack', 'lamp', 'candle'}:
        verticality = min(1.0, (h / max(1.0, w)) / 2.2)
        shape_prior_bonus = verticality * 0.05
        if artifact_type == 'lamp':
            core_ratio = float(artifact_mask.sum()) / max(1.0, area)
            shape_prior_bonus += min(0.06, core_ratio * 0.06)
            artifact_family_bonus += min(0.16, core_ratio * 0.16)
            oversized_soft_penalty += max(0.0, (area / max(1.0, float(artifact_mask.sum()))) - 1.15) * 0.18
        if artifact_type == 'candle':
            core_ratio = float(artifact_mask.sum()) / max(1.0, area)
            artifact_family_bonus += min(0.09, core_ratio * 0.09)
            oversized_soft_penalty += max(0.0, (area / max(1.0, float(artifact_mask.sum()))) - 1.18) * 0.14
    elif artifact_type in {'plant-cluster', 'vials-cluster', 'tool-cluster', 'vial-tray'}:
        shape_prior_bonus = max(0.0, (1.0 - bbox_fill)) * 0.05
        spread_ratio = area / max(1.0, float(artifact_mask.sum()))
        oversized_soft_penalty += max(0.0, spread_ratio - 1.18) * 0.12
    total = (
        overlap * 0.3
        + coverage * 0.16
        + edge_align * 0.14
        + depth_consistency * 0.18
        + compactness * 0.08
        + clickability * 0.05
        + type_bonus
        + shape_prior_bonus
        + artifact_family_bonus
        - leak * 0.24
        - depth_span_penalty * 0.12
        - oversized_soft_penalty
    )
    return {
        'total': round(total, 4),
        'overlap': round(overlap, 4),
        'coverage': round(coverage, 4),
        'edge_align': round(edge_align, 4),
        'depth_consistency': round(depth_consistency, 4),
        'depth_span_penalty': round(depth_span_penalty, 4),
        'compactness': round(compactness, 4),
        'bbox_fill': round(bbox_fill, 4),
        'circularity': round(circularity, 4),
        'shape_prior_bonus': round(shape_prior_bonus, 4),
        'artifact_family_bonus': round(artifact_family_bonus, 4),
        'oversized_soft_penalty': round(oversized_soft_penalty, 4),
        'clickability': round(clickability, 4),
        'leak': round(leak, 4),
        'area_px': int(area),
    }


def colorize_mask(mask: np.ndarray, color: tuple[int, int, int]) -> Image.Image:
    h, w = mask.shape
    canvas = np.zeros((h, w, 4), dtype=np.uint8)
    canvas[mask] = (*color, 120)
    boundary = mask ^ ndimage.binary_erosion(mask, iterations=1)
    canvas[boundary] = (*color, 255)
    return Image.fromarray(canvas, mode='RGBA')


def render_audit_board(rgb: np.ndarray, depth: np.ndarray, artifact_results: list[dict], output_path: Path, title: str) -> None:
    base = Image.fromarray(rgb.astype(np.uint8), mode='RGB')
    width, height = base.size
    board_w = width * 2 + 60
    board_h = height * 2 + 120
    board = Image.new('RGB', (board_w, board_h), (18, 18, 20))
    title_font = pil_font(28)
    label_font = pil_font(18)
    small_font = pil_font(14)
    draw = ImageDraw.Draw(board)
    draw.text((24, 18), title, fill=(235, 232, 220), font=title_font)

    board.paste(base, (20, 70))

    overlay = base.convert('RGBA')
    for idx, result in enumerate(artifact_results):
        color = ((73 + idx * 37) % 255, (180 + idx * 51) % 255, (120 + idx * 67) % 255)
        overlay = Image.alpha_composite(overlay, colorize_mask(result['winner_mask'], color))
        cx, cy = result['geometry']['centroid_px']
        ImageDraw.Draw(overlay).ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill=(255, 255, 255, 255))
        ImageDraw.Draw(overlay).text((result['bbox_px'][0], max(0, result['bbox_px'][1] - 18)), result['artifact_id'], fill=(255, 255, 255, 255), font=small_font)
    board.paste(overlay.convert('RGB'), (width + 40, 70))

    depth_img = Image.fromarray((depth * 255).astype(np.uint8), mode='L').convert('RGB')
    board.paste(depth_img, (20, height + 90))

    summary = Image.new('RGB', (width, height), (26, 26, 30))
    sdraw = ImageDraw.Draw(summary)
    y = 16
    for result in artifact_results[:8]:
        sdraw.text((16, y), f"{result['artifact_id']}  winner={result['winner_name']}  score={result['winner_score']['total']}", fill=(230, 228, 218), font=label_font)
        y += 22
        sdraw.text((30, y), f"fallback={result['fallback_name']}  centroid={result['geometry']['centroid_px']}  hover={result['geometry']['safe_hover_origin_px']}", fill=(180, 180, 190), font=small_font)
        y += 18
    board.paste(summary, (width + 40, height + 90))

    draw.text((20, 48), 'source plate', fill=(180, 180, 190), font=label_font)
    draw.text((width + 40, 48), 'winner masks + centroids', fill=(180, 180, 190), font=label_font)
    draw.text((20, height + 68), 'estimated depth map', fill=(180, 180, 190), font=label_font)
    draw.text((width + 40, height + 68), 'winner / fallback / geometry summary', fill=(180, 180, 190), font=label_font)
    board.save(output_path)


def run_edition(edition_dir: Path, generation_name: str, apply_artifact_map: bool = False, prompted_mask_dir: Path | None = None) -> dict:
    edition = load_json(edition_dir / 'edition.json')
    artifact_map = load_json(edition_dir / 'artifact-map.json')
    plate_path = edition_dir / edition['plate_asset_path'].lstrip('/').split('/', 2)[-1]
    if not plate_path.exists():
        plate_path = edition_dir / 'assets' / 'plate.jpg'
    rgb = np.array(Image.open(plate_path).convert('RGB'))
    height, width = rgb.shape[:2]
    gray = normalized(rgb_to_gray(rgb))
    depth = estimate_depth_map(rgb)

    artifacts = [Artifact(
        id=a['id'],
        label=a['label'],
        kind=a['kind'],
        artifact_type=a['artifact_type'],
        bounds=a['bounds'],
        polygon=a['polygon'],
    ) for a in artifact_map['artifacts']]

    edition_out = OUTPUT_ROOT / generation_name / edition_dir.name
    edition_out.mkdir(parents=True, exist_ok=True)
    artifact_results = []
    geometry_export = {}
    candidate_pack_export = {}
    applied_artifact_ids = []
    synced_artifact_ids = []

    for artifact in artifacts:
        artifact_mask = polygon_mask(artifact.polygon, width, height)
        seed = artifact_seed_mask(artifact.bounds, width, height, expand=0.07 if artifact.kind == 'hero' else 0.05)
        contour = candidate_contour_tight(gray, seed, artifact_mask)
        silhouette = candidate_silhouette_soft(gray, seed, artifact_mask)
        semantic = candidate_semantic_object(rgb.astype(np.float32) / 255.0, depth, seed, artifact_mask)
        grabcut_prompted = candidate_grabcut_prompted(rgb, seed, artifact_mask)
        depth_contour = candidate_depth_aware(contour, depth, artifact_mask, seed)
        depth_semantic = candidate_depth_aware(semantic, depth, artifact_mask, seed)
        candidates = {
            'contour-tight': contour,
            'silhouette-soft': silhouette,
            'semantic-object': semantic,
            'grabcut-prompted': grabcut_prompted,
            'depth-contour': depth_contour,
            'depth-semantic': depth_semantic,
            'depth-grabcut-prompted': candidate_depth_aware(grabcut_prompted, depth, artifact_mask, seed),
        }
        prompted_mask = read_prompted_mask(prompted_mask_dir, edition_dir.name, artifact.id, width, height)
        if prompted_mask is not None:
            prompted_mask &= ndimage.binary_dilation(seed, iterations=2)
            candidates['external-prompted-mask'] = pick_largest_component(prompted_mask, artifact_mask)
            candidates['depth-external-prompted-mask'] = candidate_depth_aware(candidates['external-prompted-mask'], depth, artifact_mask, seed)
        if artifact.artifact_type == 'open-book':
            book_split = candidate_open_book_split(gray, seed, artifact_mask)
            candidates['open-book-split'] = book_split
            candidates['depth-book-split'] = candidate_depth_aware(book_split, depth, artifact_mask, seed)
            saliency_core = candidate_saliency_core(gray, seed, artifact_mask)
            candidates['saliency-core'] = saliency_core
            candidates['depth-saliency-core'] = candidate_depth_aware(saliency_core, depth, artifact_mask, seed)
        if artifact.artifact_type in {'lamp', 'candle'}:
            lamp_core = candidate_lamp_glow_suppression(gray, seed, artifact_mask)
            candidates['lamp-core'] = lamp_core
            candidates['depth-lamp-core'] = candidate_depth_aware(lamp_core, depth, artifact_mask, seed)
            bright_core = candidate_bright_core_subtraction(gray, seed, artifact_mask)
            candidates['bright-core'] = bright_core
            candidates['depth-bright-core'] = candidate_depth_aware(bright_core, depth, artifact_mask, seed)
        if artifact.artifact_type in {'plant-cluster', 'vial-tray', 'altar-object', 'cup', 'vessel'}:
            foliage_core = candidate_foliage_dehalo(gray, seed, artifact_mask)
            candidates['dehalo-core'] = foliage_core
            candidates['depth-dehalo-core'] = candidate_depth_aware(foliage_core, depth, artifact_mask, seed)
            local_split = candidate_local_watershed_split(gray, seed, artifact_mask)
            candidates['local-split'] = local_split
            candidates['depth-local-split'] = candidate_depth_aware(local_split, depth, artifact_mask, seed)
        scored = []
        for name, mask in candidates.items():
            score = score_candidate(mask, artifact_mask, seed, depth, gray, artifact.artifact_type)
            scored.append((score['total'], name, mask, score))
        scored.sort(reverse=True, key=lambda item: item[0])
        winner_total, winner_name, winner_mask, winner_score = scored[0]
        fallback_total, fallback_name, fallback_mask, fallback_score = scored[1]
        winner_polygon = mask_to_points(winner_mask, epsilon=5.0 if artifact.kind == 'hero' else 3.5)
        geometry = extract_geometry(winner_mask, winner_polygon)
        bbox_px = geometry['bbox_px']
        candidate_scores = {name: score for _, name, _, score in scored}
        artifact_results.append({
            'artifact_id': artifact.id,
            'winner_name': winner_name,
            'fallback_name': fallback_name,
            'winner_score': winner_score,
            'fallback_score': fallback_score,
            'winner_mask': winner_mask,
            'geometry': geometry,
            'bbox_px': bbox_px,
            'candidate_scores': candidate_scores,
        })
        geometry_export[artifact.id] = {
            'artifact_type': artifact.artifact_type,
            'winner': winner_name,
            'fallback': fallback_name,
            'scores': candidate_scores,
            'geometry': geometry,
        }
        candidate_pack_export[artifact.id] = {
            'artifact_type': artifact.artifact_type,
            'winner': winner_name,
            'fallback': fallback_name,
            'candidates': [
                {
                    'name': name,
                    'score': score,
                    'area_px': int(mask.sum()),
                    'coverage_px': int((mask & artifact_mask).sum()),
                }
                for _, name, mask, score in scored
            ],
            'winner_geometry': geometry,
            'fallback_geometry': extract_geometry(fallback_mask, mask_to_points(fallback_mask, epsilon=5.0 if artifact.kind == 'hero' else 3.5)),
        }

        if apply_artifact_map:
            mask_path = edition_dir / 'assets' / 'masks' / f'{artifact.id}.svg'
            polygon_for_svg = normalized_polygon_to_points(artifact.polygon, width, height)
            if should_apply_contour_polygon(artifact, winner_mask, winner_polygon, width, height):
                polygon_for_svg = winner_polygon
                applied_artifact_ids.append(artifact.id)
                for artifact_record in artifact_map['artifacts']:
                    if artifact_record['id'] != artifact.id:
                        continue
                    artifact_record['bounds'] = normalized_bounds(winner_mask, width, height)
                    artifact_record['polygon'] = normalized_polygon(winner_polygon, width, height)
                    artifact_record['mask_path'] = f'/editions/{edition_dir.name}/assets/masks/{artifact.id}.svg'
                    break
            else:
                for artifact_record in artifact_map['artifacts']:
                    if artifact_record['id'] != artifact.id:
                        continue
                    artifact_record['mask_path'] = f'/editions/{edition_dir.name}/assets/masks/{artifact.id}.svg'
                    break
            write_svg_mask(mask_path, polygon_for_svg, width, height)
            synced_artifact_ids.append(artifact.id)

    audit_path = edition_out / 'audit-board.png'
    render_audit_board(rgb, depth, artifact_results, audit_path, f'{edition_dir.name} · {generation_name}')
    (edition_out / 'geometry-kit.json').write_text(json.dumps(to_jsonable(geometry_export), indent=2) + '\n')
    (edition_out / 'candidate-pack.json').write_text(json.dumps(to_jsonable(candidate_pack_export), indent=2) + '\n')
    if apply_artifact_map:
        (edition_dir / 'artifact-map.json').write_text(json.dumps(to_jsonable(artifact_map), indent=2) + '\n')
        expected_masks = {f'{artifact.id}.svg' for artifact in artifacts}
        masks_dir = edition_dir / 'assets' / 'masks'
        if masks_dir.exists():
            for mask_file in masks_dir.glob('*.svg'):
                if mask_file.name not in expected_masks:
                    mask_file.unlink()
    depth_img = Image.fromarray((depth * 255).astype(np.uint8), mode='L')
    depth_img.save(edition_out / 'depth-map.png')
    summary = {
        'generation': generation_name,
        'edition': edition_dir.name,
        'audit_board': str(audit_path),
        'depth_map': str(edition_out / 'depth-map.png'),
        'geometry_kit': str(edition_out / 'geometry-kit.json'),
        'applied_artifact_map': apply_artifact_map,
        'applied_artifacts': applied_artifact_ids,
        'synced_svg_masks': synced_artifact_ids,
        'candidate_sources': {
            'opencv_grabcut': cv2 is not None,
            'skimage_contours': measure is not None,
            'external_prompted_mask_dir': str(prompted_mask_dir) if prompted_mask_dir else None,
        },
        'artifacts': {result['artifact_id']: {'winner': result['winner_name'], 'fallback': result['fallback_name'], 'score': result['winner_score']['total']} for result in artifact_results},
    }
    (edition_out / 'summary.json').write_text(json.dumps(to_jsonable(summary), indent=2) + '\n')
    return summary


def to_jsonable(value):
    if isinstance(value, dict):
        return {str(k): to_jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_jsonable(v) for v in value]
    if isinstance(value, np.generic):
        return value.item()
    return value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--generation-name', required=True)
    parser.add_argument('--apply-artifact-map', action='store_true', help='Write winning contour polygons and SVG masks back into packaged artifact-map.json.')
    parser.add_argument('--prompted-mask-dir', help='Optional directory of externally generated PNG masks, e.g. SAM/SAM2 masks named <artifact-id>.png or <edition-id>/<artifact-id>.png.')
    parser.add_argument('editions', nargs='+')
    args = parser.parse_args()

    summaries = []
    prompted_mask_dir = Path(args.prompted_mask_dir).resolve() if args.prompted_mask_dir else None
    for edition in args.editions:
        edition_dir = ROOT / 'public' / 'editions' / edition
        summaries.append(run_edition(edition_dir, args.generation_name, apply_artifact_map=args.apply_artifact_map, prompted_mask_dir=prompted_mask_dir))
    print(json.dumps(to_jsonable({'generated': summaries}), indent=2))


if __name__ == '__main__':
    main()
