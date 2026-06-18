import { ReactNode } from 'react';
import './AppShell.css';

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

const ShellPane = ({ region, header, children }: ShellPaneProps) => (
  <section className={`app-shell__pane app-shell__pane--${region}`} data-shell-region={region}>
    <header className="app-shell__pane-header">{header}</header>
    <div className="app-shell__pane-body">{children}</div>
  </section>
);

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
}: AppShellProps) => (
  <div className="app-shell" style={{ opacity }}>
    <header className="app-shell__top" data-shell-region="top">
      {top}
    </header>
    <div className="app-shell__workbench" data-shell-region="workbench">
      <ShellPane region="menu" header={menuHeader}>
        {menu}
      </ShellPane>
      <ShellPane region="list" header={listHeader}>
        {list}
      </ShellPane>
      <ShellPane region="content" header={contentHeader}>
        {content}
      </ShellPane>
    </div>
    <footer className="app-shell__bottom" data-shell-region="bottom">
      {bottom}
    </footer>
  </div>
);
