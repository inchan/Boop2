export interface EditorAdapter {
  getText(): string;
  getSelection(): string;
  replaceSelection(text: string): void;
  replaceText(text: string): void;
  insertAtCursor(text: string): void;
}

export class ScriptExecution {
  private adapter: EditorAdapter;

  constructor(adapter: EditorAdapter) {
    this.adapter = adapter;
  }

  get fullText(): string {
    return this.adapter.getText();
  }
  set fullText(val: string) {
    this.adapter.replaceText(val);
  }

  get selection(): string {
    return this.adapter.getSelection();
  }
  set selection(val: string) {
    this.adapter.replaceSelection(val);
  }

  // The core logic from Boop's ScriptExecution.swift
  // If text is selected, operates on selection. Otherwise, operates on full text.
  get text(): string {
    const sel = this.selection;
    return sel.length > 0 ? sel : this.fullText;
  }
  set text(val: string) {
    if (this.selection.length > 0) {
      this.selection = val;
    } else {
      this.fullText = val;
    }
  }

  insert(text: string) {
    this.adapter.insertAtCursor(text);
  }

  postError(msg: string) {
    console.error('[Script Error]', msg);
  }

  postInfo(msg: string) {
    console.info('[Script Info]', msg);
  }
}
