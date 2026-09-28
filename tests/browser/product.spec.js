import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoSeriousAccessibilityViolations(page) {
  const scan = await new AxeBuilder({ page }).analyze();
  const violations = scan.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

async function gotoReady(page, path) {
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute('data-veil-ready', 'true');
}

test('organizer completes the one-use authorization lifecycle', async ({ page }) => {
  await gotoReady(page, '/');
  await page.getByRole('button', { name: 'Use sample' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Confirm the authorization boundary' })).toBeVisible();
  await page.getByRole('button', { name: 'Create request' }).click();
  await expect(page.locator('#statusChip')).toHaveText('Awaiting consent');
  await expect(page.locator('#message')).toContainText('The circuit exposed no identity');
  await page.getByRole('button', { name: 'Prove consent' }).click();
  await expect(page.getByText('Consent proven', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Process once' }).click();
  await expect(page.getByText('Authorized result')).toBeVisible();
  await expect(page.getByText('Processed once', { exact: true })).toBeVisible();
  await expect(page.getByText(/replay attempt will be rejected/i)).toBeVisible();
});

test('organizer and participant entry points have no serious accessibility violations', async ({ page }) => {
  await gotoReady(page, '/');
  await expectNoSeriousAccessibilityViolations(page);
  await gotoReady(page, '/participant.html');
  await expectNoSeriousAccessibilityViolations(page);
});

test('invalid participant input produces a visible recovery message', async ({ page }) => {
  await gotoReady(page, '/participant.html');
  await page.getByLabel('Invitation packet').fill('invalid invitation');
  await page.getByRole('button', { name: 'Verify and show request' }).click();
  await expect(page.locator('#reviewMessage')).toHaveClass(/error/);
  await expect(page.locator('#reviewMessage')).not.toBeEmpty();
});

test('desktop organizer and participant views match reviewed baselines', async ({ page }) => {
  await gotoReady(page, '/?demo=initial');
  await expect(page).toHaveScreenshot('organizer-desktop.png', { fullPage: true });
  await gotoReady(page, '/participant.html');
  await expect(page).toHaveScreenshot('participant-desktop.png', { fullPage: true });
});

test('mobile layouts remain readable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page, '/?demo=initial');
  const organizerOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(organizerOverflow).toBeLessThanOrEqual(1);
  await expect(page).toHaveScreenshot('organizer-mobile.png');
  await gotoReady(page, '/participant.html');
  const participantOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(participantOverflow).toBeLessThanOrEqual(1);
  await expect(page).toHaveScreenshot('participant-mobile.png');
});
