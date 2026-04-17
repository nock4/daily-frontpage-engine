# Source Window / Embed Interaction Spec

## Purpose

Front-page pockets open real source windows, not text-summary cards. Each pocket reveals the best available live representation of its source: embedded tweet/bookmark, playable YouTube video, streamable NTS track, image, or direct source page.

## Core Rules

- every pocket maps to a real source artifact
- no generic summary-card UI
- hover may preview a source window, but playback persists until explicit close
- click promotes a pocket into an active source window
- only explicit close, replace, or navigation should dismiss active media
- fallback should still preserve source truth when no native embed exists

## Source Window Types

1. social embed
   - tweets, bookmark-like posts, web articles with rich preview support
2. video embed
   - YouTube and other playable video sources
3. audio embed
   - NTS liked tracks or other streamable audio sources
4. image/media viewer
   - static image, GIF, scanned artifact, or hosted media file
5. source-page fallback
   - direct open to the original URL in a framed or new-tab pattern when no safe embed exists

## Interaction States

### 1. Resting pocket
- pocket is visible as part of the scene only
- no window is open
- hoverable pockets get subtle affordance only: glow, parallax, underline, shimmer, or object-specific motion

### 2. Hover preview
- desktop/tablet pointer only
- after short hover delay, open a lightweight preview window near the pocket
- preview should feel spatially attached to the object, not centered like a modal
- preview may show live embed if lightweight enough, otherwise poster/thumbnail + source label
- preview never steals focus or auto-scrolls the page

### 3. Active window
- triggered by click/tap
- source window becomes pinned/open
- pinned window remains open after pointer leaves the pocket or leaves the window
- if media is playable, playback can start on click and continues until paused or closed
- active window gets highest local z-layer among source windows

### 4. Playing
- applies to video/audio embeds
- playback persists independently of hover state
- window may be visually minimized, but playback continues unless the user pauses or closes it
- leaving the scene area, moving the mouse away, or hovering another pocket must not stop playback by itself

### 5. Minimized
- user can collapse an active window into a smaller docked state
- minimized state preserves playback for audio and allowed video behavior
- minimized window stays recoverable from a visible dock, stack, or object-linked tab

### 6. Closed
- explicit close button, escape action, close-all action, or replacement rule closes the window
- closing stops playback unless the source has been deliberately popped out to a native tab/window

## Hover and Click Behavior

### Desktop / pointer devices
- hover: reveal affordance immediately; open preview after a short delay
- click on pocket: pin/open active source window
- click inside preview: promote preview to active window
- moving away from pocket: dismiss preview only if it was never pinned
- moving away from active window: do nothing

### Mobile / touch devices
- no hover dependency
- first tap opens the active source window immediately
- second tap on the same pocket may focus, expand, or toggle controls
- background tap closes only lightweight previews or unfocused chrome, not active media unless clearly targeted

## Window Placement

- source window should originate from or visually point back to its pocket
- avoid full-screen takeover by default
- prefer local placement rules: above, beside, or anchored to the object depending on available space
- if the scene edge would clip the window, flip its placement while preserving apparent attachment
- allow multiple windows only if composition remains readable; otherwise open one primary window at a time

## Multi-Window Policy

Use one of these modes per edition:

### Default: single-primary + optional audio persistence
- opening a new visual source window replaces the previous visual window
- active audio may continue in a minimized dock if the new window is non-audio
- prevents scene clutter while preserving listening continuity

### Optional: small stack
- allow up to 2 to 3 pinned windows when the composition supports it
- newest active window comes to front
- each window still needs explicit close

## Persistence Rules

- hover previews are ephemeral
- clicked/tapped windows persist until explicit close, replacement, or page navigation
- playback state should survive pointer exit and incidental scene interaction
- if the edition supports internal navigation between pockets, keep active media alive when possible
- if a window is minimized, preserve source state and playback position where the embed API allows it

## Close Controls

Every active window needs at least one obvious close path:

- visible close button in the window chrome
- keyboard escape closes the currently focused non-minimized window on desktop
- optional close-all command for clearing the scene
- minimized items need their own close affordance
- close target must be large enough for touch

Do not rely on mouseleave as a close mechanism for active media.

## Content-Specific Rules

### Tweets / bookmarks / social posts
- show the real embedded post when platform support exists
- if full embed is heavy, hover can use a lightweight shell and click loads the live embed
- preserve author, timestamp, and outbound link

### YouTube
- hover may show thumbnail, muted teaser, or lightweight embed shell
- click opens playable embed with controls
- playback continues after mouseleave until explicit close or pause
- support pop-out to YouTube when embed restrictions or performance require it

### NTS liked tracks
- click opens a stream-capable audio embed or player-linked window
- audio should persist while the user explores other pockets
- provide minimized player state as a first-class pattern

### Images / scanned artifacts
- open high-resolution viewer or framed media view
- allow zoom if the source supports detail worth inspecting

## Fallback Rules

When no native embed exists, use the highest-truth fallback in this order:

1. platform-native embed
2. lightweight rich preview with title/source metadata and explicit open-source action
3. thumbnail/poster + source label + outbound open action
4. direct source-page open in new tab/window

Fallback must still show:
- source name
- outbound link
- enough metadata to communicate what the user is opening

Fallback must not become a generic summary card with rewritten descriptive copy.

## Performance Rules

- do not eagerly load all embeds on page load
- lazy-load on hover preview or click
- prefer thumbnail/poster on hover for heavy embeds
- keep one active media session smooth rather than many half-loaded windows
- unload fully closed embeds when practical

## Accessibility Rules

- every pocket needs a focusable target and source label
- keyboard users must be able to open, focus, minimize, and close source windows
- active windows need visible focus state
- do not make hover the only path to discovery
- touch and reduced-motion users should receive the same source access without hidden behavior

## Implementation Decision Summary

- pockets open real source windows/embeds
- no text-summary cards
- hover previews are optional and lightweight
- click/tap creates a persistent active window
- media keeps playing after mouseleave
- explicit close is required to dismiss active media
- mobile uses tap-first behavior
- fallback preserves source truth when live embed is unavailable
