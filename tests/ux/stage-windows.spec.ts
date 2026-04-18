import { expect, test, type Locator, type Page } from '@playwright/test'

import { expectStableVisual } from './visual'

const stageWindows = (page: Page) => page.locator('.stage-overlay-windows--live .source-window')
const iframeMask = (page: Page): Locator[] => [page.locator('iframe')]

async function gotoEdition(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'networkidle' })
  await page.waitForSelector('button.artifact', { timeout: 15_000 })
}

async function clickArtifactByIndex(page: Page, index: number) {
  await page.locator('button.artifact').nth(index).click({ force: true })
  await page.waitForTimeout(500)
}

test.describe('live-stage window UX baselines', () => {
  test('night observatory untouched live state', async ({ page }) => {
    await gotoEdition(page, '/archive/night-observatory-v1')

    await expect(stageWindows(page)).toHaveCount(0)
    await expectStableVisual(page, 'night-observatory-live-rest')
  })

  test('night observatory one hero window open', async ({ page }) => {
    await gotoEdition(page, '/archive/night-observatory-v1')
    await clickArtifactByIndex(page, 0)

    await expect(stageWindows(page)).toHaveCount(1)
    await expectStableVisual(page, 'night-observatory-one-window', { mask: iframeMask(page) })
  })

  test('night observatory two-window stack', async ({ page }) => {
    await gotoEdition(page, '/archive/night-observatory-v1')
    await clickArtifactByIndex(page, 0)
    await clickArtifactByIndex(page, 2)

    await expect(stageWindows(page)).toHaveCount(2)
    await expectStableVisual(page, 'night-observatory-two-windows', { mask: iframeMask(page) })
  })

  test('night observatory frontmost focus swap', async ({ page }) => {
    await gotoEdition(page, '/archive/night-observatory-v1')
    await clickArtifactByIndex(page, 0)
    await clickArtifactByIndex(page, 2)
    await stageWindows(page).nth(0).click({ force: true })
    await page.waitForTimeout(300)

    await expect(stageWindows(page)).toHaveCount(2)
    await expectStableVisual(page, 'night-observatory-focus-swap', { mask: iframeMask(page) })
  })

  test('forest listening table two youtube windows stacked', async ({ page }) => {
    await gotoEdition(page, '/archive/forest-listening-table-v1')
    await clickArtifactByIndex(page, 0)
    await clickArtifactByIndex(page, 2)

    await expect(stageWindows(page)).toHaveCount(2)
    await expect(page.locator('iframe')).toHaveCount(2)
    await expectStableVisual(page, 'forest-listening-table-two-youtube-windows', { mask: iframeMask(page) })
  })

  test('night observatory close returns to one-window state cleanly', async ({ page }) => {
    await gotoEdition(page, '/archive/night-observatory-v1')
    await clickArtifactByIndex(page, 0)
    await clickArtifactByIndex(page, 2)
    await page.locator('.stage-overlay-windows--live .source-window .source-window__close').last().click({ force: true })
    await page.waitForTimeout(400)

    await expect(stageWindows(page)).toHaveCount(1)
    await expectStableVisual(page, 'night-observatory-close-back-to-one-window', { mask: iframeMask(page) })
  })
})
