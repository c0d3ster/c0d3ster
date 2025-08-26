import { expect, test } from '@playwright/test'

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept the GraphQL API to prevent real emails from being sent
    await page.route('/api/graphql', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()

      // Check if this is a contact form submission
      if (postData?.query?.includes('SubmitContactForm')) {
        const variables = postData.variables?.input

        // Success response for valid submissions
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              submitContactForm: {
                id: `contact_${Date.now()}`,
                name: variables.name,
                email: variables.email,
                subject: variables.subject,
                message: variables.message,
                submittedAt: new Date().toISOString(),
              },
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

  test('should display contact form on landing page', async ({ page }) => {
    await page.goto('/')

    // Check if the form elements are visible
    await expect(page.getByLabel('NAME')).toBeVisible()
    await expect(page.getByLabel('EMAIL')).toBeVisible()
    await expect(page.getByLabel('SUBJECT')).toBeVisible()
    await expect(page.getByLabel('MESSAGE')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'INITIATE TRANSMISSION' })
    ).toBeVisible()
  })

  test('should show validation errors for empty form submission', async ({
    page,
  }) => {
    await page.goto('/')

    // Try to submit empty form
    await page.getByRole('button', { name: 'INITIATE TRANSMISSION' }).click()

    // Check for validation errors in toast (these appear at the top-right)
    // The form validation shows errors via toast notifications
    await expect(page.getByText('Name is required')).toBeVisible()
    await expect(page.getByText('Subject is required')).toBeVisible()
    await expect(
      page.getByText('Message must be at least 10 characters')
    ).toBeVisible()
  })

  test('should successfully submit form with valid data', async ({ page }) => {
    await page.goto('/')

    // Fill out the form
    await page.getByLabel('NAME').fill('John Doe')
    await page.getByLabel('EMAIL').fill('john@example.com')
    await page.getByLabel('SUBJECT').fill('Website Project')
    await page
      .getByLabel('MESSAGE')
      .fill(
        'This is a test message for a website project that needs to be at least 10 characters long.'
      )

    // Submit the form
    await page.getByRole('button', { name: 'INITIATE TRANSMISSION' }).click()

    // Check for success message in toast
    await expect(
      page.getByText(
        "Message sent successfully! I'll get back to you within 24 hours."
      )
    ).toBeVisible()
  })

  test('should handle invalid email format', async ({ page }) => {
    await page.goto('/')

    // Fill form with invalid email
    await page.getByLabel('NAME').fill('John Doe')
    await page.getByLabel('EMAIL').fill('invalid-email')
    await page.getByLabel('SUBJECT').fill('Test Project')
    await page
      .getByLabel('MESSAGE')
      .fill(
        'This is a test message that is long enough to meet the minimum requirement.'
      )

    await page.getByRole('button', { name: 'INITIATE TRANSMISSION' }).click()

    // Check for email validation error in toast
    await expect(page.getByText('Invalid email address')).toBeVisible()
  })

  test('should handle message too short', async ({ page }) => {
    await page.goto('/')

    // Fill form with message that's too short
    await page.getByLabel('NAME').fill('John Doe')
    await page.getByLabel('EMAIL').fill('john@example.com')
    await page.getByLabel('SUBJECT').fill('Test Project')
    await page.getByLabel('MESSAGE').fill('Short')

    await page.getByRole('button', { name: 'INITIATE TRANSMISSION' }).click()

    // Check for message length validation error in toast
    await expect(
      page.getByText('Message must be at least 10 characters')
    ).toBeVisible()
  })
})
