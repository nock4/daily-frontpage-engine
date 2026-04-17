# Research-to-Scene Pipeline Spec

## Purpose
Turn recent Obsidian signals into a ranked research field that can drive one daily scene, its pockets, and its ambiance.

## Inputs
- recent notes, bookmarks, clips, likes, and outbound links from Obsidian
- attached or linked media: images, video, audio, screenshots, PDFs
- lightweight history from recent editions to avoid repeating yesterday's dominant motif

## 1. Mine signals from Obsidian
Extract atoms, not summaries.

For each candidate signal, capture:
- source note/link id and timestamp
- motif terms: objects, materials, organisms, tools, symbols, spaces
- tone terms: moods, energies, tensions
- media evidence: image/video/audio present, plus URLs
- recurrence signals: repeated mentions, backlinks, tag overlap, temporal clustering
- open threads: unfinished fascinations, questions, or return visits

Group candidates into 3-8 clusters that could plausibly become a world.

## 2. Enrich each cluster with automated research
For each cluster:
1. open the original sources
2. inspect linked media first
3. pull adjacent references: artists, movements, lineages, geographies, tools, materials, environments, historical echoes
4. extract concrete visual evidence rather than broad summaries
5. collect playable/viewable source targets for future pockets

Research record per cluster:
- visual cues: shapes, silhouettes, compositions, density
- material cues: surfaces, weathering, fabrication, textures
- ambient cues: lighting, weather, sound, motion behavior
- object inventory: artifacts that could become native mask targets
- source windows: URLs worth exposing directly in-scene
- risk flags: overfamiliar, too literal, weak media support, hard-to-render

## 3. Let media findings shape the edition
Media evidence has priority over abstract topic similarity.

Use media findings to steer:
- scene brief: world type, camera stance, spatial depth, hero objects, clutter level
- pocket planning: which real artifacts can host source windows
- ambiance: motion grammar, particles, color drift, sound-reactive behavior, playback tone

Rule: if research changes how the scene should look, move, or sound, it belongs in the brief.

## 4. Score and select motifs
Score each cluster 1-5 on:
- resonance: how strongly it reflects recent Obsidian attention
- visual potency: image/world-building strength
- media richness: quality and variety of inspectable sources
- artifactability: number of plausible native interaction targets
- ambiance yield: ability to drive motion, lighting, sound, atmosphere
- novelty: distance from the last few editions
- coherence: can become one scene without collapsing into collage

Suggested weighted score:
`total = 0.25 resonance + 0.2 visual_potency + 0.15 media_richness + 0.15 artifactability + 0.1 ambiance_yield + 0.1 novelty + 0.05 coherence`

Selection rule:
- choose 1 primary cluster
- optionally merge 1 secondary cluster only if it increases contrast or depth without breaking coherence
- reject clusters with weak media evidence or no believable artifact targets

## 5. Outputs for scene generation
Produce one save-ready package per edition:

### A. Scene brief
- edition title or working name
- one-paragraph world description
- visual direction: composition, palette, lighting, materials, scale
- object inventory: 5-12 concrete artifacts
- interaction grammar: 2 hero pockets + 4-8 secondary pockets
- negative constraints: what to avoid repeating or rendering generically

### B. Research field
- ranked motif list with scores
- supporting references and lineage notes
- extracted media cues
- shortlist of source URLs for pockets

### C. Ambiance brief
- motion rules
- color/lighting behavior
- audio or playback posture
- any media-reactive behaviors

### D. Generation payload
```json
{
  "date": "YYYY-MM-DD",
  "primary_cluster": "...",
  "secondary_cluster": "...",
  "scene_brief": "...",
  "visual_cues": ["..."],
  "material_cues": ["..."],
  "ambient_cues": ["..."],
  "object_inventory": ["..."],
  "pocket_targets": [
    {"artifact": "...", "source_url": "...", "media_type": "video|image|audio|article"}
  ],
  "motif_scores": {
    "resonance": 0,
    "visual_potency": 0,
    "media_richness": 0,
    "artifactability": 0,
    "ambiance_yield": 0,
    "novelty": 0,
    "coherence": 0,
    "total": 0
  },
  "negative_constraints": ["..."]
}
```

## Acceptance check
Before handing off to image generation, verify:
- the brief names concrete objects, materials, and lighting
- at least 6 viable source-window targets exist
- ambiance is derived from research, not random styling
- the chosen motif is distinct from recent editions
- the scene still reads as one world, not a moodboard
