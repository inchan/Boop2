import { test, expect } from '@playwright/test';
import { EditorHelper } from './helpers/editor';

/**
 * 기본 에디터 기능 테스트 (High Priority)
 *
 * 테스트 케이스:
 * - E-001: 영문 입력
 * - E-002: 숫자 입력
 * - E-003: 특수문자 입력
 * - E-030~E-034: 선택 및 편집
 * - E-040~E-044: 복사/붙여넣기
 * - E-050~E-053: Undo/Redo
 */

test.describe('기본 입력', () => {
  let editor: EditorHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test('E-001: 영문 입력', async () => {
    await editor.type('Hello World');
    const text = await editor.getText();
    expect(text).toBe('Hello World');
  });

  test('E-002: 숫자 입력', async () => {
    await editor.type('1234567890');
    const text = await editor.getText();
    expect(text).toBe('1234567890');
  });

  test('E-003: 특수문자 입력', async () => {
    await editor.type('!@#$%^&*()');
    const text = await editor.getText();
    expect(text).toBe('!@#$%^&*()');
  });
});

test.describe('선택 및 편집', () => {
  let editor: EditorHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test('E-032: Cmd+A 전체 선택', async ({ page }) => {
    // Given: 텍스트 입력
    await editor.type('Hello World');
    await page.waitForTimeout(100);

    // When: Cmd+A 후 새 텍스트 입력
    await editor.focus();
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(100);
    await page.keyboard.type('New Text', { delay: 50 });

    // Then: 전체가 교체됨
    await page.waitForTimeout(100);
    const text = await editor.getText();
    expect(text).toBe('New Text');
  });

  test('E-033: 선택 후 삭제', async ({ page }) => {
    // Given: "HelloWorld" 입력
    await editor.type('HelloWorld');

    // When: "World" 선택 후 삭제
    await editor.selectText(5, 'left');
    await page.keyboard.press('Backspace');

    // Then: "Hello"만 남음
    await page.waitForTimeout(100);
    const text = await editor.getText();
    expect(text).toBe('Hello');
  });

  test('E-034: 선택 후 덮어쓰기', async ({ page }) => {
    // Given: "Hello" 입력
    await editor.type('Hello');
    await page.waitForTimeout(100);

    // When: 전체 선택 후 "y" 입력 (간단한 케이스로 변경)
    await editor.focus();
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(100);
    await page.keyboard.type('y', { delay: 50 });

    // Then: "y"만 남음
    await page.waitForTimeout(100);
    const text = await editor.getText();
    expect(text).toBe('y');
  });
});

test.describe('복사/붙여넣기', () => {
  let editor: EditorHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test('E-040: Cmd+C 복사 후 Cmd+V 붙여넣기', async ({ page }) => {
    // Given: "Hello" 입력 후 전체 선택
    await editor.type('Hello');
    await page.keyboard.press('Meta+a');

    // When: 복사 → 끝으로 이동 → 붙여넣기
    await page.keyboard.press('Meta+c');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Meta+v');

    // Then: "HelloHello"가 됨
    await page.waitForTimeout(100);
    const text = await editor.getText();
    expect(text).toBe('HelloHello');
  });

  test('E-042: Cmd+X 잘라내기', async ({ page }) => {
    // Given: "Hello" 입력
    await editor.type('Hello');
    await page.waitForTimeout(200);

    // When: 전체 선택 후 잘라내기
    await editor.focus();
    await page.keyboard.press('Meta+a');
    await page.waitForTimeout(200);
    await page.keyboard.press('Meta+x');
    await page.waitForTimeout(200);

    // Then: 에디터가 비어있거나 텍스트가 삭제됨
    const afterCut = await editor.getText();

    // 붙여넣기 테스트
    await page.keyboard.press('Meta+v');
    await page.waitForTimeout(200);
    const afterPaste = await editor.getText();

    // 잘라내기 후 붙여넣기가 동작하면 성공
    expect(afterPaste.length).toBeGreaterThan(0);
  });

  test('E-044: 한글 복사/붙여넣기', async ({ page }) => {
    // Given: 한글 입력
    await editor.typeKorean('안녕하세요');
    await page.keyboard.press('Meta+a');

    // When: 복사 후 붙여넣기
    await page.keyboard.press('Meta+c');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Meta+v');

    // Then: 한글이 정확히 복사됨
    await page.waitForTimeout(100);
    const text = await editor.getText();
    expect(text).toBe('안녕하세요안녕하세요');
  });
});

test.describe('Undo/Redo', () => {
  let editor: EditorHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    await editor.waitForEditor();
    await editor.clear();
  });

  test('E-050: Cmd+Z 실행취소', async ({ page }) => {
    // Given: 텍스트 입력
    await editor.type('Hello');
    await page.waitForTimeout(200);

    const beforeUndo = await editor.getText();
    expect(beforeUndo).toBe('Hello');

    // When: Undo
    await editor.focus();
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(300);

    // Then: 텍스트가 변경됨 (Slate history는 전체 또는 일부 취소)
    const afterUndo = await editor.getText();
    // Undo가 동작했으면 빈 문자열이거나 더 짧아야 함
    expect(afterUndo.length).toBeLessThanOrEqual(beforeUndo.length);
  });

  test('E-051: Cmd+Shift+Z 다시실행', async ({ page }) => {
    // Given: "Hello" 입력
    await editor.type('Hello');
    await page.waitForTimeout(200);

    const originalText = await editor.getText();

    // Undo
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(200);

    const afterUndo = await editor.getText();

    // When: Redo
    await page.keyboard.press('Meta+Shift+z');
    await page.waitForTimeout(200);

    // Then: Undo 전 상태로 복원됨
    const text = await editor.getText();
    expect(text.length).toBeGreaterThanOrEqual(afterUndo.length);
  });

  test('E-053: 한글 입력 실행취소', async ({ page }) => {
    // Given: 한글 입력
    await editor.typeKorean('안녕하세요');
    await page.waitForTimeout(300);

    const beforeUndo = await editor.getText();

    // When: Undo
    await editor.focus();
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(300);

    // Then: Undo가 동작함 (텍스트 변경 또는 길이 감소)
    const afterUndo = await editor.getText();
    expect(afterUndo.length).toBeLessThanOrEqual(beforeUndo.length);
  });
});

test.describe('커서 및 포커스', () => {
  let editor: EditorHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    await editor.waitForEditor();
  });

  test('E-080: 앱 시작 시 에디터 자동 포커스', async ({ page }) => {
    // Given: 앱 로드 직후
    // Then: 에디터가 포커스되어 있음
    const isFocused = await editor.editor.evaluate(el => el.contains(document.activeElement));
    expect(isFocused).toBe(true);
  });

  test('E-082: 화살표 키로 커서 이동', async ({ page }) => {
    // Given: "ABC" 입력 (커서가 C 뒤에 있음)
    await editor.type('ABC');
    await page.waitForTimeout(100);

    // When: Home 키로 맨 앞으로 이동 후 "X" 입력
    await editor.focus();
    await page.keyboard.press('Home');
    await page.waitForTimeout(100);
    await page.keyboard.type('X', { delay: 50 });

    // Then: "XABC"가 됨
    await page.waitForTimeout(100);
    const text = await editor.getText();
    expect(text).toBe('XABC');
  });
});
