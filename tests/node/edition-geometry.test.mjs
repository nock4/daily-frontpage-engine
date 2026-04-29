import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  expansionLabel,
  parseImageSize,
  rectPolygon,
  safeOrigin,
  writeArtifactSvgMasks,
} from '../../scripts/lib/edition-geometry.mjs'

describe('edition geometry helpers', () => {
  it('creates normalized rectangle polygons and parses declared image sizes', () => {
    expect(rectPolygon({ x: 0.1, y: 0.2, w: 0.3, h: 0.4 })).toEqual([
      [0.1, 0.2],
      [0.4, 0.2],
      [0.4, 0.6],
      [0.1, 0.6],
    ])
    expect(parseImageSize('1200x800')).toEqual({ width: 1200, height: 800 })
    expect(parseImageSize('bad')).toEqual({ width: 1536, height: 1024 })
  })

  it('keeps stage origins and expansion labels bounded', () => {
    expect(safeOrigin({ x: 0.5, y: 0.5, w: 0.2, h: 0.2 }, 'stage')).toEqual([946, 614])
    expect(expansionLabel({ x: 0.1, y: 0.75, w: 0.1, h: 0.1 })).toBe('up')
    expect(expansionLabel({ x: 0.8, y: 0.2, w: 0.1, h: 0.1 })).toBe('left')
  })

  it('writes current SVG masks and removes orphan masks', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfe-geometry-'))
    const editionId = '2026-04-27-test-v1'
    const editionDir = path.join(root, 'public', 'editions', editionId)
    const masksDir = path.join(editionDir, 'assets', 'masks')
    await fs.mkdir(masksDir, { recursive: true })
    await fs.writeFile(path.join(masksDir, 'orphan.svg'), '<svg/>')

    await writeArtifactSvgMasks(editionDir, editionId, [{
      id: 'hero-field',
      bounds: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 },
      mask_path: `/editions/${editionId}/assets/masks/hero-field.svg`,
    }], { width: 100, height: 50 }, { root })

    await expect(fs.readFile(path.join(masksDir, 'hero-field.svg'), 'utf8')).resolves.toContain('25,12.5 75,12.5 75,37.5 25,37.5')
    await expect(fs.access(path.join(masksDir, 'orphan.svg'))).rejects.toThrow()
  })
})
