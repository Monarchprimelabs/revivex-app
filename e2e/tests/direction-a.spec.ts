import { expect, test, type Page } from '@playwright/test';

/**
 * Direction A core flow on web: log a strength workout, see it in history and
 * detail. Onboarding is pre-seeded so the flow starts on the tabs.
 */

const PROFILE = {
  id: 'profile_e2e',
  displayName: 'E2E Athlete',
  trainingFocus: 'Hybrid',
  primaryGoal: 'Build Strength',
  experienceLevel: 'Intermediate',
  weeklyTrainingTarget: 4,
  preferredWeightUnit: 'lb',
  preferredDistanceUnit: 'mi',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

async function seedOnboarded(page: Page) {
  // Init scripts run on every document load, including page.goto() reloads
  // mid-test, so seed only once per browser context.
  await page.addInitScript(
    ({ profile }) => {
      if (window.localStorage.getItem('e2e.seeded')) return;
      window.localStorage.clear();
      window.localStorage.setItem('revivex.profile.v1', profile);
      window.localStorage.setItem('revivex.onboarding.v1', JSON.stringify({ completed: true, completedAt: '2026-10-01T00:00:00.000Z' }));
      window.localStorage.setItem('e2e.seeded', '1');
    },
    { profile: JSON.stringify(PROFILE) }
  );
}

test.describe('Direction A', () => {
  test('fresh install starts onboarding', async ({ page }) => {
    await page.addInitScript(() => {
      if (!window.localStorage.getItem('e2e.seeded')) {
        window.localStorage.clear();
        window.localStorage.setItem('e2e.seeded', '1');
      }
    });
    await page.goto('/');
    await expect(page.getByText('1 / 6')).toBeVisible();
  });

  test('logs a workout and finds it in history and detail', async ({ page }) => {
    await seedOnboarded(page);
    await page.goto('/train');
    await page.getByText('Start Empty Workout').click();

    // The Train screen stays mounted behind the modal on web, so take the last match.
    await page.getByText('Start Workout', { exact: true }).last().click();
    await page.getByText('+ Add Exercise').click();
    await page.getByPlaceholder('Search exercises or muscle group').fill('Bench');
    // Train's library preview also lists Bench Press underneath the picker; the picker's copy is last.
    await page.getByText('Bench Press', { exact: true }).last().click();

    // Set types cycle by tapping the set number: 1 -> W -> D -> F -> 1.
    await page.getByTestId('set-type-1').click();
    await expect(page.getByTestId('set-type-1')).toHaveText('W');
    await page.getByTestId('set-type-1').click();
    await page.getByTestId('set-type-1').click();
    await page.getByTestId('set-type-1').click();
    await expect(page.getByTestId('set-type-1')).toHaveText('1');

    await page.getByTestId('set-weight-1').fill('185');
    await page.getByTestId('set-reps-1').fill('8');
    await page.getByTestId('set-done-1').click();
    await page.getByText('Finish', { exact: true }).click();

    await expect(page.getByTestId('workout-detail-title')).toBeVisible();
    const title = await page.getByTestId('workout-detail-title').innerText();

    await page.goto('/workout/history');
    await expect(page.getByText('1 workout logged')).toBeVisible();
    const card = page.locator('[data-testid^="workout-card-"]').first();
    await expect(card).toContainText(title);
    await card.click();
    await expect(page.getByTestId('workout-detail-title')).toHaveText(title);
    await expect(page.getByText('Bench Press').last()).toBeVisible();
  });

  test('profile links to the account screen and explains cloud status', async ({ page }) => {
    await seedOnboarded(page);
    await page.goto('/profile');
    await page.getByTestId('profile-account-card').click();
    await expect(page.getByText('Account & Sync')).toBeVisible();
    // Without Supabase keys the screen says so instead of failing.
    const unconfigured = page.getByText('Cloud backup is not configured in this build');
    const form = page.getByTestId('account-email');
    await expect(unconfigured.or(form).last()).toBeVisible();
  });
});
