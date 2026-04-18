import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

async function gotoEdition(page, route: string) {
  await page.goto(route, { waitUntil: 'networkidle' })
  await page.waitForSelector('button.artifact', { timeout: 15_000 })
}

async function clickArtifactByIndex(page, index: number) {
  await page.locator('button.artifact').nth(index).click({ force: true })
  await page.waitForTimeout(500)
}

test.describe('live-stage accessibility checks', () => {
  test('night observatory untouched live route has no serious axe violations', async ({ page }) => {
    await gotoEdition(page, '/archive/night-observatory-v1')

    const results = await new AxeBuilder({ page }).analyze()
    const seriousOrWorse = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))
    expect(seriousOrWorse).toEqual([])
  })

  test('night observatory article/source window state has no serious axe violations', async ({ page }) => {
    await gotoEdition(page, '/archive/night-observatory-v1')
    await clickArtifactByIndex(page, 2)

    const results = await new AxeBuilder({ page }).exclude('iframe').analyze()
    const seriousOrWorse = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))
    expect(seriousOrWorse).toEqual([])
  })

  test('night observatory two-window stack keeps close controls and focusable overlays accessible', async ({ page }) => {
    await gotoEdition(page, '/archive/night-observatory-v1')
    await clickArtifactByIndex(page, 0)
    await clickArtifactByIndex(page, 2)

    await expect(page.getByLabel('Close source window')).toHaveCount(2)

    const results = await new AxeBuilder({ page }).exclude('iframe').analyze()
    const seriousOrWorse = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))
    expect(seriousOrWorse).toEqual([])
  })
})
