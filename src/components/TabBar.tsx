import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './TabBar.css';
import {
  Tab,
  TabGroup,
  DEFAULT_GROUP_ID,
  GROUP_COLOR_PALETTE,
  PRESET_COLORS,
  GroupColor,
} from '../lib/tabGroups';
import { ContextMenu, MenuItem } from './ContextMenu';

interface Props {
  tabs: Tab[];
  groups: TabGroup[];
  activeTabId: string;
  groupLayoutMode?: 'dropdown' | 'two-row';
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
  onCreateGroup?: (title: string) => string;
  onRenameGroup?: (groupId: string, title: string) => void;
  onSetGroupColor?: (groupId: string, color: GroupColor) => void;
  onSetGroupBackgroundColor?: (groupId: string, color: string | undefined) => void;
  onSetGroupFontColor?: (groupId: string, color: string | undefined) => void;
  onDuplicateGroup?: (groupId: string) => void;
  onActivateGroup?: (groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  onReorderGroups?: (fromIndex: number, toIndex: number) => void;
  moveTabToGroup?: (tabId: string, groupId: string) => void;
}

export function TabBar({
  tabs,
  groups,
  activeTabId,
  groupLayoutMode = 'two-row',
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
  onSetGroupColor,
  onSetGroupBackgroundColor,
  onSetGroupFontColor,
  onDuplicateGroup,
  onActivateGroup,
  onDeleteGroup,
  onReorderGroups,
  moveTabToGroup,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [colorPickerGroupId, setColorPickerGroupId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    dragging: boolean;
    fromIndex: number | null;
    overIndex: number | null;
    mouseX: number;
    mouseY: number;
  }>({ dragging: false, fromIndex: null, overIndex: null, mouseX: 0, mouseY: 0 });
  const [contextMenu, setContextMenu] = useState<{
    tabId: string;
    position: { x: number; y: number };
  } | null>(null);
  const [groupContextMenu, setGroupContextMenu] = useState<{
    groupId: string;
    position: { x: number; y: number };
  } | null>(null);
  const [colorPickerState, setColorPickerState] = useState<{
    groupId: string;
    type: 'background' | 'font';
  } | null>(null);
  const [closingTabs, setClosingTabs] = useState<Set<string>>(new Set());
  const [needsGroupScroll, setNeedsGroupScroll] = useState(false); // 그룹탭 스크롤 필요 여부
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const groupScrollRef = useRef<HTMLDivElement>(null); // 그룹탭 스크롤 컨테이너
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDragRef = useRef<{ index: number; x: number; y: number } | null>(null);
  const currentMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const CLOSE_ANIMATION_DURATION = 200; // ms
  const LONG_PRESS_DURATION = 300; // ms

  useEffect(() => {
    if ((editingId || editingGroupId) && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId, editingGroupId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close dropdown during drag operation
      if (dragState.dragging) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsGroupDropdownOpen(false);
      }
    };
    if (isGroupDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isGroupDropdownOpen, dragState.dragging]);

  // 그룹탭 스크롤 필요 여부 감지
  useEffect(() => {
    if (groupLayoutMode !== 'two-row') return;
    const scrollContainer = groupScrollRef.current;
    if (!scrollContainer) return;

    const checkScrollNeeded = () => {
      const needsScroll = scrollContainer.scrollWidth > scrollContainer.clientWidth;
      setNeedsGroupScroll(needsScroll);
    };

    // 초기 체크
    checkScrollNeeded();

    // ResizeObserver로 크기 변화 감지
    const resizeObserver = new ResizeObserver(checkScrollNeeded);
    resizeObserver.observe(scrollContainer);

    // MutationObserver로 자식 변화 감지 (그룹 추가/삭제)
    const mutationObserver = new MutationObserver(checkScrollNeeded);
    mutationObserver.observe(scrollContainer, { childList: true, subtree: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [groupLayoutMode, groups.length]); // 모드/그룹 변경 시 체크

  // Cancel long-press timer helper
  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pendingDragRef.current = null;
  }, []);

  // Handle mouse up globally to complete drag or cancel long-press
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Always track current mouse position for long-press activation
      currentMouseRef.current = { x: e.clientX, y: e.clientY };

      if (dragState.dragging) {
        setDragState((prev) => ({ ...prev, mouseX: e.clientX, mouseY: e.clientY }));
      } else if (pendingDragRef.current) {
        // If mouse moves too much before long-press completes, cancel it
        const dx = e.clientX - pendingDragRef.current.x;
        const dy = e.clientY - pendingDragRef.current.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          cancelLongPress();
        }
      }
    };

    const handleMouseUp = () => {
      // Cancel pending long-press if any
      cancelLongPress();

      if (dragState.dragging) {
        if (
          dragState.fromIndex !== null &&
          dragState.overIndex !== null &&
          dragState.fromIndex !== dragState.overIndex &&
          dragState.overIndex !== 0
        ) {
          onReorderGroups?.(dragState.fromIndex, dragState.overIndex);
        }
        setDragState({ dragging: false, fromIndex: null, overIndex: null, mouseX: 0, mouseY: 0 });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    dragState.dragging,
    dragState.fromIndex,
    dragState.overIndex,
    onReorderGroups,
    cancelLongPress,
  ]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

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

  // Animated close helpers
  const animateAndClose = (tabIds: string[], closeCallback: () => void) => {
    if (tabIds.length === 0) return;

    // Mark tabs as closing (triggers CSS animation)
    setClosingTabs(new Set(tabIds));

    // After animation, actually close the tabs
    setTimeout(() => {
      setClosingTabs(new Set());
      closeCallback();
    }, CLOSE_ANIMATION_DURATION);
  };

  const handleAnimatedCloseToRight = (tabId: string) => {
    const tabIndex = currentGroupTabs.findIndex((t) => t.id === tabId);
    const tabsToClose = currentGroupTabs.slice(tabIndex + 1).map((t) => t.id);
    animateAndClose(tabsToClose, () => onCloseToRight?.(tabId));
  };

  const handleAnimatedCloseToLeft = (tabId: string) => {
    const tabIndex = currentGroupTabs.findIndex((t) => t.id === tabId);
    const tabsToClose = currentGroupTabs.slice(0, tabIndex).map((t) => t.id);
    animateAndClose(tabsToClose, () => onCloseToLeft?.(tabId));
  };

  const handleAnimatedCloseOthers = (tabId: string) => {
    const tabsToClose = currentGroupTabs.filter((t) => t.id !== tabId).map((t) => t.id);
    animateAndClose(tabsToClose, () => onCloseOthers?.(tabId));
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

  const handleGroupContextMenu = (e: React.MouseEvent, groupId: string) => {
    if (groupId === DEFAULT_GROUP_ID) return; // Default 그룹 보호
    e.preventDefault();
    setGroupContextMenu({
      groupId,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  // 그룹 컨텍스트 메뉴만 닫기 (ContextMenu의 onClose 용)
  const handleCloseGroupContextMenu = () => {
    setGroupContextMenu(null);
    // 주의: colorPickerState는 여기서 초기화하지 않음
    // ContextMenu의 handleItemClick이 onClick 후 onClose를 호출하기 때문
  };

  // 오버레이 클릭 시 모달과 메뉴 모두 닫기
  const handleCloseColorPicker = () => {
    setGroupContextMenu(null);
    setColorPickerState(null);
  };

  const getGroupContextMenuItems = (groupId: string): MenuItem[] => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return [];

    const hasColors = Boolean(group.backgroundColor || group.fontColor);

    return [
      {
        label: '배경색 변경',
        onClick: () => {
          setGroupContextMenu(null); // 컨텍스트 메뉴 닫기
          setColorPickerState({ groupId, type: 'background' });
        },
      },
      {
        label: '폰트 색상 변경',
        onClick: () => {
          setGroupContextMenu(null); // 컨텍스트 메뉴 닫기
          setColorPickerState({ groupId, type: 'font' });
        },
      },
      {
        label: '색상 초기화',
        onClick: () => {
          onSetGroupBackgroundColor?.(groupId, undefined);
          onSetGroupFontColor?.(groupId, undefined);
          handleCloseGroupContextMenu();
        },
        disabled: !hasColors,
      },
      { divider: true, label: '' },
      {
        label: '그룹 복제',
        onClick: () => {
          onDuplicateGroup?.(groupId);
          handleCloseGroupContextMenu();
        },
      },
      {
        label: '그룹 닫기',
        onClick: () => {
          onDeleteGroup?.(groupId);
          handleCloseGroupContextMenu();
        },
      },
    ];
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
        label: '그룹으로 이동',
        submenu: groupSubmenu.length > 0 ? groupSubmenu : undefined,
        disabled: groupSubmenu.length === 0,
      },
      { divider: true, label: '' },
      {
        label: '탭 복제',
        onClick: () => {
          onDuplicate?.(tabId);
        },
      },
      { divider: true, label: '' },
      {
        label: '탭 닫기',
        onClick: () => {
          onClose(tabId);
        },
      },
      {
        label: '다른 탭 닫기',
        onClick: () => {
          handleAnimatedCloseOthers(tabId);
        },
        disabled: !hasOtherTabs,
      },
      {
        label: '오른쪽 탭 닫기',
        onClick: () => {
          handleAnimatedCloseToRight(tabId);
        },
        disabled: !hasTabsToRight,
      },
      {
        label: '왼쪽 탭 닫기',
        onClick: () => {
          handleAnimatedCloseToLeft(tabId);
        },
        disabled: !hasTabsToLeft,
      },
    ];
  };

  // Render Color Picker Modal
  const renderColorPickerModal = () => {
    if (!colorPickerState) return null;

    const group = groups.find((g) => g.id === colorPickerState.groupId);
    if (!group) return null;

    const currentColor =
      colorPickerState.type === 'background' ? group.backgroundColor : group.fontColor;

    const commitColor = (raw: string) => {
      const value = raw.trim();
      if (colorPickerState.type === 'background') {
        onSetGroupBackgroundColor?.(colorPickerState.groupId, value || undefined);
      } else {
        onSetGroupFontColor?.(colorPickerState.groupId, value || undefined);
      }
      handleCloseColorPicker();
    };

    const applyColor = (color: string) => {
      if (colorPickerState.type === 'background') {
        onSetGroupBackgroundColor?.(colorPickerState.groupId, color);
      } else {
        onSetGroupFontColor?.(colorPickerState.groupId, color);
      }
      handleCloseColorPicker();
    };

    return createPortal(
      <div className="color-picker-overlay" onClick={handleCloseColorPicker}>
        <div className="color-picker-modal" onClick={(e) => e.stopPropagation()}>
          <div className="color-picker-header">
            {colorPickerState.type === 'background' ? '배경색 선택' : '폰트 색상 선택'}
          </div>

          <input
            type="text"
            className="color-input"
            placeholder="#000000 또는 rgb(0,0,0)"
            defaultValue={currentColor || ''}
            onBlur={(e) => commitColor(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitColor(e.currentTarget.value);
              } else if (e.key === 'Escape') {
                handleCloseColorPicker();
              }
            }}
          />

          <div className="color-preset-grid">
            {PRESET_COLORS.map((color) => (
              <span
                key={color}
                className="color-preset-option"
                style={{ backgroundColor: color }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyColor(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>,
      document.body
    );
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
              <span className="group-dot" style={{ backgroundColor: activeGroup.color }}></span>
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
            {groups.map((group, index) => {
              const isDragging = dragState.dragging && dragState.fromIndex === index;
              const isDropTarget =
                dragState.dragging &&
                dragState.overIndex === index &&
                dragState.fromIndex !== index &&
                index !== 0;

              return (
                <div
                  key={group.id}
                  className={`group-dropdown-item ${group.id === activeGroupId ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''}`}
                  onMouseDown={(e) => {
                    // Only start long-press for non-default groups, left button only
                    if (group.id === DEFAULT_GROUP_ID || e.button !== 0) return;
                    e.preventDefault();

                    // Store pending drag info and initialize current mouse position
                    pendingDragRef.current = { index, x: e.clientX, y: e.clientY };
                    currentMouseRef.current = { x: e.clientX, y: e.clientY };

                    // Start long-press timer
                    longPressTimerRef.current = setTimeout(() => {
                      if (pendingDragRef.current) {
                        // Use current mouse position for natural ghost placement
                        setDragState({
                          dragging: true,
                          fromIndex: pendingDragRef.current.index,
                          overIndex: pendingDragRef.current.index,
                          mouseX: currentMouseRef.current.x,
                          mouseY: currentMouseRef.current.y,
                        });
                        pendingDragRef.current = null;
                      }
                    }, LONG_PRESS_DURATION);
                  }}
                  onMouseEnter={() => {
                    if (dragState.dragging && dragState.fromIndex !== index) {
                      setDragState((prev) => ({ ...prev, overIndex: index }));
                    }
                  }}
                  onClick={() => {
                    if (!dragState.dragging) {
                      onActivateGroup?.(group.id);
                      setIsGroupDropdownOpen(false);
                      setColorPickerGroupId(null);
                    }
                  }}
                >
                  <span
                    className="group-dot clickable"
                    style={{ backgroundColor: group.color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setColorPickerGroupId(colorPickerGroupId === group.id ? null : group.id);
                    }}
                    title="Change color"
                  ></span>
                  <span className="group-name">{group.title}</span>
                  {group.id === activeGroupId && <span className="group-check">✓</span>}

                  {/* Delete button (not for default group) */}
                  {group.id !== DEFAULT_GROUP_ID && (
                    <span
                      className="group-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGroup?.(group.id);
                      }}
                      title="Delete group"
                    >
                      ×
                    </span>
                  )}

                  {/* Color Picker */}
                  {colorPickerGroupId === group.id && (
                    <div className="color-picker" onClick={(e) => e.stopPropagation()}>
                      {GROUP_COLOR_PALETTE.map((color) => (
                        <span
                          key={color}
                          className={`color-option ${color === group.color ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetGroupColor?.(group.id, color);
                            setColorPickerGroupId(null);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="group-dropdown-divider"></div>
            <div
              className="group-dropdown-item new-group"
              onClick={() => {
                const newGroupId = onCreateGroup?.('New Group');
                if (newGroupId) {
                  onActivateGroup?.(newGroupId);
                }
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

  // Render Group Tabs (Two-Row Mode)
  const renderGroupTabs = () => {
    // 새 그룹 버튼 컴포넌트
    const newGroupButton = (
      <div
        className={`group-new-btn ${!needsGroupScroll ? 'inline' : ''}`}
        onClick={() => {
          const newGroupId = onCreateGroup?.('New Group');
          if (newGroupId) onActivateGroup?.(newGroupId);
        }}
        title="Create new group"
      >
        <span className="plus-icon">+</span>
      </div>
    );

    return (
      <div className="group-tabs-row">
        <div className="group-tabs-scroll" ref={groupScrollRef}>
          {groups.map((group) => {
            const isActive = group.id === activeGroupId;

            // 그룹 커스텀 색상 스타일 적용
            const groupStyle: React.CSSProperties = {};
            if (group.backgroundColor) groupStyle.backgroundColor = group.backgroundColor;
            if (group.fontColor) groupStyle.color = group.fontColor;

            return (
              <div
                key={group.id}
                className={`group-tab-item ${isActive ? 'active' : ''}`}
                style={groupStyle}
                onClick={() => !isActive && onActivateGroup?.(group.id)}
                onContextMenu={(e) => handleGroupContextMenu(e, group.id)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleDoubleClickGroup(group);
                }}
                title={group.title}
              >
                {editingGroupId === group.id ? (
                  <input
                    ref={inputRef}
                    className="group-tab-edit-input"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="group-tab-name">{group.title}</span>
                )}
              </div>
            );
          })}
          {/* 스크롤 불필요 시 마지막 그룹 옆에 버튼 표시 */}
          {!needsGroupScroll && newGroupButton}
        </div>

        {/* 스크롤 필요 시 고정 위치에 버튼 표시 */}
        {needsGroupScroll && newGroupButton}

        {/* Action Buttons (Settings) - Fixed on right */}
        <div className="tab-bar-actions group-row-actions">
          {hasHistory && (
            <button
              className="tab-bar-action"
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
            </button>
          )}
          <button
            className={`tab-bar-action ${hasSessions ? 'has-indicator' : ''}`}
            onClick={onToggleSessions}
            title="Session History"
          >
            ⋯
          </button>
          <button className="tab-bar-action" onClick={onToggleSettings} title="Settings">
            ⚙
          </button>
        </div>
      </div>
    );
  };

  // Filter tabs for active group
  const currentGroupTabs = tabs.filter((t) => t.groupId === activeGroupId);

  return (
    <div
      className={`tab-bar-container ${groupLayoutMode === 'two-row' ? 'two-row-mode' : ''}`}
      data-tauri-drag-region
    >
      {/* Conditional Group Display */}
      {groupLayoutMode === 'two-row' ? renderGroupTabs() : renderGroupSelector()}

      <div className="tabs-list" data-tauri-drag-region>
        {currentGroupTabs.map((tab) => {
          const isClosing = closingTabs.has(tab.id);
          const group = groups.find((g) => g.id === tab.groupId);

          const customStyle: React.CSSProperties = {};
          if (group?.backgroundColor) customStyle.backgroundColor = group.backgroundColor;
          if (group?.fontColor) customStyle.color = group.fontColor;

          return (
            <div
              key={tab.id}
              className={`tab-item ${tab.id === activeTabId ? 'active' : ''} ${isClosing ? 'closing' : ''}`}
              style={customStyle}
              onClick={() => onSelect(tab.id)}
              onDoubleClick={() => handleDoubleClickTab(tab)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
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
          );
        })}
        <div className="add-tab-btn" onClick={onAdd} title="New Tab (Cmd+T)">
          +
        </div>
      </div>

      {/* Action Buttons (only in dropdown mode) */}
      {groupLayoutMode === 'dropdown' && (
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
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          items={getContextMenuItems(contextMenu.tabId)}
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
        />
      )}

      {/* Group Context Menu */}
      {groupContextMenu && (
        <ContextMenu
          items={getGroupContextMenuItems(groupContextMenu.groupId)}
          position={groupContextMenu.position}
          onClose={handleCloseGroupContextMenu}
        />
      )}

      {/* Color Picker Modal */}
      {renderColorPickerModal()}
    </div>
  );
}
