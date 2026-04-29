import { describe, expect, it } from 'vitest'

import { sanitizeSourceText } from '../../scripts/lib/source-text.mjs'

describe('sanitizeSourceText', () => {
  it('strips logged-out X page shell from captured text', () => {
    const text = 'Don\u2019t miss what\u2019s happening People on X are the first to know. Log in Sign up Post See new posts Conversation Example @example A clean post with a real source sentence. New to X? Sign up now to get your own personalized timeline! Terms of Service | Privacy Policy'

    expect(sanitizeSourceText(text)).toBe('Example @example A clean post with a real source sentence.')
  })

  it('removes invisible controls and truncates at a word boundary', () => {
    const text = `Alpha\u200b ${'bravo '.repeat(20)}charlie`

    expect(sanitizeSourceText(text, '', 40)).toBe('Alpha bravo bravo bravo bravo bravo...')
  })

  it('uses fallback text when the captured shell has no source body', () => {
    expect(sanitizeSourceText('Don\u2019t miss what\u2019s happening People on X are the first to know.', 'Fallback title')).toBe('Fallback title')
  })
})
