import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import './ContextMenu.css';

export interface MenuItem {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
  submenu?: MenuItem[];
}

interface ContextMenuProps {
  items: MenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [activeSubmenuIndex, setActiveSubmenuIndex] = useState<number | null>(null);

  // Get actionable items (non-divider items)
  const actionableItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.divider);

  // Calculate adjusted position to keep menu within viewport
  const getAdjustedPosition = useCallback(() => {
    if (!menuRef.current) return position;

    const menu = menuRef.current;
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontal position
    if (x + menuRect.width > viewportWidth) {
      x = viewportWidth - menuRect.width - 8;
    }
    if (x < 8) {
      x = 8;
    }

    // Adjust vertical position
    if (y + menuRect.height > viewportHeight) {
      y = viewportHeight - menuRect.height - 8;
    }
    if (y < 8) {
      y = 8;
    }

    return { x, y };
  }, [position]);

  // Handle keyboard navigation and click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => {
            const nextIndex = prev + 1;
            if (nextIndex >= actionableItems.length) return 0;
            return nextIndex;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => {
            const nextIndex = prev - 1;
            if (nextIndex < 0) return actionableItems.length - 1;
            return nextIndex;
          });
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < actionableItems.length) {
            const { item } = actionableItems[focusedIndex];
            if (!item.disabled && !item.submenu) {
              item.onClick?.();
              onClose();
            }
          }
          break;
      }
    };

    // Use setTimeout to avoid closing immediately when the menu opens
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, focusedIndex, actionableItems]);

  // Adjust position after mount
  useEffect(() => {
    if (menuRef.current) {
      const adjusted = getAdjustedPosition();
      menuRef.current.style.left = `${adjusted.x}px`;
      menuRef.current.style.top = `${adjusted.y}px`;
    }
  }, [getAdjustedPosition]);

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled || item.submenu) return;
    item.onClick?.();
    onClose();
  };

  const handleSubmenuItemClick = (subItem: MenuItem) => {
    if (subItem.disabled) return;
    subItem.onClick?.();
    onClose();
  };

  // Find which actionable index corresponds to the current item index
  const getActionableIndex = (itemIndex: number): number => {
    return actionableItems.findIndex(({ index }) => index === itemIndex);
  };

  const menuContent = (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: position.x, top: position.y }}
      role="menu"
      aria-label="Context menu"
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={index} className="context-menu-divider" role="separator" />;
        }

        const actionableIndex = getActionableIndex(index);
        const isFocused = actionableIndex === focusedIndex;
        const hasSubmenu = item.submenu && item.submenu.length > 0;
        const isSubmenuOpen = activeSubmenuIndex === index;

        return (
          <div
            key={index}
            className={`context-menu-item ${item.disabled ? 'disabled' : ''} ${hasSubmenu ? 'has-submenu' : ''} ${isFocused ? 'focused' : ''}`}
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => {
              setFocusedIndex(actionableIndex);
              if (hasSubmenu) {
                setActiveSubmenuIndex(index);
              } else {
                setActiveSubmenuIndex(null);
              }
            }}
            onMouseLeave={() => {
              // Don't close submenu on mouse leave - let it close when hovering other items
            }}
            role="menuitem"
            aria-disabled={item.disabled}
            aria-haspopup={hasSubmenu ? 'menu' : undefined}
            aria-expanded={isSubmenuOpen ? 'true' : undefined}
            tabIndex={-1}
          >
            <span className="context-menu-label">{item.label}</span>
            {hasSubmenu && <span className="context-menu-arrow">▶</span>}

            {/* Submenu */}
            {hasSubmenu && isSubmenuOpen && (
              <div className="context-submenu" role="menu">
                {item.submenu!.map((subItem, subIndex) => (
                  <div
                    key={subIndex}
                    className={`context-menu-item ${subItem.disabled ? 'disabled' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmenuItemClick(subItem);
                    }}
                    role="menuitem"
                    aria-disabled={subItem.disabled}
                  >
                    <span className="context-menu-label">{subItem.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return createPortal(menuContent, document.body);
}

export default ContextMenu;
