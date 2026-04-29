import importlib.util
import sys
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = ROOT / 'scripts' / 'automated-mask-pipeline.py'
SPEC = importlib.util.spec_from_file_location('automated_mask_pipeline', SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def test_score_candidate_reports_depth_span_penalty_and_prefers_tighter_mask():
    gray = np.zeros((12, 12), dtype=np.float32)
    gray[3:9, 3:9] = 0.5
    depth = np.ones((12, 12), dtype=np.float32) * 0.8
    depth[4:8, 4:8] = 0.25

    artifact_mask = np.zeros((12, 12), dtype=bool)
    artifact_mask[4:8, 4:8] = True

    seed = np.zeros((12, 12), dtype=bool)
    seed[3:9, 3:9] = True

    tight = artifact_mask.copy()
    leaky = seed.copy()

    tight_score = MODULE.score_candidate(tight, artifact_mask, seed, depth, gray, 'reading-sheet')
    leaky_score = MODULE.score_candidate(leaky, artifact_mask, seed, depth, gray, 'reading-sheet')

    assert 'depth_span_penalty' in tight_score
    assert tight_score['depth_span_penalty'] < leaky_score['depth_span_penalty']
    assert tight_score['total'] > leaky_score['total']


def test_extract_geometry_includes_stage_window_origin_and_expansion_direction():
    mask = np.zeros((40, 40), dtype=bool)
    mask[10:30, 12:28] = True
    polygon = [(12.0, 10.0), (28.0, 10.0), (28.0, 30.0), (12.0, 30.0)]

    geometry = MODULE.extract_geometry(mask, polygon)

    assert 'safe_stage_window_origin_px' in geometry
    assert 'preferred_expansion_direction' in geometry
    assert len(geometry['safe_stage_window_origin_px']) == 2
    assert len(geometry['preferred_expansion_direction']) == 2


def test_mask_to_points_follows_concave_contours_instead_of_convex_hull():
    mask = np.zeros((30, 30), dtype=bool)
    mask[5:24, 5:11] = True
    mask[18:24, 5:24] = True

    points = MODULE.mask_to_points(mask, epsilon=0.5)
    area = MODULE.polygon_area(points)

    assert len(points) > 4
    assert area < 220


def test_normalized_polygon_to_points_keeps_svg_masks_in_sync_with_artifact_map():
    points = MODULE.normalized_polygon_to_points([[0.1, 0.2], [0.5, 0.25], [0.42, 0.8]], 200, 100)

    assert points == [(20.0, 20.0), (100.0, 25.0), (84.0, 80.0)]


def test_foreground_core_prompt_uses_center_of_rough_mask():
    mask = np.zeros((40, 40), dtype=bool)
    mask[8:32, 6:34] = True

    core = MODULE.foreground_core_prompt(mask)

    assert core.sum() < mask.sum()
    assert core[20, 20]
    assert not core[9, 7]


def test_candidate_grabcut_prompted_trims_rectangular_background_when_available():
    if MODULE.cv2 is None:
        return

    rgb = np.zeros((72, 72, 3), dtype=np.uint8)
    rgb[:, :] = [36, 92, 48]
    yy, xx = np.ogrid[:72, :72]
    circle = (xx - 36) ** 2 + (yy - 36) ** 2 <= 13 ** 2
    rgb[circle] = [210, 34, 42]

    artifact_mask = np.zeros((72, 72), dtype=bool)
    artifact_mask[18:54, 18:54] = True
    seed = np.zeros((72, 72), dtype=bool)
    seed[12:60, 12:60] = True

    candidate = MODULE.candidate_grabcut_prompted(rgb, seed, artifact_mask)

    assert candidate[circle].mean() > 0.85
    assert candidate.sum() < artifact_mask.sum() * 0.75


def test_score_candidate_prefers_disk_like_shape_for_chart_artifacts():
    yy, xx = np.ogrid[:24, :24]
    circle = (xx - 12) ** 2 + (yy - 12) ** 2 <= 6 ** 2
    box = np.zeros((24, 24), dtype=bool)
    box[6:18, 6:18] = True
    seed = np.zeros((24, 24), dtype=bool)
    seed[4:20, 4:20] = True
    gray = np.zeros((24, 24), dtype=np.float32)
    depth = np.ones((24, 24), dtype=np.float32) * 0.4

    circle_score = MODULE.score_candidate(circle, circle, seed, depth, gray, 'chart-disk')
    box_score = MODULE.score_candidate(box, circle, seed, depth, gray, 'chart-disk')

    assert 'shape_prior_bonus' in circle_score
    assert circle_score['shape_prior_bonus'] > box_score['shape_prior_bonus']
    assert circle_score['total'] > box_score['total']


def test_score_candidate_prefers_open_book_like_geometry():
    open_book = np.zeros((32, 32), dtype=bool)
    open_book[12:24, 6:15] = True
    open_book[12:24, 17:26] = True
    open_book[14:24, 15:17] = True

    squat_block = np.zeros((32, 32), dtype=bool)
    squat_block[10:24, 8:24] = True

    seed = np.zeros((32, 32), dtype=bool)
    seed[8:26, 4:28] = True
    gray = np.zeros((32, 32), dtype=np.float32)
    depth = np.ones((32, 32), dtype=np.float32) * 0.5

    open_book_score = MODULE.score_candidate(open_book, open_book, seed, depth, gray, 'open-book')
    block_score = MODULE.score_candidate(squat_block, open_book, seed, depth, gray, 'open-book')

    assert 'shape_prior_bonus' in open_book_score
    assert open_book_score['shape_prior_bonus'] > block_score['shape_prior_bonus']
    assert open_book_score['total'] > block_score['total']



def test_score_candidate_prefers_irregular_clutter_for_plant_cluster():
    plant = np.zeros((28, 28), dtype=bool)
    plant[8:22, 12:16] = True
    plant[6:12, 8:12] = True
    plant[6:12, 16:20] = True
    plant[4:8, 10:13] = True
    plant[4:8, 15:18] = True

    box = np.zeros((28, 28), dtype=bool)
    box[6:22, 8:20] = True

    seed = np.zeros((28, 28), dtype=bool)
    seed[4:24, 6:22] = True
    gray = np.zeros((28, 28), dtype=np.float32)
    depth = np.ones((28, 28), dtype=np.float32) * 0.45

    plant_score = MODULE.score_candidate(plant, plant, seed, depth, gray, 'plant-cluster')
    box_score = MODULE.score_candidate(box, plant, seed, depth, gray, 'plant-cluster')

    assert plant_score['shape_prior_bonus'] > box_score['shape_prior_bonus']
    assert plant_score['total'] > box_score['total']



def test_candidate_open_book_split_preserves_center_valley():
    gray = np.zeros((40, 40), dtype=np.float32)
    gray[10:30, 7:17] = 0.8
    gray[10:30, 23:33] = 0.8
    gray[13:30, 18:22] = 0.25

    seed = np.zeros((40, 40), dtype=bool)
    seed[8:32, 5:35] = True
    artifact_mask = np.zeros((40, 40), dtype=bool)
    artifact_mask[10:30, 7:17] = True
    artifact_mask[10:30, 23:33] = True
    artifact_mask[13:30, 18:22] = True

    candidate = MODULE.candidate_open_book_split(gray, seed, artifact_mask)
    valley_fill = candidate[15:28, 19:21].mean()
    page_fill = candidate[15:28, 10:15].mean()

    assert page_fill > valley_fill



def test_candidate_lamp_glow_suppression_trims_outer_halo():
    yy, xx = np.ogrid[:40, :40]
    dist = np.sqrt((xx - 20) ** 2 + (yy - 20) ** 2)
    gray = np.clip(1.0 - dist / 18.0, 0.0, 1.0).astype(np.float32)
    seed = np.zeros((40, 40), dtype=bool)
    seed[8:32, 8:32] = True
    artifact_mask = dist <= 7

    candidate = MODULE.candidate_lamp_glow_suppression(gray, seed, artifact_mask)

    inner_fill = candidate[dist <= 6].mean()
    halo_fill = candidate[(dist >= 10) & (dist <= 14)].mean()
    assert inner_fill > halo_fill



def test_candidate_foliage_dehalo_prefers_branchy_core_over_boxy_fill():
    gray = np.zeros((36, 36), dtype=np.float32)
    gray[10:28, 16:20] = 0.75
    gray[8:14, 11:16] = 0.7
    gray[8:14, 20:25] = 0.7
    gray[5:10, 14:18] = 0.7
    gray[5:10, 19:23] = 0.7
    gray[8:30, 8:28] += 0.15

    seed = np.zeros((36, 36), dtype=bool)
    seed[6:32, 8:28] = True
    artifact_mask = np.zeros((36, 36), dtype=bool)
    artifact_mask[10:28, 16:20] = True
    artifact_mask[8:14, 11:16] = True
    artifact_mask[8:14, 20:25] = True
    artifact_mask[5:10, 14:18] = True
    artifact_mask[5:10, 19:23] = True

    candidate = MODULE.candidate_foliage_dehalo(gray, seed, artifact_mask)
    branch_fill = candidate[artifact_mask].mean()
    outer_haze = candidate[8:30, 8:28].mean()
    assert branch_fill > outer_haze



def test_candidate_bright_core_subtraction_keeps_core_and_reduces_outer_glow():
    yy, xx = np.ogrid[:48, :48]
    dist = np.sqrt((xx - 24) ** 2 + (yy - 24) ** 2)
    gray = np.clip(1.0 - dist / 20.0, 0.0, 1.0).astype(np.float32)
    seed = np.zeros((48, 48), dtype=bool)
    seed[10:38, 10:38] = True
    artifact_mask = dist <= 6

    candidate = MODULE.candidate_bright_core_subtraction(gray, seed, artifact_mask)

    core_fill = candidate[dist <= 5].mean()
    outer_fill = candidate[(dist >= 11) & (dist <= 16)].mean()
    assert core_fill > outer_fill



def test_candidate_local_watershed_split_prefers_one_lobe_over_bridge_fill():
    gray = np.zeros((42, 42), dtype=np.float32)
    gray[10:28, 7:17] = 0.8
    gray[10:28, 25:35] = 0.78
    gray[16:22, 17:25] = 0.5
    seed = np.zeros((42, 42), dtype=bool)
    seed[8:30, 5:37] = True
    artifact_mask = np.zeros((42, 42), dtype=bool)
    artifact_mask[10:28, 7:17] = True

    candidate = MODULE.candidate_local_watershed_split(gray, seed, artifact_mask)

    left_fill = candidate[12:26, 9:15].mean()
    bridge_fill = candidate[16:22, 18:24].mean()
    right_fill = candidate[12:26, 27:33].mean()
    assert left_fill > bridge_fill
    assert left_fill >= right_fill



def test_candidate_saliency_core_prefers_high_contrast_center_mass():
    gray = np.zeros((40, 40), dtype=np.float32)
    gray[11:29, 16:24] = 0.82
    gray[7:15, 8:18] = 0.35
    gray[7:15, 22:32] = 0.35
    seed = np.zeros((40, 40), dtype=bool)
    seed[6:31, 7:33] = True
    artifact_mask = np.zeros((40, 40), dtype=bool)
    artifact_mask[11:29, 16:24] = True

    candidate = MODULE.candidate_saliency_core(gray, seed, artifact_mask)

    center_fill = candidate[12:28, 17:23].mean()
    wing_fill = candidate[8:14, 9:17].mean()
    assert center_fill > wing_fill



def test_artifact_type_weighting_prefers_bright_core_for_small_luminous_objects():
    gray = np.zeros((40, 40), dtype=np.float32)
    yy, xx = np.ogrid[:40, :40]
    dist = np.sqrt((xx - 20) ** 2 + (yy - 20) ** 2)
    gray += np.clip(1.0 - dist / 18.0, 0.0, 1.0) * 0.9
    depth = np.ones((40, 40), dtype=np.float32) * 0.45
    seed = np.zeros((40, 40), dtype=bool)
    seed[8:32, 8:32] = True
    artifact_mask = dist <= 6

    bright_core = MODULE.candidate_bright_core_subtraction(gray, seed, artifact_mask)
    soft = MODULE.candidate_silhouette_soft(gray, seed, artifact_mask)

    bright_score = MODULE.score_candidate(bright_core, artifact_mask, seed, depth, gray, 'lamp')
    soft_score = MODULE.score_candidate(soft, artifact_mask, seed, depth, gray, 'lamp')

    assert 'artifact_family_bonus' in bright_score
    assert bright_score['artifact_family_bonus'] > soft_score['artifact_family_bonus']
    assert bright_score['total'] > soft_score['total']



def test_oversized_soft_mask_penalty_hits_clutter_scene_candidates():
    gray = np.zeros((36, 36), dtype=np.float32)
    gray[10:26, 15:21] = 0.8
    gray[8:14, 10:15] = 0.7
    gray[8:14, 21:26] = 0.7
    depth = np.ones((36, 36), dtype=np.float32) * 0.5
    seed = np.zeros((36, 36), dtype=bool)
    seed[6:30, 8:28] = True
    artifact_mask = np.zeros((36, 36), dtype=bool)
    artifact_mask[10:26, 15:21] = True
    artifact_mask[8:14, 10:15] = True
    artifact_mask[8:14, 21:26] = True

    tight = MODULE.candidate_foliage_dehalo(gray, seed, artifact_mask)
    oversized = MODULE.candidate_silhouette_soft(gray, seed, artifact_mask)

    tight_score = MODULE.score_candidate(tight, artifact_mask, seed, depth, gray, 'plant-cluster')
    oversized_score = MODULE.score_candidate(oversized, artifact_mask, seed, depth, gray, 'plant-cluster')

    assert 'oversized_soft_penalty' in tight_score
    assert oversized_score['oversized_soft_penalty'] > tight_score['oversized_soft_penalty']



def test_run_edition_candidate_pack_contains_ranked_candidates_and_fallback_geometry(tmp_path):
    edition_dir = ROOT / 'public' / 'editions' / '2026-04-18-signal-greenhouse-bench-v1'
    old_output_root = MODULE.OUTPUT_ROOT
    try:
        MODULE.OUTPUT_ROOT = tmp_path
        MODULE.run_edition(edition_dir, 'pytest-batch')
    finally:
        MODULE.OUTPUT_ROOT = old_output_root

    candidate_pack = tmp_path / 'pytest-batch' / edition_dir.name / 'candidate-pack.json'
    assert candidate_pack.exists()

    import json

    payload = json.loads(candidate_pack.read_text())
    first_artifact = next(iter(payload.values()))
    assert first_artifact['candidates'][0]['score']['total'] >= first_artifact['candidates'][1]['score']['total']
    assert 'fallback_geometry' in first_artifact
    assert 'preferred_expansion_label' in first_artifact['fallback_geometry']

    summary_path = tmp_path / 'pytest-batch' / edition_dir.name / 'summary.json'
    assert summary_path.exists()
    summary = json.loads(summary_path.read_text())
    assert summary['generation'] == 'pytest-batch'
