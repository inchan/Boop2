import { describe, expect, it } from 'vitest';
import { normalizeBackendProjectFileNode } from './projectFileClient';
import type { ProjectFileNode } from './projectFileTypes';

describe('projectFileTypes', () => {
  it('allows folder and file nodes with read-only content flow', () => {
    const node: ProjectFileNode = {
      id: 'project:/tmp/Boop2/src',
      name: 'src',
      path: '/tmp/Boop2/src',
      kind: 'folder',
      childrenLoaded: false,
    };

    expect(node.kind).toBe('folder');
  });

  it('normalizes backend snake_case fields for the frontend tree', () => {
    expect(
      normalizeBackendProjectFileNode({
        id: '/tmp/Boop2/src',
        name: 'src',
        path: '/tmp/Boop2/src',
        kind: 'folder',
        children_loaded: true,
      })
    ).toEqual({
      id: '/tmp/Boop2/src',
      name: 'src',
      path: '/tmp/Boop2/src',
      kind: 'folder',
      childrenLoaded: true,
    });
  });
});
