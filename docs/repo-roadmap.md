# Repo Roadmap

## Current Baseline

- Canonical runtime shell lives in this repo.
- Packaged editions live under `public/editions/`.
- `npm run daily:process` can run from recent saved signals through generated plate, package assembly, mask generation, validation, build, Playwright smoke, and source-window media audit.
- From-scratch generation uses `gpt-5.5` for source autoresearch, brief composition, and post-plate vision, and `gpt-image-2` for the plate.
- Source mining is restricted to recent Twitter/X bookmarks, YouTube likes, NTS liked-track source maps, and Chrome bookmarks.
- Generated editions include run-specific `about.json`, interpretation files, enhancement plans, and contour-mask artifacts when the automated mask pass succeeds.

## Immediate

- Keep README and canonical docs synchronized with the actual pipeline after each process change.
- Decide whether `2026-04-28-ash-procession-flare-v1` should be promoted live.
- Continue tightening contour masks where abstract fields produce overbroad masks.
- Keep the source-window media audit strict: no title-only media windows, no non-embeddable generated YouTube videos, no raw Twitter/X CDN primary URLs.

## Near Term

- Improve scene-native About presentation and copy while keeping live mode chrome-free.
- Improve audio-source windows for Bandcamp/SoundCloud/NTS-derived tracks.
- Expand the mask candidate pipeline with optional prompted SAM/SAM 2 masks when available.
- Add a clearer promotion command/report that shows exactly which manifest entries change and verifies `current_edition_id` matches the sole `is_live: true` record.

## Later

- More nuanced ambiance/reactivity derived from edition interpretation, without adding dashboard-like controls.
- Stronger archive browsing by motif, scene family, and source lineage.
- Optional unattended overnight candidate generation, still gated by human review before publish.
- Additional media-provider support when it preserves source truth better than rich previews.
