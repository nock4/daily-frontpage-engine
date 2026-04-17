# Process

## Canonical pipeline

1. Mine recent Obsidian signals
2. Run automated research on those signals
3. Translate the combined signal + research field into a daily scene brief
4. Generate a brand new AI scene for that day
5. Map native artifacts in the generated plate
6. Mount into the live scaffold
7. Attach live source windows to pockets
8. Add ambiance influenced by the research field
9. Review, approve, publish
10. Archive the daily edition

## 1. Mine recent Obsidian signals
Pull recent notes, bookmarks, likes, clips, and recurring motifs from the vault.
Look for:
- repeated objects and materials
- emotional tone
- unresolved fascinations
- media types present in the signal set
- clusters that could become a world

The goal is not summary. The goal is taste and direction extraction.

## 2. Automated research
Before generating the scene, deepen the signal field.
For each strong signal cluster:
- fetch source URLs
- inspect linked media
- research adjacent references, lineages, tools, artists, aesthetics, objects, and environments
- let media findings influence both scene generation and later ambiance decisions

This step should produce a richer inspiration field than the vault alone.

## 3. Daily scene generation
A new scene is generated every day. Never reuse the same scene twice.
The archive keeps past editions explorable.

Generation input should include:
- mined vault motifs
- research-derived visual and material cues
- desired interaction grammar
- scene-family constraints
- daily variation requirements

Prompting strategy:
- prompt for a world first, not a homepage
- ask for a strong central atmosphere and multiple discoverable artifact pockets
- bias toward visible objects that can later become native interaction targets
- avoid generic dashboards, hero cards, floating UI, or blank composition-only spaces
- require plate-level uniqueness day to day

Good prompt ingredients:
- material language
- object inventory
- lighting conditions
- emotional tone
- density zones
- interaction affordances implied by the image itself

## 4. Native-artifact mapping
Masks must follow real visible artifacts in the plate.

Good targets:
- labels
- cards
- specimen bodies
- diagrams
- instruments
- candles
- shelves
- windows
- screens
- trays
- containers
- object clusters

Bad targets:
- empty space
- arbitrary quadrants
- generic modules
- layout-only balance zones

Current mapping strategy:
- use vision passes to identify likely native artifacts
- define 2 hero masks and around 6 module masks
- store normalized bounds and polygons in layout data
- generate SVG mask files from those polygons
- verify in debug mode against the real image
- tighten the worst offenders first

Current tools and techniques:
- vision analysis to identify artifact candidates
- normalized polygon layout data in JSON
- SVG masks in `public/masks/`
- live scaffold with `debug`, `clickable`, `solo`, and `live` modes
- browser screenshot / audit review for mask truth-check

Longer-term mapping direction:
- auto-trace pipeline for plate-specific proposal generation
- overgenerate native candidates, then prune
- keep geometry and manifestation review separate

## 5. Live scaffold
Mount the generated plate into the runtime shell.
The shell should support:
- plate switching
- mask layers
- hover-triggered media windows
- persistent playback until explicit close
- archive access
- daily edition routing

## 6. Source windows, not summaries
Pockets should not become text summaries.
They should become windows into actual source content.

Examples:
- tweet or bookmark -> creative tweet presentation or embedded source card
- YouTube -> hover opens playable embed
- NTS liked track -> find streamable source and open playable embed
- text/article -> show an actual framed source window, excerpted visually, not collapsed into a generic summary card

Interaction rule:
- hover can open the source window
- click activates it
- media keeps playing even if the pointer leaves the module
- explicit close button required

The front page should feel like a living media surface, not a note-summary dashboard.

## 7. Ambiance
Ambiance should be influenced by the research field, not added randomly.
Examples:
- motion systems derived from the scene lineage
- particle behavior tied to source mood
- WebGL treatments
- color drift
- subtle sound-reactive or media-reactive behavior

Ambiance is part of the edition identity.

## 8. Review contract
Step 1: `?debug=masks`
- geometry truth-check only

Step 2: `?qa=clickable`
- clean clickability review

Step 3: `?qa=solo`
- isolate one region at a time

Step 4: `?review=current-live`
- full behavior and media-window review

## 9. Archive
Every daily scene is unique and should be archived.
The archive should let people explore past editions rather than replacing history.
