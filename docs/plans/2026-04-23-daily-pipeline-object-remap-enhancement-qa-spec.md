# Daily Frontpage Engine Pipeline Spec

Status: historical/high-level plan. The current runnable implementation is `npm run daily:process`; the current exact process contract lives in `docs/process.md`. This plan remains useful for product intent around post-plate interpretation, contour masks, enhancement selection, and QA gates.

> Historical note: this was the high-level workflow before `npm run daily:process` became the canonical runnable path. Keep it for product intent, but use `docs/process.md` for the exact current pipeline.

**Goal:** Define the full end-to-end daily-frontpage-engine pipeline, including the new object-aware remapping, enhancement selection, and pre-live Playwright QA/autofix loop.

**Architecture:** The pipeline remains signal-driven and scene-first. The new logic sits after plate generation: first inspect what the image actually produced, then remap artifacts and masks around those real objects, then choose scene-native enhancements that fit those objects, then run pre-live browser QA and auto-fix weak spots before promotion.

**Tech Stack:** signal intake scripts, source fetch + media capture, GPT Image 2 generation, vision/object analysis, segmentation/contour extraction, edition packaging JSON, Playwright, screenshot + vision review, runtime build/validate scripts.

---

## Core principle

The generated plate is not the end of the creative process.
It is the beginning of the runtime interpretation pass.

The system should not assume that the prompt's intended objects are the same as the image's actual objects.
The image must be inspected after generation, and the runtime package must be rebuilt around what actually appeared.

## Full pipeline

### 1. Signal intake
Collect recent taste/activity signals from the existing intake sources.

Historical examples included broad notes, bookmarks, likes, clips, research notes, and recent sessions. The current implementation is narrower: it only reads the saved-signal allowlist documented in `docs/process.md` before choosing public source bindings.

Output:
- normalized signal set for the day

### 2. Cluster + winner selection
Group signals into candidate worlds and pick the strongest winner.

Selection criteria:
- clear thesis
- strong scene potential
- object ecology likely to produce many scene-native artifacts
- enough real sources and media to support source windows

Output:
- chosen world / scene family
- candidate source list

### 3. Source research + media fetch
Fetch real sources before packaging.

Requirements:
- use actual URLs
- fetch source content
- collect real media
- gather screenshots/thumbnails when native source media is weak

Output:
- source text captures
- source screenshots/thumbnails
- media bundle for packaging

### 4. Plate generation
Generate the main scene image from scratch.

Requirements:
- no refinement unless explicitly requested
- direct OpenAI `gpt-image-2` first
- fallbacks only if needed

Output:
- generated plate image

### 5. Plate analysis
Analyze the generated plate itself, not just the prompt.

Questions to answer:
- what actual objects are visible?
- what objects are visually dominant?
- what surfaces can hold HTML/text/media?
- where are likely heroes vs modules?
- how dense/cluttered is the scene?
- what parts are readable / legible enough for interaction?

Required outputs:
- detected object list
- surface list
- scene-density notes
- artifact candidates with rough regions

### 6. Object remapping + contour mask generation
This is a required downstream step from plate analysis.

Purpose:
- remap heroes/modules around what actually appeared in the image
- regenerate artifact regions based on real objects
- make masks hug contours as closely as possible

Substeps:
1. select final hero objects
2. select final module objects
3. discard weak/ambiguous object candidates
4. generate contour-aware masks for selected objects
5. simplify those masks into runtime-safe SVG geometry

Requirements:
- do not rely on rough prompt-era boxes if the image materially differs
- prefer contour-hugging masks over generic broad rectangles
- keep masks precise enough to feel touchable, but simple enough to remain stable in runtime

Implementation note:
- semantic object detection picks the object
- segmentation/contour extraction defines the geometry

Output:
- final hero/module set
- contour-aware artifact polygons/masks
- remapped artifact map

### 7. Enhancement selection
This is the new extra decision layer. It does not replace the pipeline.
It chooses which scene-native techniques fit the actual objects that appeared.

Purpose:
- avoid using the same enhancement grammar every day
- fit the runtime treatment to the image's real object ecology

Examples:
- lamp present -> lamp-projected HTML fragment
- monitor/device face present -> screen-rendered HTML
- clipped notes/papers present -> warped paper fragment HTML
- drawers/index boxes present -> card-file/drawer metadata HTML
- placards/labels present -> hidden self-aware embedded text
- reflective surfaces present -> ghost/reflection mode

Rules:
- choose a small bundle, not everything
- only use techniques supported by the actual image
- do not force a device-screen renderer into a scene with no device
- do not force a big mission layer where the scene wants quiet fragments

Output:
- enhancement bundle for that edition
- per-artifact enhancement assignments where needed

### 8. Edition packaging
Build the edition package from:
- source research/media
- remapped artifacts
- contour-aware masks
- enhancement selection

Artifacts to produce:
- `edition.json`
- `brief.json`
- `artifact-map.json`
- `source-bindings.json`
- `ambiance.json`
- `review.json`
- mask SVGs
- plate/preview assets
- source-preview assets

Output:
- packaged edition ready to build

### 9. Pre-live UX / QA autofix loop
This is the new crucial QA layer before promotion.

Purpose:
- actively test the site before live promotion
- catch weak interactions, awkward layout, bad source treatment, and enhancement mismatches
- automatically fix what can be fixed before push

This is not optional.

## QA tool choice

### Primary tool: Playwright
Playwright should be the main UX testing system.

Why:
- deterministic hover/click testing
- real browser interaction
- screenshot capture
- geometry checks
- regression-friendly
- works locally and against the remote tunnel

Playwright should test:
- hover preview behavior
- click/pin-open behavior
- close behavior
- artifact/window tethering
- source media quality/presence
- enhancement fit
- overlap/collision issues
- remote review link behavior

### Secondary tool: screenshot + vision review
After Playwright captures screenshots, vision review should evaluate:
- does the page still read as a world?
- is the enhancement actually suited to the object?
- is any hero/mission copy too loud?
- do previews feel embedded or detached?
- is the page samey or dynamically mixed?

### Autofix scope
If the QA pass finds problems, Hermes should patch what can be fixed automatically before promotion.

Examples:
- preview placement too detached -> patch spacing/placement
- source media too weak -> recapture screenshot / improve source preview asset
- enhancement mismatch -> change enhancement assignment
- artifact mapping too sloppy -> refine object mapping or mask region
- mission layer too loud -> reduce or hide it in scene-native artifacts

Output:
- QA-reviewed build candidate
- patch set if needed
- rerun until pass

### 10. Validate + build
After the QA/autofix loop, run the normal validation/build chain again.

Required:
- `npm run validate:editions`
- `npm run build`

Output:
- validated build candidate

### 11. Final browser verification
Run final local and remote checks after the last patch round.

Requirements:
- local verification in browser
- remote/tunnel verification in browser
- screenshot evidence
- verify representative hover/click cases across different topic/source classes

Output:
- final verified release candidate

### 12. Promote live
Only after all prior phases pass.

Steps:
- update live edition pointer
- archive previous live edition
- keep review link available

Output:
- live edition

---

## What changed relative to the older manual pipeline

The older simplified flow was effectively:
- generate plate
- package edition
- verify
n
The new intended flow is:
- generate plate
- analyze actual image
- remap objects/modules
- generate contour-hugging masks
- choose enhancement bundle from actual objects
- package edition
- run pre-live Playwright QA/autofix loop
- validate/build
- final verify
- promote

---

## Required implementation additions

### A. Object remapping system
Need a formal post-generation artifact remapper that:
- reads plate analysis output
- selects heroes/modules
- writes updated artifact map data

### B. Contour-aware mask generation
Need a mask pipeline that:
- generates masks from detected object contours
- simplifies them into runtime-safe SVGs
- avoids defaulting to broad boxes when a better object contour exists

### C. Enhancement selector
Need a selector that:
- maps detected objects/surfaces to a small enhancement bundle
- records those decisions into packaging output
- prevents same treatment every day

### D. Playwright pre-live QA loop
Need a standard pre-live test harness that:
- opens the built edition locally
- verifies hover/click/source behavior
- captures screenshots
- runs remote tunnel verification too
- supports autofix retries before promotion

---

## Initial output schema suggestion

The post-generation analysis phase should likely emit a machine-readable artifact such as:

```json
{
  "edition_id": "2026-04-23-example",
  "detected_objects": [
    {"label": "desk lamp", "role": "projection_surface"},
    {"label": "drawer stack", "role": "filing_surface"},
    {"label": "clipboard", "role": "document_surface"},
    {"label": "monitor", "role": "device_surface"}
  ],
  "artifact_candidates": [
    {"id": "artifact-lamp", "kind": "hero"},
    {"id": "artifact-drawers", "kind": "module"}
  ],
  "recommended_enhancements": [
    "lamp_projected_html",
    "drawer_card_metadata",
    "clipboard_dossier",
    "screen_embedded_html"
  ]
}
```

This does not replace packaging JSON.
It feeds packaging.

---

## Non-goals

- do not replace the existing pipeline wholesale
- do not remove source research/media fetch
- do not let enhancement choice become a static per-scene-family default
- do not publish based on validation alone without browser QA

---

## Current practical decision

Historical intended plan:
- keep the then-existing rerun flow
- add object-aware remapping and contour masks after generation
- add enhancement selection after that
- add a required Playwright-driven pre-live QA/autofix loop before promotion

Current state: these ideas are now represented in `npm run daily:process`, `analysis.json`, `interpretation.json`, `enhancement-plan.json`, the automated mask pipeline, and Playwright smoke/media audits. Use `docs/process.md` for exact current steps.
