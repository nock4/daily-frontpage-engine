import { generateEnhancementPlanFiles } from './lib/generate-enhancement-plan-files.mjs'

const result = await generateEnhancementPlanFiles({ repoRoot: process.cwd() })
console.log(JSON.stringify(result, null, 2))
