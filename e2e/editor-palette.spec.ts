import { test, expect } from '@playwright/test';
import { EditorHelper } from './helpers/editor';

test.describe('Command Palette 기능', () => {
  let editor: EditorHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test('P-001: Command Palette 열기 (Cmd+B)', async ({ page }) => {
    await page.keyboard.press('Meta+b');
    await page.waitForTimeout(300);

    const palette = page.locator('.command-palette');
    await expect(palette).toBeVisible();

    const input = page.locator('.command-input');
    await expect(input).toBeFocused();
  });

  test('P-002: 스크립트 검색', async ({ page }) => {
    await page.keyboard.press('Meta+b');
    await page.waitForSelector('.command-item', { timeout: 10000 });

    const input = page.locator('.command-input');
    await input.fill('base64');
    await page.waitForTimeout(500);

    const items = page.locator('.command-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      expect(text?.toLowerCase()).toContain('base64');
    }
  });

  test('P-003: 최근 스크립트 관리', async ({ page }) => {
    await page.keyboard.press('Meta+b');
    await page.waitForSelector('.command-item', { timeout: 10000 });

    const firstItem = page.locator('.command-item').first();
    const scriptName = await firstItem.locator('.command-name').textContent();
    await firstItem.click();

    await page.keyboard.press('Meta+b');
    await page.waitForSelector('.command-item', { timeout: 10000 });

    const recentHeader = page.locator('.list-section-header', { hasText: 'RECENT' });
    await expect(recentHeader).toBeVisible();

    const recentItem = page.locator('.command-item').first();
    const recentName = await recentItem.locator('.command-name').textContent();
    expect(recentName).toBe(scriptName);

    const removeBtn = recentItem.locator('.remove-recent-btn');
    await expect(removeBtn).toBeVisible();

    await removeBtn.click();
    await expect(recentHeader).not.toBeVisible();
  });
});
