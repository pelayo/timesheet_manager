import { test, expect } from '@playwright/test';

test.describe('Admin Time Entries', () => {
  test('should view and filter time entries', async ({ browser }) => {
    // 1. Setup Data (Admin Context)
    const adminContext = await browser.newContext({ baseURL: 'http://localhost:8080' });
    const adminPage = await adminContext.newPage();
    
    // Login Admin
    await adminPage.goto('/login');
    await adminPage.fill('input[name="email"]', 'admin@example.com');
    await adminPage.fill('input[name="password"]', 'password');
    await adminPage.click('button[type="submit"]');
    await expect(adminPage).toHaveURL('/');

    // Create Projects
    const p1Name = `Proj A ${Date.now()}`;
    const p2Name = `Proj B ${Date.now()}`;
    
    // Project A
    await adminPage.click('text=Projects');
    await adminPage.click('text=Add Project');
    await adminPage.fill('input[name="name"]', p1Name);
    await adminPage.click('button:has-text("Save")');
    // Add Task to A
    await adminPage.getByRole('row', { name: p1Name }).getByText('Manage').click();
    await adminPage.click('text=Add Task');
    await adminPage.fill('input[name="name"]', 'Task A');
    await adminPage.click('button:has-text("Save")');
    // Add Member (Worker)
    await adminPage.click('text=Members');
    await adminPage.click('text=Add Member');
    await adminPage.getByLabel('User').click(); // Dropdown
    await expect(adminPage.getByRole('listbox')).toBeVisible();
    await adminPage.getByRole('option', { name: 'worker@example.com' }).click();
    await expect(adminPage.getByRole('listbox')).not.toBeVisible();
    await adminPage.getByRole('button', { name: 'Add', exact: true }).click();

    // Project B (No entries will be added here, used for filter check)
    await adminPage.click('text=Projects');
    await adminPage.click('text=Add Project');
    await adminPage.fill('input[name="name"]', p2Name);
    await adminPage.click('button:has-text("Save")');

    await adminPage.close();

    // 2. Log Time (Worker Context)
    const workerContext = await browser.newContext({ baseURL: 'http://localhost:8081' });
    const workerPage = await workerContext.newPage();
    
    await workerPage.goto('/login');
    await workerPage.fill('input[name="email"]', 'worker@example.com');
    await workerPage.fill('input[name="password"]', 'password');
    await workerPage.click('button[type="submit"]');
    
    // Add Task Row for Project A
    await workerPage.click('button:has-text("Add Task Row")');
    await workerPage.getByLabel('Project').click();
    await workerPage.getByRole('option', { name: p1Name }).click();
    await workerPage.getByRole('combobox', { name: 'Task' }).click();
    await workerPage.getByRole('option', { name: 'Task A' }).click();
    await workerPage.getByRole('button', { name: 'Add', exact: true }).click();

    // Log time
    const row = workerPage.getByRole('row').filter({ hasText: p1Name });
    const input = row.locator('input').first();
    
    const savePromise = workerPage.waitForResponse(resp => resp.url().includes('/cell') && resp.status() === 200 || resp.status() === 201);
    await input.fill('120');
    await input.blur();
    await savePromise;
    
    await workerPage.close();

    // 3. Verify Admin Time Entries Page
    const verifyPage = await adminContext.newPage();
    await verifyPage.goto('/'); // Already logged in via storage state? No, context isolated?
    // Re-login needed if state not shared, but browser.newContext isolated.
    // I closed adminPage but context remains. Session storage/cookies might persist if I didn't close context.
    // Let's re-login to be safe or reuse session.
    // Actually simpler to keep adminPage open or just navigate.
    
    await verifyPage.goto('/login');
    await verifyPage.fill('input[name="email"]', 'admin@example.com');
    await verifyPage.fill('input[name="password"]', 'password');
    await verifyPage.click('button[type="submit"]');

    await verifyPage.click('text=Time Entries');
    
    // Filter by Project A to avoid seeded data noise
    await verifyPage.getByRole('combobox', { name: 'Project' }).click();
    await verifyPage.getByRole('option', { name: p1Name }).click();

    // Check Entry Exists
    await expect(verifyPage.getByRole('cell', { name: p1Name }).first()).toBeVisible();
    await expect(verifyPage.getByRole('cell', { name: '120' }).first()).toBeVisible();
    await expect(verifyPage.getByRole('cell', { name: 'worker@example.com' }).first()).toBeVisible();

    // Filter by Project B (Should be empty)
    await verifyPage.getByRole('combobox', { name: 'Project' }).click();
    await verifyPage.getByRole('option', { name: p2Name }).click();
    await expect(verifyPage.getByRole('cell', { name: p1Name })).not.toBeVisible();
    await expect(verifyPage.getByText('No entries found')).toBeVisible();
  });
});
