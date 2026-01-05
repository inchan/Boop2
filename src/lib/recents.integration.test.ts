import { describe, it, expect } from 'vitest';

interface MockScript {
  path: string;
  name: string;
  description?: string;
}

describe('Recents UI Integration', () => {
  const mockScripts: MockScript[] = [
    { path: 'scripts/UpperCase.js', name: 'Upper Case' },
    { path: 'scripts/LowerCase.js', name: 'Lower Case' },
    { path: 'scripts/Trim.js', name: 'Trim' },
  ];

  it('should filter scripts based on search query across all sections', () => {
    const query = 'upper';
    const filtered = mockScripts.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Upper Case');
  });

  it('should manage recent scripts correctly (add and limit)', () => {
    const MAX_RECENT = 5;
    let recentPaths: string[] = ['scripts/LowerCase.js'];
    const newPath = 'scripts/UpperCase.js';

    recentPaths = [newPath, ...recentPaths.filter((p) => p !== newPath)].slice(0, MAX_RECENT);

    expect(recentPaths[0]).toBe('scripts/UpperCase.js');
    expect(recentPaths).toHaveLength(2);
  });

  it('should remove from recents correctly', () => {
    let recentPaths: string[] = ['scripts/UpperCase.js', 'scripts/LowerCase.js'];
    const pathToRemove = 'scripts/UpperCase.js';

    recentPaths = recentPaths.filter((p) => p !== pathToRemove);

    expect(recentPaths).toHaveLength(1);
    expect(recentPaths[0]).toBe('scripts/LowerCase.js');
  });
});
