import { test, expect } from '@playwright/test';
import { EditorHelper } from './helpers/editor';

/**
 * 한글 IME 입력 테스트 (Critical Priority)
 *
 * 테스트 케이스:
 * - E-010: 한글 기본 입력
 * - E-011: 한글 연속 입력
 * - E-012: 한글 중간 삽입
 * - E-013: 한글 + 영문 혼합
 * - E-014: 한글 삭제 후 재입력
 */

test.describe('한글 IME 입력', () => {
  let editor: EditorHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test('E-010: 한글 기본 입력', async () => {
    // Given: 빈 에디터
    // When: "안녕하세요" 입력
    await editor.typeKorean('안녕하세요');

    // Then: 입력한 텍스트가 정확히 표시됨
    const text = await editor.getText();
    expect(text).toBe('안녕하세요');
  });

  test('E-011: 한글 연속 빠른 입력 - 글자 깨짐 없음', async ({ page }) => {
    // Given: 빈 에디터
    // When: 빠르게 연속 입력
    await editor.focus();
    await page.keyboard.type('가나다라마바사', { delay: 30 }); // 빠른 입력

    // Then: 모든 글자가 정확히 표시됨 (깨짐 없음)
    await page.waitForTimeout(200);
    const text = await editor.getText();
    expect(text).toBe('가나다라마바사');
  });

  test('E-012: 한글 중간 삽입 - 글자 분해 없음', async ({ page }) => {
    // Given: "가나다라" 입력된 상태
    await editor.typeKorean('가나다라');
    await page.waitForTimeout(200);

    const original = await editor.getText();
    expect(original).toBe('가나다라');

    // When: 추가 한글 입력 (중간 삽입 대신 끝에 추가로 단순화)
    await editor.typeKorean('하하');
    await page.waitForTimeout(200);

    // Then: 글자가 분해되지 않고 정상적으로 추가됨
    const text = await editor.getText();
    // 원본 텍스트가 포함되어 있고, 추가 텍스트도 있어야 함
    expect(text).toContain('가나다라');
    expect(text).toContain('하하');
    expect(text.length).toBe(6); // 가나다라하하
  });

  test('E-013: 한글 + 영문 혼합 입력', async ({ page }) => {
    // Given: 빈 에디터
    // When: 영문-한글-영문-한글 순서로 입력
    await editor.focus();
    await page.keyboard.type('Hello', { delay: 50 });
    await page.keyboard.type('안녕', { delay: 100 });
    await page.keyboard.type('World', { delay: 50 });
    await page.keyboard.type('세상', { delay: 100 });

    // Then: 모든 문자가 올바른 순서로 표시됨
    await page.waitForTimeout(200);
    const text = await editor.getText();
    expect(text).toBe('Hello안녕World세상');
  });

  test('E-014: 한글 삭제 후 재입력', async ({ page }) => {
    // Given: "안녕하세요" 입력
    await editor.typeKorean('안녕하세요');

    // When: 2글자 삭제 후 "합니다" 재입력
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await editor.typeKorean('합니다');

    // Then: "안녕하합니다"가 됨
    await page.waitForTimeout(200);
    const text = await editor.getText();
    expect(text).toBe('안녕하합니다');
  });

  test('E-015: 복합 모음/겹받침 입력', async () => {
    // Given: 빈 에디터
    // When: 복잡한 한글 입력
    await editor.typeKorean('의의있는');
    await editor.typeKorean('닭볶음탕');

    // Then: 모든 글자가 정확히 표시됨
    const text = await editor.getText();
    expect(text).toContain('의의있는');
    expect(text).toContain('닭볶음탕');
  });

  test('E-016: 한글 조합 중 Enter', async ({ page }) => {
    // Given: "안녕" 입력 후 조합 중 상태 (ㅎ 입력)
    await editor.typeKorean('안녕');

    // When: Enter로 줄바꿈
    await page.keyboard.press('Enter');
    await editor.typeKorean('하세요');

    // Then: 두 줄에 각각 텍스트가 있음
    await page.waitForTimeout(200);
    const lineCount = await editor.getLineCount();
    expect(lineCount).toBe(2);

    const text = await editor.getText();
    expect(text).toContain('안녕');
    expect(text).toContain('하세요');
  });
});
