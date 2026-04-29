import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import {
  extractUrls,
  isAllowedSourceUrl,
  isPreferredNtsStreamingSourceUrl,
  isYouTubeThumbnailUrl,
  isYouTubeVideoUrl,
  ntsStreamingSourceRank,
} from './source-url-policy.mjs'
import { uniqueNonEmpty } from './string-utils.mjs'

const allowedSignalDirectories = [
  'Inbox/tweets',
  'Inbox/youtube',
]

const allowedSignalFiles = [
  'Inbox/nts-liked-tracks-source-map.md',
  'Inbox/nts-liked-tracks-source-map-batch-1.md',
  'Inbox/nts-liked-tracks-source-map-batch-2.md',
  'Inbox/nts-liked-tracks-source-map-batch-3.md',
  'Resources/Chrome Bookmarks.md',
  'Resources/Collections/Chrome Bookmarks.md',
  'Resources/Collections/YouTube Likes.md',
]

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join('/')
}

export function signalChannelForPath(relativePath) {
  const normalized = normalizeRelativePath(relativePath)
  const lower = normalized.toLowerCase()
  if (lower.startsWith('inbox/tweets/')) return 'twitter-bookmark'
  if (lower.startsWith('inbox/youtube/')) return 'youtube-like'
  if (lower.startsWith('inbox/nts-liked-tracks-source-map')) return 'nts-like'
  if (lower === 'resources/chrome bookmarks.md' || lower === 'resources/collections/chrome bookmarks.md') return 'chrome-bookmark'
  if (lower === 'resources/collections/youtube likes.md') return 'youtube-like'
  return null
}

async function listAllowedSignalMarkdownFiles(vault) {
  const files = []
  for (const relativeDir of allowedSignalDirectories) {
    const full = path.join(vault, relativeDir)
    if (await pathExists(full)) files.push(...await listMarkdownFiles(full))
  }
  for (const relativeFile of allowedSignalFiles) {
    const full = path.join(vault, relativeFile)
    if ((await pathExists(full)) && full.endsWith('.md')) files.push(full)
  }
  return [...new Set(files)]
}

function parseMarkdownTableCells(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return []
  return trimmed.slice(1, -1).split('|').map((cell) => cell.trim())
}

export function extractNtsStreamingSourceUrls(text) {
  const rows = []
  for (const line of text.split('\n')) {
    const cells = parseMarkdownTableCells(line)
    if (cells.length < 6 || !/^\d+$/.test(cells[0])) continue

    const bestSource = cells[3].toLowerCase()
    const confidence = cells[4].toLowerCase()
    const url = extractUrls(cells[5])[0]
    if (!url) continue
    if (bestSource.includes('unverified') || bestSource.includes('search') || confidence === 'low') continue
    if (!isPreferredNtsStreamingSourceUrl(url)) continue
    rows.push({ url, bestSource, confidence })
  }

  return uniqueNonEmpty(rows
    .sort((left, right) => ntsStreamingSourceRank(left.url) - ntsStreamingSourceRank(right.url))
    .map((row) => row.url))
}

export function normalizeNoteUrls(urls, sourceChannel) {
  const filtered = uniqueNonEmpty(urls).filter(isAllowedSourceUrl)
  if (sourceChannel !== 'youtube-like') return filtered

  const videoUrls = filtered.filter(isYouTubeVideoUrl)
  const supportingUrls = filtered.filter((url) => !isYouTubeThumbnailUrl(url) && !videoUrls.includes(url))
  return uniqueNonEmpty([...videoUrls, ...supportingUrls])
}

function extractTitle(text, fallback) {
  const frontmatterTitle = text.match(/^---[\s\S]*?\ntitle:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/m)?.[1]
  if (frontmatterTitle) return frontmatterTitle.trim()
  const heading = text.match(/^#\s+(.+)$/m)?.[1]
  if (heading) return heading.trim()
  return fallback.replace(/[-_]/g, ' ').replace(/\.md$/, '').trim()
}

function extractDateFromPath(filePath) {
  const match = filePath.match(/20\d{2}-\d{2}-\d{2}/)
  return match?.[0] || null
}

function daysBetween(leftDate, rightDate) {
  const left = new Date(`${leftDate}T00:00:00Z`).getTime()
  const right = new Date(`${rightDate}T00:00:00Z`).getTime()
  return Math.round((left - right) / 86_400_000)
}

function compactText(text, limit = 1600) {
  return text
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit)
}

const diversityStopTerms = new Set([
  'ambient',
  'edition',
  'frontpage',
  'generated',
  'image',
  'source',
  'window',
])

function normalizeDiversityTerms(values) {
  return uniqueNonEmpty(values)
    .map((value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim())
    .filter((value) => value.length >= 4 && !diversityStopTerms.has(value))
    .slice(0, 32)
}

function noteDiversityPenalty(note, diversityAvoidTerms = []) {
  const terms = normalizeDiversityTerms(diversityAvoidTerms)
  if (!terms.length) return 0
  const haystack = `${note.title || ''} ${note.excerpt || ''} ${note.text || ''}`.toLowerCase()
  const matches = terms.filter((term) => haystack.includes(term)).length
  return Math.min(36, matches * 12)
}

function withDiversityScore(note, diversityAvoidTerms = []) {
  const diversity_penalty = noteDiversityPenalty(note, diversityAvoidTerms)
  return {
    ...note,
    diversity_penalty,
    selection_score: note.score - diversity_penalty,
  }
}

function wordFrequencies(notes) {
  const stop = new Set([
    'about', 'after', 'again', 'also', 'because', 'before', 'being', 'between', 'could', 'daily',
    'edition', 'front', 'from', 'have', 'into', 'just', 'like', 'more', 'note', 'notes', 'page',
    'project', 'really', 'should', 'source', 'that', 'their', 'there', 'this', 'through', 'today',
    'with', 'would', 'your',
  ])
  const counts = new Map()
  for (const note of notes) {
    for (const token of note.text.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) || []) {
      if (stop.has(token)) continue
      counts.set(token, (counts.get(token) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 48)
    .map(([term, count]) => ({ term, count }))
}

export function selectRecentSignalNotes(notes, maxNotes, { diversityAvoidTerms = [] } = {}) {
  const scored = notes.map((note) => withDiversityScore(note, diversityAvoidTerms))
  const sorted = scored.sort((a, b) => b.selection_score - a.selection_score)
  const channelOrder = ['youtube-like', 'nts-like', 'chrome-bookmark', 'twitter-bookmark']
  const minimumPerAvailableChannel = Math.min(4, Math.max(2, Math.floor(maxNotes / 8)))
  const softCaps = {
    'twitter-bookmark': Math.max(8, Math.ceil(maxNotes * 0.45)),
    'youtube-like': Math.max(5, Math.ceil(maxNotes * 0.28)),
    'nts-like': Math.max(5, Math.ceil(maxNotes * 0.24)),
    'chrome-bookmark': Math.max(5, Math.ceil(maxNotes * 0.24)),
  }
  const selected = []
  const selectedIds = new Set()
  const channelCounts = new Map()
  const add = (note) => {
    if (!note || selectedIds.has(note.id) || selected.length >= maxNotes) return false
    selectedIds.add(note.id)
    channelCounts.set(note.source_channel, (channelCounts.get(note.source_channel) || 0) + 1)
    selected.push(note)
    return true
  }

  for (const channel of channelOrder) {
    const candidates = sorted.filter((note) => note.source_channel === channel)
    for (const note of candidates.slice(0, minimumPerAvailableChannel)) add(note)
  }

  for (const note of sorted) {
    if (selected.length >= maxNotes) break
    const cap = softCaps[note.source_channel] ?? maxNotes
    if ((channelCounts.get(note.source_channel) || 0) >= cap) continue
    add(note)
  }

  for (const note of sorted) {
    if (selected.length >= maxNotes) break
    add(note)
  }

  return selected
}

async function listMarkdownFiles(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.') || ['node_modules', 'dist', 'tmp'].includes(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await listMarkdownFiles(full, files)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full)
    }
  }
  return files
}

export async function mineSignals({ vault, date, windowDays, maxNotes, diversityAvoidTerms = [] }, runDir) {
  if (!(await pathExists(vault))) throw new Error(`Vault path does not exist: ${vault}`)

  const files = await listAllowedSignalMarkdownFiles(vault)
  const notes = []
  for (const filePath of files) {
    const stat = await fs.stat(filePath)
    const relativePath = path.relative(vault, filePath)
    const source_channel = signalChannelForPath(relativePath)
    if (!source_channel) continue
    const pathDate = extractDateFromPath(relativePath)
    const mtimeDate = stat.mtime.toISOString().slice(0, 10)
    const noteDate = pathDate || mtimeDate
    const ageDays = daysBetween(date, noteDate)
    if (ageDays < 0 || ageDays > windowDays) continue

    const text = await fs.readFile(filePath, 'utf8')
    const urls = source_channel === 'nts-like'
      ? extractNtsStreamingSourceUrls(text)
      : normalizeNoteUrls(extractUrls(text), source_channel)
    if (!urls.length) continue
    const title = extractTitle(text, path.basename(filePath))
    const channelBoost = source_channel === 'twitter-bookmark' ? 8 : source_channel === 'youtube-like' ? 10 : source_channel === 'nts-like' ? 10 : 7
    const score = (windowDays - ageDays) * 2 + Math.min(urls.length, 8) * 2 + channelBoost

    notes.push({
      id: crypto.createHash('sha1').update(relativePath).digest('hex').slice(0, 12),
      path: relativePath,
      source_channel,
      date: noteDate,
      title,
      urls,
      score,
      excerpt: compactText(text),
      text,
    })
  }

  const normalizedDiversityAvoidTerms = normalizeDiversityTerms(diversityAvoidTerms)
  const selectedNotes = selectRecentSignalNotes(notes, maxNotes, { diversityAvoidTerms: normalizedDiversityAvoidTerms })
  const urlRecords = []
  const seenUrls = new Set()
  for (const note of selectedNotes) {
    for (const url of note.urls) {
      if (seenUrls.has(url)) continue
      seenUrls.add(url)
      urlRecords.push({
        url,
        note_id: note.id,
        note_title: note.title,
        note_path: note.path,
        source_channel: note.source_channel,
        note_date: note.date,
        note_score: note.selection_score ?? note.score,
        note_raw_score: note.score,
        note_diversity_penalty: note.diversity_penalty || 0,
      })
    }
  }

  const harvest = {
    generated_at: new Date().toISOString(),
    vault,
    date,
    window_days: windowDays,
    selection_policy: {
      selected_count: maxNotes,
      filters: [
        'Markdown files only.',
        'Only enumerate explicit saved-content signal paths: Inbox/tweets, Inbox/youtube, Inbox NTS liked-track source maps, Resources Chrome Bookmarks, and Resources/Collections YouTube Likes.',
        'Use an explicit YYYY-MM-DD date in the relative path when present, otherwise file mtime.',
        `Keep notes whose date is from ${date} back through ${windowDays} days.`,
        'Read note contents only after the path is in the saved-content allowlist and the file date passes the recent-window filter.',
        'Reject local/private endpoints and text/data/document URLs such as .txt, .md, .json, .xml, and llm.txt before source research.',
        'For NTS liked-track maps, use only direct streamable source URLs; skip NTS pages, YouTube/SoundCloud search locators, unverified rows, low-confidence rows, and empty rows.',
      ],
      scoring: [
        'Recency: (window_days - age_days) * 2.',
        'Linked-source richness: min(url_count, 8) * 2.',
        'Saved-content channel boost: Twitter bookmarks +8, YouTube likes +10, NTS likes +10, Chrome bookmarks +7.',
        'Selection is channel-balanced: available YouTube, NTS, Chrome, and Twitter groups each get an initial share before score-only filling; Twitter has a soft cap so it cannot crowd out every other channel.',
        'NTS streaming candidates are ordered and scored with direct YouTube watch/music URLs first, then Bandcamp, then SoundCloud.',
        normalizedDiversityAvoidTerms.length
          ? `Variety pressure subtracts points from notes that repeat recent edition language: ${normalizedDiversityAvoidTerms.join(', ')}.`
          : 'Variety pressure is available but no recent edition terms were supplied for this run.',
      ],
      diversity_avoid_terms: normalizedDiversityAvoidTerms,
      looked_for: [
        'recent saved Twitter/X bookmarks with source media',
        'recent YouTube liked videos',
        'recent NTS liked tracks and resolved track sources',
        'recent Chrome bookmarks',
        'source media likely to support a title-plus-image card or a native YouTube embed',
      ],
    },
    markdown_files_seen: files.length,
    notes_scanned: notes.length,
    notes_selected: selectedNotes.map(({ text, ...note }) => note),
    motif_terms: wordFrequencies(selectedNotes),
    source_candidates: urlRecords,
  }

  await writeJson(path.join(runDir, 'signal-harvest.json'), harvest)
  return harvest
}
