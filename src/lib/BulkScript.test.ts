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
      } else if (fileName === 'HexToASCII.js') {
        initialInput = '48656C6C6F'; // "Hello" in hex
      } else if (fileName === 'SumAll.js') {
        initialInput = '1\n2\n3\n4\n5'; // List of numbers
      } else if (fileName === 'ASCIIToHex.js') {
        initialInput = 'Hello'; // Plain text for hex conversion
      } else if (fileName === 'BinaryToDecimal.js') {
        initialInput = '1010'; // Binary number
      } else if (fileName === 'DecimalToBinary.js') {
        initialInput = '10'; // Decimal number
      } else if (fileName === 'DecimalToHex.js') {
        initialInput = '255'; // Decimal number
      } else if (fileName === 'HexToDecimal.js') {
        initialInput = 'FF'; // Hex number
      } else if (fileName === 'DateToTimestamp.js' || fileName === 'DateToUTC.js') {
        initialInput = '2025-01-15T12:00:00Z'; // ISO date string
      } else if (fileName === 'JWTDecode.js') {
        initialInput =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Valid JWT
      } else if (fileName === 'PhpUnserialize.js') {
        initialInput = 's:11:"hello world";'; // PHP serialized string
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
