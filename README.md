# Daily Frontpage Engine

Scene-first runtime for a daily front page that becomes a new interactive artwork every day.

Goal:
Ship a daily edition engine, not a one-off homepage.

Core idea:
The image is the interface.
Each edition is a world with native visible artifacts that open real source windows.

Current product rules:
- live mode is full-page artwork only
- review chrome exists only in explicit QA and debug modes
- every day gets a new scene and editions stay explorable in the archive
- artifact mapping must anchor to real visible objects in the plate
- source windows should expose real media or source-framed fallbacks, not summary cards
- provider-native URL detection outranks weak binding metadata when the URL is unambiguous

Current repo state:
- runtime lives in this repo
- packaged editions live under `public/editions/`
- root manifest lives at `public/editions/index.json`
- current live edition: `2026-04-17-herbarium-bed-v1`
- current archive count: 8 packaged editions

Current strongest review routes:
- `/` -> current live edition
- `/archive/herbarium-bed-v1`
- `/archive/forest-listening-table-v1`
- `/archive/tea-house-qin-desk-v1`
- `/archive/resolver-atlas-shrine-v1`

Working commands:
- `npm test`
- `npm run validate:editions`
- `npm run build`
- `npm run preview -- --host 127.0.0.1 --port 4174`
- `npm run test:ux:update`
- `npm run test:ux`
- `npm run test:ux:a11y`

Repository purpose:
- hold the actual runtime shell
- keep packaged editions and archive routing in one place
- track architecture, product decisions, and review rules
- preserve the current contract for live mode, review modes, and source-window behavior

See:
- `docs/vision.md`
- `docs/architecture.md`
- `docs/runtime-plan.md`
- `docs/source-window-embed-interaction-spec.md`
- `docs/current-state.md`
- `docs/decision-log.md`
- `docs/testing/ux-acceptance-states.md`
- `docs/testing/review-checklist.md`
- `docs/testing/argos-ci.md`
