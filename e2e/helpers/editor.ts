import { Page, Locator } from '@playwright/test';

/**
 * Editor Page Object - Slate.js 에디터 조작 헬퍼
 */
export class EditorHelper {
  readonly page: Page;
  readonly editorContainer: Locator;
  readonly editor: Locator;
  readonly gutter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editorContainer = page.locator('.slate-editor-container');
    // Slate.js는 contenteditable div에 data-slate-editor 속성 추가
    this.editor = page.locator('[data-slate-editor="true"]');
    this.gutter = page.locator('.slate-gutter');
  }

  /**
   * 에디터가 로드될 때까지 대기
   */
  async waitForEditor() {
    await this.editor.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * 에디터에 포커스
   */
  async focus() {
    await this.editor.click();
    await this.page.waitForTimeout(100);
  }

  /**
   * 텍스트 입력 (IME 시뮬레이션 포함)
   */
  async type(text: string, options?: { delay?: number }) {
    await this.focus();
    await this.page.keyboard.type(text, { delay: options?.delay ?? 50 });
    // IME 완료 대기
    await this.page.waitForTimeout(100);
  }

  /**
   * 한글 입력 (IME composition 시뮬레이션)
   */
  async typeKorean(text: string) {
    await this.focus();
    // 한글은 천천히 입력해야 composition이 제대로 동작
    await this.page.keyboard.type(text, { delay: 100 });
    await this.page.waitForTimeout(150);
  }

  /**
   * 에디터 전체 텍스트 가져오기
   */
  async getText(): Promise<string> {
    // placeholder 요소 제외하고 실제 텍스트만 가져오기
    const text = await this.editor.evaluate((el) => {
      const paragraphs = el.querySelectorAll('.slate-paragraph');
      const texts: string[] = [];
      paragraphs.forEach((p) => {
        // data-slate-placeholder 속성이 있는 요소 제외
        const placeholder = p.querySelector('[data-slate-placeholder="true"]');
        if (placeholder) {
          texts.push('');
        } else {
          texts.push(p.textContent || '');
        }
      });
      return texts.join('\n');
    });
    return text;
  }

  /**
   * 라인 수 가져오기
   */
  async getLineCount(): Promise<number> {
    const lineNumbers = await this.gutter.locator('.slate-line-number').all();
    return lineNumbers.length;
  }

  /**
   * 에디터 내용 초기화
   */
  async clear() {
    await this.focus();
    await this.page.keyboard.press('Meta+a');
    await this.page.keyboard.press('Backspace');
    await this.page.waitForTimeout(50);
  }

  /**
   * 특정 키 입력
   */
  async pressKey(key: string) {
    await this.page.keyboard.press(key);
    await this.page.waitForTimeout(50);
  }

  /**
   * 텍스트 선택 (Shift + 화살표)
   */
  async selectText(charCount: number, direction: 'left' | 'right' = 'right') {
    const arrow = direction === 'right' ? 'ArrowRight' : 'ArrowLeft';
    for (let i = 0; i < charCount; i++) {
      await this.page.keyboard.press(`Shift+${arrow}`);
    }
    await this.page.waitForTimeout(50);
  }

  /**
   * 커서를 특정 위치로 이동
   */
  async moveCursor(direction: 'left' | 'right' | 'up' | 'down', count: number = 1) {
    const keyMap = {
      left: 'ArrowLeft',
      right: 'ArrowRight',
      up: 'ArrowUp',
      down: 'ArrowDown',
    };
    // 에디터에 포커스 확인
    await this.focus();
    for (let i = 0; i < count; i++) {
      await this.page.keyboard.press(keyMap[direction]);
      await this.page.waitForTimeout(30);
    }
    await this.page.waitForTimeout(50);
  }

  /**
   * 텍스트 중간에 삽입
   */
  async insertAtPosition(text: string, fromEnd: number) {
    await this.focus();
    // 끝으로 이동
    await this.page.keyboard.press('Meta+ArrowDown');
    await this.page.keyboard.press('Meta+ArrowRight');
    // fromEnd 만큼 왼쪽으로 이동
    await this.moveCursor('left', fromEnd);
    // 텍스트 삽입
    await this.page.keyboard.type(text, { delay: 50 });
    await this.page.waitForTimeout(100);
  }
}

/**
 * 탭바 조작 헬퍼
 */
export class TabBarHelper {
  readonly page: Page;
  readonly tabBar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tabBar = page.locator('.tab-bar-container');
  }

  /**
   * 새 탭 추가 (+ 버튼 클릭)
   */
  async addTab() {
    // 브라우저 단축키 충돌 방지를 위해 UI 클릭 사용
    const addButton = this.tabBar.locator('.add-tab-btn').first();
    await addButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 현재 탭 닫기 (x 버튼 클릭)
   */
  async closeCurrentTab() {
    // 활성 탭의 닫기 버튼 클릭
    const activeTab = this.tabBar.locator('.tab-item.active').first();
    const closeButton = activeTab.locator('.tab-close').first();
    await closeButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * N번째 탭 선택 (1-indexed)
   */
  async selectTab(index: number) {
    await this.page.keyboard.press(`Meta+${index}`);
    await this.page.waitForTimeout(200);
  }

  /**
   * 탭 개수 가져오기
   */
  async getTabCount(): Promise<number> {
    const tabs = await this.tabBar.locator('.tab-item').all();
    return tabs.length;
  }

  /**
   * N번째 탭 클릭 (0-indexed)
   */
  async clickTab(index: number) {
    const tabs = await this.tabBar.locator('.tab-item').all();
    if (index < tabs.length) {
      await tabs[index].click();
      await this.page.waitForTimeout(200);
    }
  }
}

/**
 * 커맨드 팔레트 조작 헬퍼
 */
export class CommandPaletteHelper {
  readonly page: Page;
  readonly palette: Locator;

  constructor(page: Page) {
    this.page = page;
    this.palette = page.locator('.command-palette');
  }

  /**
   * 팔레트 열기
   */
  async open() {
    await this.page.keyboard.press('Meta+b');
    await this.palette.waitFor({ state: 'visible', timeout: 2000 });
  }

  /**
   * 팔레트 닫기
   */
  async close() {
    await this.page.keyboard.press('Escape');
    await this.palette.waitFor({ state: 'hidden', timeout: 2000 });
  }

  /**
   * 스크립트 검색 및 선택
   */
  async selectScript(scriptName: string) {
    await this.open();
    await this.page.keyboard.type(scriptName);
    await this.page.waitForTimeout(200);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }
}
