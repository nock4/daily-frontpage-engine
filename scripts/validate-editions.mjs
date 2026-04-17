import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const editionsRoot = path.join(root, 'public', 'editions')
const manifest = JSON.parse(fs.readFileSync(path.join(editionsRoot, 'index.json'), 'utf8'))
const errors = []

for (const item of manifest.editions) {
  const base = path.join(root, 'public', item.path.replace(/^\//, ''))
  for (const file of ['edition.json', 'brief.json', 'artifact-map.json', 'source-bindings.json', 'ambiance.json', 'review.json']) {
    const full = path.join(base, file)
    if (!fs.existsSync(full)) errors.push(`Missing ${file} for ${item.edition_id}`)
  }

  const edition = JSON.parse(fs.readFileSync(path.join(base, 'edition.json'), 'utf8'))
  const artifactMap = JSON.parse(fs.readFileSync(path.join(base, 'artifact-map.json'), 'utf8'))
  const bindings = JSON.parse(fs.readFileSync(path.join(base, 'source-bindings.json'), 'utf8'))

  if (!fs.existsSync(path.join(root, 'public', edition.plate_asset_path.replace(/^\//, '')))) {
    errors.push(`Missing plate asset for ${item.edition_id}: ${edition.plate_asset_path}`)
  }

  const artifactIds = new Set(artifactMap.artifacts.map((artifact) => artifact.id))
  for (const binding of bindings.bindings) {
    if (!artifactIds.has(binding.artifact_id)) {
      errors.push(`Binding ${binding.id} references missing artifact ${binding.artifact_id}`)
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(JSON.stringify({ editions: manifest.editions.length, status: 'ok' }, null, 2))
