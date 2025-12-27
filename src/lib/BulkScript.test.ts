import { describe, it, expect } from 'vitest';
import { ScriptExecution, EditorAdapter } from './ScriptExecution';
import { requireShim } from './RequireShim';
import * as fs from 'fs';
import * as path from 'path';

// Mock Editor for Testing
class TestAdapter implements EditorAdapter {
  constructor(public content: string) {}
  getText() {
    return this.content;
  }
  getSelection() {
    return '';
  }
  replaceSelection(t: string) {
    this.content = t;
  }
  replaceText(t: string) {
    this.content = t;
  }
  insertAtCursor(t: string) {
    this.content += t;
  }
}

const SCRIPTS_DIR = path.resolve(__dirname, '../../src-tauri/scripts');
const files = fs.readdirSync(SCRIPTS_DIR).filter((f) => f.endsWith('.js'));

describe('Global Script Compatibility Audit', () => {
  files.forEach((fileName) => {
    it(`${fileName}: should execute without strict-mode or runtime errors`, () => {
      const scriptPath = path.join(SCRIPTS_DIR, fileName);
      const content = fs.readFileSync(scriptPath, 'utf8');

      // Choose initial input based on script name (crude but effective)
      let initialInput = 'hello world';
      if (fileName.toLowerCase().includes('json') || fileName.toLowerCase().includes('yaml')) {
        initialInput = '{"test": "data", "count": 123}';
      } else if (fileName.includes('URL') || fileName.includes('HTML')) {
        initialInput = 'hello%20world%3F';
      }

      const adapter = new TestAdapter(initialInput);
      const exec = new ScriptExecution(adapter);

      // Execute in the SAME WAY as worker.ts
      const runner = () => {
        const fn = new Function(
          'input',
          'require',
          `
                    var buf, i, url, R, G, B, result, res, data;
                    ${content}
                    if (typeof main === 'function') {
                        main(input);
                    }
                `
        );
        fn(exec, requireShim);
      };

      expect(runner).not.toThrow();
    });
  });
});
