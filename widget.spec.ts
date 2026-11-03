import { test, expect, Page } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const FIXTURE = process.env.WIDGET_HTML ?? path.resolve(process.cwd(), 'widget.html');
const URL = pathToFileURL(FIXTURE).href;

async function sendSnapshot(page: Page, snapshot: unknown) {
  await page.evaluate((data) => {
    const api = (window as any).qaWidget;
    if (!api?.update) throw new Error('window.qaWidget.update() not found');
    api.update(data);
  }, snapshot);
}
const row = (page: Page, id: string) => page.locator(`[data-testid="provider-${id}"]`);
const odds = (page: Page, id: string) => row(page, id).locator('[data-testid="odds"]');

test.beforeEach(async ({ page }) => { await page.goto(URL); });

test('Best Value: highlights all ties and excludes invalid odds', async ({ page }) => {
  await sendSnapshot(page, {
    gameId: 'g1', version: 10,
    providers: [
      { id: 'A', decimalOdds: 2.2 },
      { id: 'B', decimalOdds: 2.1 },
      { id: 'C', decimalOdds: 2.2 },
    ],
  });
  await expect(row(page, 'A')).toHaveAttribute('data-best', 'true');
  await expect(row(page, 'C')).toHaveAttribute('data-best', 'true');
  await expect(row(page, 'B')).toHaveAttribute('data-best', 'false');

  await sendSnapshot(page, {
    gameId: 'g1', version: 11,
    providers: [
      { id: 'A', decimalOdds: 2.2 },
      { id: 'B', decimalOdds: null },
      { id: 'C', decimalOdds: 1 },
    ],
  });
  await expect(row(page, 'A')).toHaveAttribute('data-best', 'true');
  await expect(odds(page, 'B')).toHaveText('--');
  await expect(odds(page, 'C')).toHaveText('--');

  await sendSnapshot(page, {
    gameId: 'g1', version: 12,
    providers: [
      { id: 'A', decimalOdds: null },
      { id: 'B', decimalOdds: 1 },
      { id: 'C', decimalOdds: 'NaN' },
    ],
  });
  await expect(row(page, 'A')).toHaveAttribute('data-best', 'false');
  await expect(row(page, 'B')).toHaveAttribute('data-best', 'false');
  await expect(row(page, 'C')).toHaveAttribute('data-best', 'false');
  await expect(page.locator('[data-testid="best-value"]')).toHaveCount(0);
});

test('Snapshot ordering: older and equal versions cannot replace newest data', async ({ page }) => {
  await sendSnapshot(page, {
    gameId: 'g1', version: 12,
    providers: [
      { id: 'A', decimalOdds: 2.35 },
      { id: 'B', decimalOdds: 2.15 },
      { id: 'C', decimalOdds: null },
    ],
  });
  await sendSnapshot(page, {
    gameId: 'g1', version: 11,
    providers: [
      { id: 'A', decimalOdds: 1.7 },
      { id: 'B', decimalOdds: 2.8 },
      { id: 'C', decimalOdds: 3.0 },
    ],
  });
  await sendSnapshot(page, {
    gameId: 'g1', version: 12,
    providers: [
      { id: 'A', decimalOdds: 1.6 },
      { id: 'B', decimalOdds: 3.1 },
      { id: 'C', decimalOdds: 3.2 },
    ],
  });
  await expect(page.locator('#widget')).toHaveAttribute('data-version', '12');
  await expect(odds(page, 'A')).toHaveText('2.35');
  await expect(odds(page, 'B')).toHaveText('2.15');
  await expect(odds(page, 'C')).toHaveText('--');
  await expect(row(page, 'A')).toHaveAttribute('data-best', 'true');
});
