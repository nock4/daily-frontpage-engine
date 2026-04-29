import { describe, expect, it } from 'vitest'

import {
  domain,
  getSourceDisplayTitle,
} from '../../scripts/lib/source-display.mjs'

describe('source display helpers', () => {
  it('normalizes domains for labels', () => {
    expect(domain('https://www.example.com/path')).toBe('example.com')
    expect(domain('not a url')).toBe('')
  })

  it('uses actual post text from X title wrappers', () => {
    expect(getSourceDisplayTitle({
      title: 'Somebody on X: "A better source title"',
      url: 'https://x.com/person/status/123',
    }, 'fallback')).toBe('A better source title')
  })

  it('rejects filename-like image titles and falls back to note or domain', () => {
    expect(getSourceDisplayTitle({
      title: 'IMG_0123.jpg',
      note_title: 'Saved visual reference',
      url: 'https://example.com/image.jpg',
    }, '')).toBe('Saved visual reference')

    expect(getSourceDisplayTitle({
      title: 'homepage',
      url: 'https://www.example.com/story',
    }, '')).toBe('example.com')
  })
})
