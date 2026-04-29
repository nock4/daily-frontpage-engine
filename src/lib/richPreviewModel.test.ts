import { describe, expect, it } from 'vitest'
import { getRichPreviewModel } from './richPreviewModel'
import type { SourceBindingRecord } from '../types/runtime'
import type { SourceWindowDescriptor } from '../types/sourceWindows'

const baseBinding: SourceBindingRecord = {
  id: 'binding-1',
  artifact_id: 'artifact-1',
  source_type: 'article',
  source_url: 'https://example.com/story',
  window_type: 'web',
  hover_behavior: 'preview',
  click_behavior: 'pin-open',
  playback_persistence: false,
  fallback_type: 'rich-preview',
  title: 'Example binding',
  kicker: 'Scene detail',
  excerpt: 'A longer source excerpt that gives enough room to verify how the hover preview is compressed or preserved by source class.',
  source_title: 'Example Magazine | Story about a place',
  source_summary: 'A strong editorial summary that should survive mostly intact for article-style hover previews because those pockets can carry more reading weight.',
  source_domain: 'example.com',
  source_meta: '2026-04-15',
}

const baseDescriptor: SourceWindowDescriptor = {
  kind: 'rich-preview',
  sourceUrl: 'https://example.com/story',
  allowsPlaybackPersistence: false,
  domainLabel: 'example.com',
  ctaLabel: 'Open source',
  platformLabel: 'Web source',
  accentTone: 'reading',
}

describe('getRichPreviewModel', () => {
  it('keeps article hover copy in a more editorial register', () => {
    const model = getRichPreviewModel(baseBinding, baseDescriptor)

    expect(model.copyProfile).toBe('editorial')
    expect(model.previewCharLimit).toBe(116)
    expect(model.imageTreatment).toBe('editorial-clipping')
    expect(model.fontProfile).toBe('editorial-serif')
    expect(model.titleTreatment).toBe('typeset')
    expect(model.revealProfile).toBe('editorial-scan')
    expect(model.motionProfile).toBe('soft')
    expect(model.spatialProfile).toBe('airy')
    expect(model.projectionProfile).toBe('cast')
    expect(model.previewCopy.length).toBeLessThanOrEqual(149)
  })

  it('compresses github repo hover copy into a terse technical slip', () => {
    const model = getRichPreviewModel(
      {
        ...baseBinding,
        source_url: 'https://github.com/nock4/daily-frontpage-engine',
        source_title: 'nock4/daily-frontpage-engine',
        source_summary: 'Repository summary that should be compressed harder than editorial article copy so the hover feels sharp and technical.',
        source_domain: 'github.com',
      },
      {
        ...baseDescriptor,
        sourceUrl: 'https://github.com/nock4/daily-frontpage-engine',
        domainLabel: 'github.com',
      },
    )

    expect(model.copyProfile).toBe('terse')
    expect(model.previewCharLimit).toBe(84)
    expect(model.imageTreatment).toBe('technical-slip')
    expect(model.fontProfile).toBe('technical-mono')
    expect(model.titleTreatment).toBe('etched')
    expect(model.revealProfile).toBe('repo-scan')
    expect(model.motionProfile).toBe('snappy')
    expect(model.spatialProfile).toBe('tight')
    expect(model.projectionProfile).toBe('mechanical')
    expect(model.actionLabel).toBe('View repository')
    expect(model.previewCopy.length).toBeLessThanOrEqual(85)
  })

  it('detects github repo classification from the url when source_domain is missing', () => {
    const model = getRichPreviewModel(
      {
        ...baseBinding,
        source_url: 'https://github.com/nock4/daily-frontpage-engine',
        source_title: 'nock4/daily-frontpage-engine',
        source_summary: 'Repository summary that should still classify as a repo even when the stored source_domain is blank.',
        source_domain: undefined,
      },
      {
        ...baseDescriptor,
        sourceUrl: 'https://github.com/nock4/daily-frontpage-engine',
        domainLabel: 'web source',
      },
    )

    expect(model.copyProfile).toBe('terse')
    expect(model.imageTreatment).toBe('technical-slip')
    expect(model.fontProfile).toBe('technical-mono')
    expect(model.motionProfile).toBe('snappy')
    expect(model.spatialProfile).toBe('tight')
    expect(model.projectionProfile).toBe('mechanical')
    expect(model.platformPillLabel).toBe('Repository')
  })

  it('treats root source pages like branded shards with terse hover copy', () => {
    const model = getRichPreviewModel(
      {
        ...baseBinding,
        source_url: 'https://cleardarksky.com/',
        source_title: 'Clear Dark Sky | Homepage',
        source_domain: 'cleardarksky.com',
      },
      {
        ...baseDescriptor,
        sourceUrl: 'https://cleardarksky.com/',
        domainLabel: 'cleardarksky.com',
      },
    )

    expect(model.copyProfile).toBe('terse')
    expect(model.previewCharLimit).toBe(72)
    expect(model.imageTreatment).toBe('branded-shard')
    expect(model.fontProfile).toBe('signal-sans')
    expect(model.titleTreatment).toBe('broadcast')
    expect(model.revealProfile).toBe('signal-feed')
    expect(model.motionProfile).toBe('snappy')
    expect(model.spatialProfile).toBe('tight')
    expect(model.projectionProfile).toBe('mechanical')
    expect(model.actionLabel).toBe('Visit source site')
    expect(model.previewCopy.length).toBeLessThanOrEqual(73)
  })

  it('uses a gallery-serif profile for fashion/editorial portfolio source sites', () => {
    const model = getRichPreviewModel(
      {
        ...baseBinding,
        source_url: 'https://christopherireland.net/',
        source_title: 'Christopher Ireland',
        source_domain: 'christopherireland.net',
      },
      {
        ...baseDescriptor,
        sourceUrl: 'https://christopherireland.net/',
        domainLabel: 'christopherireland.net',
      },
    )

    expect(model.imageTreatment).toBe('branded-shard')
    expect(model.fontProfile).toBe('gallery-serif')
    expect(model.titleTreatment).toBe('inscribed')
  })

  it('uses a condensed display profile for motion-heavy social and video sources', () => {
    const model = getRichPreviewModel(
      {
        ...baseBinding,
        source_type: 'video',
        source_url: 'https://www.youtube.com/watch?v=7Ul_1yuxEVs',
        window_type: 'video',
        source_domain: 'youtube.com',
        source_title: 'Field recording dispatch',
      },
      {
        ...baseDescriptor,
        sourceUrl: 'https://www.youtube.com/watch?v=7Ul_1yuxEVs',
        domainLabel: 'youtube.com',
      },
    )

    expect(model.fontProfile).toBe('display-condensed')
    expect(model.titleTreatment).toBe('broadcast')
  })

  it('uses an editorial reading treatment for X article URLs even when the binding metadata still says tweet/social', () => {
    const model = getRichPreviewModel(
      {
        ...baseBinding,
        source_type: 'tweet',
        window_type: 'social',
        source_url: 'https://x.com/i/article/1947619289998414258',
        source_title: 'Inside the Archive Machine',
        source_domain: 'x.com',
      },
      {
        ...baseDescriptor,
        sourceUrl: 'https://x.com/i/article/1947619289998414258',
        domainLabel: 'x.com',
      },
    )

    expect(model.imageTreatment).toBe('editorial-clipping')
    expect(model.fontProfile).toBe('editorial-serif')
    expect(model.actionLabel).toBe('Read X article')
  })

  it('treats pdf-backed previews like caption fragments', () => {
    const model = getRichPreviewModel(
      {
        ...baseBinding,
        source_url: 'https://ica.art/some-catalog.pdf',
        source_title: 'ICA Catalog PDF',
        source_domain: 'ica.art',
      },
      {
        ...baseDescriptor,
        sourceUrl: 'https://ica.art/some-catalog.pdf',
        domainLabel: 'ica.art',
      },
    )

    expect(model.copyProfile).toBe('caption')
    expect(model.previewCharLimit).toBe(96)
    expect(model.imageTreatment).toBe('document-fragment')
    expect(model.fontProfile).toBe('document-serif')
    expect(model.titleTreatment).toBe('stamped')
    expect(model.revealProfile).toBe('document-burn')
    expect(model.motionProfile).toBe('archival')
    expect(model.spatialProfile).toBe('anchored')
    expect(model.projectionProfile).toBe('hinged')
    expect(model.previewCopy.length).toBeLessThanOrEqual(97)
  })

  it('handles invalid source urls without silently reclassifying them as root pages', () => {
    const model = getRichPreviewModel(
      {
        ...baseBinding,
        source_url: 'not a url',
        source_domain: undefined,
        source_title: 'Broken link reference',
      },
      {
        ...baseDescriptor,
        sourceUrl: 'not a url',
        domainLabel: 'linked source',
      },
    )

    expect(model.imageTreatment).toBe('editorial-clipping')
    expect(model.actionLabel).toBe('Read source article')
    expect(model.sourceDomainLabel).toBe('linked source')
  })
})
