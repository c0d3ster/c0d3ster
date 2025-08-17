import { expect, takeSnapshot, test } from '@chromatic-com/playwright'

test.describe('Visual testing', () => {
  test.describe('Static pages', () => {
    test('should take screenshot of the homepage', async ({
      page,
    }, testInfo) => {
      await page.goto('/')

      // Check for actual content from your landing page
      await expect(
        page.getByRole('heading', {
          name: 'CONTACT',
        })
      ).toBeVisible()

      await takeSnapshot(page, testInfo)
    })

    test('should take screenshot of the about page', async ({
      page,
    }, testInfo) => {
      await page.goto('/about')

      // Check for actual content from your about page using translation
      await expect(
        page.getByText(
          'Welcome to our About page! We are a team of passionate individuals dedicated to creating amazing software.'
        )
      ).toBeVisible()

      await takeSnapshot(page, testInfo)
    })

    test('should take screenshot of the projects page', async ({
      page,
    }, testInfo) => {
      await page.goto('/projects')

      // Check for actual content from your projects page
      await expect(
        page.getByRole('heading', {
          name: 'ALL PROJECTS',
        })
      ).toBeVisible()

      await takeSnapshot(page, testInfo)
    })

    test('should take screenshot of the French homepage', async ({
      page,
    }, testInfo) => {
      await page.goto('/fr')

      // Check for actual content from your French landing page
      await expect(
        page.getByRole('heading', {
          name: 'CONTACT',
        })
      ).toBeVisible()

      await takeSnapshot(page, testInfo)
    })
  })
})
