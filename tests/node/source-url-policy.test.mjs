import { describe, expect, it } from 'vitest'

import {
  canonicalizeSourceUrl,
  extractUrls,
  hostnameForUrl,
  isAllowedSourceUrl,
  isBandcampStreamingSourceUrl,
  isPreferredNtsStreamingSourceUrl,
  isSoundCloudStreamingSourceUrl,
  isYouTubeSearchLocatorUrl,
  isYouTubeThumbnailUrl,
  isYouTubeVideoUrl,
  ntsStreamingSourceRank,
  youtubeId,
} from '../../scripts/lib/source-url-policy.mjs'

describe('source URL policy', () => {
  it('extracts and cleans http URLs from text', () => {
    expect(extractUrls('see (https://example.com/story?x=1&amp;y=2), and https://bad.local/a')).toEqual([
      'https://example.com/story?x=1&y=2',
      'https://bad.local/a',
    ])
  })

  it('rejects local, document, NTS page, and thumbnail URLs', () => {
    expect(isAllowedSourceUrl('https://example.com/story')).toBe(true)
    expect(isAllowedSourceUrl('http://localhost:3000/story')).toBe(false)
    expect(isAllowedSourceUrl('https://example.com/llm.txt')).toBe(false)
    expect(isAllowedSourceUrl('https://nts.live/shows/example')).toBe(false)
    expect(isAllowedSourceUrl('https://img.youtube.com/vi/abc123/hqdefault.jpg')).toBe(false)
  })

  it('classifies playable YouTube URLs without accepting thumbnail URLs as sources', () => {
    expect(youtubeId('https://youtu.be/abc123')).toBe('abc123')
    expect(youtubeId('https://www.youtube.com/watch?v=abc123')).toBe('abc123')
    expect(isYouTubeVideoUrl('https://www.youtube.com/shorts/abc123')).toBe(true)
    expect(isYouTubeThumbnailUrl('https://i.ytimg.com/vi/abc123/hqdefault.jpg')).toBe(true)
    expect(isYouTubeVideoUrl('https://i.ytimg.com/vi/abc123/hqdefault.jpg')).toBe(false)
  })

  it('keeps NTS resolved streaming source preference explicit', () => {
    expect(isYouTubeSearchLocatorUrl('https://www.youtube.com/results?search_query=track')).toBe(true)
    expect(isPreferredNtsStreamingSourceUrl('https://www.youtube.com/watch?v=abc123')).toBe(true)
    expect(isBandcampStreamingSourceUrl('https://artist.bandcamp.com/track/song')).toBe(true)
    expect(isSoundCloudStreamingSourceUrl('https://soundcloud.com/artist/song')).toBe(true)
    expect(isPreferredNtsStreamingSourceUrl('https://soundcloud.com/search?q=song')).toBe(false)
    expect(ntsStreamingSourceRank('https://www.youtube.com/watch?v=abc123')).toBeLessThan(ntsStreamingSourceRank('https://artist.bandcamp.com/track/song'))
  })

  it('canonicalizes source identity for duplicate prevention', () => {
    expect(hostnameForUrl('https://www.Example.com/path')).toBe('example.com')
    expect(canonicalizeSourceUrl('https://twitter.com/person/status/123?s=20')).toBe('x.com/person/status/123')
    expect(canonicalizeSourceUrl('https://img.youtube.com/vi/abc123/hqdefault.jpg')).toBe('youtube.com/watch/abc123')
    expect(canonicalizeSourceUrl('https://www.youtube.com/watch?v=abc123&feature=share')).toBe('youtube.com/watch/abc123')
  })
})
