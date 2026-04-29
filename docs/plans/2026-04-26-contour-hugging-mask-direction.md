# Contour-Hugging Mask Direction

Date: 2026-04-26

Status: current direction. The concave contour, artifact-map writeback, SVG mask output, and GrabCut candidate pieces are implemented in the daily process. SAM/SAM 2 remains an optional prompted-mask input path rather than a required dependency.

## Problem

The post-plate mask pass was producing useful audit data, but the runtime artifact map could still use the original rectangular or coarse planned polygons. That made hover/click regions feel loose even when the generated plate had cleaner object edges.

## Research Notes

- Segment Anything frames promptable segmentation as the right long-term fit for this project: we already have rough artifact boxes/points from the plate interpretation pass, and SAM-style models are designed to turn prompts into object masks on new image distributions.
  Source: https://arxiv.org/abs/2304.02643
- SAM 2 is the better future target if we add video-like temporal review or iterative correction, but its image benefits also matter: the paper reports stronger and faster image segmentation than SAM.
  Source: https://arxiv.org/abs/2408.00714
- GrabCut remains a useful fallback when we have a rectangle plus definite foreground/background seeds. It is not as semantic as SAM, but it matches our current artifact-bounds input and can refine foreground from a rough rectangle through iterative graph cuts.
  Source: https://docs.opencv.org/4.x/d8/d83/tutorial_py_grabcut.html
- Marching-squares contour extraction is the correct low-cost bridge from binary masks to runtime polygons. `skimage.measure.find_contours` gives subpixel-ish boundary contours instead of the old convex hull, which matters for concave objects, flowers, branches, holes, and irregular silhouettes.
  Source: https://scikit-image.org/docs/stable/auto_examples/edges/plot_contours.html

## Direction

1. Keep the current heuristic candidate pack for cheap local scoring.
2. Convert winning binary masks into concave marching-squares polygons, not convex hulls.
3. Write the winning polygons back into packaged `artifact-map.json`.
4. Write matching SVG masks under `assets/masks/` so the package actually contains the mask files referenced by the artifact map.
5. Add a SAM/SAM 2 candidate source, using current vision bounds as box prompts and artifact centroids as point prompts.
6. Add a GrabCut fallback candidate seeded from the current artifact rectangle plus the winning heuristic core.
7. Score masks with edge alignment, object coverage, leak outside seed, depth consistency, area sanity, and clickability.

## Implemented Now

- The mask pipeline now uses `skimage.measure.find_contours` when available, falling back to the old convex hull only if contour extraction fails.
- `npm run daily:process` now calls the mask pass with `--apply-artifact-map`, so generated editions receive tighter polygons and real SVG masks.
- The mask pipeline now adds an OpenCV GrabCut candidate. It treats the artifact polygon as a probable foreground prompt, carves a smaller definite foreground core, and lets graph-cut refinement compete against the heuristic masks in the existing scorer.
- The mask pipeline now accepts `--prompted-mask-dir` for externally generated PNG masks. This is the integration point for SAM/SAM 2 output without coupling the daily process to a heavy local Torch install.
- A regression test verifies concave masks keep more than four points and do not collapse into a rectangular hull.

## Next Implementation Step

Generate SAM/SAM 2 masks into the prompted-mask directory:

```text
vision/planned artifact bounds -> SAM box prompt
artifact centroid / weighted center -> positive point prompt
neighbor/background ring -> negative point prompt
SAM masks -> PNG files in tmp/sam2-masks/<edition-id>/<artifact-id>.png
daily mask pass --prompted-mask-dir tmp/sam2-masks -> existing scorer -> winning runtime polygon
```

This should replace the current heuristic winner when the SAM mask has better edge alignment, lower leakage, and acceptable click area.
