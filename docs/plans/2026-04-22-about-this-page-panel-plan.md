# About This Page Scene-Note Implementation Plan

Status: historical implementation plan. The runtime now supports edition-scoped `about.json` records, and current generated editions receive two-paragraph run-specific About content with typography profiles. Use `docs/process.md`, `docs/current-state.md`, and `docs/daily-edition-schema.md` for the current About contract.

> Historical note: this was the original implementation plan. Do not treat it as the current task list without checking the runtime first.

**Goal:** Add a scene-native `About this page` note in the bottom-right of each live edition that reveals a short hover blurb and a richer click-open artist statement explaining the page, the software underneath it, and the research lineage shaping the scene.

**Architecture:** Treat `About this page` as a first-class edition artifact, not product chrome. Add edition-scoped `about.json` content, load it with the edition package, render a dedicated bottom-right scene note tab in live mode, and open it through the existing stage-window system with a custom body treatment. Reuse runtime state patterns where possible, but keep the about note visually distinct from ordinary source/media pockets.

**Tech Stack:** React, TypeScript, Vite runtime, edition JSON packages under `public/editions/*`, Playwright/Vitest regression tests, existing stage-window rendering.

---

## Design intent

This should feel like:
- a curator's note tucked into the room
- an artist statement crossed with a diary entry
- a self-aware annotation on the edition, not app UI

This should **not** feel like:
- a footer
- a help tooltip
- a product explainer modal
- generic website chrome

Interaction model:
- **rest:** a quiet nested tab in the bottom-right
- **hover:** short whisper preview, 2 to 4 lines max
- **click:** a fuller note panel with links and plain-English software explanation

For the CD-Age edition, the copy should mention:
- what the room is imagining
- that a generated plate was made from a research-driven prompt
- that artifact pockets were mapped over the scene
- that fetched sources and media were bound into those objects
- lineage links like `Heisei No Oto`, `Virtual Dreams II`, `Kankyō Ongaku`

---

## Recommended data model

Add a new edition-scoped file:
- `public/editions/<edition-id>/about.json`

Suggested schema:

```json
{
  "about_id": "about-2026-04-22-cd-age-a",
  "label": "About this page",
  "kicker": "Curator's note",
  "short_blurb": "A generated daily edition built from real research signals, then mapped into clickable objects inside the room.",
  "body_markdown": "This page imagines ... [Heisei No Oto](...) ...",
  "links": [
    {
      "label": "Heisei No Oto",
      "url": "https://..."
    }
  ],
  "placement": {
    "x": 0.83,
    "y": 0.86,
    "w": 0.13,
    "h": 0.10
  }
}
```

Why separate file instead of `brief.json`:
- longform writing stays out of the scene-brief fields
- edition authorship is cleaner
- easier to vary tone and links per edition
- future edits do not risk contaminating artifact/source schemas

---

## Runtime strategy

### High-level approach

Use a dedicated scene note component rather than faking this as a normal source binding.

Why:
- source bindings are still about external media/research windows
- the about note is editorial/meta text about the edition itself
- the panel needs markdown-ish text blocks and inline links
- hover preview copy is much shorter and more essay-like than current source windows

### Recommended implementation shape

1. Load `about.json` into `LoadedEdition`
2. Render an `AboutSceneNote` in live mode only, anchored bottom-right via edition data
3. Maintain a minimal local UI state for:
   - `aboutPreviewOpen`
   - `aboutPanelOpen`
4. Render two custom surfaces:
   - `AboutPreview` on hover/focus
   - `AboutPanel` on click
5. Use stage overlay positioning and motion vocabulary so it still feels native to the runtime

This avoids polluting `SourceBindingRecord` with meta-editorial concerns.

---

## Files to modify

### New files
- `src/types/about.ts`
- `src/lib/aboutLoader.ts`
- `src/components/AboutSceneNote.tsx` (or keep in `src/App.tsx` first pass if speed matters)
- `public/editions/2026-04-22-cd-age-listening-bar-v1/about.json`
- `tests/ux/about-panel.spec.ts` or extend `tests/ux/stage-windows.spec.ts`

### Existing files
- `src/types/runtime.ts`
- `src/lib/editionLoader.ts`
- `src/App.tsx`
- `src/styles/runtime.css`
- `src/lib/runtimePresentation.ts` (only if new live-mode flags are needed)
- `public/editions/2026-04-22-cd-age-listening-bar-v1/review.json` (note the new feature after approval)

---

## Task 1: Add about-note data types and loader support

**Objective:** Make edition packages able to load optional `about.json` cleanly.

**Files:**
- Create: `src/types/about.ts`
- Modify: `src/types/runtime.ts`
- Modify: `src/lib/editionLoader.ts`
- Test: `src/lib/editionLoader.test.ts`

**Step 1: Add about types**

Create `src/types/about.ts`:

```ts
export interface AboutLinkRecord {
  label: string
  url: string
}

export interface AboutPlacementRecord {
  x: number
  y: number
  w: number
  h: number
}

export interface AboutRecord {
  about_id: string
  label: string
  kicker: string
  short_blurb: string
  body_markdown: string
  links: AboutLinkRecord[]
  placement: AboutPlacementRecord
}
```

**Step 2: Extend loaded-edition type**

In `src/types/runtime.ts`, add:

```ts
import type { AboutRecord } from './about'
```

Extend `LoadedEdition`:

```ts
about?: AboutRecord | null
```

**Step 3: Parse optional about file**

In `src/lib/editionLoader.ts`, add parser functions for `AboutRecord` and wire:

```ts
fetchOptionalJson(`${basePath}/about.json`, parseAboutRecord)
```

Return it from `loadEditionPackage`.

**Step 4: Write failing test first**

Add to `src/lib/editionLoader.test.ts`:
- one test that loads `about.json` successfully
- one test that treats missing `about.json` as `null`

**Step 5: Run tests**

Run:
- `npx vitest run src/lib/editionLoader.test.ts`

Expected:
- initially fail
- after implementation pass

**Step 6: Commit**

```bash
git add src/types/about.ts src/types/runtime.ts src/lib/editionLoader.ts src/lib/editionLoader.test.ts
git commit -m "feat: load edition about-note metadata"
```

---

## Task 2: Author the first edition-specific about note

**Objective:** Create the actual CD-Age artist-statement content and links.

**Files:**
- Create: `public/editions/2026-04-22-cd-age-listening-bar-v1/about.json`

**Step 1: Write the note**

The body should include four compact beats:
- what the page is
- what the software is doing in plain English
- what this edition is inspired by
- how the research became room objects and windows

**Step 2: Add linked facts**

Recommended links for this edition:
- `Heisei No Oto`
- `Virtual Dreams II`
- `Kankyō Ongaku`
- the guide mix if useful

**Step 3: Keep the voice tight**

Guardrails:
- first person or close-first-person is okay
- plain English for technical explanation
- no README tone
- no fake mysticism
- max ~220 words for click panel body in v1

**Step 4: Commit**

```bash
git add public/editions/2026-04-22-cd-age-listening-bar-v1/about.json
git commit -m "feat: add cd-age about-note content"
```

---

## Task 3: Render the bottom-right scene note tab

**Objective:** Add the resting scene-native note affordance in live mode.

**Files:**
- Create: `src/components/AboutSceneNote.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/runtime.css`

**Step 1: Add a new component**

Component props:

```ts
interface AboutSceneNoteProps {
  about: AboutRecord
  previewOpen: boolean
  panelOpen: boolean
  onPreviewOpen: () => void
  onPreviewClose: () => void
  onPanelToggle: () => void
}
```

**Step 2: Render as a scene artifact**

In live mode, place it inside `.stage`, near the artifact buttons and stage overlays.

Style via absolute placement from `about.placement`:

```tsx
style={{
  left: `${about.placement.x * 100}%`,
  top: `${about.placement.y * 100}%`,
  width: `${about.placement.w * 100}%`,
  height: `${about.placement.h * 100}%`,
}}
```

**Step 3: Tab copy**

Visible label should just be:
- `About this page`

Optional tiny kicker in hover state only:
- `Curator's note`

**Step 4: Initial style direction**

Use a folded-note / drawer-tab treatment, not a button-pill.

CSS class ideas:
- `.about-scene-note`
- `.about-scene-note__tab`
- `.about-scene-note__preview`
- `.about-scene-note__panel`

**Step 5: Keep it quiet**

Resting state should be low-contrast and nested visually into the corner.
Hover can lift it slightly.

**Step 6: Commit**

```bash
git add src/components/AboutSceneNote.tsx src/App.tsx src/styles/runtime.css
git commit -m "feat: add scene-native about-note tab"
```

---

## Task 4: Add hover whisper preview

**Objective:** Show a short, elegant preview on hover/focus.

**Files:**
- Modify: `src/components/AboutSceneNote.tsx`
- Modify: `src/styles/runtime.css`
- Test: `tests/ux/stage-windows.spec.ts`

**Step 1: Hover state**

Preview content:
- kicker
- short blurb

No more than 2 to 4 lines.

**Step 2: Placement**

Preview should open just above or above-left of the tab so it feels attached.
Do not center it in the viewport.

**Step 3: Style**

Make it feel like:
- note fragment
- recommendation slip
- liner-note insert

Avoid:
- source-window chrome
- giant modal glass
- platform badges

**Step 4: UX test**

Extend `tests/ux/stage-windows.spec.ts` with one test:
- hover over `About this page`
- assert preview appears
- assert `short_blurb` text is present

**Step 5: Commit**

```bash
git add src/components/AboutSceneNote.tsx src/styles/runtime.css tests/ux/stage-windows.spec.ts
git commit -m "feat: add about-note hover preview"
```

---

## Task 5: Add click-open full about panel

**Objective:** Open a richer diary/artist-statement panel on click.

**Files:**
- Modify: `src/components/AboutSceneNote.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/runtime.css`
- Test: `tests/ux/stage-windows.spec.ts`

**Step 1: Panel behavior**

Click on the note tab should:
- open the full panel
- keep it on stage in live mode
- close on explicit close affordance

**Step 2: Content layout**

Suggested internal structure:
- kicker
- title (`About this page`)
- body markdown rendered as safe structured text
- related links list only if needed

For v1, simplest safe route:
- split `body_markdown` into paragraphs manually or render a tiny safe subset
- do **not** use raw HTML injection

**Step 3: Link behavior**

Links must open with:
- `target="_blank"`
- `rel="noopener noreferrer"`

**Step 4: Keep it narrower than a modal**

Treat it like a margin essay or curator slip, not a takeover overlay.

**Step 5: UX tests**

Add test coverage for:
- click opens full panel
- link count or known linked text appears
- panel can close

**Step 6: Commit**

```bash
git add src/components/AboutSceneNote.tsx src/App.tsx src/styles/runtime.css tests/ux/stage-windows.spec.ts
git commit -m "feat: add full about-note panel"
```

---

## Task 6: Write the CD-Age copy in the right voice

**Objective:** Tighten the prose so it reads like an artist statement meets diary entry.

**Files:**
- Modify: `public/editions/2026-04-22-cd-age-listening-bar-v1/about.json`

**Writing rubric:**
- paragraph 1: what the room is
- paragraph 2: under-the-hood software in plain English
- paragraph 3: historical/scene inspiration
- paragraph 4: how research became artifacts and windows

**Good examples of technical phrasing:**
- “Under the hood, this page starts as a generated scene image shaped by a research prompt.”
- “From there, specific objects in the room are mapped as interactive pockets.”
- “The windows opening out of those objects are tied to fetched sources and local media.”

**Bad examples:**
- “This site is powered by React/Vite JSON manifests.”
- “Users can interact with multimedia components.”

**Commit**

```bash
git add public/editions/2026-04-22-cd-age-listening-bar-v1/about.json
git commit -m "feat: refine cd-age about-note voice"
```

---

## Task 7: Final verification

**Objective:** Confirm the interaction feels native and does not break runtime behavior.

**Files:**
- Modify if needed: `src/styles/runtime.css`, `src/components/AboutSceneNote.tsx`

**Run all verification**

```bash
npm run build
npx vitest run src/lib/editionLoader.test.ts
npx playwright test -c playwright.ux.config.ts tests/ux/stage-windows.spec.ts --reporter=line
```

**Browser checks**

Local:
- open live root
- hover `About this page`
- confirm preview is visible and attached to tab
- click it
- confirm full note opens with links
- confirm existing artifact hover/click still works

Remote:
- verify same interaction on tunnel
- capture screenshot with preview open
- capture screenshot with full panel open

**Taste checklist**
- feels like a scene artifact, not UI chrome
- text is readable but not dominant
- panel does not overpower the edition
- links feel like discoveries, not bibliography
- hover and click states are visually tethered to the corner note

**Commit**

```bash
git add .
git commit -m "feat: ship scene-native about-note interaction"
```

---

## Copy draft direction for CD-Age edition

This is a direction, not final copy:

```md
This page imagines a late-night Tokyo listening bar built out of jewel cases, recommendation slips, and the shelf logic of Japanese ambient, IDM, glitch, and left-field electronica. I wanted the room to feel less like a mood board and more like a place where genre history is physically arranged within arm's reach.

Under the hood, this is a generated daily edition. The scene image is produced from a research-shaped prompt, then mapped with interactive pockets so specific objects in the room can open real source windows. The shelves, note cards, binders, and monitors are doing double duty: they are both visual fiction and anchors for fetched media.

A lot of the emotional grammar here came from [Heisei No Oto](https://www.musicfrommemory.com/releases/various-artists-heisei-no-oto-japanese-left-field-pop-from-the-cd-age-1989-1996), [Virtual Dreams II](https://www.musicfrommemory.com/release/8986/various-artists/virtual-dreams-ii-ambient-explorations-in-the-house-techno-age-japan-1993-1999), and [Kankyō Ongaku](https://www.musicfrommemory.com/releases/various-artists-kankyo-ongaku-japanese-ambient-environmental-new-age-music-1980-1990): compilations and histories that make it easier to see how Japanese CD-era listening culture carried ambient and listening techno through labels, stores, and compilations.

The research isn't represented here as a pile of citations. It's been rearranged into the furniture of the room. The note grid stands in for staff curation. The binders become browse-state memory. The compilation tags hold the lineage in public. The page is trying to keep research alive by turning it into a place.
```

---

## Recommendation

Build this first for:
- `2026-04-22-cd-age-listening-bar-v1`

Then, if it works tastefully, backfill the pattern into:
- future daily editions first
- older archive editions only if they clearly benefit

Do **not** immediately wire it into every edition before the first one feels right.
