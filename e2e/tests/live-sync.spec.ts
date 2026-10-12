import { randomUUID } from 'node:crypto';
import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

/**
 * Live sync against a real Supabase project. Skipped unless REVIVEX_LIVE=1.
 *
 * Run with `npm run e2e:live` after putting the project URL and anon key in
 * apps/direction-a/.env.local and apps/direction-b/.env.local (see
 * supabase/README.md); the script re-exports the web builds so the keys are
 * embedded. Each test signs up a fresh account and uses two browser contexts
 * as two devices: data written on one must arrive on the other through the
 * server. Email confirmation must be off in the project for sign-up to log in.
 *
 * Optional: REVIVEX_LIVE_EMAIL=you@yourdomain.com makes test accounts plus
 * addresses of that inbox. No mail is sent while confirmation is off. Test
 * accounts can be deleted any time in Supabase under Authentication → Users.
 */

const LIVE = process.env.REVIVEX_LIVE === '1';
const A_URL = 'http://127.0.0.1:4311';
const B_URL = 'http://127.0.0.1:4312';
const SYNC_TIMEOUT = 75_000;

const ONBOARDED_A = {
  'revivex.profile.v1': JSON.stringify({
    id: 'profile_live',
    displayName: 'Live Test',
    trainingFocus: 'Hybrid',
    primaryGoal: 'Build Strength',
    experienceLevel: 'Intermediate',
    weeklyTrainingTarget: 4,
    preferredWeightUnit: 'lb',
    preferredDistanceUnit: 'mi',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  }),
  'revivex.onboarding.v1': JSON.stringify({ completed: true, completedAt: '2026-10-01T00:00:00.000Z' }),
};

function testEmail(tag: string): string {
  const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
  const base = process.env.REVIVEX_LIVE_EMAIL;
  if (base && base.includes('@')) {
    const [local, domain] = base.split('@');
    return `${local}+revivex-${tag}-${stamp}@${domain}`;
  }
  return `revivex-${tag}-${stamp}@example.com`;
}

async function device(browser: Browser, seed: Record<string, string> = {}): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  // Seed once per device; later reloads keep whatever the app stored.
  await context.addInitScript((items: Record<string, string>) => {
    if (window.localStorage.getItem('e2e.seeded')) return;
    window.localStorage.clear();
    for (const [key, value] of Object.entries(items)) window.localStorage.setItem(key, value);
    window.localStorage.setItem('e2e.seeded', '1');
  }, seed);
  return { context, page: await context.newPage() };
}

function visible(page: Page, testId: string) {
  return page.getByTestId(testId).filter({ visible: true }).first();
}

async function openAccount(page: Page, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}/account`);
  const form = page.getByTestId('account-email');
  const unconfigured = page.getByText('Cloud backup is not configured in this build');
  await expect(form.or(unconfigured).first()).toBeVisible();
  if (await unconfigured.isVisible()) {
    throw new Error(
      'This web build has no Supabase keys. Put REVIVEX_SUPABASE_URL and REVIVEX_SUPABASE_ANON_KEY in apps/direction-a/.env.local and apps/direction-b/.env.local, then run npm run e2e:live again (it re-exports the builds).'
    );
  }
}

async function submitCredentials(page: Page, mode: 'signIn' | 'signUp', email: string, password: string): Promise<void> {
  await page.getByTestId(`account-mode-${mode}`).click();
  await page.getByTestId('account-email').fill(email);
  await page.getByTestId('account-password').fill(password);
  await page.getByTestId('account-submit').click();
  const signedIn = page.getByTestId('account-email-label');
  const message = page.getByTestId('account-message');
  await expect(signedIn.or(message).first()).toBeVisible({ timeout: 30_000 });
  if (!(await signedIn.isVisible())) {
    throw new Error(`${mode} did not log in: "${await message.innerText()}". If it mentions confirmation, turn off "Confirm email" in Supabase (Authentication → Providers → Email).`);
  }
}

/** Waits until the first sync after sign-in has finished, so a reload cannot interrupt it. */
async function waitForFirstSync(page: Page): Promise<void> {
  await expect(page.getByText(/^Last sync/)).toBeVisible({ timeout: SYNC_TIMEOUT });
}

test.describe('Live sync', () => {
  test.skip(!LIVE, 'Live tests need REVIVEX_LIVE=1 and Supabase keys in apps/*/.env.local. Use npm run e2e:live.');
  test.setTimeout(240_000);

  test('Direction A: a workout logged on one device arrives on another', async ({ browser }) => {
    const email = testEmail('a');
    const password = randomUUID();

    const one = await device(browser, ONBOARDED_A);
    await openAccount(one.page, A_URL);
    await submitCredentials(one.page, 'signUp', email, password);
    await waitForFirstSync(one.page);

    await one.page.goto(`${A_URL}/train`);
    await one.page.getByText('Start Empty Workout').click();
    await one.page.getByText('Start Workout', { exact: true }).last().click();
    await one.page.getByText('+ Add Exercise').click();
    await one.page.getByPlaceholder('Search exercises or muscle group').fill('Bench');
    await one.page.getByText('Bench Press', { exact: true }).last().click();
    await one.page.getByTestId('set-weight-1').fill('185');
    await one.page.getByTestId('set-reps-1').fill('8');
    await one.page.getByTestId('set-done-1').click();
    await one.page.getByText('Finish', { exact: true }).click();
    await expect(visible(one.page, 'workout-detail-title')).toBeVisible();
    const title = await visible(one.page, 'workout-detail-title').innerText();
    await expect(visible(one.page, 'sync-badge-synced')).toBeVisible({ timeout: SYNC_TIMEOUT });

    const two = await device(browser, ONBOARDED_A);
    await openAccount(two.page, A_URL);
    await submitCredentials(two.page, 'signIn', email, password);
    await waitForFirstSync(two.page);
    await two.page.goto(`${A_URL}/workout/history`);
    await expect(two.page.getByText('1 workout logged')).toBeVisible({ timeout: SYNC_TIMEOUT });
    const card = two.page.locator('[data-testid^="workout-card-"]').filter({ visible: true }).first();
    await expect(card).toContainText(title);
    await card.click();
    await expect(visible(two.page, 'workout-detail-title')).toHaveText(title);
    await expect(visible(two.page, 'sync-badge-synced')).toBeVisible({ timeout: SYNC_TIMEOUT });

    await one.context.close();
    await two.context.close();
  });

  test('Direction B: a session completed on one device arrives on another', async ({ browser }) => {
    const email = testEmail('b');
    const password = randomUUID();

    const one = await device(browser);
    await one.page.goto(`${B_URL}/`);
    await one.page.getByTestId('today-setup').click();
    await one.page.getByTestId('settings-save').click();
    await openAccount(one.page, B_URL);
    await submitCredentials(one.page, 'signUp', email, password);
    await waitForFirstSync(one.page);

    await one.page.goto(`${B_URL}/`);
    await one.page.getByTestId('today-checkin-button').click();
    await one.page.getByTestId('checkin-sleep-4').click();
    await one.page.getByTestId('checkin-soreness-2').click();
    await one.page.getByTestId('checkin-energy-4').click();
    await one.page.getByTestId('checkin-submit').click();
    await expect(one.page.getByTestId('today-plan-title')).toBeVisible();
    const planTitle = await one.page.getByTestId('today-plan-title').innerText();
    await one.page.getByTestId('today-complete').click();
    await one.page.getByTestId('complete-save').click();
    await expect(one.page.getByTestId('today-done')).toBeVisible();
    await expect(visible(one.page, 'sync-badge-synced')).toBeVisible({ timeout: SYNC_TIMEOUT });

    const two = await device(browser);
    await openAccount(two.page, B_URL);
    await submitCredentials(two.page, 'signIn', email, password);
    await waitForFirstSync(two.page);
    await two.page.goto(`${B_URL}/history`);
    await expect(two.page.getByTestId('history-summary')).toContainText('1 completed', { timeout: SYNC_TIMEOUT });
    await two.page.locator('[data-testid^="history-item-"]').filter({ visible: true }).first().click();
    await expect(two.page.getByTestId('plan-detail-title')).toHaveText(planTitle);
    await expect(two.page.getByTestId('plan-detail-status')).toHaveText('Completed');

    await one.context.close();
    await two.context.close();
  });
});
