import { test, expect } from '@playwright/test';
test('demo conversation and report', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Начать тренировку' }).click();
  await expect(page.getByText('Владелец автосервиса')).toBeVisible();
  const input = page.getByPlaceholder('Ответ покупателю…');
  await input.fill('Какой объём вам нужен в месяц?');
  await input.press('Enter');
  await expect(page.getByText(/20 комплектов/)).toBeVisible();
  await page.getByRole('button', { name: 'Завершить' }).click();
  await expect(page.getByText('Оценка навыков')).toBeVisible();
});
test('no horizontal scroll', async ({ page }) => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }
});
