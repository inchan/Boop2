import React, { useState, useRef, useEffect } from 'react';
import './TabBar.css';
import { Tab, TabGroup, DEFAULT_GROUP_ID } from '../lib/tabGroups';
import { ContextMenu, MenuItem } from './ContextMenu';

interface Props {
  tabs: Tab[];
  groups: TabGroup[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, newTitle: string) => void;
  onToggleClipboard: () => void;
  onToggleSessions: () => void;
  onToggleSettings: () => void;
  hasHistory: boolean;
  hasSessions: boolean;
  // Tab context menu actions
  onDuplicate?: (id: string) => void;
  onCloseOthers?: (id: string) => void;
  onCloseToRight?: (id: string) => void;
  onCloseToLeft?: (id: string) => void;
  // Group actions
  onCreateGroup?: (title: string) => void;
  onRenameGroup?: (groupId: string, title: string) => void;
  onActivateGroup?: (groupId: string) => void;
  moveTabToGroup?: (tabId: string, groupId: string) => void;
}

export function TabBar({
  tabs,
  groups,
  activeTabId,
  onSelect,
  onClose,
  onAdd,
  onRename,
  onToggleClipboard,
  onToggleSessions,
  onToggleSettings,
  hasHistory,
  hasSessions,
  onDuplicate,
  onCloseOthers,
  onCloseToRight,
  onCloseToLeft,
  onCreateGroup,
  onRenameGroup,
  onActivateGroup,
  moveTabToGroup,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    tabId: string;
    position: { x: number; y: number };
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((editingId || editingGroupId) && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId, editingGroupId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsGroupDropdownOpen(false);
      }
    };
    if (isGroupDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isGroupDropdownOpen]);

  // Determine active group
  const activeGroupId = tabs.find((t) => t.id === activeTabId)?.groupId || DEFAULT_GROUP_ID;
  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  if (!activeGroup) {
    console.error('[TabBar] No active group found!', { groups, activeGroupId });
    return <div className="tab-bar-container">Loading groups...</div>;
  }

  const handleDoubleClickTab = (tab: Tab) => {
    setEditingId(tab.id);
    setEditingGroupId(null);
    setTempTitle(tab.title);
  };

  const handleDoubleClickGroup = (group: TabGroup) => {
    if (group.id === DEFAULT_GROUP_ID) return;
    setEditingGroupId(group.id);
    setEditingId(null);
    setTempTitle(group.title);
  };

  const handleSave = () => {
    if (editingId) {
      onRename(editingId, tempTitle.trim() || 'Untitled');
      setEditingId(null);
    } else if (editingGroupId && onRenameGroup) {
      onRenameGroup(editingGroupId, tempTitle.trim() || 'Group');
      setEditingGroupId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingGroupId(null);
    }
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({
      tabId,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Build context menu items
  const getContextMenuItems = (tabId: string): MenuItem[] => {
    const tabIndex = currentGroupTabs.findIndex((t) => t.id === tabId);
    const hasTabsToRight = tabIndex < currentGroupTabs.length - 1;
    const hasTabsToLeft = tabIndex > 0;
    const hasOtherTabs = currentGroupTabs.length > 1;

    // Build submenu for group move
    const currentTab = tabs.find((t) => t.id === tabId);
    const otherGroups = groups.filter((g) => g.id !== currentTab?.groupId);
    const groupSubmenu: MenuItem[] = otherGroups.map((group) => ({
      label: group.title,
      onClick: () => {
        moveTabToGroup?.(tabId, group.id);
      },
    }));

    return [
      {
        label: '탭 닫기',
        onClick: () => {
          onClose(tabId);
        },
      },
      {
        label: '탭 복제',
        onClick: () => {
          onDuplicate?.(tabId);
        },
      },
      { divider: true, label: '' },
      {
        label: '다른 탭 모두 닫기',
        onClick: () => {
          onCloseOthers?.(tabId);
        },
        disabled: !hasOtherTabs,
      },
      {
        label: '오른쪽 탭 닫기',
        onClick: () => {
          onCloseToRight?.(tabId);
        },
        disabled: !hasTabsToRight,
      },
      {
        label: '왼쪽 탭 닫기',
        onClick: () => {
          onCloseToLeft?.(tabId);
        },
        disabled: !hasTabsToLeft,
      },
      { divider: true, label: '' },
      {
        label: '그룹으로 이동',
        submenu: groupSubmenu.length > 0 ? groupSubmenu : undefined,
        disabled: groupSubmenu.length === 0,
      },
    ];
  };

  // Render Group Selector (Dropdown Trigger)
  const renderGroupSelector = () => {
    return (
      <div className="group-selector-container" ref={dropdownRef}>
        <div
          className="group-selector-btn"
          onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
          title="Switch Group"
        >
          {editingGroupId === activeGroup.id ? (
            <input
              ref={inputRef}
              className="group-edit-input"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span
                className="group-selector-name"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleDoubleClickGroup(activeGroup);
                }}
              >
                {activeGroup.title}
              </span>
              <span className="group-selector-arrow">▼</span>
            </>
          )}
        </div>

        {isGroupDropdownOpen && (
          <div className="group-dropdown-menu">
            <div className="group-dropdown-header">GROUPS</div>
            {groups.map((group) => (
              <div
                key={group.id}
                className={`group-dropdown-item ${group.id === activeGroupId ? 'active' : ''}`}
                onClick={() => {
                  onActivateGroup?.(group.id);
                  setIsGroupDropdownOpen(false);
                }}
              >
                <span className="group-dot" style={{ backgroundColor: group.color }}></span>
                <span className="group-name">{group.title}</span>
                {group.id === activeGroupId && <span className="group-check">✓</span>}
              </div>
            ))}
            <div className="group-dropdown-divider"></div>
            <div
              className="group-dropdown-item new-group"
              onClick={() => {
                onCreateGroup?.('New Group');
                setIsGroupDropdownOpen(false);
              }}
            >
              <span className="plus-icon">+</span>
              <span>New Group</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Filter tabs for active group
  const currentGroupTabs = tabs.filter((t) => t.groupId === activeGroupId);

  return (
    <div className="tab-bar-container" data-tauri-drag-region>
      {/* Group Selector */}
      {renderGroupSelector()}

      <div className="tabs-list" data-tauri-drag-region>
        {currentGroupTabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => onSelect(tab.id)}
            onDoubleClick={() => handleDoubleClickTab(tab)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            style={{ borderTop: `2px solid ${activeGroup.color}` }}
          >
            {editingId === tab.id ? (
              <input
                ref={inputRef}
                className="tab-edit-input"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
              />
            ) : (
              <span className="tab-title">{tab.title}</span>
            )}

            <span
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
            >
              ×
            </span>
          </div>
        ))}
        <div className="add-tab-btn" onClick={onAdd} title="New Tab (Cmd+T)">
          +
        </div>
      </div>

      <div className="tab-bar-actions" data-tauri-drag-region>
        {hasHistory && (
          <div
            className="action-btn clipboard-btn"
            onClick={onToggleClipboard}
            title="Clipboard History"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </div>
        )}

        {hasSessions && (
          <div
            className="action-btn session-btn"
            onClick={onToggleSessions}
            title="Restore Session"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
              <path d="M12 7v5l4 2"></path>
            </svg>
          </div>
        )}

        <div className="action-btn settings-btn" onClick={onToggleSettings} title="Settings">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          items={getContextMenuItems(contextMenu.tabId)}
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
}
