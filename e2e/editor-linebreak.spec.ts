import { test, expect } from '@playwright/test';
import { EditorHelper } from './helpers/editor';

/**
 * 줄바꿈 및 멀티라인 테스트 (Critical/High Priority)
 *
 * 테스트 케이스:
 * - E-020: Enter 줄바꿈
 * - E-021: 라인 번호 동기화
 * - E-022: 중간 줄바꿈
 * - E-023: 빈 줄 처리
 */

test.describe('줄바꿈 및 멀티라인', () => {
  let editor: EditorHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test('E-020: Enter 키로 새 줄 생성', async ({ page }) => {
    // Given: 빈 에디터
    // When: 텍스트 입력 후 Enter
    await editor.type('첫번째 줄');
    await page.keyboard.press('Enter');
    await editor.type('두번째 줄');

    // Then: 2줄이 생성됨
    const lineCount = await editor.getLineCount();
    expect(lineCount).toBe(2);

    const text = await editor.getText();
    expect(text).toContain('첫번째 줄');
    expect(text).toContain('두번째 줄');
  });

  test('E-021: 라인 번호 동기화', async ({ page }) => {
    // Given: 빈 에디터 (1줄)
    let lineCount = await editor.getLineCount();
    expect(lineCount).toBe(1);

    // When: Enter로 줄 추가
    await editor.type('Line 1');
    await page.keyboard.press('Enter');
    await editor.type('Line 2');
    await page.keyboard.press('Enter');
    await editor.type('Line 3');

    // Then: 라인 번호가 3까지 표시됨
    lineCount = await editor.getLineCount();
    expect(lineCount).toBe(3);

    // 라인 번호 텍스트 확인
    const gutterText = await editor.gutter.innerText();
    expect(gutterText).toContain('1');
    expect(gutterText).toContain('2');
    expect(gutterText).toContain('3');
  });

  test('E-022: 텍스트 중간에서 Enter', async ({ page }) => {
    // Given: "HelloWorld" 입력
    await editor.type('HelloWorld');

    // When: "Hello" 뒤에서 Enter (World 앞)
    await editor.focus();
    await page.keyboard.press('Meta+ArrowRight'); // 끝으로
    await editor.moveCursor('left', 5); // "World" 앞으로
    await page.keyboard.press('Enter');

    // Then: "Hello"와 "World"가 각각 다른 줄에
    await page.waitForTimeout(100);
    const lineCount = await editor.getLineCount();
    expect(lineCount).toBe(2);
  });

  test('E-023: 연속 Enter로 빈 줄 여러 개 생성', async ({ page }) => {
    // Given: 빈 에디터
    // When: Enter 3번
    await editor.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');

    // Then: 4줄 생성 (빈 줄 포함)
    const lineCount = await editor.getLineCount();
    expect(lineCount).toBe(4);
  });

  test('E-024: 줄 삭제 시 라인 번호 감소', async ({ page }) => {
    // Given: 3줄 생성
    await editor.type('Line 1');
    await page.keyboard.press('Enter');
    await editor.type('Line 2');
    await page.keyboard.press('Enter');
    await editor.type('Line 3');

    let lineCount = await editor.getLineCount();
    expect(lineCount).toBe(3);

    // When: 전체 선택 후 삭제하고 2줄만 다시 입력
    await editor.focus();
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(50);
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);

    await editor.type('Line 1');
    await page.keyboard.press('Enter');
    await editor.type('Line 2');

    // Then: 2줄
    await page.waitForTimeout(100);
    lineCount = await editor.getLineCount();
    expect(lineCount).toBe(2);
  });
});
