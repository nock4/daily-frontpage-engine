import { describe, expect, it } from 'vitest'
import { getStageWindowPlacement } from './stageWindowPlacement'
import type { ArtifactRecord } from '../types/runtime'

const makeArtifact = (overrides: Partial<ArtifactRecord>): ArtifactRecord => ({
  id: 'artifact-1',
  kind: 'module',
  label: 'Specimen note',
  artifact_type: 'note',
  cluster_id: 'cluster-1',
  bounds: { x: 0.12, y: 0.14, w: 0.22, h: 0.18 },
  polygon: [],
  z_index: 3,
  source_binding_ids: ['binding-1'],
  ...overrides,
})

describe('getStageWindowPlacement', () => {
  it('pushes a primary live window away from a left-side artifact and enlarges hero pockets', () => {
    expect(
      getStageWindowPlacement(
        makeArtifact({ kind: 'hero', bounds: { x: 0.08, y: 0.16, w: 0.24, h: 0.34 } }),
        'primary',
      ),
    ).toEqual({
      anchorSide: 'right',
      x: 0.38,
      y: 0.11,
      width: 0.38,
      maxHeight: 0.58,
      tone: 'hero',
    })
  })

  it('keeps a preview compact and flips it left when the artifact sits on the right edge', () => {
    expect(
      getStageWindowPlacement(
        makeArtifact({ bounds: { x: 0.74, y: 0.2, w: 0.16, h: 0.16 } }),
        'preview',
      ),
    ).toEqual({
      anchorSide: 'left',
      x: 0.5,
      y: 0.17,
      width: 0.24,
      maxHeight: 0.3,
      tone: 'preview',
    })
  })

  it('clamps near-bottom artifacts so windows stay on stage', () => {
    expect(
      getStageWindowPlacement(
        makeArtifact({ bounds: { x: 0.42, y: 0.78, w: 0.16, h: 0.12 } }),
        'primary',
      ),
    ).toEqual({
      anchorSide: 'right',
      x: 0.64,
      y: 0.34,
      width: 0.3,
      maxHeight: 0.58,
      tone: 'module',
    })
  })
})
