import { describe, expect, it } from 'vitest'

import {
  sentenceList,
  slugify,
  uniqueNonEmpty,
} from '../../scripts/lib/string-utils.mjs'

describe('string utilities', () => {
  it('normalizes values into stable slugs', () => {
    expect(slugify(' The Mnemonic Conservatory! v2 ')).toBe('the-mnemonic-conservatory-v2')
    expect(slugify('')).toBe('daily-edition')
  })

  it('keeps unique trimmed values in original order', () => {
    expect(uniqueNonEmpty([' alpha ', '', 'beta', 'alpha', null, 'gamma'])).toEqual([
      'alpha',
      'beta',
      'gamma',
    ])
  })

  it('formats compact sentence lists', () => {
    expect(sentenceList(['alpha'])).toBe('alpha')
    expect(sentenceList(['alpha', 'beta'])).toBe('alpha and beta')
    expect(sentenceList(['alpha', 'beta', 'gamma'])).toBe('alpha, beta, and gamma')
  })
})
