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
    await expect(page.getByText('Design Phase')).toBeVisible();
    
    // Ensure "Research" is NOT visible (clean up if needed)
    if (await page.getByText('Research').isVisible()) {
        const row = page.getByRole('row').filter({ hasText: 'Research' });
        
        // Clear any logged hours to enable the remove button
        const inputs = await row.locator('input').all();
        for (const input of inputs) {
            await input.fill('');
            await input.blur();
        }
        
        // Wait for button to be enabled (it might take a moment after blur/mutation)
        const removeBtn = row.getByRole('button', { name: 'Remove from view' });
        await expect(removeBtn).toBeEnabled();
        await removeBtn.click();
        
        await expect(page.getByText('Research')).not.toBeVisible();
    } else {
        await expect(page.getByText('Research')).not.toBeVisible();
    }

    // 3. Add "Research" Task
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

    // 4. Verify "Research" is now visible
    await expect(page.getByText('Research')).toBeVisible();

    // 5. Log Time on "Research"
    // Find the row for Research.
    const researchRow = page.getByRole('row').filter({ hasText: 'Research' });
    const firstInput = researchRow.locator('input').first();
    await firstInput.fill('45');
    await firstInput.blur(); // Trigger save

    // 6. Refresh and Verify persistence
    await page.reload();
    await expect(page.getByText('Research')).toBeVisible();
    await expect(firstInput).toHaveValue('45');
  });
});
