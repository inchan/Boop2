import { describe, it, expect } from 'vitest';
import { ScriptExecution, EditorAdapter } from './ScriptExecution';

class MockEditorAdapter implements EditorAdapter {
  content: string;
  selectionStart: number;
  selectionEnd: number;

  constructor(content: string, selStart: number, selEnd: number) {
    this.content = content;
    this.selectionStart = selStart;
    this.selectionEnd = selEnd;
  }

  getText(): string {
    return this.content;
  }

  getSelection(): string {
    return this.content.substring(this.selectionStart, this.selectionEnd);
  }

  replaceSelection(text: string): void {
    const before = this.content.substring(0, this.selectionStart);
    const after = this.content.substring(this.selectionEnd);
    this.content = before + text + after;
    // Update selection to cover new text
    this.selectionEnd = this.selectionStart + text.length;
  }

  replaceText(text: string): void {
    this.content = text;
    this.selectionStart = 0;
    this.selectionEnd = 0;
  }

  insertAtCursor(text: string): void {
    this.replaceSelection(text);
  }
}

describe('ScriptExecution Logic', () => {
  it('modifies full text when no selection exists', () => {
    const adapter = new MockEditorAdapter('Hello World', 0, 0);
    const exec = new ScriptExecution(adapter);

    expect(exec.text).toBe('Hello World');

    // Modify
    exec.text = 'Goodbye World';

    expect(adapter.getText()).toBe('Goodbye World');
  });

  it('modifies only selection when selection exists', () => {
    const adapter = new MockEditorAdapter('Hello World', 0, 5); // Select "Hello"
    const exec = new ScriptExecution(adapter);

    expect(exec.text).toBe('Hello');

    // Modify selection
    exec.text = 'Hi';

    expect(adapter.getText()).toBe('Hi World');
  });

  it('insert() appends text at cursor', () => {
    const adapter = new MockEditorAdapter('Hello', 5, 5); // Cursor at end
    const exec = new ScriptExecution(adapter);

    exec.insert(' World');

    expect(adapter.getText()).toBe('Hello World');
  });
});
