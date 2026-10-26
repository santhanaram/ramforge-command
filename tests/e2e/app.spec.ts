import { expect, test, type Page } from '@playwright/test';

const noSideScroll = async (page: Page) => {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw + 1);
};

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => { throw e; });
});

test('overview labels demo data and simulated AI honestly', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your AI workforce, in command.' })).toBeVisible();
  await expect(page.getByText('Data: demo only, resets on restart')).toBeVisible();
  await expect(page.getByText('AI: simulated, no model is called')).toBeVisible();
  await expect(page.locator('footer')).toContainText('not affiliated with or endorsed by Alex Hormozi');
  await noSideScroll(page);
});

test('workforce shows 75 roles grouped by division and is searchable', async ({ page }) => {
  await page.goto('/workforce');
  await expect(page.getByText('75 of 75 roles shown.')).toBeVisible();
  await expect(page.locator('.rolecard')).toHaveCount(75);
  await page.getByLabel('Search the workforce').fill('citation');
  await expect(page.getByRole('link', { name: /Celia Citation/ })).toBeVisible();
  await page.getByLabel('Search the workforce').fill('');
  await page.getByLabel('Level').selectOption('head');
  await expect(page.locator('.rolecard')).toHaveCount(5);
  await noSideScroll(page);
});

test('character profile shows ten role-specific responsibilities, a portrait and five videos', async ({ page }) => {
  await page.goto('/workforce/RF-063');
  await expect(page.getByRole('heading', { name: 'Celia Citation', level: 1 })).toBeVisible();
  await expect(page.locator('.duties').first().locator('li')).toHaveCount(10);
  await expect(page.getByText('Confirm quoted text appears exactly in the cited passage')).toBeVisible();
  await expect(page.getByRole('img', { name: /AI-generated portrait of fictional character Celia Citation/ })).toBeVisible();
  const videoLinks = page.locator('.videos a');
  await expect(videoLinks).toHaveCount(5);
  await expect(videoLinks.first()).toHaveAttribute('href', /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/);
  await expect(page.getByText('Inclusion is not endorsement')).toBeVisible();
  await noSideScroll(page);
});

test('full governed workflow: create, run, Vera review, RAM release', async ({ page }) => {
  await page.goto('/tasks');
  const title = `Explain the source policy ${Date.now()}`;
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Accountable role').selectOption('RF-049');
  await page.getByLabel('Description').fill('Summarise the RAMFORGE source policy on permission and release.');
  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('Task created.')).toBeVisible();

  await page.getByRole('button', { name: 'Run simulated agent' }).click();
  await expect(page.getByText('Simulated run finished and was handed to Vera for review.')).toBeVisible();
  await expect(page.getByText('SIMULATED OUTPUT. No AI model was called.')).toBeVisible();
  await expect(page.getByText('Simulated output', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Run Vera review' }).click();
  await expect(page.getByText(/Vera review recorded/)).toBeVisible();
  await expect(page.getByText(/This output came from the simulated provider/).first()).toBeVisible();

  await page.getByLabel('Approve release').check();
  const rationale = `Citations checked, simulated test release ${Date.now()}`;
  await page.getByLabel(/Rationale/).fill(rationale);
  await page.getByRole('button', { name: 'Record RAM decision' }).click();
  await expect(page.getByText('Released by RAM.', { exact: true })).toBeVisible();
  await expect(page.getByText('release decision')).toBeVisible();

  await page.goto('/approvals');
  await expect(page.getByText(rationale)).toBeVisible();
  await page.goto('/runs');
  await expect(page.getByRole('cell', { name: 'simulated' }).first()).toBeVisible();
  await noSideScroll(page);
});

test('knowledge rights gate blocks text until rights are approved with evidence', async ({ page }) => {
  await page.goto('/knowledge');
  const title = `Licensed test source ${Date.now()}`;
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: 'Add source (rights pending)' }).click();
  await expect(page.getByText(/Nothing can be ingested until rights are approved/)).toBeVisible();
  const card = page.locator('article.source', { hasText: title });
  await expect(card.getByText('rights pending')).toBeVisible();
  await card.getByText(/^Add text/).click();
  await expect(card.getByRole('button', { name: 'Store passages' })).toBeDisabled();

  await card.getByText('Rights decision', { exact: true }).click();
  await card.getByLabel('Rights status').selectOption('approved');
  await card.getByLabel(/Why/).fill('Testing approval without evidence');
  await card.getByRole('button', { name: 'Save rights decision' }).click();
  await expect(page.getByText('Approving rights requires written permission evidence.')).toBeVisible();

  const card2 = page.locator('article.source', { hasText: title });
  await card2.getByText('Rights decision', { exact: true }).click();
  await card2.getByLabel('Rights status').selectOption('approved');
  await card2.getByLabel(/Permission evidence/).fill('Written licence L-42 on file');
  await card2.getByLabel(/Why/).fill('Licence received');
  await card2.getByRole('button', { name: 'Save rights decision' }).click();
  await expect(page.getByText(/Rights approved/)).toBeVisible();

  const card3 = page.locator('article.source', { hasText: title });
  await card3.getByText(/^Add text/).click();
  await card3.getByLabel('Text to store').fill('[page 1]\nThis licensed passage is used to test ingestion and citation locators.');
  await card3.getByRole('button', { name: 'Store passages' }).click();
  await expect(page.getByText(/Stored 1 passage/)).toBeVisible();
});

test('manual status changes cannot skip Vera or RAM', async ({ page }) => {
  await page.goto('/tasks');
  const title = `Status guard ${Date.now()}`;
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  const options = await page.locator('#status option').allTextContents();
  expect(options).toEqual(['queued', 'cancelled']);
});
