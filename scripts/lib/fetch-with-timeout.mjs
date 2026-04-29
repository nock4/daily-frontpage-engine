export async function fetchWithTimeout(url, init = {}, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort(new Error(`Fetch timed out after ${timeoutMs}ms`))
  }, timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}
