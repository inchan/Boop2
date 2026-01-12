import { useEffect, useRef, useCallback } from 'react';
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

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
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
  }, [onClose]);

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

  const menuContent = (
    <div ref={menuRef} className="context-menu" style={{ left: position.x, top: position.y }}>
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={index} className="context-menu-divider" />;
        }

        return (
          <div
            key={index}
            className={`context-menu-item ${item.disabled ? 'disabled' : ''} ${item.submenu ? 'has-submenu' : ''}`}
            onClick={() => handleItemClick(item)}
          >
            <span className="context-menu-label">{item.label}</span>
            {item.submenu && <span className="context-menu-arrow">▶</span>}
          </div>
        );
      })}
    </div>
  );

  return createPortal(menuContent, document.body);
}

export default ContextMenu;
