import { test, expect } from '@playwright/test';
import { EditorHelper } from './helpers/editor';

/**
 * Tab 키 들여쓰기/내어쓰기 테스트
 *
 * 테스트 케이스:
 * - E-070: Tab 키로 4개 공백 삽입
 * - E-071: Shift+Tab으로 들여쓰기 제거
 * - E-072: 여러 줄 선택 후 Tab으로 일괄 들여쓰기
 * - E-073: 여러 줄 선택 후 Shift+Tab으로 일괄 내어쓰기
 * - E-074: Tab 키 후 포커스 유지 확인
 * - E-075: Undo로 들여쓰기 되돌리기
 */

test.describe('Tab 키 들여쓰기', () => {
  let editor: EditorHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test('E-070: Tab 키로 4개 공백 삽입', async ({ page }) => {
    // Given: 텍스트 입력
    await editor.type('hello');

    // When: Tab 키 입력
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Then: 4개 공백이 삽입됨
    const text = await editor.getText();
    expect(text).toBe('hello    '); // 4 spaces after hello
  });

  test('E-071: Shift+Tab으로 들여쓰기 제거', async ({ page }) => {
    // Given: 4개 공백으로 시작하는 텍스트
    await editor.type('    hello'); // 4 spaces + hello

    // When: 줄 시작으로 이동 후 Shift+Tab
    await page.keyboard.press('Home');
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(100);

    // Then: 앞의 4개 공백이 제거됨
    const text = await editor.getText();
    expect(text).toBe('hello');
  });

  test('E-072: 여러 줄 선택 후 Tab으로 일괄 들여쓰기', async ({ page }) => {
    // Given: 3줄 입력
    await editor.type('line1');
    await page.keyboard.press('Enter');
    await editor.type('line2');
    await page.keyboard.press('Enter');
    await editor.type('line3');

    // When: 전체 선택 후 Tab
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Then: 모든 줄에 4개 공백 추가
    const text = await editor.getText();
    expect(text).toBe('    line1\n    line2\n    line3');
  });

  test('E-073: 여러 줄 선택 후 Shift+Tab으로 일괄 내어쓰기', async ({ page }) => {
    // Given: 들여쓰기된 3줄
    await editor.type('    line1');
    await page.keyboard.press('Enter');
    await editor.type('    line2');
    await page.keyboard.press('Enter');
    await editor.type('    line3');

    // When: 전체 선택 후 Shift+Tab
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(100);

    // Then: 모든 줄에서 들여쓰기 제거
    const text = await editor.getText();
    expect(text).toBe('line1\nline2\nline3');
  });

  test('E-074: Tab 키 후 포커스 유지', async ({ page }) => {
    // Given: 텍스트 입력
    await editor.type('test');

    // When: Tab 키 입력 후 추가 텍스트 입력
    await page.keyboard.press('Tab');
    await editor.type('more');

    // Then: 포커스가 유지되어 추가 텍스트가 입력됨
    const text = await editor.getText();
    expect(text).toBe('test    more');
  });

  test('E-075: Undo로 들여쓰기 되돌리기', async ({ page }) => {
    // Given: 텍스트 입력 후 Tab
    await editor.type('hello');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    let text = await editor.getText();
    expect(text).toBe('hello    ');

    // When: Undo
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(100);

    // Then: Tab 입력이 되돌려짐
    text = await editor.getText();
    expect(text).toBe('hello');
  });

  test('E-076: 줄 시작에서 Tab 입력', async ({ page }) => {
    // Given: 텍스트 입력 후 줄 시작으로 이동
    await editor.type('hello');
    await page.keyboard.press('Home');

    // When: Tab 키 입력
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Then: 줄 앞에 4개 공백 추가
    const text = await editor.getText();
    expect(text).toBe('    hello');
  });

  test('E-077: 들여쓰기가 없는 줄에서 Shift+Tab은 무시', async ({ page }) => {
    // Given: 들여쓰기 없는 텍스트
    await editor.type('hello');

    // When: Shift+Tab
    await page.keyboard.press('Home');
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(100);

    // Then: 변화 없음
    const text = await editor.getText();
    expect(text).toBe('hello');
  });

  test('E-078: 2개 공백만 있을 때 Shift+Tab', async ({ page }) => {
    // Given: 2개 공백으로 시작
    await editor.type('  hello'); // 2 spaces

    // When: Shift+Tab
    await page.keyboard.press('Home');
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(100);

    // Then: 2개 공백만 제거됨 (있는 만큼만)
    const text = await editor.getText();
    expect(text).toBe('hello');
  });
});
