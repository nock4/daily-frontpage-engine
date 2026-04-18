import { describe, expect, it } from 'vitest'
import { getSourceWindowSurfaceProfile } from './sourceWindowSurface'
import type { SourceWindowDescriptor } from './sourceWindowContent'

const videoDescriptor: SourceWindowDescriptor = {
  kind: 'youtube-embed',
  embedUrl: 'https://www.youtube.com/embed/test',
  allowsPlaybackPersistence: false,
  domainLabel: 'youtube.com',
  ctaLabel: 'Open on YouTube',
  platformLabel: 'YouTube',
  accentTone: 'video',
}

const socialDescriptor: SourceWindowDescriptor = {
  kind: 'social-card',
  sourceUrl: 'https://x.com/nick/status/123',
  allowsPlaybackPersistence: false,
  domainLabel: 'x.com',
  ctaLabel: 'Open post',
  platformLabel: 'X',
  sourceLabel: '@nick',
  postLabel: 'Post 123',
  byline: 'Posted by @nick on X',
  accentTone: 'social',
}

const unboundDescriptor: SourceWindowDescriptor = {
  kind: 'rich-preview',
  sourceUrl: null,
  allowsPlaybackPersistence: false,
  domainLabel: 'unbound source',
  ctaLabel: 'Open source',
  platformLabel: 'Web source',
  accentTone: 'reading',
}

describe('getSourceWindowSurfaceProfile', () => {
  it('makes live stage video windows feel embedded instead of panel-like', () => {
    expect(getSourceWindowSurfaceProfile(videoDescriptor, 'stage', 'primary')).toEqual({
      showHeader: false,
      showExcerpt: false,
      showMeta: false,
      showBodyEyebrow: false,
      showBodyPlatformPill: true,
      frameStyle: 'embedded-media',
      bodyStyle: 'immersive',
      closeStyle: 'floating',
    })
  })

  it('keeps live stage previews extra minimal', () => {
    expect(getSourceWindowSurfaceProfile(socialDescriptor, 'stage', 'preview')).toEqual({
      showHeader: false,
      showExcerpt: false,
      showMeta: false,
      showBodyEyebrow: false,
      showBodyPlatformPill: true,
      frameStyle: 'artifact-card',
      bodyStyle: 'compact',
      closeStyle: 'floating',
    })
  })

  it('does not duplicate the platform label on unbound stage fallback cards', () => {
    expect(getSourceWindowSurfaceProfile(unboundDescriptor, 'stage', 'primary')).toEqual({
      showHeader: false,
      showExcerpt: false,
      showMeta: false,
      showBodyEyebrow: false,
      showBodyPlatformPill: true,
      frameStyle: 'artifact-card',
      bodyStyle: 'standard',
      closeStyle: 'floating',
    })
  })

  it('keeps panel review windows fully legible and review-oriented', () => {
    expect(getSourceWindowSurfaceProfile(socialDescriptor, 'panel', 'primary')).toEqual({
      showHeader: true,
      showExcerpt: true,
      showMeta: true,
      showBodyEyebrow: true,
      showBodyPlatformPill: true,
      frameStyle: 'panel',
      bodyStyle: 'standard',
      closeStyle: 'inline',
    })
  })
})
