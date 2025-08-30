import { expect, takeSnapshot, test } from '@chromatic-com/playwright'

test.describe('Visual testing', () => {
  test.beforeEach(async ({ page }) => {
    // Mock GraphQL API to ensure pages load properly in test environment
    await page.route('/api/graphql', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()

      // Mock the GetProjects query
      if (postData?.query?.includes('GetProjects')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              projects: [
                {
                  id: 'test-project-1',
                  title: 'Test Project 1',
                  projectName: 'test-project-1',
                  description: 'A test project for e2e testing',
                  overview: 'This is a test project overview',
                  techStack: ['React', 'TypeScript', 'Tailwind'],
                  status: 'COMPLETED',
                  logo: null,
                  liveUrl: 'https://example.com',
                  repositoryUrl: 'https://github.com/example/test',
                  featured: true,
                },
                {
                  id: 'test-project-2',
                  title: 'Test Project 2',
                  projectName: 'test-project-2',
                  description: 'Another test project for e2e testing',
                  overview: 'This is another test project overview',
                  techStack: ['Next.js', 'GraphQL', 'PostgreSQL'],
                  status: 'IN_PROGRESS',
                  logo: null,
                  liveUrl: 'https://example2.com',
                  repositoryUrl: 'https://github.com/example/test2',
                  featured: false,
                },
              ],
            },
            errors: null,
          }),
        })
      } else {
        // For other GraphQL queries, pass through
        await route.continue()
      }
    })
  })

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

    test('should take screenshot of the projects page', async ({
      page,
    }, testInfo) => {
      await page.goto('/projects')

      // Wait for the page to load and check for either projects content or no projects message
      // The page is dynamic and fetches data, so we need to wait for it to settle
      await page.waitForLoadState('networkidle')

      // Check for the main heading first
      await expect(
        page.getByRole('heading', {
          name: 'ALL PROJECTS',
        })
      ).toBeVisible()

      // Wait a bit more to ensure any dynamic content has loaded
      await page.waitForTimeout(1000)

      // Check for either projects content or the "no projects" message
      const hasProjects = await page.locator('.grid').isVisible()
      const hasNoProjectsMessage = await page
        .getByText('NO PROJECTS AVAILABLE')
        .isVisible()

      // Ensure at least one of these conditions is met
      expect(hasProjects || hasNoProjectsMessage).toBeTruthy()

      await takeSnapshot(page, testInfo)
    })
  })
})
