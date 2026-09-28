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
  await page.getByRole('button', { name: 'Load example' }).click();
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

test('deployment subpath loads the organizer runtime', async ({ page }) => {
  await gotoReady(page, '/veil-consent/');
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.locator('#document')).toHaveValue(/Project Aurora launches Tuesday/);
  await page.locator('#wizardNext').click();
  await page.locator('#wizardNext').click();
  await page.locator('#create').click();
  await expect(page.locator('#statusChip')).toHaveText('Awaiting consent');
});

test('organizer controls expose clear, working states', async ({ page }) => {
  await gotoReady(page, '/');
  await expect(page.locator('#wizardTab2')).toBeDisabled();
  await expect(page.locator('#wizardTab3')).toBeDisabled();
  await expect(page.locator('#connectWallet')).toBeDisabled();

  await page.locator('#document').fill('this is a test');
  await expect(page.locator('#charCount')).toHaveText('14 characters · never saved');
  await expect(page.locator('#useSample')).toHaveText('Replace with example');
  await page.locator('#useSample').click();
  await expect(page.locator('#document')).toHaveValue(/Project Aurora launches Tuesday/);
  await expect(page.locator('#charCount')).not.toHaveText('0 characters · never saved');

  await page.locator('#wizardNext').click();
  await expect(page.locator('#wizardTab2')).toBeEnabled();
  await expect(page.locator('#wizardTab3')).toBeDisabled();
  await page.locator('#wizardNext').click();
  await expect(page.locator('#wizardTab3')).toBeEnabled();
  await page.locator('#wizardBack').click();
  await page.locator('#wizardBack').click();
  await page.locator('#wizardTab3').click();
  await expect(page.getByRole('heading', { name: 'Confirm the authorization boundary' })).toBeVisible();

  await page.locator('#create').click();
  await page.locator('#revoke').click();
  await expect(page.locator('#statusChip')).toHaveText('Revoked');

  await page.addInitScript(() => {
    window.midnight = {
      lace: {
        name: 'Lace test wallet',
        connect: async networkId => ({
          getConnectionStatus: async () => ({ status: 'connected', networkId }),
          getUnshieldedAddress: async () => ({ unshieldedAddress: 'mn_test_wallet_address' }),
        }),
      },
    };
  });
  await gotoReady(page, '/');
  await page.locator('#refreshWallet').click();
  await expect(page.locator('#connectWallet')).toBeEnabled();
  await page.locator('#connectWallet').click();
  await expect(page.locator('#connectWallet')).toHaveText('Checked');
  await expect(page.locator('#walletState')).toContainText('Lace test wallet checked · Preprod');
});

test('independent participants can approve or decline and satisfy a threshold', async ({ browser }) => {
  test.setTimeout(60_000);
  const context = await browser.newContext();
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const participant = await context.newPage();
  const organizer = await context.newPage();
  const enrollments = {};

  for (const slot of ['A', 'B', 'C']) {
    await gotoReady(participant, '/participant.html');
    await participant.locator('#slot').selectOption(slot);
    await participant.locator('#enroll').click();
    enrollments[slot] = await participant.locator('#enrollment').inputValue();
    await participant.locator('#copyEnrollment').click();
    await expect(participant.locator('#enrollMessage')).toHaveText('Copied to clipboard.');
  }

  await gotoReady(organizer, '/');
  await organizer.locator('#useSample').click();
  await organizer.locator('#wizardNext').click();
  await organizer.locator('#modeIndependent').check();
  for (const slot of ['A', 'B', 'C']) {
    await organizer.locator(`#enroll${slot}`).fill(enrollments[slot]);
    await organizer.locator(`.enroll-import[data-slot="${slot}"]`).click();
    await expect(organizer.locator(`#enrollStatus${slot}`)).toHaveText('Credential ready');
  }
  await organizer.locator('#wizardNext').click();
  await organizer.locator('#create').click();
  await expect(organizer.locator('#invitationGrid textarea')).toHaveCount(3);
  const invitations = await organizer.locator('#invitationGrid textarea').evaluateAll(areas => areas.map(area => area.value));
  const fingerprint = await organizer.locator('#organizerFingerprint').textContent();
  await organizer.getByRole('button', { name: 'Copy invitation' }).first().click();
  await expect(organizer.locator('#message')).toHaveText('Invitation copied. Send it to the assigned participant.');

  const responses = {};
  for (const [index, slot] of ['A', 'B', 'C'].entries()) {
    await gotoReady(participant, '/participant.html');
    await participant.locator('#invitation').fill(invitations[index]);
    await participant.getByText('Verify organizer identity', { exact: true }).click();
    await participant.locator('#organizerFingerprintInput').fill(fingerprint);
    await participant.locator('#review').click();
    await expect(participant.locator('#reviewCard')).toBeVisible();
    await participant.locator(slot === 'C' ? '#decline' : '#approve').click();
    await expect(participant.locator('#copyResponse')).toBeEnabled();
    await participant.locator('#copyResponse').click();
    await expect(participant.locator('#responseMessage')).toHaveText('Copied to clipboard.');
    responses[slot] = await participant.locator('#response').inputValue();
  }

  for (const slot of ['A', 'B']) {
    await organizer.locator('#responsePacket').fill(responses[slot]);
    await organizer.locator('#importResponse').click();
  }
  await expect(organizer.locator('#issue')).toBeEnabled();
  await expect(organizer.locator('#message')).toContainText('2 approvals have been received');

  await organizer.locator('#responsePacket').fill(responses.C);
  await organizer.locator('#importResponse').click();
  await expect(organizer.locator('#issue')).toBeEnabled();
  await organizer.locator('#issue').click();
  await organizer.locator('#process').click();
  await expect(organizer.locator('#statusChip')).toHaveText('Consumed');
  await participant.locator('#clearLocal').click();
  await expect(participant.locator('#copyEnrollment')).toBeDisabled();
  await expect(participant.locator('#invitation')).toHaveValue('');
  await context.close();
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
