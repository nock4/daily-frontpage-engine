# Daily Edition Schema

## Purpose
Define the canonical package for one daily front-page edition.

Each edition should be self-contained enough to:
- render live
- review in debug/clickable/solo/live
- publish
- archive
- replay later

## Core rule
One day = one edition package.

That package should include:
- the daily brief
- generated scene plate
- artifact map
- source bindings
- ambiance recipe
- review state
- publish metadata

## Top-level edition object
```json
{
  "edition_id": "2026-04-17-herbarium-bed-v1",
  "date": "2026-04-17",
  "status": "draft|review|approved|published|archived",
  "slug": "herbarium-bed-v1",
  "title": "Herbarium Bed",
  "scene_family": "herbarium-bed",
  "brief_id": "brief-2026-04-17-a",
  "plate_id": "plate-2026-04-17-a",
  "artifact_map_id": "map-2026-04-17-a",
  "source_binding_set_id": "bindings-2026-04-17-a",
  "ambiance_recipe_id": "ambiance-2026-04-17-a",
  "review_state_id": "review-2026-04-17-a",
  "publish_state": {
    "is_live": false,
    "published_at": null,
    "archive_path": null
  }
}
```

## 1. Daily brief
Captures why this edition exists.

```json
{
  "brief_id": "brief-2026-04-17-a",
  "date": "2026-04-17",
  "signal_cluster_ids": ["cluster-botany", "cluster-archive"],
  "research_node_ids": ["node-1", "node-2"],
  "mood": "quiet archival ecology",
  "material_language": ["aged paper", "pressed flora", "handwritten labels"],
  "lighting": "soft warm dusk",
  "object_inventory": ["specimen labels", "pressed stems", "paper seams"],
  "interaction_grammar": {
    "hero_count": 2,
    "module_count": 6,
    "window_strategy": "source-window"
  },
  "negative_constraints": ["no dashboard cards", "no empty compositional zones"]
}
```

## 2. Scene plate
Stores the generated image and provenance.

```json
{
  "plate_id": "plate-2026-04-17-a",
  "asset_path": "assets/plates/2026-04-17-herbarium-bed-v1.jpg",
  "width": 1280,
  "height": 720,
  "model": "provider/model-name",
  "seed": "optional-seed",
  "prompt_version": "prompt-v3",
  "generated_at": "2026-04-17T09:00:00Z",
  "scene_family": "herbarium-bed",
  "uniqueness_hash": "sha256-or-similar"
}
```

## 3. Artifact map
Defines hero/module geometry and semantics.

```json
{
  "artifact_map_id": "map-2026-04-17-a",
  "viewport": {
    "base_width": 1280,
    "base_height": 720,
    "aspect_ratio": "1280:720"
  },
  "default_cluster_id": "left-specimen",
  "default_artifact_id": "module-left-label",
  "artifacts": [
    {
      "id": "hero-left",
      "kind": "hero",
      "label": "Left pressed specimen",
      "artifact_type": "specimen-body",
      "cluster_id": "left-specimen",
      "bounds": {"x": 0.01, "y": 0.03, "w": 0.35, "h": 0.95},
      "polygon": [[0.02,0.08],[0.06,0.03],[0.21,0.02]],
      "z_index": 10,
      "source_binding_ids": ["binding-left-specimen"]
    }
  ]
}
```

## 4. Source binding set
Each artifact opens a real source window.

```json
{
  "source_binding_set_id": "bindings-2026-04-17-a",
  "bindings": [
    {
      "id": "binding-left-specimen",
      "artifact_id": "module-left-label",
      "source_type": "tweet|youtube|nts|article|image|link",
      "source_url": "https://...",
      "window_type": "social|video|audio|image|web",
      "hover_behavior": "preview|none",
      "click_behavior": "pin-open",
      "playback_persistence": true,
      "fallback_type": "rich-preview|outbound-link"
    }
  ]
}
```

## 5. Ambiance recipe
Stores edition-specific atmosphere.

```json
{
  "ambiance_recipe_id": "ambiance-2026-04-17-a",
  "motion_system": "soft-spore-drift",
  "color_drift": "warm-paper-breathing",
  "glow_behavior": "artifact-proximity",
  "audio_posture": "silent|ambient|reactive",
  "webgl_mode": "none|particles|shader-scene",
  "research_inputs": ["node-1", "node-2"]
}
```

## 6. Review state
Tracks whether the edition is ready.

```json
{
  "review_state_id": "review-2026-04-17-a",
  "geometry_status": "pending|pass|fail",
  "clickability_status": "pending|pass|fail",
  "behavior_status": "pending|pass|fail",
  "editorial_status": "pending|approved|rejected",
  "notes": []
}
```

## 7. Archive metadata
Supports long-term browsing.

```json
{
  "archive_record": {
    "edition_id": "2026-04-17-herbarium-bed-v1",
    "date": "2026-04-17",
    "scene_family": "herbarium-bed",
    "motif_tags": ["botany", "archive", "paper"],
    "preview_asset": "assets/previews/2026-04-17-herbarium-bed-v1.jpg",
    "archive_slug": "2026-04-17-herbarium-bed-v1"
  }
}
```

## File layout recommendation
```text
editions/
  2026-04-17-herbarium-bed-v1/
    edition.json
    brief.json
    artifact-map.json
    source-bindings.json
    ambiance.json
    review.json
    assets/
      plate.jpg
      preview.jpg
      masks/*.svg
```

## Validation rules
- one edition per date
- one unique plate per edition
- all artifact ids unique
- all source bindings must resolve to real source URLs
- all artifacts must reference real bindings when interactive
- published edition must have review pass states
- archive package must be complete before live pointer changes
