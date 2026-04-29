# UX Review Checklist

Do not report a UX issue fixed until every box below is true.

## Required artifacts
- [ ] A named Playwright UX test exists for the affected scenario
- [ ] A fresh screenshot artifact was produced
- [ ] A Playwright trace was produced
- [ ] If the scenario is stable, a screenshot baseline exists or was intentionally updated
- [ ] If accessibility could be affected, an axe scan was run
- [ ] If source-window media could be affected, `npm run test:ux:media` or the route-scoped media audit was run

## Required checks
- [ ] The screenshot was inspected directly, not inferred from DOM text alone
- [ ] The screenshot does not show internal implementation labels
- [ ] The screenshot does not show placeholder domains or fake routes
- [ ] The screenshot does not show artifact-label bleed behind an open window
- [ ] The screenshot does not show review chrome in live mode
- [ ] The intended number of open windows is visibly present
- [ ] The frontmost/focused window is the one expected by the scenario
- [ ] The close control is visible and reachable
- [ ] Generated YouTube windows are playable embeds, not linkout-only windows
- [ ] Generated source windows are not title-only when source media should be available
- [ ] Generated packages do not use raw Twitter/X CDN media as primary source URLs

## If the user is reviewing via tunnel
- [ ] Verification was run against the same fresh preview build
- [ ] Any stale preview or tunnel processes were killed first if necessary
- [ ] The final screenshot came from the current build, not an older cached route

## Auto-fail conditions
If any of these appear, the fix is not done:
- `MAPPED POCKET`
- `Hero artifact`
- `WEB SOURCE`
- `Unbound source`
- `example.com`
- title-only source windows for media-capable bindings
- non-embeddable YouTube videos in generated editions
- raw `pbs.twimg.com` or `video.twimg.com` primary source URLs
- visible scene-label bleed under an open stage window
- a single popup over wallpaper when the target state is supposed to be multi-window
