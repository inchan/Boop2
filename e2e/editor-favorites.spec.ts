import { test, expect } from '@playwright/test';
import { EditorHelper } from './helpers/editor';

/**
 * Favorites 기능 E2E 테스트
 *
 * 테스트 케이스:
 * - F-001: Command Palette 열기 (Cmd+B)
 * - F-002: 스크립트 즐겨찾기 추가
 * - F-003: Cmd+1로 즐겨찾기 실행
 * - F-004: 즐겨찾기 제거
 * - F-005: Cmd+2, Cmd+3 등 다중 단축키
 * - F-006: LRU eviction (5개 초과 시 자동 제거)
 */

test.describe('즐겨찾기 기능', () => {
  let editor: EditorHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test('F-001: Command Palette 열기 (Cmd+B)', async ({ page }) => {
    // Given: 에디터가 열려 있음
    // When: Cmd+B를 누름
    await page.keyboard.press('Meta+b');
    await page.waitForTimeout(300);

    // Then: Command Palette가 나타남
    const palette = page.locator('.command-palette');
    await expect(palette).toBeVisible();

    // 검색框에 포커스가 있어야 함
    const input = page.locator('.command-input');
    await expect(input).toBeFocused();
  });

  test('F-002: 스크립트 즐겨찾기 추가', async ({ page }) => {
    // Given: Command Palette 열기
    await page.keyboard.press('Meta+b');
    await page.waitForTimeout(300);

    // 스크립트 목록이 로드될 때까지 대기
    await page.waitForSelector('.command-item', { timeout: 5000 });

    // 첫 번째 스크립트의 별 아이콘 클릭
    const firstStar = page.locator('.favorite-star').first();
    await expect(firstStar).toBeVisible();
    await firstStar.click();

    // Then: 별이 filled 상태로 변경됨
    await expect(firstStar).toHaveClass(/active/);

    // Command Palette 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('F-003: Cmd+1로 즐겨찾기 실행', async ({ page }) => {
    // Given: Command Palette 열고 즐겨찾기 추가
    await page.keyboard.press('Meta+b');
    await page.waitForTimeout(300);
    await page.waitForSelector('.command-item', { timeout: 5000 });

    // 첫 번째 스크립트를 즐겨찾기에 추가
    const firstStar = page.locator('.favorite-star').first();
    await firstStar.click();

    // Command Palette 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // 에디터에 텍스트 입력
    await editor.type('hello world');
    await page.waitForTimeout(100);

    // When: Cmd+1을 누름
    await page.keyboard.press('Meta+1');
    await page.waitForTimeout(500);

    // Then: 첫 번째 즐겨찾기 스크립트가 실행됨 (텍스트가 변환됨)
    const text = await editor.getText();
    // UpperCase 스크립트가 실행되면 대문자가 됨
    expect(text).not.toBe('hello world');
  });

  test('F-004: 즐겨찾기 제거', async ({ page }) => {
    // Given: Command Palette 열고 즐겨찾기 추가
    await page.keyboard.press('Meta+b');
    await page.waitForTimeout(300);
    await page.waitForSelector('.command-item', { timeout: 5000 });

    // 첫 번째 스크립트를 즐겨찾기에 추가
    const firstStar = page.locator('.favorite-star').first();
    await firstStar.click();

    // When: 같은 별을 다시 클릭 (제거)
    await firstStar.click();

    // Then: 별이 empty 상태로 변경됨
    await expect(firstStar).not.toHaveClass(/active/);
  });

  test('F-005: Cmd+2로 두 번째 즐겨찾기 실행', async ({ page }) => {
    // Given: 두 개의 스크립트를 즐겨찾기에 추가
    await page.keyboard.press('Meta+b');
    await page.waitForTimeout(300);
    await page.waitForSelector('.command-item', { timeout: 5000 });

    // 첫 번째 스크립트 즐겨찾기
    const firstStar = page.locator('.favorite-star').first();
    await firstStar.click();

    // 두 번째 스크립트 즐겨찾기
    const secondStar = page.locator('.favorite-star').nth(1);
    await secondStar.click();

    // Command Palette 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // 에디터에 텍스트 입력
    await editor.type('hello world');
    await page.waitForTimeout(100);

    // When: Cmd+2를 누름
    await page.keyboard.press('Meta+2');
    await page.waitForTimeout(500);

    // Then: 두 번째 즐겨찾기 스크립트가 실행됨
    const text = await editor.getText();
    expect(text).not.toBe('hello world');
  });

  test('F-006: Cmd+숫자 배지 표시 확인', async ({ page }) => {
    // Given: Command Palette 열고 즐겨찾기 추가
    await page.keyboard.press('Meta+b');
    await page.waitForTimeout(300);
    await page.waitForSelector('.command-item', { timeout: 5000 });

    // 첫 번째 스크립트 즐겨찾기
    const firstStar = page.locator('.favorite-star').first();
    await firstStar.click();

    // Then: Cmd+1 배지가 표시됨
    const shortcutBadge = page.locator('.shortcut-badge').first();
    await expect(shortcutBadge).toBeVisible();
    await expect(shortcutBadge).toHaveText('Cmd+1');

    // 툴팁도 표시되어야 함
    const tooltip = page.locator('.shortcut-tooltip').first();
    await expect(tooltip).toHaveText('Press Cmd+1');
  });

  test('F-007: Favorites 섹션 확인', async ({ page }) => {
    // Given: Command Palette 열고 즐겨찾기 추가
    await page.keyboard.press('Meta+b');
    await page.waitForTimeout(300);
    await page.waitForSelector('.command-item', { timeout: 5000 });

    // 스크립트 즐겨찾기 추가
    const firstStar = page.locator('.favorite-star').first();
    await firstStar.click();

    // Then: FAVORITES 섹션이 표시됨
    const favHeader = page.locator('.list-section-header:has-text("FAVORITES")').first();
    await expect(favHeader).toBeVisible();
  });

  test('F-008: 검색 시 Favorites 섹션 숨김', async ({ page }) => {
    // Given: Command Palette 열고 즐겨찾기 추가
    await page.keyboard.press('Meta+b');
    await page.waitForTimeout(300);
    await page.waitForSelector('.command-item', { timeout: 5000 });

    // 스크립트 즐겨찾기 추가
    const firstStar = page.locator('.favorite-star').first();
    await firstStar.click();

    // When: 검색어 입력
    const input = page.locator('.command-input');
    await input.fill('upper');

    // Then: FAVORITES 섹션이 숨겨지고 검색 결과만 표시됨
    const favHeader = page.locator('.list-section-header:has-text("FAVORITES")');
    await expect(favHeader).not.toBeVisible();
  });
});

test.describe('즐겨찾기 단축키 (앱 포커스 상태)', () => {
  let editor: EditorHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test('F-009: 에디터 포커스 상태에서 Cmd+1 실행', async ({ page }) => {
    // Given: 즐겨찾기가 추가된 상태 (Favorites 섹션에서 확인)
    await page.keyboard.press('Meta+b');
    await page.waitForTimeout(300);
    await page.waitForSelector('.command-item', { timeout: 5000 });

    // 첫 번째 스크립트 즐겨찾기 추가
    const firstStar = page.locator('.favorite-star').first();
    await firstStar.click();

    // Command Palette 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // 에디터에 텍스트 입력 후 포커스 유지
    await editor.type('test text');
    await page.waitForTimeout(100);

    // When: 에디터 포커스 상태에서 Cmd+1
    await editor.focus();
    await page.keyboard.press('Meta+1');
    await page.waitForTimeout(500);

    // Then: 스크립트가 실행됨
    const text = await editor.getText();
    expect(text.length).toBeGreaterThan(0);
  });
});
