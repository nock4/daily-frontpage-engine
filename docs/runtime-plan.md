# Runtime Plan

## Goal
Define the runtime shell that renders daily editions, source windows, ambiance, review modes, and archive navigation.

The runtime should stay stable while the daily edition package changes.

## Runtime responsibilities
- load one edition package by date or slug
- render plate, masks, and source bindings
- support review modes
- manage source-window lifecycle
- keep active media alive until explicit close
- mount ambiance systems
- switch between live edition and archive editions
- keep live mode chrome-free at rest
- place source windows on the stage near their originating artifacts

## Runtime layers

### 1. Edition loader
Loads:
- edition.json
- brief.json
- artifact-map.json
- source-bindings.json
- ambiance.json
- about.json
- analysis.json
- interpretation.json
- enhancement-plan.json
- review.json

Inputs:
- `/`
- `/?date=YYYY-MM-DD`
- `/?edition=slug`
- review query params

### 2. Plate renderer
Renders:
- base plate image
- optional variant assets
- responsive fit rules
- z-layer for artifact masks

### 3. Artifact interaction layer
Renders:
- hero artifacts
- module artifacts
- hover affordances
- focus state
- active artifact state

Review modes:
- `?debug=masks`
- `?qa=clickable`
- `?qa=solo`
- `?review=current-live`

### 4. Source-window manager
Controls:
- hover previews
- active pinned windows
- close/minimize state
- playback persistence
- docking/minimized player state
- replacement rules for single-primary mode
- provider-native renderer selection from URL and binding metadata
- stage placement fallback when artifact lookup fails
- threshold-bloom / genie-like hover reveal treatments where assigned by the enhancement plan
- title-plus-source-image cards for rich previews and playable embeds for YouTube

### 5. Ambiance engine
Mounts:
- CSS motion systems
- canvas or WebGL layers
- glow/particle treatments
- optional audio-reactive systems

Should read directly from the ambiance recipe.

### 6. About scene note
Supports:
- edition-scoped About content loaded from `about.json`
- a stable project paragraph
- a run-specific process paragraph
- edition typography profiles using self-hosted fonts
- scene-native presentation, not a generic product help modal

### 7. Archive navigator
Supports:
- previous editions
- archive browsing by date
- archive browsing by family/motif
- live/current pointer

## Recommended runtime structure
```text
src/
  app/
    router.ts
    edition-loader.ts
  components/
    EditionRuntime.tsx
    ArtPlate.tsx
    ArtifactLayer.tsx
    HeroArtifact.tsx
    ModuleArtifact.tsx
    SourceWindowManager.tsx
    SourceWindow.tsx
    MinimizedMediaDock.tsx
    ReviewGuide.tsx
    ArchiveNavigator.tsx
  ambiance/
    index.ts
    css-motion.ts
    webgl-layer.ts
    audio-reactive.ts
  lib/
    geometry.ts
    source-bindings.ts
    edition-validation.ts
  state/
    edition-store.ts
    window-store.ts
    playback-store.ts
```

## State model

### Edition state
- loaded edition
- current review mode
- active artifact id
- current archive context

### Window state
- open windows
- focused window id
- minimized windows
- dock state

### Playback state
- currently playing source ids
- transport state
- persistence flags

## Routing contract
- `/` -> current live edition
- `/archive` -> archive index
- `/archive/:slug` -> archived edition
- query params:
  - `review=current-live`
  - `debug=masks`
  - `qa=clickable`
  - `qa=solo`

## Rendering sequence
1. load edition package
2. validate required files
3. mount base plate
4. mount artifact layer
5. mount source-window manager
6. mount ambiance layer
7. mount review or archive chrome as needed

## Window behavior defaults
- hover creates preview when supported
- click pins source window
- pinned media keeps playing after mouseleave
- explicit close required
- one primary visual window at a time by default
- optional persistent minimized audio dock
- live-stage windows should anchor near the clicked artifact and clamp inside the stage
- if provider URL and binding metadata disagree, prefer the provider-native URL interpretation when safe

## Performance plan
- lazy-load embeds
- lazy-load heavy media only on click
- lightweight hover previews
- unload closed windows
- keep ambiance modular so heavy WebGL can be disabled per edition

## Fallback plan
If source embed fails:
- fall back to rich preview
- if no rich preview, show source-framed outbound window action
- do not replace with a generic summary card
- do not allow null-source packaging bugs to silently ship as acceptable UX
- generated YouTube editions should catch non-embeddable videos in QA and skip them in future runs
- generated Twitter/X editions should use native tweet source URLs, not raw CDN media URLs

## Live-vs-review presentation contract

- live mode should be full-page scene only at rest
- archive controls, metadata rails, and review chrome belong only in explicit review states
- opened source windows in live mode should feel like stage objects, not side-panel UI transplanted onto the art
- stage windows should use lighter surface treatment than review panels

## Minimum viable runtime
Phase 1:
- edition loader
- plate renderer
- artifact layer
- basic source-window manager
- debug/clickable/solo/live review modes
- archive index with simple date list

Phase 2:
- minimized media dock
- richer social/video/audio windows
- ambiance recipe execution
- family and motif archive browsing
- About scene-note presentation

Phase 3:
- stronger WebGL systems
- smarter multi-window orchestration
- automated live/archived edition publishing tools
