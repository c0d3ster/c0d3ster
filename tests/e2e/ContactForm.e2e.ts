import { expect, test } from '@playwright/test'

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept the contact API to prevent real emails from being sent
    await page.route('/api/contact', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()

      // Simulate API response with validation
      if (postData) {
        // Basic validation (same as the real API)
        if (
          !postData.name ||
          !postData.subject ||
          !postData.message ||
          postData.message.length < 10
        ) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Validation failed',
              details: [
                ...(!postData.name ? [{ message: 'Name is required' }] : []),
                ...(!postData.subject
                  ? [{ message: 'Subject is required' }]
                  : []),
                ...(!postData.message || postData.message.length < 10
                  ? [{ message: 'Message must be at least 10 characters' }]
                  : []),
              ],
            }),
          })
          return
        }

        if (
          !postData.email ||
          !postData.email.includes('@') ||
          !postData.email.includes('.')
        ) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Validation failed',
              details: [{ message: 'Invalid email address' }],
            }),
          })
          return
        }

        // Success response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Message sent successfully!' }),
        })
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No data provided' }),
        })
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
