import { test, expect } from '@playwright/test'

test.describe('Admin Standard Hours', () => {
  test('should set and persist standard hours for a user', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/')
    await page.click('text=Users')

    await page.click('text=Add User')
    const userEmail = `standard-hours-${Date.now()}@example.com`
    await page.getByLabel('Email').fill(userEmail)
    await page.getByLabel('Password').fill('password')
    const createResponse = page.waitForResponse(
      response => response.url().includes('/admin/users') && response.request().method() === 'POST'
    )
    await page.click('button:has-text("Create")')
    const created = await createResponse
    expect(created.ok()).toBeTruthy()

    await page.getByRole('textbox', { name: 'Search Users' }).fill(userEmail)
    const userLink = page.getByRole('link', { name: userEmail })
    await expect(userLink).toBeVisible()
    await userLink.click()
    await page.waitForURL(/\/users\//)
    const userId = new URL(page.url()).pathname.split('/').pop() ?? ''
    expect(userId).not.toBe('')

    await expect(page.getByRole('heading', { name: userEmail })).toBeVisible()

    const standardHoursInput = page.getByLabel('Standard hours / week')
    await expect(standardHoursInput).toBeVisible()
    await standardHoursInput.fill('32.5')

    const saveResponse = page.waitForResponse(
      response => response.url().includes('/standard-hours') && response.request().method() === 'PUT'
    )
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(standardHoursInput).toHaveValue('32.5')

    const saveResult = await saveResponse
    const saveStatus = saveResult.status()
    if (saveStatus !== 200) {
      const body = await saveResult.text()
      throw new Error(`Expected 200 from standard-hours update, got ${saveStatus}: ${body}`)
    }

    const token = await page.evaluate(() => localStorage.getItem('token'))
    const apiResponse = await page.request.get(`http://localhost:3000/admin/users/${userId}/standard-hours`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    expect(apiResponse.ok()).toBeTruthy()
    const apiData = await apiResponse.json()
    expect(apiData).toEqual({ userId, hours: 32.5 })
  })
})
