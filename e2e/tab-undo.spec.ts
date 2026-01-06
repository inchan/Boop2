import { test, expect } from '@playwright/test';
import { EditorHelper, TabBarHelper } from './helpers/editor';

/**
 * 탭별 Undo/Redo 독립성 테스트 (Feature: 010-fix-tab-undo)
 *
 * User Stories:
 * - US1 (P1): Tab-Independent Undo
 * - US2 (P1): Tab-Independent Redo
 * - US3 (P2): History Persistence Across Tab Switches
 *
 * 테스트 케이스:
 * - E-070: 탭 간 Undo 독립성 검증
 * - E-071: 탭 간 Redo 독립성 검증
 * - E-072: 탭 전환 후 히스토리 보존 검증
 * - E-073: 5개 탭 시나리오 독립성 검증
 */

test.describe('탭별 Undo/Redo 독립성', () => {
  let editor: EditorHelper;
  let tabBar: TabBarHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    tabBar = new TabBarHelper(page);
    await editor.waitForEditor();
  });

  test('E-070: 탭 1 편집 후 탭 2에서 Cmd+Z → 탭 1 변경 없음 (US1)', async ({ page }) => {
    // Given: 탭 1에 "Hello" 입력
    await editor.clear();
    await editor.type('Hello');
    await page.waitForTimeout(100);

    // 탭 1 내용 확인
    let tab1Content = await editor.getText();
    expect(tab1Content).toBe('Hello');

    // When: 탭 2 생성 후 "World" 입력
    await tabBar.addTab();
    await page.waitForTimeout(300);
    await editor.type('World');
    await page.waitForTimeout(100);

    // 탭 2 내용 확인
    let tab2Content = await editor.getText();
    expect(tab2Content).toBe('World');

    // 탭 2에서 Cmd+Z 실행
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(100);

    // Then: 탭 2의 "World"만 되돌려지고 탭 1의 "Hello"는 유지
    tab2Content = await editor.getText();
    expect(tab2Content).toBe(''); // 탭 2는 빈 상태로 되돌려짐

    // 탭 1으로 돌아가 내용 확인
    await tabBar.clickTab(0);
    await page.waitForTimeout(300);

    tab1Content = await editor.getText();
    expect(tab1Content).toBe('Hello'); // 탭 1은 그대로
  });

  test('E-071: 탭별 Redo 동작 확인 (US2)', async ({ page }) => {
    // Given: 탭 1에 텍스트 입력
    await editor.clear();
    await editor.type('First');
    await page.waitForTimeout(200);

    let content = await editor.getText();
    expect(content).toBe('First');

    // Undo 실행
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(100);
    content = await editor.getText();
    expect(content).toBe(''); // Undo로 빈 상태

    // Redo 실행 (탭 전환 없이)
    await page.keyboard.press('Meta+Shift+z');
    await page.waitForTimeout(100);
    content = await editor.getText();
    expect(content).toBe('First'); // Redo로 복원

    // When: 탭 2 생성
    await tabBar.addTab();
    await page.waitForTimeout(300);
    await editor.type('Second');
    await page.waitForTimeout(100);

    content = await editor.getText();
    expect(content).toBe('Second');

    // 탭 2에서 Undo
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(100);
    content = await editor.getText();
    expect(content).toBe(''); // 탭 2 내용 제거

    // 탭 2에서 Redo
    await page.keyboard.press('Meta+Shift+z');
    await page.waitForTimeout(100);
    content = await editor.getText();
    expect(content).toBe('Second'); // 탭 2 복원

    // Then: 탭 1 내용도 여전히 유지
    await tabBar.clickTab(0);
    await page.waitForTimeout(300);
    content = await editor.getText();
    expect(content).toBe('First'); // 탭 1은 그대로
  });

  test('E-072: 탭 전환 후 돌아왔을 때 히스토리 보존 (US3)', async ({ page }) => {
    // Given: 탭 1에서 텍스트 입력
    await editor.clear();
    await editor.type('Hello World');
    await page.waitForTimeout(200);

    let content = await editor.getText();
    expect(content).toBe('Hello World');

    // When: 탭 2로 전환 후 다시 탭 1로 돌아옴
    await tabBar.addTab();
    await page.waitForTimeout(300);
    await editor.type('Tab 2 Content');
    await page.waitForTimeout(100);

    await tabBar.clickTab(0);
    await page.waitForTimeout(300);

    // Then: 탭 1의 내용이 유지되어 있고, Undo가 동작함
    content = await editor.getText();
    expect(content).toBe('Hello World');

    // Cmd+Z 실행 → 히스토리가 보존되어 되돌려짐
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(100);
    content = await editor.getText();
    expect(content).toBe(''); // 전체 입력이 되돌려짐 (Slate는 연속 입력을 하나로 병합)

    // Redo로 복원 가능
    await page.keyboard.press('Meta+Shift+z');
    await page.waitForTimeout(100);
    content = await editor.getText();
    expect(content).toBe('Hello World'); // 복원됨
  });

  test('E-073: 5개 탭 시나리오에서 각 탭 히스토리 독립 유지', async ({ page }) => {
    const tabContents = ['Tab1', 'Tab2', 'Tab3', 'Tab4', 'Tab5'];

    // Given: 5개 탭 생성, 각각 다른 내용 입력
    // 첫 번째 탭
    await editor.clear();
    await editor.type(tabContents[0]);
    await page.waitForTimeout(100);

    // 나머지 탭들 생성
    for (let i = 1; i < 5; i++) {
      await tabBar.addTab();
      await page.waitForTimeout(300);
      await editor.type(tabContents[i]);
      await page.waitForTimeout(100);
    }

    // 탭 개수 확인
    const tabCount = await tabBar.getTabCount();
    expect(tabCount).toBe(5);

    // When: 각 탭에서 Undo 수행
    // 5번째 탭 (현재 활성)에서 Undo
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(100);
    let content = await editor.getText();
    expect(content).toBe(''); // Tab5 내용 제거됨

    // 3번째 탭으로 이동 후 Undo
    await tabBar.clickTab(2);
    await page.waitForTimeout(300);
    content = await editor.getText();
    expect(content).toBe('Tab3'); // 아직 Undo 안 함

    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(100);
    content = await editor.getText();
    expect(content).toBe(''); // Tab3 내용 제거됨

    // Then: 다른 탭들 내용은 영향 없음
    // 1번째 탭 확인
    await tabBar.clickTab(0);
    await page.waitForTimeout(300);
    content = await editor.getText();
    expect(content).toBe('Tab1'); // 그대로

    // 2번째 탭 확인
    await tabBar.clickTab(1);
    await page.waitForTimeout(300);
    content = await editor.getText();
    expect(content).toBe('Tab2'); // 그대로

    // 4번째 탭 확인
    await tabBar.clickTab(3);
    await page.waitForTimeout(300);
    content = await editor.getText();
    expect(content).toBe('Tab4'); // 그대로
  });

  test('E-074: 빈 탭에서 Cmd+Z 시 아무 변화 없음', async ({ page }) => {
    // Given: 탭 1에서 편집 후 탭 2 생성 (빈 상태)
    await editor.clear();
    await editor.type('Content');
    await page.waitForTimeout(100);

    await tabBar.addTab();
    await page.waitForTimeout(300);

    // 탭 2는 빈 상태
    let content = await editor.getText();
    expect(content).toBe('');

    // When: 탭 2에서 Cmd+Z 실행
    await page.keyboard.press('Meta+z');
    await page.waitForTimeout(100);

    // Then: 아무 변화 없음 (빈 상태 유지)
    content = await editor.getText();
    expect(content).toBe('');

    // 탭 1도 영향 없음
    await tabBar.clickTab(0);
    await page.waitForTimeout(300);
    content = await editor.getText();
    expect(content).toBe('Content');
  });
});
