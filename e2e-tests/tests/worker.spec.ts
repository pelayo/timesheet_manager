import { test, expect } from '@playwright/test';

test.describe('Worker Flows', () => {
  test('should manage timesheet', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'worker@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'My Timesheet' })).toBeVisible({ timeout: 15000 });

    // 2. Add a task row from the first available project/task
    await page.getByRole('button', { name: 'Add Task Row' }).click();

    await page.getByLabel('Project').click();
    await expect(page.getByRole('listbox')).toBeVisible();
    const projectOption = page.getByRole('option').first();
    await expect(projectOption).toBeVisible({ timeout: 15000 });
    const projectName = (await projectOption.textContent())?.trim() ?? '';
    if (!projectName) throw new Error('No projects available for worker');
    await projectOption.click();

    await expect(page.getByRole('combobox', { name: 'Task' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Task' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    const taskOption = page.getByRole('option').first();
    await expect(taskOption).toBeVisible({ timeout: 15000 });
    const taskName = (await taskOption.textContent())?.trim() ?? '';
    if (!taskName) throw new Error('No tasks available for worker');
    await taskOption.click();
    await expect(page.getByRole('listbox')).not.toBeVisible();

    await page.getByRole('button', { name: 'Add', exact: true }).click();

    const taskRow = page.getByRole('row').filter({ hasText: projectName }).filter({ hasText: taskName });
    await expect(taskRow).toBeVisible();

    // 3. Log Time on the selected task
    const firstInput = taskRow.locator('input').first();
    await firstInput.fill('45');
    await firstInput.blur(); // Trigger save

    // 4. Refresh and Verify persistence
    await page.reload();
    const reloadedRow = page.getByRole('row').filter({ hasText: projectName }).filter({ hasText: taskName });
    await expect(reloadedRow).toBeVisible();
    await expect(reloadedRow.locator('input').first()).toHaveValue('0:45');
  });
});
