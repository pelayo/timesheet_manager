import { test, expect } from '@playwright/test';

test.describe('Admin Time Entries Fix', () => {
  test('should view and filter time entries with hh:mm format', async ({ browser }) => {
    // 1. Setup Data (Admin Context)
    const adminContext = await browser.newContext({ baseURL: 'http://localhost:8080' });
    const adminPage = await adminContext.newPage();
    
    // Login Admin
    await adminPage.goto('/login');
    await adminPage.fill('input[name="email"]', 'admin@example.com');
    await adminPage.fill('input[name="password"]', 'password');
    await adminPage.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or projects
    await expect(adminPage).not.toHaveURL('/login');

    // Create a unique project for this test
    const p1Name = `Fix Test Proj ${Date.now()}`;
    
    await adminPage.getByRole('button', { name: 'Projects' }).click();
    await adminPage.waitForURL('/projects');
    await adminPage.click('text=Add Project');
    await adminPage.fill('input[name="name"]', p1Name);
    await adminPage.click('button:has-text("Save")');
    await expect(adminPage.getByRole('dialog')).not.toBeVisible();
    const projectSearch = adminPage.getByRole('textbox', { name: 'Search Projects' });
    await expect(projectSearch).toBeVisible();
    await projectSearch.fill(p1Name);
    
    // Add Task
    const projectRow = adminPage.getByRole('row', { name: p1Name });
    await expect(projectRow).toBeVisible({ timeout: 10000 });
    await projectRow.getByText('Manage').click();
    await adminPage.click('text=Add Task');
    await adminPage.fill('input[name="name"]', 'Fix Task');
    await adminPage.click('button:has-text("Save")');
    
    // Add Member (Worker)
    await adminPage.click('text=Members');
    await adminPage.click('text=Add Member');
    await adminPage.getByLabel('User').click();
    await adminPage.getByRole('option', { name: 'worker@example.com' }).click();
    await adminPage.getByRole('button', { name: 'Add', exact: true }).click();

    await adminPage.close();

    // 2. Log Time (Worker Context)
    const workerContext = await browser.newContext({ baseURL: 'http://localhost:8081' });
    const workerPage = await workerContext.newPage();
    
    await workerPage.goto('/login');
    await workerPage.fill('input[name="email"]', 'worker@example.com');
    await workerPage.fill('input[name="password"]', 'password');
    await workerPage.click('button[type="submit"]');
    
    // Add Task Row
    await workerPage.click('button:has-text("Add Task Row")');
    await workerPage.getByLabel('Project').click();
    await workerPage.getByRole('option', { name: p1Name }).click();
    await workerPage.getByRole('combobox', { name: 'Task' }).click();
    await workerPage.getByRole('option', { name: 'Fix Task' }).click();
    await workerPage.getByRole('button', { name: 'Add', exact: true }).click();

    // Log time as hh:mm (e.g., 1:30 = 90 mins)
    const row = workerPage.getByRole('row').filter({ hasText: p1Name });
    const input = row.locator('input').first();
    
    const savePromise = workerPage.waitForResponse(resp => resp.url().includes('/cell') && (resp.status() === 200 || resp.status() === 201));
    await input.fill('1:30');
    await input.blur();
    await savePromise;
    
    await workerPage.close();

    // 3. Verify Admin Time Entries Page
    const verifyPage = await adminContext.newPage();
    await verifyPage.goto('/login');
    await verifyPage.fill('input[name="email"]', 'admin@example.com');
    await verifyPage.fill('input[name="password"]', 'password');
    await verifyPage.click('button[type="submit"]');

    await verifyPage.getByRole('button', { name: 'Time Entries' }).click();
    
    // Filter by Project
    await verifyPage.getByTestId('project-select').click();
    await verifyPage.getByRole('option', { name: p1Name }).click();

    // Check Entry Exists and is formatted as hh:mm (1:30)
    await expect(verifyPage.getByRole('cell', { name: p1Name }).first()).toBeVisible();
    await expect(verifyPage.getByRole('cell', { name: '1:30' }).first()).toBeVisible();
    await expect(verifyPage.getByRole('cell', { name: 'worker@example.com' }).first()).toBeVisible();
    
    await verifyPage.close();
  });
});
