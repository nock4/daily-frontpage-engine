# Daily Behavior System Spec

## Goal

Define a reusable behavior library for the daily-frontpage-engine so each edition can express different interaction ideas without collapsing back into generic product UI.

This spec turns one-off taste notes into a system the daily generation pipeline can actually use.

## Core framing

The behavior system exists to reinforce the project's original idea:

- the image is the interface
- each edition is a world
- artifacts are real visible things in the plate
- source windows expose real source encounters, not summary cards
- live mode should read as artwork first, software second
- variation should happen daily, but within a coherent scene grammar

Behavior should make the world feel more alive.
Behavior should not make the runtime feel more like a dashboard.

## Behavior categories

The system uses four categories.

### 1. Reveal behaviors
How a source crosses into visibility.

These control the threshold between dormant artifact and readable source state.

Examples:
- threshold scan
- activation bloom
- broadcast degrade/resolve
- editorial scanline
- repo inspection mode
- document ember
- video tuner

### 2. Artifact behaviors
How the visible object itself behaves.

These should feel native to the object class in the plate.

Examples:
- peel reveal
- lens inspection
- drag-to-tune
- projection reveal
- cabinet drawer behavior
- object memory
- artifact inheritance

### 3. Scene-wide behaviors
How the surrounding world responds.

These reinforce that the edition is a living environment rather than independent isolated hotspots.

Examples:
- constellation wake
- ambient tone shift by source class
- neighbor echo
- light path reaction
- weathering response
- scene pulse memory

### 4. Choreography rules
How multiple sources relate across one edition.

These determine sequencing, hierarchy, and system-level coherence.

Examples:
- anchor + satellites
- signal family clustering
- narrative reveal order
- edition-specific interaction grammar

## Frequency tiers

Each behavior belongs to one of three tiers.

### Default
Can happen often without becoming noisy.

Use for stable recurring grammar.

Examples:
- threshold scan
- activation bloom
- peel reveal
- artifact inheritance
- constellation wake
- ambient tone shift
- anchor + satellites
- signal family clustering

### Occasional
Useful when the signal field clearly supports it.

Use when a day has a strong source or edition-family fit.

Examples:
- broadcast degrade/resolve
- repo inspection mode
- editorial scanline
- video tuner
- lens inspection
- projection reveal
- neighbor echo
- light path reaction
- narrative reveal order

### Rare
Should feel special.

Use only when the edition wants ritual, uncanniness, or a one-off escalation.

Examples:
- hold-to-awaken
- reverse reveal
- ribbon pull
- tap sequence
- rotary selection
- ghost double

## Starter library

This is the recommended first production-ready behavior library.

### Reveal starter set
- threshold scan
- activation bloom
- broadcast degrade/resolve
- editorial scanline
- repo inspection mode
- video tuner

### Artifact starter set
- peel reveal
- lens inspection
- drag-to-tune
- projection reveal
- object memory
- artifact inheritance

### Scene-wide starter set
- constellation wake
- ambient tone shift by source class
- neighbor echo
- light path reaction

### Choreography starter set
- anchor + satellites
- signal family clustering
- edition-specific interaction grammar
- narrative reveal order

## Source-class mapping

Different source classes should bias toward different behaviors.

### Articles / essays / reading-heavy web sources
Bias toward:
- threshold scan
- activation bloom
- editorial scanline
- peel reveal
- ambient reading tone
- anchor + satellites

Avoid overusing:
- aggressive broadcast/noise logic
- heavy motion-first interactions

### Source sites / branded websites
Bias toward:
- threshold scan
- broadcast degrade/resolve
- activation bloom
- artifact inheritance
- ambient reading or signal tone depending on source character

Avoid overusing:
- generic hero-card entrances

### GitHub / docs / tool pages
Bias toward:
- repo inspection mode
- threshold scan
- lens inspection
- neighbor echo
- signal family clustering

Avoid overusing:
- social/post-shaped treatments
- soft editorial-only logic when the source is clearly technical

### Social / posts / X statuses
Bias toward:
- broadcast degrade/resolve
- tweet as intercepted transmission
- drag-to-tune
- constellation wake
- ambient social tone

Avoid overusing:
- large editorial article treatment unless the URL is actually article-like
- raw Twitter/X CDN media as the behavioral source; media can be foregrounded, but the native status URL remains the source of truth

### X articles / reading-like social longform
Bias toward:
- threshold scan
- editorial scanline
- activation bloom
- peel reveal
- ambient reading tone

Avoid overusing:
- tweet embed logic
- intercepted-transmission styling meant for posts

### Video / YouTube
Bias toward:
- video tuner
- signal lock
- drag-to-tune
- projection reveal
- ambient video tone

Avoid overusing:
- static article-style reveal logic
- linkout-only behavior in newly generated editions; non-embeddable YouTube videos should be skipped before packaging

### Audio / track sources
Bias toward:
- audio specter
- constellation wake
- drag-to-tune
- scene pulse memory
- ambient audio tone
- listening-window treatments that foreground cover art and source title clearly

Avoid overusing:
- visually dense reading-first transitions that obscure the music role
- the original NTS URL as a behavior/source target; use the resolved YouTube, Bandcamp, or SoundCloud source

### Documents / PDFs / scans
Bias toward:
- document ember
- OCR apparition
- activation bloom
- cabinet drawer behavior
- ambient reading tone

Avoid overusing:
- social or broadcast signal logic unless the document is actually presented that way in-scene

## Artifact-class mapping

Behavior should inherit from visible object type whenever possible.

### Paper-like objects
Includes:
- notes
- tags
- cards
- clippings
- posters
- manuscripts
- labels

Best behaviors:
- peel reveal
- slow burn-in title
- editorial scanline
- threshold scan
- document ember

### Glass / lens / reflective objects
Includes:
- jars
- glass panes
- mirrors
- optics
- display cases
- lenses

Best behaviors:
- lens inspection
- projection reveal
- parallax drift
- activation bloom

### Light-emitting objects
Includes:
- lamps
- bulbs
- projectors
- lit cabinets
- candles with directional glow

Best behaviors:
- projection reveal
- light path reaction
- activation bloom
- signal lock

### Screen / display objects
Includes:
- monitors
- televisions
- embedded displays
- instrument panels

Best behaviors:
- broadcast degrade/resolve
- repo inspection mode
- tweet as intercepted transmission
- video tuner
- drag-to-tune

### Containers / drawers / cabinets / trays
Includes:
- boxes
- shelves
- cabinets
- drawers
- archival trays

Best behaviors:
- cabinet drawer behavior
- object memory
- narrative reveal order
- document ember

### Ritual / relic / specimen objects
Includes:
- seals
- vessels
- offerings
- rare preserved objects
- icon-like hero artifacts

Best behaviors:
- hold-to-awaken
- activation bloom
- ghost double
- tap sequence
- light path reaction

## Edition-family mapping

Each edition family should bias toward a consistent interaction grammar.

### Greenhouse / herbarium / botany families
Material cues:
- leaves
- condensation
- paper labels
- soil
- glass
- warm diffuse light

Bias toward:
- activation bloom
- peel reveal
- editorial scanline
- constellation wake
- weathering response

### Observatory / map / signal families
Material cues:
- lenses
- scopes
- charts
- receivers
- beam paths
- night glow

Bias toward:
- threshold scan
- signal lock
- video tuner
- drag-to-tune
- projection reveal
- light path reaction

### Altar / shrine / reliquary / ritual families
Material cues:
- candles
- relics
- inscriptions
- parchment
- sacred object spacing

Bias toward:
- document ember
- hold-to-awaken
- activation bloom
- slow burn-in title
- light path reaction

### Patchboard / console / communications families
Material cues:
- handsets
- switches
- routing surfaces
- screens
- wires
- technical labels

Bias toward:
- broadcast degrade/resolve
- repo inspection mode
- tweet as intercepted transmission
- drag-to-tune
- neighbor echo

### Library / archive / desk families
Material cues:
- books
- notes
- drawers
- pages
- index-card logic

Bias toward:
- editorial scanline
- document ember
- cabinet drawer behavior
- anchor + satellites
- narrative reveal order

## Daily selection rule

Each daily edition should select:

- 1 reveal behavior
- 1 artifact behavior
- 1 scene-wide behavior
- 1 choreography rule
- optional 1 wildcard when the source field strongly supports it

This keeps daily variation real without making the edition feel overdesigned or incoherent.

## Daily assembly recipe

### Step 1. Determine the dominant source mix
Classify the day's source field.

Track:
- article / essay density
- source-site density
- repo / technical density
- social density
- video density
- audio density
- document density

### Step 2. Determine the dominant artifact family
Classify the visible objects in the plate.

Track:
- paper-like
- glass/lens
- light-emitting
- screen/display
- container/drawer
- ritual/relic/specimen

### Step 3. Determine the edition family
Infer the world grammar from the scene brief and plate.

Examples:
- greenhouse
- observatory
- altar
- patchboard
- archive desk

### Step 4. Select one behavior from each category
Use the following order of precedence:

1. edition-family fit
2. source-class fit
3. artifact-class fit
4. rarity guardrail

### Step 5. Run coherence check
Reject selections that break scene-first logic.

## Coherence constraints

### Required
- the artifact remains the visible interaction anchor
- the source still reads as a real source encounter
- the stage remains artwork first, software second
- the chosen behaviors do not introduce generic dashboard chrome

### Avoid
- stacking multiple reveal gimmicks on one source
- using high-noise behaviors across every module in one edition
- making every artifact interactive in the same way
- choosing a behavior because it is visually cool but object-incoherent
- defaulting to post/social treatments for reading-like sources

## Recommended combinations

### Article-heavy editorial day
Use:
- reveal: editorial scanline or threshold scan
- artifact: peel reveal
- scene-wide: ambient reading tone or constellation wake
- choreography: anchor + satellites

### Technical / repo / tool day
Use:
- reveal: repo inspection mode
- artifact: lens inspection or drag-to-tune
- scene-wide: neighbor echo
- choreography: signal family clustering

### Social-heavy day
Use:
- reveal: broadcast degrade/resolve
- artifact: drag-to-tune
- scene-wide: ambient social tone or constellation wake
- choreography: anchor + satellites

### Video / clip-heavy day
Use:
- reveal: video tuner
- artifact: projection reveal or drag-to-tune
- scene-wide: ambient video tone
- choreography: narrative reveal order

### Archive / ritual / document-heavy day
Use:
- reveal: document ember or activation bloom
- artifact: cabinet drawer behavior or hold-to-awaken
- scene-wide: light path reaction
- choreography: edition-specific interaction grammar

## Implementation priority

Recommended order for building out the full system:

1. artifact inheritance
2. threshold scan
3. activation bloom
4. anchor + satellites
5. signal family clustering
6. ambient tone shift by source class
7. peel reveal
8. neighbor echo
9. source-specific reveal branches
10. advanced artifact behaviors

### Why this order
- first establish a coherent grammar
- then add flexible daily variation
- then add stronger special-case behaviors

## Runtime integration model

The behavior system should eventually be represented as explicit data.

Suggested runtime-facing schema shape:

```json
{
  "behavior_recipe": {
    "reveal": "threshold-scan",
    "artifact": "peel-reveal",
    "scene": "constellation-wake",
    "choreography": "anchor-and-satellites",
    "wildcard": null
  }
}
```

The final selection can live in:
- generated edition package metadata
- ambiance.json
- or a dedicated behavior-recipe.json if separation becomes useful

## Pipeline integration model

The research-to-scene pipeline should eventually do this:

1. mine signals
2. deepen with research
3. classify source mix
4. classify object/material language
5. classify edition family
6. choose behavior recipe using this spec
7. generate plate and interaction notes together
8. implement and review

## Review checklist for behavior selection

Before promoting an edition, confirm:

- does the chosen reveal make the source feel more scene-native?
- does the artifact behavior match the visible object?
- does the scene-wide behavior connect the world rather than distract?
- does the choreography make the source set feel authored?
- would this still read as artwork first if someone never opened a source?

## Current recommended next moves

If building from this spec right now, the highest-leverage next features are:

1. artifact inheritance
2. anchor + satellites
3. signal family clustering
4. activation bloom
5. neighbor echo

These provide the most system value while preserving the original scene-first idea.
