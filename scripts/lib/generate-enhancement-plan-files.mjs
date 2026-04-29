import fs from 'node:fs/promises'
import path from 'node:path'

import { generateEnhancementPlan } from '../../src/lib/generateEnhancementPlan.ts'

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export async function generateEnhancementPlanFiles({ repoRoot = process.cwd() } = {}) {
  const editionsRoot = path.join(repoRoot, 'public', 'editions')
  const manifestPath = path.join(editionsRoot, 'index.json')
  const manifest = await readJson(manifestPath)

  let generated = 0
  let skipped = 0

  for (const item of manifest.editions) {
    const editionBase = path.join(repoRoot, 'public', item.path.replace(/^\//, ''))
    const interpretationPath = path.join(editionBase, 'interpretation.json')

    let interpretation
    try {
      interpretation = await readJson(interpretationPath)
    } catch {
      skipped += 1
      continue
    }

    const [brief, artifactMap, sourceBindings] = await Promise.all([
      readJson(path.join(editionBase, 'brief.json')),
      readJson(path.join(editionBase, 'artifact-map.json')),
      readJson(path.join(editionBase, 'source-bindings.json')),
    ])

    const enhancementPlan = generateEnhancementPlan({
      editionId: item.edition_id,
      interpretation,
      brief,
      artifactMap,
      sourceBindings,
      analysisId: interpretation.analysis_id,
    })

    await writeJson(path.join(editionBase, 'enhancement-plan.json'), enhancementPlan)
    generated += 1
  }

  return { generated, skipped, total: manifest.editions.length }
}
