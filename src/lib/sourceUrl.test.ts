import { describe, expect, it } from 'vitest'

import { sanitizeSourceUrl } from './sourceUrl'

describe('sanitizeSourceUrl', () => {
  it('keeps http and https urls', () => {
    expect(sanitizeSourceUrl('https://example.com/story')).toBe('https://example.com/story')
    expect(sanitizeSourceUrl('http://example.com/story')).toBe('http://example.com/story')
  })

  it('rejects javascript and data urls', () => {
    expect(sanitizeSourceUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeSourceUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
  })

  it('rejects malformed urls', () => {
    expect(sanitizeSourceUrl('not a url')).toBeNull()
  })
})
