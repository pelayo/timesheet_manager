import { test, expect } from '@playwright/test';

test.describe('Admin Stats', () => {
  test('should visualize stats', async ({ browser }) => {
    // 1. Setup Data (Admin Context)
    const adminContext = await browser.newContext({ baseURL: 'http://localhost:8080' });
    const adminPage = await adminContext.newPage();
    
    await adminPage.goto('/login');
    await adminPage.fill('input[name="email"]', 'admin@example.com');
    await adminPage.fill('input[name="password"]', 'password');
    await adminPage.click('button[type="submit"]');
    await expect(adminPage).toHaveURL('/');

    const p1Name = `Stat Proj A ${Date.now()}`;
    const p2Name = `Stat Proj B ${Date.now()}`;
    
    // Create Projects & Tasks & Assign
    for (const pName of [p1Name, p2Name]) {
        await adminPage.click('text=Projects');
        await adminPage.click('text=Add Project');
        await adminPage.fill('input[name="name"]', pName);
        await adminPage.click('button:has-text("Save")');
        await adminPage.getByRole('row', { name: pName }).getByText('Manage').click();
        await adminPage.click('text=Add Task');
        await adminPage.fill('input[name="name"]', 'Task 1');
        await adminPage.click('button:has-text("Save")');
        await adminPage.click('text=Members');
        await adminPage.click('text=Add Member');
        await adminPage.getByLabel('User').click();
        await adminPage.getByRole('option', { name: 'worker@example.com' }).click();
        await adminPage.getByRole('button', { name: 'Add', exact: true }).click();
    }
    await adminPage.close();

    // 2. Log Time (Worker Context)
    const workerContext = await browser.newContext({ baseURL: 'http://localhost:8081' });
    const workerPage = await workerContext.newPage();
    await workerPage.goto('/login');
    await workerPage.fill('input[name="email"]', 'worker@example.com');
    await workerPage.fill('input[name="password"]', 'password');
    await workerPage.click('button[type="submit"]');

    // Add & Log P1
    await workerPage.click('button:has-text("Add Task Row")');
    await workerPage.getByLabel('Project').click();
    await workerPage.getByRole('option', { name: p1Name }).click();
    await workerPage.getByRole('combobox', { name: 'Task' }).click();
    await workerPage.getByRole('option', { name: 'Task 1' }).click();
    await workerPage.getByRole('button', { name: 'Add', exact: true }).click();
    const row1 = workerPage.getByRole('row').filter({ hasText: p1Name });
    const savePromise1 = workerPage.waitForResponse(r => r.url().includes('/cell') && r.status() === 200);
    await row1.locator('input').first().fill('60');
    await row1.locator('input').first().blur();
    await savePromise1;
    
    // Add & Log P2
    await workerPage.click('button:has-text("Add Task Row")');
    await workerPage.getByLabel('Project').click();
    await workerPage.getByRole('option', { name: p2Name }).click();
    await workerPage.getByRole('combobox', { name: 'Task' }).click();
    await workerPage.getByRole('option', { name: 'Task 1' }).click();
    await workerPage.getByRole('button', { name: 'Add', exact: true }).click();
    const row2 = workerPage.getByRole('row').filter({ hasText: p2Name });
    const savePromise2 = workerPage.waitForResponse(r => r.url().includes('/cell') && r.status() === 200);
    await row2.locator('input').first().fill('30');
    await row2.locator('input').first().blur();
    await savePromise2;

    await workerPage.close();

    // 3. Verify Stats Page
    const verifyPage = await adminContext.newPage();
    await verifyPage.goto('/'); 
    if (await verifyPage.url().includes('login')) {
        await verifyPage.fill('input[name="email"]', 'admin@example.com');
        await verifyPage.fill('input[name="password"]', 'password');
        await verifyPage.click('button[type="submit"]');
    }

    await verifyPage.click('text=Stats');
    await expect(verifyPage).toHaveURL('/stats');

    // Check Data Loaded (Not empty)
    await expect(verifyPage.getByText('No data available')).not.toBeVisible();
    
    // Check Graph rendered (recharts-surface)
    await expect(verifyPage.locator('.recharts-surface').first()).toBeVisible();

    // Change Group By -> Project
    await verifyPage.getByTestId('split-series-select').click();
    await verifyPage.getByRole('option', { name: 'Project' }).click();
    
    // Verify Legend contains projects
    await expect(verifyPage.getByText(p1Name)).toBeVisible();
    await expect(verifyPage.getByText(p2Name)).toBeVisible();

    // Export Button Enabled
    await expect(verifyPage.getByText('Export CSV')).toBeEnabled();
  });
});