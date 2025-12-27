import { describe, it, expect } from 'vitest';
import { ScriptExecution, EditorAdapter } from './ScriptExecution';
import { requireShim } from './RequireShim';
import * as fs from 'fs';
import * as path from 'path';

// Helper to run a script file directly in Node environment for testing
function runScriptFile(filePath: string, execution: ScriptExecution) {
  const fullPath = path.resolve(__dirname, '../../' + filePath);
  const content = fs.readFileSync(fullPath, 'utf8');

  // Mimic the runner logic
  const runner = new Function(
    'input',
    'require',
    `
        ${content}
        if (typeof main === 'function') {
            main(input);
        }
    `
  );

  runner(execution, requireShim);
}

class MockAdapter implements EditorAdapter {
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

describe('Real Script Integration Test', () => {
  it('AddSlashes.js: escapes text correctly', () => {
    const adapter = new MockAdapter("kevin's birthday");
    const exec = new ScriptExecution(adapter);

    runScriptFile('src-tauri/scripts/AddSlashes.js', exec);

    // Use double backslash in string literal to represent a single real backslash
    expect(adapter.content).toBe("kevin\\'s birthday");
  });

  it('CamelCase.js: converts to camelCase', () => {
    const adapter = new MockAdapter('hello_world_test');
    const exec = new ScriptExecution(adapter);

    runScriptFile('src-tauri/scripts/CamelCase.js', exec);

    expect(adapter.content).toBe('helloWorldTest');
  });

  it('FormatJSON.js: formats messy JSON', () => {
    const adapter = new MockAdapter('{"a":1,"b":2}');
    const exec = new ScriptExecution(adapter);

    runScriptFile('src-tauri/scripts/FormatJSON.js', exec);

    expect(adapter.content).toContain('\n');
    expect(adapter.content).toContain('  "a": 1');
  });

  it('SHA256.js: hashes text using jshashes', () => {
    const adapter = new MockAdapter('hello');
    const exec = new ScriptExecution(adapter);
    runScriptFile('src-tauri/scripts/SHA256.js', exec);
    // SHA256 of "hello"
    expect(adapter.content).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
  });

  it('JSONtoYAML.js: converts json to yaml', () => {
    const adapter = new MockAdapter('{"foo": "bar"}');
    const exec = new ScriptExecution(adapter);
    runScriptFile('src-tauri/scripts/JSONtoYAML.js', exec);
    expect(adapter.content).toContain('foo: bar');
  });
});
