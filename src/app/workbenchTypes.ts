export type WorkbenchCommand =
  | { type: 'select-document-tab'; tabId: string }
  | { type: 'open-command-palette' }
  | { type: 'open-sessions' }
  | { type: 'open-clipboard' }
  | { type: 'open-settings' };

export type WorkbenchMenuIcon =
  | { type: 'emoji'; value: string; label?: string }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'letter'; value?: string };

export interface WorkbenchListItem {
  id: string;
  title: string;
  description?: string;
  command: WorkbenchCommand;
}

export interface WorkbenchSection {
  id: string;
  title: string;
  icon?: WorkbenchMenuIcon;
  items: WorkbenchListItem[];
}
