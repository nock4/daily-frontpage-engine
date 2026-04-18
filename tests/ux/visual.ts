import { argosScreenshot } from '@argos-ci/playwright'
import { expect, type Locator, type Page } from '@playwright/test'

export async function expectStableVisual(page: Page, name: string, options?: { mask?: Locator[] }) {
  if (process.env.CI) {
    await argosScreenshot(page, name, {
      mask: options?.mask,
      disableHover: true,
      ariaSnapshot: true,
    })
    return
  }

  await expect(page).toHaveScreenshot(`${name}.png`, options)
}
