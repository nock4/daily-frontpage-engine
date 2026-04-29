# Argos CI setup

Argos provides visual regression review for the Playwright UX lane.

## What runs in CI

Workflow:
- `.github/workflows/ux-visual-regression.yml`

Command:
- `npm run test:ux`

That job:
- installs dependencies
- installs Playwright Chromium
- builds the app
- runs the UX suite
- uploads Playwright HTML report artifacts
- uploads Playwright trace and test-result artifacts
- uploads Argos screenshots and traces when `ARGOS_TOKEN` is present
- uses modern GitHub Actions majors: checkout v6, setup-node v6, upload-artifact v7
- runs on Node 20; repo `package.json` requires Node `^20.19.0 || >=22.12.0`

## Required GitHub secret

Set this repository secret:
- `ARGOS_TOKEN`

How:
- create or open the project in Argos
- copy the project token
- run `gh secret set ARGOS_TOKEN --body "<token>"`

Current repo status:
- `gh secret list` returned no configured repository secrets during setup
- until `ARGOS_TOKEN` is added, the workflow still runs the UX suite, but Argos upload is disabled

## Local behavior

Local UX review still uses committed Playwright screenshot baselines.

Commands:
- `npm run test:ux:update`
- `npm run test:ux`
- `npm run test:ux:a11y`

## CI behavior

When both of these are true:
- `CI=true`
- `ARGOS_TOKEN` is present

Then visual states are sent to Argos via `argosScreenshot()` and the Argos reporter.

When `ARGOS_TOKEN` is missing:
- tests still run
- HTML report artifacts still upload
- trace artifacts still upload
- Argos visual uploads are skipped cleanly

## Files involved

- `playwright.ux.config.ts`
- `tests/ux/stage-windows.spec.ts`
- `tests/ux/visual.ts`
- `.github/workflows/ux-visual-regression.yml`

## Notes

- `bypassCSP: true` is enabled in the UX Playwright config so Argos screenshot stabilization does not get blocked by CSP
- local screenshot baselines remain the fast guardrail
- Argos is the CI review surface, not a replacement for the local harness
