import {
  CSSProperties,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './AppShell.css';

const STORAGE_KEY_SHELL_LAYOUT = 'boop_shell_layout_v1';
const MENU_MIN_WIDTH = 130;
const MENU_DEFAULT_WIDTH = MENU_MIN_WIDTH;
const MENU_MAX_WIDTH = 280;
const LIST_MIN_WIDTH = 150;
const LIST_DEFAULT_WIDTH = 260;
const LIST_MAX_WIDTH = 560;
const CONTENT_MIN_WIDTH = 480;
const RESIZER_WIDTH = 6;
const APP_SHELL_MIN_WINDOW_WIDTH =
  MENU_MIN_WIDTH + LIST_MIN_WIDTH + CONTENT_MIN_WIDTH + RESIZER_WIDTH * 2;
const KEYBOARD_RESIZE_STEP = 16;

interface PaneLayout {
  menuWidth: number;
  listWidth: number;
}

type ResizeTarget = 'menu-list' | 'list-content';

interface ResizeSession {
  target: ResizeTarget;
  startX: number;
  startLayout: PaneLayout;
}

type WorkbenchStyle = CSSProperties & {
  '--menu-pane-width': string;
  '--list-pane-width': string;
  '--content-pane-min-width': string;
};

type AppShellStyle = CSSProperties & {
  '--app-shell-min-window-width': string;
};

export interface AppShellProps {
  top: ReactNode;
  menuHeader: ReactNode;
  menu: ReactNode;
  listHeader: ReactNode;
  list: ReactNode;
  contentHeader: ReactNode;
  content: ReactNode;
  bottom: ReactNode;
  opacity?: number;
}

interface ShellPaneProps {
  region: 'menu' | 'list' | 'content';
  header: ReactNode;
  children: ReactNode;
}

interface ResizeHandleProps {
  target: ResizeTarget;
  label: string;
  value: number;
  min: number;
  max: number;
  onMouseDown: (target: ResizeTarget, event: ReactMouseEvent<HTMLDivElement>) => void;
  onKeyboardResize: (target: ResizeTarget, direction: -1 | 1) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function getDefaultLayout(): PaneLayout {
  return {
    menuWidth: MENU_DEFAULT_WIDTH,
    listWidth: LIST_DEFAULT_WIDTH,
  };
}

function normalizeLayout(value: unknown): PaneLayout {
  if (!isRecord(value)) return getDefaultLayout();

  const menuWidth = typeof value.menuWidth === 'number' ? value.menuWidth : MENU_DEFAULT_WIDTH;
  const listWidth = typeof value.listWidth === 'number' ? value.listWidth : LIST_DEFAULT_WIDTH;

  return {
    menuWidth: clamp(menuWidth, MENU_MIN_WIDTH, MENU_MAX_WIDTH),
    listWidth: clamp(listWidth, LIST_MIN_WIDTH, LIST_MAX_WIDTH),
  };
}

function loadLayout(): PaneLayout {
  try {
    if (typeof localStorage === 'undefined') return getDefaultLayout();
    const saved = localStorage.getItem(STORAGE_KEY_SHELL_LAYOUT);
    return saved ? normalizeLayout(JSON.parse(saved)) : getDefaultLayout();
  } catch {
    return getDefaultLayout();
  }
}

function saveLayout(layout: PaneLayout): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_SHELL_LAYOUT, JSON.stringify(layout));
  } catch {
    // Layout persistence should never block the shell.
  }
}

const ShellPane = ({ region, header, children }: ShellPaneProps) => (
  <section className={`app-shell__pane app-shell__pane--${region}`} data-shell-region={region}>
    <header className="app-shell__pane-header">{header}</header>
    <div className="app-shell__pane-body">{children}</div>
  </section>
);

const ResizeHandle = ({
  target,
  label,
  value,
  min,
  max,
  onMouseDown,
  onKeyboardResize,
}: ResizeHandleProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onKeyboardResize(target, -1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      onKeyboardResize(target, 1);
    }
  };

  return (
    <div
      className="app-shell__resize-handle"
      data-resize-handle={target}
      data-testid={`app-shell-resizer-${target}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onMouseDown={(event) => onMouseDown(target, event)}
      onKeyDown={handleKeyDown}
    />
  );
};

export const AppShell = ({
  top,
  menuHeader,
  menu,
  listHeader,
  list,
  contentHeader,
  content,
  bottom,
  opacity = 1,
}: AppShellProps) => {
  const workbenchRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<PaneLayout>(() => loadLayout());
  const [resizeSession, setResizeSession] = useState<ResizeSession | null>(null);

  useEffect(() => {
    const resetInitialScroll = () => {
      if (workbenchRef.current) {
        workbenchRef.current.scrollLeft = 0;
      }
    };

    if (typeof window.requestAnimationFrame === 'function') {
      const frameId = window.requestAnimationFrame(resetInitialScroll);
      return () => window.cancelAnimationFrame(frameId);
    }

    const timeoutId = window.setTimeout(resetInitialScroll, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  const getAvailableSidebarWidth = useCallback(() => {
    const workbenchWidth = workbenchRef.current?.clientWidth || window.innerWidth;
    return Math.max(
      MENU_MIN_WIDTH + LIST_MIN_WIDTH,
      workbenchWidth - CONTENT_MIN_WIDTH - RESIZER_WIDTH * 2
    );
  }, []);

  const constrainLayout = useCallback(
    (nextLayout: PaneLayout): PaneLayout => {
      const availableSidebarWidth = getAvailableSidebarWidth();
      const menuMax = Math.min(MENU_MAX_WIDTH, availableSidebarWidth - LIST_MIN_WIDTH);
      const menuWidth = clamp(nextLayout.menuWidth, MENU_MIN_WIDTH, menuMax);
      const listMax = Math.min(LIST_MAX_WIDTH, availableSidebarWidth - menuWidth);
      const listWidth = clamp(nextLayout.listWidth, LIST_MIN_WIDTH, listMax);

      return { menuWidth, listWidth };
    },
    [getAvailableSidebarWidth]
  );

  const resizeLayout = useCallback(
    (target: ResizeTarget, deltaX: number, startLayout: PaneLayout) => {
      setLayout(
        constrainLayout(
          target === 'menu-list'
            ? { ...startLayout, menuWidth: startLayout.menuWidth + deltaX }
            : { ...startLayout, listWidth: startLayout.listWidth + deltaX }
        )
      );
    },
    [constrainLayout]
  );

  useEffect(() => {
    if (!resizeSession) return;

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (event: MouseEvent) => {
      resizeLayout(
        resizeSession.target,
        event.clientX - resizeSession.startX,
        resizeSession.startLayout
      );
    };

    const handleMouseUp = () => {
      setResizeSession(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeLayout, resizeSession]);

  const handleResizeStart = useCallback(
    (target: ResizeTarget, event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      setResizeSession({
        target,
        startX: event.clientX,
        startLayout: layout,
      });
    },
    [layout]
  );

  const handleKeyboardResize = useCallback(
    (target: ResizeTarget, direction: -1 | 1) => {
      resizeLayout(target, direction * KEYBOARD_RESIZE_STEP, layout);
    },
    [layout, resizeLayout]
  );

  const workbenchStyle = useMemo<WorkbenchStyle>(
    () => ({
      '--menu-pane-width': `${layout.menuWidth}px`,
      '--list-pane-width': `${layout.listWidth}px`,
      '--content-pane-min-width': `${CONTENT_MIN_WIDTH}px`,
    }),
    [layout.listWidth, layout.menuWidth]
  );
  const appShellStyle = useMemo<AppShellStyle>(
    () => ({
      opacity,
      '--app-shell-min-window-width': `${APP_SHELL_MIN_WINDOW_WIDTH}px`,
    }),
    [opacity]
  );

  return (
    <div className="app-shell" style={appShellStyle}>
      <header className="app-shell__top" data-shell-region="top">
        {top}
      </header>
      <div
        className="app-shell__workbench"
        data-shell-region="workbench"
        ref={workbenchRef}
        style={workbenchStyle}
      >
        <ShellPane region="menu" header={menuHeader}>
          {menu}
        </ShellPane>
        <ResizeHandle
          target="menu-list"
          label="Resize menu pane"
          value={layout.menuWidth}
          min={MENU_MIN_WIDTH}
          max={MENU_MAX_WIDTH}
          onMouseDown={handleResizeStart}
          onKeyboardResize={handleKeyboardResize}
        />
        <ShellPane region="list" header={listHeader}>
          {list}
        </ShellPane>
        <ResizeHandle
          target="list-content"
          label="Resize list pane"
          value={layout.listWidth}
          min={LIST_MIN_WIDTH}
          max={LIST_MAX_WIDTH}
          onMouseDown={handleResizeStart}
          onKeyboardResize={handleKeyboardResize}
        />
        <ShellPane region="content" header={contentHeader}>
          {content}
        </ShellPane>
      </div>
      <footer className="app-shell__bottom" data-shell-region="bottom">
        {bottom}
      </footer>
    </div>
  );
};
