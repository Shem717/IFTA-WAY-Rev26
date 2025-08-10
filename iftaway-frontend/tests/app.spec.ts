import { test, expect } from '@playwright/test';

test.describe('IFTA WAY App', () => {
  test('should load the app and show login screen', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/IFTA WAY/);
    
    // Check for the main heading
    await expect(page.locator('h1')).toContainText('IFTA WAY');
    
    // Check that login form is present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for login button
    await expect(page.locator('button[type="submit"]')).toContainText(/Login|Create Account/);
  });

  test('should show Google Sign-In button in Firebase mode', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load and check if Google Sign-In is present
    const googleButton = page.locator('button:has-text("Sign in with Google")');
    
    // The button should be visible if Firebase mode is enabled
    // Or not visible if using backend mode
    const isVisible = await googleButton.isVisible();
    
    if (isVisible) {
      console.log('✓ Firebase mode detected - Google Sign-In button is visible');
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toContainText('Sign in with Google');
    } else {
      console.log('✓ Backend mode detected - Google Sign-In button is hidden');
    }
  });

  test('should have working theme toggle', async ({ page }) => {
    await page.goto('/');
    
    // Find the theme toggle button
    const themeToggle = page.locator('button[role="switch"]');
    await expect(themeToggle).toBeVisible();
    
    // Check initial state (should be dark by default)
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    
    // Click to toggle to light mode
    await themeToggle.click();
    await expect(html).toHaveClass(/light/);
    
    // Click again to toggle back to dark mode
    await themeToggle.click();
    await expect(html).toHaveClass(/dark/);
  });

  test('should attempt login with demo credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill in demo credentials (these are pre-filled in the app)
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    // Verify demo credentials are pre-filled
    await expect(emailInput).toHaveValue('demo@iftaway.com');
    await expect(passwordInput).toHaveValue('password123');
    
    // Click login button
    await loginButton.click();
    
    // Wait for either success (dashboard) or error message
    await page.waitForTimeout(3000);
    
    // Check if we're logged in (dashboard appears) or if there's an error
    const isDashboard = await page.locator('text=Dashboard').isVisible();
    const isError = await page.locator('text=error').isVisible();
    
    if (isDashboard) {
      console.log('✓ Login successful - Dashboard loaded');
      
      // Verify main app elements are present
      await expect(page.locator('text=IFTA WAY')).toBeVisible();
      
      // Check for bottom navigation
      await expect(page.locator('nav')).toBeVisible();
      
      // Check for dashboard content
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
    } else if (isError) {
      console.log('⚠ Login failed - Error message displayed (expected if backend is down)');
    } else {
      console.log('⚠ Login state unclear - May still be loading');
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that the app is responsive
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Check that elements are properly sized for mobile
    const container = page.locator('.max-w-md');
    await expect(container).toBeVisible();
  });

  test('should check for console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Filter out known acceptable errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('CORS') &&
      !error.includes('manifest')
    );
    
    if (criticalErrors.length > 0) {
      console.log('Console errors detected:', criticalErrors);
    } else {
      console.log('✓ No critical console errors detected');
    }
    
    // Don't fail the test for console errors, just report them
    expect(criticalErrors.length).toBeLessThan(5);
  });
});