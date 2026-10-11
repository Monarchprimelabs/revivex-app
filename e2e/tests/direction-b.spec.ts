import { expect, test } from '@playwright/test';

/**
 * Direction B core flow on web: set up the week, check in, get one plan,
 * complete it, find it in history and detail.
 */

test.describe('Direction B', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!window.localStorage.getItem('e2e.seeded')) {
        window.localStorage.clear();
        window.localStorage.setItem('e2e.seeded', '1');
      }
    });
  });

  test('first launch asks for the week setup', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Tell the coach about your week')).toBeVisible();
  });

  test('check in, get a plan, complete it, see it in history and detail', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('today-setup').click();
    await page.getByTestId('settings-focus-Hybrid').click();
    await page.getByTestId('settings-days-4').click();
    await page.getByTestId('settings-save').click();

    await expect(page.getByTestId('today-checkin-button')).toBeVisible();
    await page.getByTestId('today-checkin-button').click();
    await page.getByTestId('checkin-sleep-4').click();
    await page.getByTestId('checkin-soreness-2').click();
    await page.getByTestId('checkin-energy-4').click();
    await expect(page.getByTestId('checkin-preview-score')).toHaveText('75');
    await page.getByTestId('checkin-submit').click();

    await expect(page.getByTestId('today-readiness-score')).toHaveText('75');
    await expect(page.getByTestId('today-plan-title')).toHaveText('Upper body strength');
    await expect(page.getByTestId('plan-block-0')).toContainText('Bench Press');
    await expect(page.getByText('Why this today')).toBeVisible();

    await page.getByTestId('today-complete').click();
    await expect(page.getByTestId('today-done')).toBeVisible();
    await expect(page.getByTestId('today-week')).toContainText('✓ Upper');

    await page.getByTestId('today-history').click();
    await expect(page.getByTestId('history-summary')).toContainText('1 completed');
    await page.locator('[data-testid^="history-item-"]').first().click();
    await expect(page.getByTestId('plan-detail-title')).toHaveText('Upper body strength');
    await expect(page.getByTestId('plan-detail-status')).toHaveText('Completed');
    await expect(page.getByText('Logged', { exact: true })).toBeVisible();
  });

  test('skipping a day keeps the week moving', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('today-setup').click();
    await page.getByTestId('settings-save').click();
    await page.getByTestId('today-plan-without').click();
    await expect(page.getByTestId('today-plan-title')).toBeVisible();
    await page.getByTestId('today-skip').click();
    await expect(page.getByText('Skipped today')).toBeVisible();
    await page.getByTestId('today-rebuild').click();
    await expect(page.getByTestId('today-plan-title')).toBeVisible();
  });

  test('account screen explains cloud status', async ({ page }) => {
    await page.goto('/account');
    const unconfigured = page.getByText('Cloud backup is not configured in this build');
    const form = page.getByTestId('account-email');
    await expect(unconfigured.or(form).first()).toBeVisible();
  });
});
