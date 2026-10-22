// Browser tests for the built module in docs/. Run `npm run build` first.

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MODULE = 'biting-incident/index.html';
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectNoAxeViolations(page, label) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
  expect(summary, `axe violations at ${label}`).toEqual([]);
}

/** Play to the wrap screen with the keyboard only, choosing the first option each time. */
async function playByKeyboard(page, { axe = false, label = '' } = {}) {
  for (let step = 0; step < 30; step += 1) {
    if (await page.locator('.field--wrap').count()) return;
    const heading = page.locator('main h2');
    await expect(heading).toBeFocused();
    if (axe) await expectNoAxeViolations(page, `${label} step ${step}`);

    if (await page.locator('form.choices').count()) {
      await page.keyboard.press('Tab'); // first radio
      await page.keyboard.press('Space');
      await page.keyboard.press('Tab'); // Lock in my choice
      await page.keyboard.press('Enter');
      await expect(page.locator('.consequence__heading')).toBeFocused();
      if (axe) await expectNoAxeViolations(page, `${label} step ${step} consequence`);
      await page.keyboard.press('Tab'); // Continue
      await page.keyboard.press('Enter');
    } else {
      await page.keyboard.press('Tab'); // Continue
      await page.keyboard.press('Enter');
    }
  }
  throw new Error('did not reach the wrap screen');
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__events = [];
    window.addEventListener('scenario:event', (e) => window.__events.push(e.detail));
  });
});

for (const width of [320, 375, 768, 1280]) {
  test(`keyboard-only play-through with no axe violations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(MODULE);
    await expectNoAxeViolations(page, `${width}px intro`);
    await page.getByRole('button', { name: 'Begin' }).focus();
    await page.keyboard.press('Enter');
    await playByKeyboard(page, { axe: width === 320 || width === 1280, label: `${width}px` });

    await expect(page.getByRole('heading', { name: 'Your day at a glance' })).toBeVisible();
    await expectNoAxeViolations(page, `${width}px wrap`);
    const events = await page.evaluate(() => window.__events.map((e) => e.type));
    expect(events).toContain('sceneStart');
    expect(events.filter((t) => t === 'complete')).toHaveLength(1);

    // Nothing wider than the screen.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

/** Click through, choosing picks[nodeId] where given and otherwise the first option, until the node `stopAt` is showing. */
async function playUntil(page, stopAt, picks = {}) {
  for (let step = 0; step < 40; step += 1) {
    const node = await page.locator('main article[data-node]').getAttribute('data-node');
    if (node === stopAt) return;
    if (await page.locator('form.choices').count()) {
      const radio = picks[node] ? page.locator(`input[value="${picks[node]}"]`) : page.locator('form.choices input').first();
      await radio.check();
      await page.getByRole('button', { name: 'Lock in my choice' }).click();
    }
    await page.getByRole('button', { name: 'Continue' }).click();
  }
  throw new Error(`did not reach ${stopAt}`);
}

test('lock in without choosing shows a message instead of moving on', async ({ page }) => {
  await page.goto(MODULE);
  await page.getByRole('button', { name: 'Begin' }).click();
  await playUntil(page, '1.1');
  await page.getByRole('button', { name: 'Lock in my choice' }).click();
  await expect(page.getByRole('alert')).toHaveText('Choose an option first.');
  await expect(page.locator('.consequence')).toHaveCount(0);
});

test('earlier choices change later wording and form fills, and fills are announced', async ({ page }) => {
  await page.goto(MODULE);
  await page.getByRole('button', { name: 'Begin' }).click();
  await playUntil(page, '2.1', { '1.1': '1.1-b', '1.4': '1.4-a' });

  await expect(page.locator('label[for]').filter({ hasText: /^Time 10:15, block center/ })).toBeVisible();
  await expect(page.getByText('Not filled in yet').first()).toBeVisible();
  await expect(page.locator('.sheet__later')).toHaveCount(2);
  await page.locator('input[value="2.1-a"]').check();
  await page.getByRole('button', { name: 'Lock in my choice' }).click();
  await expect(page.locator('[data-field="incidentTime"] dd')).toHaveText('10:15 AM');
  await expect(page.locator('[data-field="staffPresent"] dd')).toHaveText('Nina Rodriguez. Ms. Lee arrived after the bite.');
  await expect(page.locator('[aria-live="polite"].sr-only')).toContainText('Form updated: Date of Incident');

  // Fills from 2.1 are still there in 2.2.
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('main article')).toHaveAttribute('data-node', '2.2');
  await expect(page.locator('[data-field="incidentTime"] dd')).toHaveText('10:15 AM');
});

test('a body with a blank line shows as two paragraphs', async ({ page }) => {
  await page.goto(MODULE);
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(page.locator('article[data-node="1.0"] > .text > p')).toHaveCount(2);
});

test('pause reports a real save, and a reload offers to pick up where the learner left off', async ({ page }) => {
  await page.goto(MODULE);
  await page.getByRole('button', { name: 'Begin' }).click();
  await playUntil(page, '1.1');
  await page.locator('input[value="1.1-b"]').check();
  await page.getByRole('button', { name: 'Lock in my choice' }).click();

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('dialog')).toContainText('Your progress is saved in this browser.');
  await page.getByRole('dialog').getByRole('button', { name: 'Keep going' }).first().click();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pick up where you left off?' })).toBeVisible();
  await page.getByRole('button', { name: 'Pick up where I left off' }).click();
  await expect(page.locator('main article')).toHaveAttribute('data-node', '1.2');
});

test('with storage blocked, pause tells the learner to finish the scene', async ({ page }) => {
  await page.goto(`${MODULE}?storage=off`);
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('dialog')).toContainText('could not be saved in this browser. Please finish this scene before you leave.');
});

test('policy drawer opens with the policy text and closes with Escape', async ({ page }) => {
  await page.goto(MODULE);
  await page.getByRole('button', { name: 'Begin' }).click();
  const button = page.getByRole('button', { name: 'Policy' });
  await button.click();
  const dialog = page.getByRole('dialog', { name: 'Policy reference' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Biting hurts. We keep our teeth to ourselves.');
  await expect(dialog.locator('em, i')).toHaveCount(0);
  await expectNoAxeViolations(page, 'policy drawer');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();
});

test('the built module runs when opened from a folder (file://)', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const url = pathToFileURL(path.resolve('docs', MODULE)).href;
  await page.goto(url);
  await page.getByRole('button', { name: 'Begin' }).click();
  await playUntil(page, '1.1');
  await page.locator('form.choices input').first().check();
  await page.getByRole('button', { name: 'Lock in my choice' }).click();
  await expect(page.getByRole('heading', { name: 'What happened' })).toBeVisible();
  const fontsLoaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('700 16px Anybody') && document.fonts.check('16px Inter');
  });
  expect(fontsLoaded).toBe(true);
  expect(errors).toEqual([]);
});

test('no network requests leave the page', async ({ page }) => {
  const external = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:4173/')) external.push(r.url());
  });
  await page.goto(MODULE);
  await page.getByRole('button', { name: 'Begin' }).click();
  await playByKeyboard(page);
  expect(external).toEqual([]);
});

test('the Parent Notice shows as a paper card at 3.1, with blanks announced as "blank"', async ({ page }) => {
  await page.goto(MODULE);
  await page.getByRole('button', { name: 'Begin' }).click();
  await playUntil(page, '3.1');
  const paper = page.locator('.paper');
  await expect(paper.getByRole('heading', { name: 'Parent Notice' })).toBeVisible();
  await expect(paper).toContainText('Notice for the family of the child who was bitten');
  await expect(paper).toContainText('A.K. was bitten by another child on the right forearm');
  await expect(paper).not.toContainText('D.M.');
  await expect(paper.locator('.blank .sr-only').first()).toHaveText('blank');
  await expectNoAxeViolations(page, 'Parent Notice at 3.1');
});

test('options are shuffled per learner and keep their order after a reload', async ({ page }) => {
  const order = () => page.locator('form.choices input').evaluateAll((els) => els.map((e) => e.value));

  await page.goto(`${MODULE}?order=authored`);
  await page.getByRole('button', { name: 'Begin' }).click();
  await playUntil(page, '1.1');
  expect(await order()).toEqual(['1.1-a', '1.1-b', '1.1-c']);

  await page.evaluate(() => localStorage.clear());
  await page.goto(MODULE);
  await page.getByRole('button', { name: 'Begin' }).click();
  await playUntil(page, '1.1');
  const first = await order();
  expect([...first].sort()).toEqual(['1.1-a', '1.1-b', '1.1-c']);

  await page.reload();
  await page.getByRole('button', { name: 'Pick up where I left off' }).click();
  await expect(page.locator('main article')).toHaveAttribute('data-node', '1.1');
  expect(await order()).toEqual(first);
});
