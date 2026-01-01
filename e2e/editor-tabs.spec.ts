import { test, expect } from '@playwright/test';
import { EditorHelper, TabBarHelper } from './helpers/editor';

/**
 * 탭 전환 테스트 (Critical/High Priority)
 *
 * 테스트 케이스:
 * - E-060: 탭 전환 후 내용 유지
 * - E-061: 새 탭 생성
 * - E-062: 탭 닫기
 * - E-063: 탭 번호 선택
 */

test.describe('탭 관리', () => {
  let editor: EditorHelper;
  let tabBar: TabBarHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    editor = new EditorHelper(page);
    tabBar = new TabBarHelper(page);
    await editor.waitForEditor();
  });

  test('E-060: 탭 전환 후 내용 유지', async ({ page }) => {
    // Given: 첫번째 탭에 "Tab 1 Content" 입력
    await editor.clear();
    await editor.type('Tab 1 Content');
    await page.waitForTimeout(100);

    // When: 새 탭 생성 → 내용 입력 → 첫번째 탭으로 돌아감
    await tabBar.addTab();
    await page.waitForTimeout(300);
    await editor.type('Tab 2 Content');
    await page.waitForTimeout(100);

    // 첫번째 탭 클릭으로 선택
    await tabBar.clickTab(0);
    await page.waitForTimeout(300);

    // Then: 첫번째 탭 내용이 유지됨
    const text = await editor.getText();
    expect(text).toBe('Tab 1 Content');
  });

  test('E-061: Cmd+T로 새 탭 생성', async () => {
    // Given: 1개 탭
    let tabCount = await tabBar.getTabCount();
    expect(tabCount).toBe(1);

    // When: Cmd+T
    await tabBar.addTab();

    // Then: 2개 탭
    tabCount = await tabBar.getTabCount();
    expect(tabCount).toBe(2);
  });

  test('E-062: Cmd+W로 탭 닫기', async () => {
    // Given: 2개 탭
    await tabBar.addTab();
    let tabCount = await tabBar.getTabCount();
    expect(tabCount).toBe(2);

    // When: Cmd+W
    await tabBar.closeCurrentTab();

    // Then: 1개 탭 (최소 1개 유지)
    tabCount = await tabBar.getTabCount();
    expect(tabCount).toBe(1);
  });

  test('E-063: 탭 클릭으로 탭 선택', async ({ page }) => {
    // Given: 3개 탭 생성, 각각 다른 내용
    await editor.clear();
    await editor.type('Content 1');
    await page.waitForTimeout(100);

    await tabBar.addTab();
    await page.waitForTimeout(300);
    await editor.type('Content 2');
    await page.waitForTimeout(100);

    await tabBar.addTab();
    await page.waitForTimeout(300);
    await editor.type('Content 3');
    await page.waitForTimeout(100);

    // When: 첫번째 탭 클릭
    await tabBar.clickTab(0);
    await page.waitForTimeout(300);

    // Then: 첫번째 탭 내용 표시
    let text = await editor.getText();
    expect(text).toBe('Content 1');

    // When: 두번째 탭 클릭
    await tabBar.clickTab(1);
    await page.waitForTimeout(300);

    // Then: 두번째 탭 내용 표시
    text = await editor.getText();
    expect(text).toBe('Content 2');
  });

  test('E-064: 탭 전환 시 한글 내용 유지', async ({ page }) => {
    // Given: 첫번째 탭에 한글 입력
    await editor.clear();
    await editor.typeKorean('안녕하세요');
    await page.waitForTimeout(200);

    // When: 새 탭 → 돌아옴
    await tabBar.addTab();
    await page.waitForTimeout(300);
    await editor.typeKorean('반갑습니다');
    await page.waitForTimeout(200);

    // 첫번째 탭 클릭
    await tabBar.clickTab(0);
    await page.waitForTimeout(300);

    // Then: 한글 내용 유지
    const text = await editor.getText();
    expect(text).toBe('안녕하세요');
  });
});
