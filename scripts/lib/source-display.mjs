export function domain(sourceUrl) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function stripSourceTitleChrome(value) {
  return String(value || '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[^A-Za-z0-9@#"'(]+/, '')
    .replace(/[|:,\-–—\s]+$/g, '')
    .replace(/\s*\/\s*X$/i, '')
    .trim()
}

function isFilenameLikeTitle(value) {
  const title = stripSourceTitleChrome(value)
  return /^[A-Za-z0-9_-]+\.(?:png|jpe?g|webp|avif)(?:\s+\(\d+\s*[x×]\s*\d+\))?$/i.test(title)
    || /^[A-Za-z0-9_-]{10,}\.(?:png|jpe?g|webp|avif)$/i.test(title)
}

function trimDisplayTitle(value, limit = 96) {
  const title = stripSourceTitleChrome(value)
  if (title.length <= limit) return title
  const wordIndex = title.lastIndexOf(' ', limit)
  return `${title.slice(0, wordIndex > 48 ? wordIndex : limit).trim()}...`
}

function cleanDisplayTitle(value) {
  const title = stripSourceTitleChrome(value)
  if (!title) return ''

  const xPost = title.match(/^[^:]+ on X:\s*"([^"]+)"/i)
  if (xPost?.[1]) return trimDisplayTitle(xPost[1])
  const xOpenQuote = title.match(/^[^:]+ on X:\s*"(.+)$/i)
  if (xOpenQuote?.[1]) return trimDisplayTitle(xOpenQuote[1].replace(/"+$/g, ''))
  if (isFilenameLikeTitle(title)) return ''
  if (/^(home|homepage|untitled|image|photo|site icon)$/i.test(title)) return ''
  return trimDisplayTitle(title)
}

export function getSourceDisplayTitle(source, fallback) {
  const directTitle = cleanDisplayTitle(source?.title)
  if (directTitle) return directTitle

  const noteTitle = cleanDisplayTitle(source?.note_title)
  if (noteTitle) return noteTitle

  const fallbackTitle = cleanDisplayTitle(fallback)
  if (fallbackTitle) return fallbackTitle

  return domain(source?.final_url || source?.url || source?.source_url || '') || 'Source material'
}
