import { describe, expect, it } from 'vitest';
import {
  createProjectId,
  getDefaultProjectName,
  splitFileNameForDisplay,
} from './projectPathUtils';

describe('projectPathUtils', () => {
  it('derives project names from root paths', () => {
    expect(getDefaultProjectName('/Users/inchan/workspace/private/Boop2')).toBe('Boop2');
    expect(getDefaultProjectName('/Users/inchan/workspace/private/Boop2/')).toBe('Boop2');
  });

  it('creates stable project ids from root paths', () => {
    expect(createProjectId('/tmp/Boop2')).toBe('project:/tmp/Boop2');
  });

  it('splits filenames so the final extension can stay visible', () => {
    expect(splitFileNameForDisplay('AppShell.tsx')).toEqual({
      stem: 'AppShell',
      extension: '.tsx',
    });
    expect(splitFileNameForDisplay('script-with-long-name.test.ts')).toEqual({
      stem: 'script-with-long-name.test',
      extension: '.ts',
    });
    expect(splitFileNameForDisplay('README')).toEqual({ stem: 'README', extension: '' });
  });
});
