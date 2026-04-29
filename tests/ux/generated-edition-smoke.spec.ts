import { expect, test } from '@playwright/test'

test('generated edition route renders artwork and opens a source window', async ({ page }) => {
  const route = process.env.DFE_SMOKE_ROUTE || '/'

  await page.goto(route, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('img.plate', { timeout: 20_000 })
  await page.waitForSelector('button.artifact', { timeout: 20_000 })

  const plateState = await page.locator('img.plate').evaluate((node) => {
    const image = node as HTMLImageElement
    return {
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    }
  })

  expect(plateState.complete).toBe(true)
  expect(plateState.naturalWidth).toBeGreaterThan(0)
  expect(plateState.naturalHeight).toBeGreaterThan(0)

  const artifactCount = await page.locator('button.artifact').count()
  expect(artifactCount).toBeGreaterThanOrEqual(6)

  await page.locator('button.artifact').first().hover({ force: true })
  await expect(page.locator('.stage-overlay-windows--live .source-window')).toHaveCount(1)
})
