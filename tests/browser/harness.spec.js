// The Storyline harness: both completion routes, through nested frames.

import { test, expect } from '@playwright/test';

async function playInFrame(frame) {
  await frame.getByRole('button', { name: 'Begin' }).click();
  for (let step = 0; step < 30; step += 1) {
    if (await frame.locator('.field--wrap').count()) return;
    if (await frame.locator('form.choices').count()) {
      await frame.locator('.choice__label').first().click();
      await frame.getByRole('button', { name: 'Lock in my choice' }).click();
    }
    await frame.getByRole('button', { name: 'Continue' }).click();
  }
  throw new Error('did not reach the wrap screen');
}

test('both routes report completion with the module framed directly', async ({ page }) => {
  await page.goto('storyline-harness.html');
  await playInFrame(page.frameLocator('#frame'));
  await expect(page.locator('#status-a')).toHaveText(/Route A: completion received/);
  await expect(page.locator('#status-b')).toHaveText(/Route B: completion received/);
  await expect(page.locator('#log')).toContainText('SetVar("ScenarioComplete", true)');
});

test('route A alone finds GetPlayer two frames up', async ({ page }) => {
  await page.goto('storyline-harness.html');
  await page.selectOption('#route', 'a');
  await page.selectOption('#nest', '2');
  await page.getByRole('button', { name: 'Load module' }).click();
  await playInFrame(page.frameLocator('#frame').frameLocator('#inner').frameLocator('#inner'));
  await expect(page.locator('#status-a')).toHaveText(/completion received/);
  await expect(page.locator('#status-b')).toHaveText('Route B: waiting');
});

test('route B alone reaches the top window through nested frames', async ({ page }) => {
  await page.goto('storyline-harness.html');
  await page.selectOption('#route', 'b');
  await page.selectOption('#nest', '1');
  await page.getByRole('button', { name: 'Load module' }).click();
  await playInFrame(page.frameLocator('#frame').frameLocator('#inner'));
  await expect(page.locator('#status-b')).toHaveText(/completion received/);
  await expect(page.locator('#status-a')).toHaveText('Route A: waiting');
});

test('a custom variable name is passed through', async ({ page }) => {
  await page.goto('storyline-harness.html');
  await page.fill('#variable', 'BitingDone');
  await page.getByRole('button', { name: 'Load module' }).click();
  await playInFrame(page.frameLocator('#frame'));
  await expect(page.locator('#log')).toContainText('SetVar("BitingDone", true)');
  await expect(page.locator('#status-a')).toHaveText(/completion received/);
});
