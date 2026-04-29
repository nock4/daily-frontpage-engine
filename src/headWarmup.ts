import { buildRuntimeWarmupPlan, selectEditionForPath, syncRuntimeWarmupLinks } from './lib/runtimeWarmup'
import type { EditionManifest, EditionRecord, SourceBindingSetRecord } from './types/runtime'

const MANIFEST_URL = '/editions/index.json'
const HEAD_SCOPE = 'head-boot'

const fetchJson = async <T,>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(url, { credentials: 'same-origin' })
    if (!response.ok) return null
    return await response.json() as T
  } catch {
    return null
  }
}

const runHeadWarmup = async () => {
  const manifest = await fetchJson<EditionManifest>(MANIFEST_URL)
  if (!manifest) return

  const edition = selectEditionForPath(manifest, window.location.pathname)
  if (!edition) return

  const [editionRecord, sourceBindings] = await Promise.all([
    fetchJson<EditionRecord>(`${edition.path}/edition.json`),
    fetchJson<SourceBindingSetRecord>(`${edition.path}/source-bindings.json`),
  ])
  const plan = buildRuntimeWarmupPlan({
    editionPath: edition.path,
    plateAssetPath: editionRecord?.plate_asset_path ?? edition.preview_asset_path,
    bindings: sourceBindings?.bindings ?? [],
  })

  syncRuntimeWarmupLinks(HEAD_SCOPE, plan)
}

void runHeadWarmup()
