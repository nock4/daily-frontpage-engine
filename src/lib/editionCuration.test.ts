import { describe, expect, it } from 'vitest'
import manifest from '../../public/editions/index.json'
import liveArtifactMap from '../../public/editions/2026-04-23-forest-breath-cabinet-v2/artifact-map.json'
import liveSourceBindings from '../../public/editions/2026-04-23-forest-breath-cabinet-v2/source-bindings.json'
import nightArtifactMap from '../../public/editions/2026-04-16-night-observatory-v1/artifact-map.json'
import forestArtifactMap from '../../public/editions/2026-04-17-forest-listening-table-v1/artifact-map.json'
import resolverArtifactMap from '../../public/editions/2026-04-18-resolver-atlas-shrine-v2/artifact-map.json'

const packagedArtifactMaps = [
  liveArtifactMap,
  nightArtifactMap,
  forestArtifactMap,
  resolverArtifactMap,
]

describe('live edition curation rules', () => {
  it('keeps the current live edition between 6 and 10 masks/modules with no duplicate urls', () => {
    expect(manifest.current_edition_id.startsWith('2026-04-23-')).toBe(true)

    const urls = liveSourceBindings.bindings.map((binding) => binding.source_url).filter(Boolean) as string[]

    expect(liveArtifactMap.artifacts.length).toBeGreaterThanOrEqual(6)
    expect(liveArtifactMap.artifacts.length).toBeLessThanOrEqual(10)
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('keeps serious packaged iterations in the 6 to 10 artifact range', () => {
    for (const artifactMap of packagedArtifactMaps) {
      expect(artifactMap.artifacts.length).toBeGreaterThanOrEqual(6)
      expect(artifactMap.artifacts.length).toBeLessThanOrEqual(10)
    }
  })

  it('keeps the current live edition source set populated with distinct titles', () => {
    const distinctTitles = new Set(
      liveSourceBindings.bindings.map((binding) => binding.source_title || binding.title),
    )

    expect(distinctTitles.size).toBeGreaterThanOrEqual(6)
    expect(distinctTitles.size).toBe(liveSourceBindings.bindings.length)
  })
})
