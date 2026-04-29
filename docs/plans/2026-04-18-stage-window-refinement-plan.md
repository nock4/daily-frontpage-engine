# Stage Window Refinement Plan

Status: historical implementation plan. The current source-window behavior, hover reveal direction, and generated-edition media rules are documented in `docs/source-window-embed-interaction-spec.md`, `docs/runtime-plan.md`, and `docs/process.md`.

This plan captures a historical stage-window cleanup pass.

**Goal:** Fix the live-stage window experience so it reads like a coherent scene-native interface instead of a shared overlay shell with leaking labels, single-slot behavior, and weak composition.

**Architecture:** Separate scene discovery, artifact affordance, and opened-window composition into clearer layers. Treat live-stage windows as a small windowing system with explicit stacking, occlusion, and artifact-to-window handoff rules. Stop letting artifact labels and generic overlay behavior compete with open windows.

**Tech stack:** React, TypeScript, Vite, Vitest, Playwright, packaged edition JSON under `public/editions/`.

---

## Diagnosis

The screenshot points to three structural problems, not just one bug.

1. Text bleeding through
- The visible text is the artifact label itself, specifically the active artifact label like `Central mountain peak with bright horizon light`.
- This comes from the absolutely-positioned `.artifact span` label inside the stage layer.
- In live mode, active artifact labels still appear while a source window is open, so the scene keeps talking underneath the window.

2. Only one module visible
- The current state model is intentionally single-primary.
- `pinBinding()` replaces the previous visual primary window.
- Live mode has no true multi-window composition yet, only one primary plus an optional preview/dock state.
- So the screenshot is exposing an architectural limitation, not just a styling mistake.

3. Wrong interaction posture
- The runtime is still behaving like one shared overlay host.
- Artifact labels, hover state, and active window state are not cleanly handed off.
- Result: the page feels like a composited shell rather than a world with coherent discoverable objects.

---

## Target product behavior

In live mode:
- the untouched page is only the scene
- artifact affordances are subtle at rest
- when a window opens, the triggering artifact can stay visually related, but its label should not keep shouting through the composition
- windows should feel like placed objects on the stage
- at least a small stack of windows should be possible when the composition can support it
- opened windows should have stronger local isolation from the underlying scene

In review modes:
- labels, inventories, and helper chrome can remain explicit
- geometry and manifestation review should stay separated from live behavior

---

## Phase 1: Stop the bleed and clean the handoff

### Task 1: Document the exact bleed source in code comments
**Objective:** Make the failure explicit before changing behavior.

**Files:**
- Modify: `src/styles/runtime.css`
- Modify: `src/App.tsx`

**Steps:**
1. Add a short comment near `.artifact span` explaining that live-mode labels must not remain visible once a primary stage window is open.
2. Add a short comment near the stage artifact button rendering explaining that artifact labels are affordance hints, not persistent captions in live mode.

### Task 2: Add a live-mode label suppression rule
**Objective:** Hide active artifact labels when a primary stage window is open.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles/runtime.css`
- Test: `src/lib/runtimePresentation.test.ts` or a new focused presentation/state test if needed

**Steps:**
1. Add a derived boolean in `App.tsx` like `hasPrimaryStageWindow`.
2. Add a stage class when live mode has a primary window open, for example `stage--window-open`.
3. In CSS, suppress `.artifact span` visibility in immersive live mode when that class is present.
4. Keep labels visible in QA/debug modes.
5. Verify the exact mountain-label bleed is gone in a screenshot.

### Task 3: Freeze hover-driven preview churn while a primary window is open
**Objective:** Prevent the open window state from competing with active hover labels.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/lib/sourceWindowManager` or current state helper usage if needed
- Test: `src/lib/sourceWindowManager.test.ts`

**Steps:**
1. Change live-mode hover behavior so once a primary visual window is pinned, hover does not keep creating competing preview state over unrelated artifacts.
2. Preserve focus changes only when explicitly clicked.
3. Keep QA/review behavior unchanged unless a test shows the contract should differ.

---

## Phase 2: Replace single-slot thinking with a small stage window system

### Task 4: Write the windowing contract
**Objective:** Decide how many windows can coexist and under what rules.

**Files:**
- Modify: `docs/runtime-plan.md`
- Modify: `docs/source-window-embed-interaction-spec.md`
- Optionally create: `docs/windowing-contract.md`

**Required decisions:**
- default live stack size: 2 visual windows, or 1 primary + 1 secondary
- whether hero clicks can replace while module clicks can stack
- z-order rules
- close/focus rules
- preview suppression rules once multiple windows exist

### Task 5: Expand window state beyond single-primary
**Objective:** Support a small visual stack instead of only one primary window.

**Files:**
- Modify: current window-state helper module used by `hoverBinding`, `pinBinding`, `restoreWindow`, `closeWindow`
- Test: `src/lib/sourceWindowManager.test.ts`

**Steps:**
1. Add explicit ordered visual window stack state.
2. Keep audio persistence separate.
3. Let `pinBinding()` either:
   - add a second stacked window, or
   - replace only when stack is full.
4. Add tests for:
   - first click opens one window
   - second click on another module adds a second window
   - third click applies the replacement rule
   - close removes only that window

### Task 6: Add explicit focus/front behavior
**Objective:** Make multi-window interaction legible.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles/runtime.css`
- Test: state-level tests where possible

**Steps:**
1. Clicking an open window should bring it to front.
2. Add a visible focused-window treatment.
3. Ensure close buttons are always accessible and not hidden behind stage content.

---

## Phase 3: Make the window objects feel native to the scene

### Task 7: Strengthen stage occlusion and isolation
**Objective:** Make open windows feel like objects with their own local surface.

**Files:**
- Modify: `src/styles/runtime.css`
- Possibly modify: `src/lib/sourceWindowSurface.ts`
- Possibly modify: `src/App.tsx`

**Steps:**
1. Increase local backdrop separation behind open windows.
2. Prevent scene text and labels from competing in the same visual zone.
3. Add a stronger inner surface for media windows so the popup reads as intentional, not floating shell UI.
4. Keep this subtle. No giant modal blackout.

### Task 8: Differentiate artifact states
**Objective:** Clarify the difference between idle, hovered, active-source, and exhausted/covered artifacts.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles/runtime.css`

**Steps:**
1. Idle artifact: nearly invisible affordance.
2. Hover artifact: subtle hint.
3. Active artifact with open window: visible relation glow, but no caption pill.
4. Covered or background artifact while another window is frontmost: lower emphasis.

### Task 9: Replace generic lower-third feeling with object-native captioning
**Objective:** Stop using free-floating artifact labels as if they were subtitles.

**Files:**
- Modify: `src/styles/runtime.css`
- Modify: `src/App.tsx`

**Steps:**
1. Rework artifact labels into tiny object-attached tags or halo labels.
2. In live mode, only show them on deliberate hover before a window is open.
3. Never let them persist as a bottom caption under an open window.

---

## Phase 4: Re-approach module design from the scene level

### Task 10: Audit each edition for real module density
**Objective:** Verify that every page actually supports the intended 2 hero + ~6 module experience.

**Files:**
- Inspect: `public/editions/*/artifact-map.json`
- Inspect: `public/editions/*/source-bindings.json`
- Create: `docs/plans/module-density-audit.md` or a session note if needed

**Questions to answer:**
- Are all module artifacts truly legible and clickable?
- Are some pages technically mapped but only one module feels usable?
- Which pages need remapping rather than runtime fixes?

### Task 11: Add a manifestation audit pass
**Objective:** Separate geometry correctness from experiential richness.

**Files:**
- Modify: `docs/current-state.md` or planning docs
- Possibly create a dedicated review checklist markdown file

**Audit criteria per edition:**
- do 2 hero regions actually read as dominant?
- do 4 to 6 module pockets feel individually discoverable?
- is there a stable reading zone?
- does opening one pocket collapse the rest of the page into irrelevance?
- does the page feel like one module plus wallpaper, or a world of pockets?

### Task 12: Rebuild weak editions if needed
**Objective:** Accept that some pages may need remapping or reseeding, not just runtime polish.

**Files:**
- Modify per-edition `artifact-map.json`
- Modify per-edition `source-bindings.json`
- Possibly regenerate masks/assets where mapping is weak

**Rule:**
If a page still reads as “one module only” after windowing fixes, treat that edition as a weak manifestation and remap the page instead of forcing the runtime to compensate.

---

## Verification plan

### Required automated verification
Run after every meaningful pass:
- `npm test`
- `npm run validate:editions`
- `npm run build`

### Required UX verification
Use Playwright and save screenshots for at least:
- `/archive/night-observatory-v1`
- `/archive/offering-board-v1`
- `/archive/forest-listening-table-v1`
- `/`

For each verification shot:
1. untouched scene
2. one open module
3. second module opened if stacking is enabled
4. close one window and confirm the remaining composition is stable

### Explicit screenshot checks
Reject the build if any screenshot still shows:
- artifact label text bleeding under or around an open stage window
- only one usable pocket on pages that are supposed to support several
- review chrome leaking into live mode
- generic fallback copy where a source-grounded artifact card should exist
- stale tunnel output compared with localhost

---

## Immediate recommended implementation order

1. Fix live label bleed
2. Freeze hover churn when a primary window is open
3. Define the 2-window live stack contract
4. Implement the small stack in state
5. Add focus/front behavior
6. Re-screenshot the same problematic pages
7. Audit edition module density
8. Remap weak pages if they still read as single-module scenes

---

## Success criteria

The pass is successful when:
- no label text bleeds through under open windows
- live mode no longer reads like one shared overlay host
- at least two windows can coexist cleanly when useful
- weak pages are identified as mapping problems instead of being mislabeled as runtime bugs
- screenshot review makes the pages feel like scene-native worlds with multiple pockets, not one popup over wallpaper
