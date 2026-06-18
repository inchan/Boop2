export type WorkbenchCommand =
  | { type: 'select-document-tab'; tabId: string }
  | { type: 'open-command-palette' }
  | { type: 'open-sessions' }
  | { type: 'open-clipboard' }
  | { type: 'open-settings' };

export interface WorkbenchListItem {
  id: string;
  title: string;
  description?: string;
  command: WorkbenchCommand;
}

export interface WorkbenchSection {
  id: string;
  title: string;
  items: WorkbenchListItem[];
}
