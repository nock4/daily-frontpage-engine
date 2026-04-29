import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const skipDirs = new Set([
  '.git',
  '.runtime',
  'assets',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
  'tmp',
])
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.py', '.sh', '.ts', '.tsx'])

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit' })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`))
      }
    })
  })
}

async function walk(dir, files = []) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return files
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.gitignore') continue
    if (entry.isDirectory() && skipDirs.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath, files)
      continue
    }

    if (entry.isFile() && textExtensions.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

async function scanText({ label, roots, rules, ignore = [] }) {
  const ignored = new Set(ignore.map((file) => path.resolve(root, file)))
  const matches = []

  for (const scanRoot of roots) {
    const files = await walk(path.resolve(root, scanRoot))
    for (const file of files) {
      if (ignored.has(file)) continue
      const text = await fs.readFile(file, 'utf8')
      for (const rule of rules) {
        if (rule.pattern.test(text)) {
          matches.push({
            file: path.relative(root, file),
            rule: rule.name,
          })
        }
      }
    }
  }

  if (matches.length) {
    const details = matches.map((match) => `  - ${match.file}: ${match.rule}`).join('\n')
    throw new Error(`${label} found ${matches.length} issue(s):\n${details}`)
  }
}

async function runSlopScan() {
  await scanText({
    label: 'Packaged edition content scan',
    roots: ['public/editions'],
    rules: [
      { name: 'logged-out X shell', pattern: /\bdon['\u2019]t miss what['\u2019]s happening\b/i },
      { name: 'X logged-out marketing copy', pattern: /\bpeople on x are the first to know\b/i },
      { name: 'X signup shell', pattern: /\bnew to x\?\s+sign up now/i },
      { name: 'old generated-process about copy', pattern: /\bgenerated process\b/i },
      { name: 'internal manual-repair wording', pattern: /\bmanual visible-anchor repair\b/i },
      { name: 'placeholder lorem ipsum', pattern: /\blorem ipsum\b/i },
    ],
  })

  await scanText({
    label: 'Runtime/source slop scan',
    roots: ['src', 'scripts'],
    ignore: ['scripts/audit-codebase.mjs'],
    rules: [
      { name: 'debugger statement', pattern: /\bdebugger\b/ },
      { name: 'placeholder lorem ipsum', pattern: /\blorem ipsum\b/i },
      { name: 'removed paper preview hidden note', pattern: /\bpaper-preview__hidden-note\b/ },
      { name: 'removed paper preview eyebrow', pattern: /\bpaper-preview__eyebrow\b/ },
      { name: 'removed editorial clipping note copy', pattern: /\bthis pocket admits\b/i },
      { name: 'removed source fragment label', pattern: /\bsource fragment\b/i },
    ],
  })
}

async function main() {
  console.log('audit: strict unused TypeScript')
  await run('npx', ['tsc', '-p', 'tsconfig.app.json', '--noEmit', '--noUnusedLocals', '--noUnusedParameters'])

  console.log('audit: dead code')
  await run('npx', ['--yes', 'knip', '--no-progress'])

  console.log('audit: content and source slop')
  await runSlopScan()

  console.log('audit: ok')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
