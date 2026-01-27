// Tab grouping domain + storage migration helpers

export const DEFAULT_GROUP_ID = 'default';

export type GroupColor =
  | '#ef4444'
  | '#f97316'
  | '#eab308'
  | '#22c55e'
  | '#06b6d4'
  | '#3b82f6'
  | '#8b5cf6'
  | '#ec4899'
  | '#64748b';

export const GROUP_COLOR_PALETTE: GroupColor[] = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

export const PRESET_COLORS = [
  '#ffffff',
  '#f0f0f0',
  '#d0d0d0',
  '#a0a0a0',
  '#808080',
  '#404040',
  '#202020',
  '#000000',
  '#ff0000',
  '#ff8800',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#0088ff',
  '#8800ff',
  '#ff00ff',
  '#ffcccc',
  '#ffe6cc',
  '#ffffcc',
  '#ccffcc',
  '#ccffff',
  '#cce6ff',
  '#e6ccff',
  '#ffccff',
];

export interface Tab {
  id: string;
  title: string;
  content: string;
  groupId: string;
}

export interface TabGroup {
  id: string;
  title: string;
  color: GroupColor;
  backgroundColor?: string;
  fontColor?: string;
  collapsed: boolean;
}

export interface WorkspaceSnapshot {
  version: 1;
  tabs: Tab[];
  groups: TabGroup[];
  activeTabId: string;
}

export function createDefaultGroup(): TabGroup {
  return {
    id: DEFAULT_GROUP_ID,
    title: 'Default',
    color: '#64748b',
    collapsed: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTabLike(value: unknown): value is Omit<Tab, 'groupId'> & Partial<Pick<Tab, 'groupId'>> {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.content === 'string'
  );
}

function isGroupLike(value: unknown): value is Partial<TabGroup> & Pick<TabGroup, 'id'> {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string';
}

function normalizeColor(value: unknown): GroupColor {
  if (typeof value !== 'string') return createDefaultGroup().color;
  const lower = value.toLowerCase();
  const asPalette = GROUP_COLOR_PALETTE.find((c) => c === lower);
  return asPalette ?? createDefaultGroup().color;
}

function normalizeGroup(value: unknown, fallbackIndex: number): TabGroup {
  if (!isGroupLike(value)) {
    return {
      id: `group-${fallbackIndex}`,
      title: `Group ${fallbackIndex}`,
      color: GROUP_COLOR_PALETTE[fallbackIndex % GROUP_COLOR_PALETTE.length],
      collapsed: false,
    };
  }

  const title =
    typeof value.title === 'string' && value.title.trim() ? value.title.trim() : 'Group';
  const collapsed = typeof value.collapsed === 'boolean' ? value.collapsed : false;
  const backgroundColor =
    typeof value.backgroundColor === 'string' ? value.backgroundColor : undefined;
  const fontColor = typeof value.fontColor === 'string' ? value.fontColor : undefined;

  return {
    id: value.id,
    title,
    color: normalizeColor(value.color),
    backgroundColor,
    fontColor,
    collapsed,
  };
}

function ensureDefaultGroupFirst(groups: TabGroup[]): TabGroup[] {
  const withoutDefault = groups.filter((g) => g.id !== DEFAULT_GROUP_ID);
  const defaultGroup = groups.find((g) => g.id === DEFAULT_GROUP_ID) ?? createDefaultGroup();
  return [defaultGroup, ...withoutDefault];
}

export function normalizeWorkspace(input: unknown): WorkspaceSnapshot {
  // Accepts:
  // - WorkspaceSnapshot-like object
  // - legacy v3 format: Tab[]
  // - partial/invalid values

  if (Array.isArray(input)) {
    const tabs = input.filter(isTabLike).map((t) => ({ ...t, groupId: DEFAULT_GROUP_ID }));
    const activeTabId = tabs[0]?.id ?? '';
    return {
      version: 1,
      tabs,
      groups: [createDefaultGroup()],
      activeTabId,
    };
  }

  const record = isRecord(input) ? input : {};

  const rawTabs = Array.isArray(record.tabs) ? record.tabs : [];
  const rawGroups = Array.isArray(record.groups) ? record.groups : [];

  const groups = ensureDefaultGroupFirst(rawGroups.map((g, idx) => normalizeGroup(g, idx + 1)));
  const groupIds = new Set(groups.map((g) => g.id));

  const tabs: Tab[] = rawTabs.filter(isTabLike).map((t) => {
    const groupId = typeof t.groupId === 'string' && t.groupId ? t.groupId : DEFAULT_GROUP_ID;
    return { ...t, groupId: groupIds.has(groupId) ? groupId : DEFAULT_GROUP_ID };
  });

  const activeTabId =
    typeof record.activeTabId === 'string' &&
    record.activeTabId &&
    tabs.some((t) => t.id === record.activeTabId)
      ? record.activeTabId
      : (tabs[0]?.id ?? '');

  return {
    version: 1,
    tabs,
    groups,
    activeTabId,
  };
}

export function toggleGroupCollapsed(groups: TabGroup[], groupId: string): TabGroup[] {
  return groups.map((g) => (g.id === groupId ? { ...g, collapsed: !g.collapsed } : g));
}

export function setGroupColor(groups: TabGroup[], groupId: string, color: GroupColor): TabGroup[] {
  return groups.map((g) => (g.id === groupId ? { ...g, color } : g));
}

export function renameGroup(groups: TabGroup[], groupId: string, title: string): TabGroup[] {
  const nextTitle = title.trim() || 'Group';
  return groups.map((g) => (g.id === groupId ? { ...g, title: nextTitle } : g));
}

export function deleteGroup(
  groups: TabGroup[],
  tabs: Tab[],
  groupId: string
): { groups: TabGroup[]; tabs: Tab[] } {
  if (groupId === DEFAULT_GROUP_ID) {
    return { groups, tabs };
  }

  const nextGroups = groups.filter((g) => g.id !== groupId);
  const nextTabs = tabs.map((t) =>
    t.groupId === groupId ? { ...t, groupId: DEFAULT_GROUP_ID } : t
  );
  return { groups: ensureDefaultGroupFirst(nextGroups), tabs: nextTabs };
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;
  if (fromIndex < 0 || fromIndex >= items.length) return items;

  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  const clamped = Math.max(0, Math.min(toIndex, next.length));
  next.splice(clamped, 0, item);
  return next;
}

export function moveTabBefore(tabs: Tab[], tabId: string, beforeTabId: string): Tab[] {
  const fromIndex = tabs.findIndex((t) => t.id === tabId);
  const toIndex = tabs.findIndex((t) => t.id === beforeTabId);
  if (fromIndex === -1 || toIndex === -1) return tabs;

  const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
  return moveItem(tabs, fromIndex, adjustedToIndex);
}

export function moveTabToGroup(
  tabs: Tab[],
  tabId: string,
  groupId: string,
  options?: { beforeTabId?: string }
): Tab[] {
  const fromIndex = tabs.findIndex((t) => t.id === tabId);
  if (fromIndex === -1) return tabs;

  const updatedTabs = tabs.map((t) => (t.id === tabId ? { ...t, groupId } : t));

  if (options?.beforeTabId) {
    return moveTabBefore(updatedTabs, tabId, options.beforeTabId);
  }

  const lastIndexInOriginal = (() => {
    for (let i = tabs.length - 1; i >= 0; i--) {
      const t = tabs[i];
      if (t.id !== tabId && t.groupId === groupId) return i;
    }
    return -1;
  })();

  if (lastIndexInOriginal === -1) {
    // No tabs in the group yet; keep global position.
    return updatedTabs;
  }

  const currentIndex = fromIndex;
  const desiredIndexWithTabPresent = lastIndexInOriginal + 1;
  const desiredIndex =
    currentIndex < desiredIndexWithTabPresent
      ? desiredIndexWithTabPresent - 1
      : desiredIndexWithTabPresent;

  return moveItem(updatedTabs, currentIndex, desiredIndex);
}

export function hasAnyNonEmptyContent(tabs: Tab[]): boolean {
  return tabs.some((t) => t.content.trim() !== '');
}

export function findTabToActivateInGroup(tabs: Tab[], groupId: string): string | undefined {
  const groupTabs = tabs.filter((t) => t.groupId === groupId);
  return groupTabs.length > 0 ? groupTabs[0].id : undefined;
}

export function reorderGroups(groups: TabGroup[], fromIndex: number, toIndex: number): TabGroup[] {
  // Don't allow moving default group (index 0)
  if (fromIndex === 0 || toIndex === 0) return groups;
  if (fromIndex === toIndex) return groups;
  if (fromIndex < 0 || fromIndex >= groups.length) return groups;
  if (toIndex < 0 || toIndex >= groups.length) return groups;

  const next = [...groups];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function setGroupBackgroundColor(
  groups: TabGroup[],
  groupId: string,
  backgroundColor: string | undefined
): TabGroup[] {
  return groups.map((g) => (g.id === groupId ? { ...g, backgroundColor } : g));
}

export function setGroupFontColor(
  groups: TabGroup[],
  groupId: string,
  fontColor: string | undefined
): TabGroup[] {
  return groups.map((g) => (g.id === groupId ? { ...g, fontColor } : g));
}

export function duplicateGroup(
  groups: TabGroup[],
  tabs: Tab[],
  groupId: string,
  newGroupId: string
): { groups: TabGroup[]; tabs: Tab[] } {
  const sourceGroup = groups.find((g) => g.id === groupId);
  if (!sourceGroup) {
    return { groups, tabs };
  }

  // 그룹 복제
  const newGroup: TabGroup = {
    ...sourceGroup,
    id: newGroupId,
    title: `${sourceGroup.title} (copy)`,
  };

  // 해당 그룹의 탭들 복제
  const groupTabs = tabs.filter((t) => t.groupId === groupId);
  const newTabs = groupTabs.map((tab) => ({
    ...tab,
    id: `${tab.id}-copy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title: `${tab.title} (copy)`,
    groupId: newGroupId,
  }));

  // 원본 그룹 바로 다음에 복제된 그룹 삽입
  const sourceIndex = groups.findIndex((g) => g.id === groupId);
  const newGroups = [...groups];
  newGroups.splice(sourceIndex + 1, 0, newGroup);

  return {
    groups: newGroups,
    tabs: [...tabs, ...newTabs],
  };
}
