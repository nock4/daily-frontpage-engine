# Geometry Kit Placement Findings

Status: historical findings from the geometry-kit experiment. Current generated editions still may consume edition-local geometry metadata, but the active post-plate mask path is documented in `docs/process.md` and `docs/plans/2026-04-26-contour-hugging-mask-direction.md`.

## What was tested

We ran an automated mask-and-geometry loop through seven batches, then wired the best geometry outputs into runtime stage-window placement.

The masking experiment covered three archive editions:
- `2026-04-18-signal-greenhouse-bench-v1`
- `2026-04-20-orbit-map-studio-v1`
- `2026-04-21-candle-library-altar-v1`

The runtime wiring step then copied the current best `geometry-kit.json` into those edition packages and changed stage placement to use geometry anchors when present.

## Final geometry contract used by runtime

Per artifact, runtime can now consume:
- `safe_stage_window_origin_px`
- `safe_hover_origin_px`
- `preferred_expansion_label`

These come from `geometry-kit.json` and are merged onto matching `artifactMap.artifacts[*].geometry` records during load.

## What improved

### 1. Placement is no longer bound-only
Before this pass, stage window placement only used artifact bounds and a generic left/right heuristic.

After this pass, stage windows can anchor from geometry-derived origins and expansion direction.

### 2. Signal lamp placement became more scene-aware
For `signal-greenhouse-bench-v1`, clicking `module-lamp` moved the primary stage window from a more generic center-left feel to a more plausible lamp-adjacent position.

Measured primary window left position during verification:
- before geometry-kit placement: `464px`
- after geometry-kit placement: `608px`

This was verified with a live Playwright screenshot review artifact:
- `tmp/geometry-placement-signal-lamp-window-v2.png`

### 3. The contract is now edition-local
Geometry placement lives with the edition package rather than hard-coded scene exceptions in runtime.

That means future editions can improve placement by improving geometry extraction, not by adding one-off UI rules.

## What did not improve enough

### 1. Hard clutter scenes are still hard
The mask loop improved ranking behavior for:
- small luminous objects
- clutter suppression
- contour preference in some shelf/candle regions

But the hardest scenes still resist purely heuristic candidate generation.

In particular:
- `signal-greenhouse-bench-v1` still has clutter ambiguity around plants, lamp glow, and nearby glass objects
- `candle-library-altar-v1` still resists specialized open-book split candidates

### 2. Geometry-aware placement is better, but not fully object-emitted
The updated lamp placement reads more plausibly anchored than a generic centered overlay, but it still looks like a floating UI object rather than something fully projected or materially emitted by the lamp.

This is a placement improvement, not a full visual integration solution.

## Best-performing scene in the mask experiment
`2026-04-20-orbit-map-studio-v1`

Why:
- the hero object is structurally clear
- candidate ranking stays stable
- circular/object-shape adherence matters and was visible
- geometry extraction is cleaner than the clutter-heavy scenes

## Final read on the masking loop

### Batches that mattered most
- batch-04: improved open-book and clutter priors
- batch-05: added specialized candidates
- batch-07: artifact-type rescoring and oversized-soft-mask suppression

### Most important finding
Adding more candidate types eventually stopped helping.

The meaningful shift came when ranking changed by artifact family, especially for:
- lamps
- candles
- clutter-heavy plant/vial regions

## Recommended stopping point
The masking experiment is at a good stopping point for heuristic work.

Further gains likely require one of these:
- a stronger real monocular depth or segmentation model
- runtime-level judging of interaction outcome instead of mask purity alone
- visual tether/projection treatment so anchored windows feel materially connected to their source artifacts

## Recommended next moves

### If improving placement realism
- add optional visual tether or light-field relation from artifact to window
- bias window frame styling by artifact family so placement feels less generic

### If improving mask quality
- swap in a stronger model-backed depth or segmentation source
- keep the current scoring/ranking system as the arbitration layer

### If improving product truth
- evaluate whether geometry-kit placement improves actual live UX in multiple editions, not just mask-board quality

## Files involved
- `scripts/automated-mask-pipeline.py`
- `src/lib/editionLoader.ts`
- `src/lib/stageWindowPlacement.ts`
- `src/types/runtime.ts`
- `public/editions/*/geometry-kit.json`
- `tmp/automated-mask-generations/mask-batch-07/*`
