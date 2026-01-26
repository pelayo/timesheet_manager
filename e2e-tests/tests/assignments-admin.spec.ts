import { test, expect } from '@playwright/test'
import * as path from 'path'

test.describe('Admin Assignments Overview', () => {
  test('should show cumulative teamwork hours before forecast weeks', async ({ page }) => {
    test.setTimeout(120000)
    const filePath = path.resolve(__dirname, '../../teamwork_report.xlsx')

    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/')
    await expect(page.getByText('Welcome to Admin Dashboard')).toBeVisible()

    await page.click('text=Jobs')
    await expect(page.getByRole('heading', { name: 'System Jobs' })).toBeVisible()

    const fileInput = page.locator('input[type="file"]')
    const [uploadResponse] = await Promise.all([
      page.waitForResponse(
        response =>
          response.url().includes('/jobs/teamwork-excel') &&
          response.request().method() === 'POST',
      ),
      fileInput.setInputFiles(filePath),
    ])

    const uploadData = await uploadResponse.json()
    const jobId = String(uploadData.id)
    const jobIdShort = jobId.slice(0, 8)
    const jobIdLabel = `${jobIdShort}...`

    const jobRow = page
      .getByRole('row')
      .filter({ has: page.getByRole('cell', { name: jobIdLabel }) })
      .filter({ has: page.getByRole('cell', { name: 'teamwork-excel-import' }) })

    await expect(jobRow.getByText('completed')).toBeVisible({ timeout: 60000 })

    await page.click('text=Assignments')
    await expect(page).toHaveURL('/assignments')
    await expect(page.getByRole('heading', { name: 'Assignments Overview' })).toBeVisible()

    await expect(page.getByRole('columnheader', { name: 'Teamwork to date' })).toBeVisible()

    const cumulativeCells = page
      .locator('table tbody tr td:nth-child(2)')
      .filter({ hasText: /-\s*\d+\.\d{2}/ })

    await expect(cumulativeCells.first()).toBeVisible({ timeout: 10000 })
  })
})
