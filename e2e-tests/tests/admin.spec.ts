import { test, expect } from '@playwright/test';

test.describe('Admin Flows', () => {
  test('should login and create projects and users', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Welcome to Admin Dashboard')).toBeVisible();

    // 2. Create Global Project
    await page.click('text=Projects');
    await page.click('text=Add Project');
    
    const globalName = `Global Proj ${Date.now()}`;
    await page.fill('input[name="name"]', globalName);
    await page.fill('input[name="code"]', 'GLB');
    // Check Global checkbox - Assuming the label text or locating by name
    // The UI uses MUI Checkbox with FormControlLabel "Global (Available to everyone)"
    await page.click('label:has-text("Global")'); 
    await page.click('button:has-text("Save")');

    await expect(page.getByText(globalName)).toBeVisible();
    await expect(page.getByRole('row', { name: globalName }).getByRole('cell', { name: 'Global', exact: true })).toBeVisible();

    // 3. Create Task in Global Project
    await page.getByRole('row', { name: globalName }).getByText('Manage').click();
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    await page.click('text=Add Task');
    await page.fill('input[name="name"]', 'Global Task 1');
    await page.click('button:has-text("Save")');
    await expect(page.getByText('Global Task 1')).toBeVisible();

    // 4. Create User
    await page.click('text=Users');
    await page.click('text=Add User');
    const userEmail = `user${Date.now()}@test.com`;
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', 'password');
    // Role defaults to User
    await page.click('button:has-text("Create")');
    
    await expect(page.getByText(userEmail)).toBeVisible();
  });
});
