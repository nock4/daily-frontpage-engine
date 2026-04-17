import type { ArtifactRecord, EditionManifest, EditionManifestItem, LoadedEdition } from '../types/runtime'

const fetchJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Failed to load ${path}`)
  return response.json() as Promise<T>
}

export const loadManifest = () => fetchJson<EditionManifest>('/editions/index.json')

export const selectEdition = (manifest: EditionManifest, search: URLSearchParams): EditionManifestItem => {
  const byId = search.get('edition')
  const byDate = search.get('date')

  if (byId) {
    const match = manifest.editions.find((item) => item.slug === byId || item.edition_id === byId)
    if (match) return match
  }

  if (byDate) {
    const match = manifest.editions.find((item) => item.date === byDate)
    if (match) return match
  }

  return manifest.editions.find((item) => item.edition_id === manifest.current_edition_id) ?? manifest.editions[0]
}

export const loadEditionPackage = async (basePath: string): Promise<LoadedEdition> => {
  const [edition, brief, artifactMap, sourceBindings, ambiance, review] = await Promise.all([
    fetchJson(`${basePath}/edition.json`),
    fetchJson(`${basePath}/brief.json`),
    fetchJson(`${basePath}/artifact-map.json`),
    fetchJson(`${basePath}/source-bindings.json`),
    fetchJson(`${basePath}/ambiance.json`),
    fetchJson(`${basePath}/review.json`),
  ])

  return { edition, brief, artifactMap, sourceBindings, ambiance, review } as LoadedEdition
}

export const polygonToClipPath = (artifact: ArtifactRecord) => {
  if (!artifact.polygon || artifact.polygon.length < 3) return undefined
  const { x, y, w, h } = artifact.bounds
  return `polygon(${artifact.polygon
    .map(([px, py]) => `${((px - x) / w) * 100}% ${((py - y) / h) * 100}%`)
    .join(', ')})`
}
