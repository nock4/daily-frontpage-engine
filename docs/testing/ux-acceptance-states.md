# UX Acceptance States

These are the canonical live-stage states that must pass before Hermes reports a UX fix as done.

## Generated Edition Smoke

Route:
- latest generated review route, currently `/archive/ash-procession-flare-v1`

State 1: artwork renders
- Plate loads without review chrome
- Artifact targets are focusable/clickable
- About/source-window styling uses the edition typography profile where applicable

State 2: source window opens
- Hover/click an artifact
- A source window opens near the stage target
- Media-capable bindings show media, not title-only placeholders
- Generated YouTube bindings render playable embeds, not linkout-only windows
- Generated primary source URLs are unique and do not point at raw Twitter/X CDN media

## Night Observatory

Route:
- `/archive/night-observatory-v1`

State 1: live rest
- No stage windows open
- Scene reads as a full-page observatory world
- No review chrome leaking into live mode

State 2: one hero window open
- Click artifact index 0: central mountain peak with bright horizon light
- One YouTube window visible
- Forbidden:
  - artifact label bleed like `Central mountain peak with bright horizon light`
  - internal labels like `Hero artifact`
  - generic fallback copy in the video window

State 3: two-window stack
- Click artifact index 0, then artifact index 2
- Two stage windows visible
- One media window plus one source/article window
- Forbidden:
  - `MAPPED POCKET`
  - label bleed
  - only-one-popup-over-wallpaper feeling

State 4: focus/front swap
- From State 3, click the back window
- Previously back window moves to front
- Stack remains 2 windows

State 5: close down to one window
- From State 3, close one window
- Remaining window stays stable and focused
- No relit artifact labels underneath

## Forest Listening Table

Route:
- `/archive/forest-listening-table-v1`

State 1: two YouTube windows stacked
- Click artifact index 0, then artifact index 2
- Two video windows visible at once
- Both visibly distinct and stackable
- Forbidden:
  - replacing back to only one visual window
  - artifact label bleed
  - duplicate provider label clutter

## Global forbidden artifacts

Never call the UI fixed if screenshots show:
- `MAPPED POCKET`
- `Hero artifact`
- `WEB SOURCE`
- `Unbound source`
- placeholder domains like `example.com`
- artifact label bleed behind open stage windows
- review chrome in live mode
- missing close controls on open windows

## Required evidence per UX fix

Every claimed fix must include:
- Playwright trace artifact
- named screenshot artifact
- passing screenshot baseline or explicit approved baseline update
- accessibility result for impacted state
- screenshot-level visual inspection, not just DOM assertions
