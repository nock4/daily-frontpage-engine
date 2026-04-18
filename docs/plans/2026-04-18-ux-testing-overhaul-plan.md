# UX Testing Overhaul Plan

> For Hermes: use this plan before continuing more front-page polish. The current testing loop is too DOM-heavy and too trusting of ad-hoc screenshots.

Goal: replace the current weak UX verification loop with a layered testing stack that can actually catch visual, behavioral, and source-window presentation failures before Nick sees them.

Architecture:
- Keep Playwright as the execution engine.
- Add first-class visual baselines, trace capture, accessibility scanning, and screenshot-level review artifacts.
- Treat DOM assertions as supporting evidence only, never the main proof for visual UX correctness.

Tech stack:
- Playwright trace viewer
- Playwright visual comparisons with toHaveScreenshot()
- Argos or Percy for CI visual review
- @axe-core/playwright for accessibility checks
- Optional Storybook visual states later for isolated window components

---

## What is wrong with the current testing loop

Current failure pattern:
- we click things with Playwright
- we inspect body text and a few simple heuristics
- we sometimes save screenshots
- we manually reason about the screenshot afterward

Why that fails here:
1. DOM text is not a reliable proxy for visual UX quality
2. screenshots are being reviewed too late and too manually
3. there are no baselines for key live-stage states
4. there is no diffing system to flag subtle regressions
5. we are not preserving rich forensic artifacts like traces and videos per failure
6. we are not systematically checking accessibility and focus behavior while we change windowing

---

## Research summary

1. Playwright Trace Viewer
Source: https://playwright.dev/docs/trace-viewer
Why it matters:
- captures screenshots, DOM snapshots, actions, timing, and network in one trace
- best tool for debugging why a specific interaction produced the wrong state
- should be enabled for every critical UX scenario, especially multi-window stage flows

2. Playwright visual comparisons
Source: https://playwright.dev/docs/test-snapshots
Why it matters:
- lets us lock important UI states with screenshot baselines using expect(page).toHaveScreenshot()
- ideal for “after click artifact A, window should look like this” checks
- best local baseline tool for this repo right now

3. Playwright accessibility testing + axe-core
Sources:
- https://playwright.dev/docs/accessibility-testing
- https://www.npmjs.com/package/@axe-core/playwright
Why it matters:
- catches missing labels, contrast issues, duplicate IDs, and other accessibility regressions
- useful now that windows can stack and focus can move between overlays

4. Argos visual regression
Source: https://argos-ci.com/
Why it matters:
- strong Playwright-friendly visual review workflow
- built-in stabilization and CI review flow
- likely the cleanest fit if we want PR-level visual review without overbuilding our own diff dashboard

5. Percy by BrowserStack
Source: https://www.browserstack.com/percy
Why it matters:
- mature hosted visual review platform
- good if Nick wants a more fully managed visual diff/review workflow
- more enterprise-heavy than Argos, but still a valid option

6. Storybook visual testing / Chromatic lane
Source: https://storybook.js.org/docs/writing-tests/visual-testing
Why it matters:
- useful later if we isolate window components into story states
- not the first fix here, because the main failures are runtime composition and stage interaction, not only component rendering in isolation

---

## Recommended tool stack for this repo

Primary stack:
1. Playwright traces for every critical UX flow
2. Playwright toHaveScreenshot() visual baselines for key routes/states
3. @axe-core/playwright for accessibility checks on key live states
4. Argos for CI visual diff review
5. vision review of saved screenshots for final screenshot-level sanity checks on especially subjective stage states

Deprioritized for now:
- Storybook/Chromatic until the runtime states are stable enough to isolate meaningfully
- more browser-tool dogfooding until the browser backend is reliable again

---

## Testing strategy redesign

### Layer 1: behavioral assertions
Keep these, but reduce their authority.

Still useful:
- number of stage windows open
- iframe count
- correct route/state transitions
- no placeholder domains
- no stale internal labels like “Mapped pocket”

Not enough on their own:
- body.innerText checks
- simple presence/absence checks without screenshots

### Layer 2: screenshot baselines
Add baseline screenshot tests for the states Nick actually reviews.

Must-have states:
- live untouched state for each flagship edition
- one hero window open
- one module/source card open
- two windows stacked
- focused-front swap after clicking a second window
- close behavior after one of two windows is dismissed
- no label bleed under an open stage window

### Layer 3: trace artifacts
For every multi-step UX test, save a Playwright trace.

Why:
- when a review screenshot looks wrong, the trace lets us inspect exact action order, hover behavior, layout, and timing
- much better than re-running blind

### Layer 4: CI visual review
Use Argos or Percy to diff screenshots in PRs.

My recommendation:
- Argos first
Because:
- lighter-weight fit
- explicitly strong for Playwright/Storybook visual regression
- good review flow without immediately dragging in a heavier QA platform

### Layer 5: accessibility checks
Run axe on critical routes/states.

Must-have checks:
- live route with one window open
- two-window stacked state
- keyboard focus path between stage windows and close buttons
- visible focus for frontmost active window

---

## Exact implementation plan

### Phase 1: Build a real UX test harness

Task 1
Create a dedicated Playwright UX spec file for stage-window behavior.

Files:
- Create: tests/ux/stage-windows.spec.ts
- Modify: package.json if needed for a new test script

Scenarios:
- night observatory one-window open
- night observatory two-window stack
- forest listening table two-window stack
- close/focus reorder behavior

Task 2
Enable trace and video capture for those tests.

Files:
- Modify: playwright config or test setup used for these scripts
- Create: test-results/ux-artifacts/ convention if needed

Output per failing test:
- trace.zip
- screenshot(s)
- optional video

Task 3
Replace ad-hoc screenshot saves with named canonical snapshots.

Files:
- Modify: tests/ux/stage-windows.spec.ts
- Create: snapshot folder generated by Playwright

Use:
- expect(page).toHaveScreenshot('night-observatory-two-windows.png')
- expect(page).toHaveScreenshot('forest-two-youtube-windows.png')

### Phase 2: Add screenshot-level acceptance criteria

Task 4
Define exact flagship visual states.

Files:
- Create: docs/testing/ux-acceptance-states.md

For each flagship route, specify:
- route
- click sequence
- expected number of windows
- expected visual hierarchy
- forbidden artifacts

Forbidden artifacts list should include:
- artifact label bleed
- internal labels like “Mapped pocket” / “Hero artifact”
- generic fallback copy in live mode unless intentional
- only-one-popup-over-wallpaper feeling for designated multi-window states

Task 5
Add a screenshot review checklist that Hermes must satisfy before replying.

Files:
- Create: docs/testing/review-checklist.md

Checklist:
- saved screenshot exists
- trace exists
- screenshot visually checked by vision
- no placeholder/internal copy
- no bleed
- intended window count visible
- intended frontmost window visible

### Phase 3: Add accessibility automation

Task 6
Add axe-core Playwright checks.

Files:
- package.json
- tests/ux/accessibility.spec.ts

Checks:
- night observatory live route
- one open window
- two stacked windows
- close buttons labeled
- focusable windows

### Phase 4: Add CI visual review

Task 7
Integrate Argos first.

Files:
- package.json
- CI workflow file
- Argos config if needed

Plan:
- run Playwright UX screenshots in CI
- upload snapshots to Argos
- review diffs before merge

Fallback option:
- Percy instead of Argos if Nick wants BrowserStack alignment later

### Phase 5: Optional isolated component lane

Task 8
Only after the runtime stabilizes, consider Storybook for SourceWindow variants.

Files:
- future work only

Good candidate stories:
- YouTube primary
- article/source slip
- social card
- stacked secondary window
- focused/frontmost state
- close button / focus ring state

Not first priority.

---

## What I recommend we do next

Immediate next move:
1. create dedicated Playwright UX spec file
2. turn the current “review clicks” into stable screenshot baseline tests
3. add trace capture
4. add the review checklist doc
5. only then continue more runtime polish

This will stop us from repeatedly claiming things are fixed based on weak heuristics.

---

## Strong opinionated recommendation

Do not continue trusting:
- body.innerText
- one-off manual screenshots
- “looks probably right” reasoning

Start trusting:
- named baseline screenshots
- traces for every important flow
- CI visual diffs
- screenshot-level vision review as a final guardrail

---

## Success criteria

This overhaul is successful when:
- every important live-stage state has a reproducible screenshot baseline
- every failing UX scenario produces a trace artifact automatically
- CI shows visual diffs before Nick does
- accessibility regressions are caught during the same loop
- Hermes no longer reports “fixed” without a trace + screenshot + baseline-backed check
