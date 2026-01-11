import { describe, it, expect } from 'vitest';
import {
  DEFAULT_GROUP_ID,
  createDefaultGroup,
  normalizeWorkspace,
  toggleGroupCollapsed,
  renameGroup,
  setGroupColor,
  deleteGroup,
  moveTabToGroup,
  moveTabBefore,
  hasAnyNonEmptyContent,
  findTabToActivateInGroup, // New function we will implement
  type Tab,
  type TabGroup,
} from './tabGroups';

describe('tabGroups', () => {
  it('normalizeWorkspace: migrates legacy Tab[] to default group workspace', () => {
    const legacy = [
      { id: 't1', title: 'A', content: 'x' },
      { id: 't2', title: 'B', content: '' },
    ];

    const ws = normalizeWorkspace(legacy);
    expect(ws.version).toBe(1);
    expect(ws.groups).toEqual([createDefaultGroup()]);
    expect(ws.tabs.map((t) => t.groupId)).toEqual([DEFAULT_GROUP_ID, DEFAULT_GROUP_ID]);
    expect(ws.activeTabId).toBe('t1');
  });

  it('normalizeWorkspace: ensures default group exists and fixes unknown groupId', () => {
    const ws = normalizeWorkspace({
      tabs: [
        { id: 't1', title: 'A', content: 'x', groupId: 'missing' },
        { id: 't2', title: 'B', content: '', groupId: DEFAULT_GROUP_ID },
      ],
      groups: [{ id: 'g1', title: 'Topic', color: '#3b82f6', collapsed: true }],
      activeTabId: 't1',
    });

    expect(ws.groups[0].id).toBe(DEFAULT_GROUP_ID);
    expect(ws.tabs.find((t) => t.id === 't1')?.groupId).toBe(DEFAULT_GROUP_ID);
    expect(ws.activeTabId).toBe('t1');
  });

  it('toggleGroupCollapsed: flips collapsed state', () => {
    const groups: TabGroup[] = [
      createDefaultGroup(),
      { id: 'g1', title: 'X', color: '#3b82f6', collapsed: false },
    ];
    const next = toggleGroupCollapsed(groups, 'g1');
    expect(next.find((g) => g.id === 'g1')?.collapsed).toBe(true);
  });

  it('renameGroup: trims and falls back when empty', () => {
    const groups: TabGroup[] = [
      createDefaultGroup(),
      { id: 'g1', title: 'X', color: '#3b82f6', collapsed: false },
    ];
    const next = renameGroup(groups, 'g1', '  New  ');
    expect(next.find((g) => g.id === 'g1')?.title).toBe('New');

    const next2 = renameGroup(groups, 'g1', '   ');
    expect(next2.find((g) => g.id === 'g1')?.title).toBe('Group');
  });

  it('setGroupColor: updates group color', () => {
    const groups: TabGroup[] = [
      createDefaultGroup(),
      { id: 'g1', title: 'X', color: '#3b82f6', collapsed: false },
    ];
    const next = setGroupColor(groups, 'g1', '#ef4444');
    expect(next.find((g) => g.id === 'g1')?.color).toBe('#ef4444');
  });

  it('deleteGroup: moves tabs to default and removes group', () => {
    const groups: TabGroup[] = [
      createDefaultGroup(),
      { id: 'g1', title: 'X', color: '#3b82f6', collapsed: false },
    ];
    const tabs: Tab[] = [
      { id: 't1', title: 'A', content: '', groupId: 'g1' },
      { id: 't2', title: 'B', content: '', groupId: DEFAULT_GROUP_ID },
    ];

    const { groups: nextGroups, tabs: nextTabs } = deleteGroup(groups, tabs, 'g1');
    expect(nextGroups.some((g) => g.id === 'g1')).toBe(false);
    expect(nextTabs.find((t) => t.id === 't1')?.groupId).toBe(DEFAULT_GROUP_ID);
  });

  it('moveTabBefore: reorders within tabs array', () => {
    const tabs: Tab[] = [
      { id: 't1', title: '1', content: '', groupId: DEFAULT_GROUP_ID },
      { id: 't2', title: '2', content: '', groupId: DEFAULT_GROUP_ID },
      { id: 't3', title: '3', content: '', groupId: DEFAULT_GROUP_ID },
    ];

    const next = moveTabBefore(tabs, 't3', 't2');
    expect(next.map((t) => t.id)).toEqual(['t1', 't3', 't2']);
  });

  it('moveTabToGroup: changes groupId and places at end of target group', () => {
    const tabs: Tab[] = [
      { id: 't1', title: '1', content: '', groupId: DEFAULT_GROUP_ID },
      { id: 't2', title: '2', content: '', groupId: 'g1' },
      { id: 't3', title: '3', content: '', groupId: 'g1' },
      { id: 't4', title: '4', content: '', groupId: DEFAULT_GROUP_ID },
    ];

    const next = moveTabToGroup(tabs, 't1', 'g1');
    expect(next.find((t) => t.id === 't1')?.groupId).toBe('g1');

    // should end up after the last g1 tab (t3)
    expect(next.map((t) => t.id)).toEqual(['t2', 't3', 't1', 't4']);
  });

  it('hasAnyNonEmptyContent: detects non-empty tab', () => {
    expect(
      hasAnyNonEmptyContent([
        { id: 't1', title: 'A', content: '   ', groupId: DEFAULT_GROUP_ID },
        { id: 't2', title: 'B', content: 'x', groupId: DEFAULT_GROUP_ID },
      ])
    ).toBe(true);
    expect(
      hasAnyNonEmptyContent([
        { id: 't1', title: 'A', content: '   ', groupId: DEFAULT_GROUP_ID },
        { id: 't2', title: 'B', content: '', groupId: DEFAULT_GROUP_ID },
      ])
    ).toBe(false);
  });

  // --- New Tests for Switching Logic ---

  it('findTabToActivateInGroup: returns first tab in group', () => {
    const tabs: Tab[] = [
      { id: 't1', title: '1', content: '', groupId: 'g1' },
      { id: 't2', title: '2', content: '', groupId: 'g2' },
      { id: 't3', title: '3', content: '', groupId: 'g2' },
    ];

    // Switch to g2 -> expect t2 (first one)
    expect(findTabToActivateInGroup(tabs, 'g2')).toBe('t2');
    // Switch to g1 -> expect t1
    expect(findTabToActivateInGroup(tabs, 'g1')).toBe('t1');
    // Switch to empty group -> expect undefined (caller must create tab)
    expect(findTabToActivateInGroup(tabs, 'g3')).toBeUndefined();
  });
});
