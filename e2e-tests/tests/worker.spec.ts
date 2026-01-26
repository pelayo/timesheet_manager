import { test, expect } from '@playwright/test';

test.describe('Worker Flows', () => {
  test('should manage timesheet', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'worker@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'My Timesheet' })).toBeVisible();

    // 2. Verify Seeded Data
    // "Design Phase" should be visible because it has seeded time
    const designCell = page.getByRole('cell', { name: 'Design Phase' }).first();
    await expect(designCell).toBeVisible();
    
    const researchRow = page.getByRole('row').filter({ hasText: 'Research' }).first();

    // 3. Add "Research" Task only if it's not already in view
    if (!(await researchRow.isVisible())) {
      await page.getByRole('button', { name: 'Add Task Row' }).click();

      // Select Project
      await page.getByLabel('Project').click();
      await expect(page.getByRole('listbox')).toBeVisible();
      await page.getByRole('option', { name: 'Project Beta' }).click();

      // Select Task (Wait for field to appear after loading)
      await expect(page.getByRole('combobox', { name: 'Task' })).toBeVisible();
      await page.getByRole('combobox', { name: 'Task' }).click();
      await expect(page.getByRole('listbox')).toBeVisible();
      await page.getByRole('option', { name: 'Research' }).click();
      await expect(page.getByRole('listbox')).not.toBeVisible();

      await page.getByRole('button', { name: 'Add', exact: true }).click();
    }

    // 4. Verify "Research" is visible
    await expect(researchRow).toBeVisible();

    // 5. Log Time on "Research"
    // Find the row for Research.
    const firstInput = researchRow.locator('input').first();
    await firstInput.fill('45');
    await firstInput.blur(); // Trigger save

    // 6. Refresh and Verify persistence
    await page.reload();
    await expect(researchRow).toBeVisible();
    await expect(firstInput).toHaveValue('0:45');
  });
});
