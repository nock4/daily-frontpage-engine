import { generateInterpretationFiles } from './lib/generate-interpretation-files.mjs'

const result = await generateInterpretationFiles({ repoRoot: process.cwd() })
console.log(JSON.stringify(result, null, 2))
