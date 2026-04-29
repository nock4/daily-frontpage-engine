# Current State

## Runtime status

- repo path: `/Users/nickgeorge-studio/Projects/daily-frontpage-engine`
- experiments repo: `/Users/nickgeorge-studio/Projects/daily-frontpage-engine-experiments`
- current live edition id: `2026-04-23-forest-breath-cabinet-v2`
- latest generated review edition id: `2026-04-28-ash-procession-flare-v1`
- packaged edition count: 55
- current live review tunnel: rotate/verify at runtime before sharing
- packaged editions are mounted from `public/editions/`
- archive routes resolve by slug at `/archive/:slug`
- root manifest: `public/editions/index.json`

## Runtime/toolchain status

- Node requirement: `^20.19.0 || >=22.12.0`
- app/toolchain: React 18, TypeScript, Vite 8, Vitest 4, Playwright
- current security audit state: `npm audit --audit-level=moderate` and `npm audit --omit=dev --audit-level=moderate` report 0 vulnerabilities
- from-scratch generation model defaults: `gpt-5.5` for text/autoresearch/vision, `gpt-image-2` for plate generation
- source capture: browser-harness, usually through a managed local Playwright Chromium CDP endpoint

## Current live contract

- live mode should read as artwork first, software second
- top bar, side rail, and resting chrome are removed from live mode
- review UI exists only in `?qa=clickable`, `?qa=solo`, `?debug=masks`, and related review states
- source windows open on the stage near the clicked artifact
- hover previews stay lightweight and visually tethered to the artifact
- click creates a persistent active window
- explicit close is required for dismissal
- live source pockets must use real fetched media, not text-only placeholders
- displayed source mix should feel intentionally heterogeneous rather than clustered around one topic
- overt landing-page hero/mission copy is not desirable in the live scene
- thesis/motivation should be embedded inside scene-native artifacts and notes, not presented as polished homepage chrome

## Current source-window contract

- source windows should open real media or source-framed fallbacks
- generic summary-card behavior is not acceptable
- every displayed binding needs a meaningful `source_image_url`
- source bindings shown to the user should come from the saved-signal allowlist: Twitter/X bookmarks, YouTube likes, NTS resolved streaming sources, and Chrome bookmarks
- automated research ranks, filters, synthesizes, and captures the saved-source candidates; it must not introduce unrelated public content as primary source bindings
- when an external page is represented visually, prefer the page's native lead image or media over a screenshot of the whole page
- X/Twitter status URLs must resolve to provider-native tweet embeds using rebuilt trusted embed HTML, not raw stored HTML
- raw `pbs.twimg.com` / `video.twimg.com` URLs are not valid primary source URLs for generated editions; use the native tweet URL and foreground tweet media when available
- YouTube URLs must resolve to the YouTube renderer even when stale binding metadata still says `web`
- YouTube candidates that cannot render as native embeds are skipped in future generated editions
- NTS URLs are discovery signals only; generated editions bind to resolved YouTube, Bandcamp, or SoundCloud track/release URLs
- stage artifact-card windows should not duplicate provider labels like `youtube.com` or `YouTube signal`
- unresolved or null source bindings should be treated as data bugs and fixed before review

## Security hardening in place

- raw `source_embed_html` is no longer trusted or carried through runtime
- `source_url` is sanitized to allow only `http/https`
- tweet embeds are rebuilt from validated URLs only
- tweet iframe sandbox is tightened to `allow-scripts allow-popups`
- source enrichment tooling blocks localhost/private/internal/metadata targets and DNS-resolved private hosts
- from-scratch source mining reads only explicit saved-signal paths before inspecting file contents, reducing accidental vault leakage
- generated source selection hard-fails when fewer than 7 non-duplicate renderable content sources survive

## Current generation / packaging status

Recent from-scratch reruns produced these notable editions:

- `2026-04-22-forest-breath-cabinet-v1`
  - fresh rerun proving a true from-scratch branch away from prior live work
- `2026-04-22-cd-age-listening-bar-v1`
  - fresh rerun with real media-backed source pockets
- `2026-04-22-jaipong-bajidoran-switchyard-v1`
  - proved another distinct world and remote/local verification flow
- `2026-04-22-detroit-native-frontage-v1`
  - proved a Detroit native-plant / stormwater ecology branch
- `2026-04-22-tape-commons-transfer-desk-v8`
  - first successful deliberately eclectic mixed-topic source pass
- `2026-04-22-tape-commons-transfer-desk-v9`
  - same eclectic desk world, but with the mission/thesis layer hidden and made more self-aware inside scene artifacts
- `2026-04-23-algorithmic-folklore-watchpost-v1`
  - first end-to-end pass exercising the new post-generation steps: object-aware artifact remap, approximate contour masks, recorded enhancement selection, and Playwright pre-live QA before promotion
- `2026-04-23-forest-breath-cabinet-v2`
  - current live edition; selected by `current_edition_id` and marked `is_live: true` in the root manifest
- `2026-04-28-indigo-proofing-wash-v1`
  - previous generated review edition; produced by the current full daily process with 9 source bindings, `gpt-image-2`, `gpt-5.5` post-plate vision, browser-harness source capture, 9 synced masks, and passing source-window media audit
- `2026-04-28-ash-procession-flare-v1`
  - latest generated review edition; produced by the current full daily process with 9 source bindings, 9 unique primary URLs, no raw Twitter/X CDN primary URLs, `gpt-image-2`, `gpt-5.5` post-plate vision, browser-harness source capture, 9 synced masks, and passing source-window media audit

## Current live edition: Forest Breath Cabinet R2

- id: `2026-04-23-forest-breath-cabinet-v2`
- status: live
- scene family: `forest-breath-cabinet`
- review tunnel: verify current tunnel before sharing; quick-tunnel URLs are ephemeral
- current read: the live manifest currently points to the forest-breath cabinet branch rather than the algorithmic-folklore watchpost branch
- pipeline note: live state is determined by `public/editions/index.json`; `current_edition_id` is the authoritative root-route pointer, and the matching manifest item should be the only record with `is_live: true`

### Current live artifact mix
- see the live edition package for the current artifact list; this section was previously watchpost-specific and is now intentionally non-authoritative until rewritten from the active edition data

### Current live source spread
- see the live edition package for the current source spread; this section was previously watchpost-specific and is now intentionally non-authoritative until rewritten from the active edition data

## Current UX verification contract

- local UX proof comes from named Playwright scenarios plus screenshots
- no visible UX bug should be called fixed from DOM assertions alone
- browser/screenshot verification is required before claiming runtime fixes are done
- remote review links should also be verified, not just localhost

## Current code / docs landmarks

- `src/App.tsx`
  - core runtime rendering, artifact interactions, stage windows, scene reaction hooks
  - now consumes optional `enhancement-plan.json` artifact assignments for first-pass screen-rendered and warped-paper stage previews
- `src/styles/runtime.css`
  - visual/runtime styling entrypoint; imports `runtime-base.css`, `source-windows.css`, and `runtime-responsive.css`
- `src/styles/source-windows.css`
  - source-window, rich-preview, native media, tweet/media card, and source overlay styling
- `src/lib/stageWindowPlacement.ts`
  - hover/source preview tethering logic; spacing was tightened this session
- `src/lib/sourceWindowContent.ts`
  - provider-native window descriptors, YouTube embed/linkout selection, tweet embed handling, audio/image/rich-preview fallbacks
- `src/lib/sourceUrl.ts`
  - URL sanitization helper
- `src/lib/tweetEmbed.ts`
  - safe tweet embed reconstruction
- `src/lib/embedPreloads.ts`
  - trusted embed preload handling
- `scripts/enrich-source-images.mjs`
  - media enrichment script, now SSRF-hardened
- `scripts/lib/source-image-network-policy.mjs`
  - DNS-aware network policy guardrail
- `scripts/lib/source-url-policy.mjs`
  - saved-source URL allow/reject rules, NTS streaming-source preference, YouTube identity, and canonical duplicate keys
- `scripts/lib/signal-mining.mjs`
  - saved-signal mining allowlist, 30-day filtering, NTS streaming-source extraction, YouTube thumbnail rejection, and channel-balanced note selection
- `scripts/lib/source-selection-policy.mjs`
  - source classification, renderable-media scoring, visual-reference selection, source diversity, and content-card eligibility
- `scripts/lib/source-inspection.mjs`
  - browser-harness source capture, fetch fallback metadata extraction, YouTube oEmbed checks, and source-image health normalization
- `scripts/lib/edition-package-assembly.mjs`
  - first package assembly, manifest insertion, source binding records, About record generation, and YouTube embed eligibility filtering
- `scripts/lib/edition-geometry.mjs`
  - shared normalized geometry helpers and generated SVG mask writing
- `scripts/lib/source-display.mjs` and `scripts/lib/string-utils.mjs`
  - source title/domain cleanup and shared string helpers used by daily process modules
- `scripts/lib/fetch-with-timeout.mjs`
  - shared abortable fetch helper used by browser/CDP readiness and source inspection
- `scripts/audit-codebase.mjs`
  - repeatable dead-code and generated-content slop audit
- `src/lib/sourceText.ts` and `scripts/lib/source-text.mjs`
  - source excerpt cleanup for runtime packages and future daily-process output
- `docs/plans/2026-04-22-about-this-page-panel-plan.md`
  - historical implementation plan for the hidden scene-native `About this page` feature; the runtime now consumes edition `about.json`, and generated editions receive run-specific About records
- `docs/plans/2026-04-24-still-in-play-roadmap.md`
  - historical roadmap; much of the About and daily-process automation work described there has since landed

## What is decided

- build a daily engine, not one homepage
- scene-first front page is the guiding frame
- packaged editions, not loose prototypes, are the primary unit now
- fresh reruns should pick genuinely new worlds unless refinement is explicitly requested
- prefer abstract, image-led, research-shaped worlds over default office/desk fallback when generating new editions
- direct OpenAI `gpt-image-2` is the required generation path for current daily-process runs
- `gpt-5.5` is the required model for source autoresearch, brief composition, and post-plate artifact inspection
- live editions should feel like worlds with real source pockets, not dashboard cards
- mixed-topic linked-out content is good when it paints a fuller picture of recent fascinations
- the page should feel weird/alive, not like a polished nonprofit landing page
- source selection should favor variety while rejecting recent duplicates and raw CDN-media primary URLs
- minimal, expressionist, clean generations are the current preferred direction: one dominant field/form, one disruptive gesture, and 7-10 quiet anchors

## What is still open

- improve the visual/native presentation of About panels and source windows without adding product chrome
- decide whether the latest generated review edition should be promoted live
- continue tightening contour masks when abstract plates produce broad field-like masks
- continue improving source-media quality and scene-native integration, especially for non-YouTube audio and social media
- deepen ambiance/reactivity without reintroducing product chrome
