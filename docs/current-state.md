# Current State

## Runtime status

- repo path: `/Users/nickgeorge-studio/Projects/daily-frontpage-engine`
- current live edition id: `2026-04-17-herbarium-bed-v1`
- current archive count: 8 packaged editions
- packaged editions are mounted from `public/editions/`
- archive routes resolve by slug at `/archive/:slug`

## Current live contract

- live mode should read as artwork first, software second
- top bar, side rail, and resting chrome are removed from live mode
- review UI exists only in `?qa=clickable`, `?qa=solo`, `?debug=masks`, and `?review=current-live`
- source windows open on the stage near the clicked artifact
- hover previews stay lightweight
- click creates a persistent active window
- explicit close is required for dismissal

## Current source-window contract

- source windows should open real media or source-framed fallbacks
- generic summary-card behavior is not acceptable
- YouTube URLs must resolve to the YouTube renderer even when stale binding metadata still says `web`
- stage artifact-card windows should not duplicate provider labels
- unresolved or null source bindings should be treated as data bugs and fixed before review
- NTS is a discovery source, not the playback destination for liked-track signals

## Current UX verification contract

- local UX proof comes from named Playwright scenarios plus committed screenshot baselines
- CI UX proof runs through `.github/workflows/ux-visual-regression.yml`
- Argos receives screenshots and traces when `ARGOS_TOKEN` is configured
- no visible UX bug should be called fixed from DOM assertions alone

## Current packaged editions

### Live
- Herbarium Bed
  - id: `2026-04-17-herbarium-bed-v1`
  - status: live
  - notes: best bridge from old Nockgarden emotional role into the daily engine

### Archive
- Night Observatory
  - id: `2026-04-16-night-observatory-v1`
  - status: archived alternate
- Offering Board
  - id: `2026-04-15-offering-board-v1`
  - status: archived side branch
- Forest Listening Table
  - id: `2026-04-17-forest-listening-table-v1`
  - status: strongest batch-02 alternate and recent UX-test target
- Tea House Qin Desk
  - id: `2026-04-17-tea-house-qin-desk-v1`
  - status: strong alternate
- Jaipong Procession Floor
  - id: `2026-04-17-jaipong-procession-floor-v1`
  - status: archive branch
- Resolver Atlas Shrine
  - id: `2026-04-17-resolver-atlas-shrine-v1`
  - status: archive branch
- Sensonarrative Watch Post
  - id: `2026-04-17-sensonarrative-watch-post-v1`
  - status: archive branch

## What is decided

- build a daily engine, not one homepage
- scene-first front page is the guiding frame
- native-artifact mapping is the mask rule
- live mode is a chrome-free stage at rest
- packaged editions, not loose prototypes, are the primary unit now
- runtime changes must be verified through real UX review, not just tests

## What is still open

- automated daily generation and publish pipeline
- approval workflow for promoting a new edition to live
- stronger provider-native renderers beyond the current first-pass shells
- archive browsing by family and motif, not just direct route
- deeper ambiance systems tied to edition recipes
