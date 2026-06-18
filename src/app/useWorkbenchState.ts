import { useMemo, useState } from 'react';
import type { WorkbenchCommand, WorkbenchListItem, WorkbenchSection } from './workbenchTypes';

interface WorkbenchDocumentTab {
  id: string;
  title: string;
}

export interface UseWorkbenchStateInput {
  documentTabs: WorkbenchDocumentTab[];
  activeDocumentTabId: string;
  sessionCount: number;
  clipboardCount: number;
  createSectionId?: () => string;
  onCommand: (command: WorkbenchCommand) => void;
}

export interface UseWorkbenchStateResult {
  sections: WorkbenchSection[];
  activeSection?: WorkbenchSection;
  activeSectionId: string;
  activeItemId?: string;
  addMenuSection: () => void;
  selectMenuSection: (sectionId: string) => void;
  reorderMenuSections: (sectionIds: string[]) => void;
  selectContentTab: (tabId: string) => void;
  openWorkbenchItem: (section: WorkbenchSection, item: WorkbenchListItem) => void;
}

const DEFAULT_SECTION_IDS = ['documents', 'scripts', 'sessions', 'clipboard', 'settings'];

export const useWorkbenchState = ({
  documentTabs,
  activeDocumentTabId,
  sessionCount,
  clipboardCount,
  createSectionId = () => `custom-${Date.now()}`,
  onCommand,
}: UseWorkbenchStateInput): UseWorkbenchStateResult => {
  const [sectionIds, setSectionIds] = useState<string[]>(DEFAULT_SECTION_IDS);
  const [activeSectionId, setActiveSectionId] = useState('documents');
  const [activeItemId, setActiveItemId] = useState<string | undefined>(activeDocumentTabId);

  const availableSections = useMemo<Record<string, WorkbenchSection>>(() => {
    const documentItems: WorkbenchListItem[] = documentTabs.map((tab) => ({
      id: tab.id,
      title: tab.title,
      description: tab.id === activeDocumentTabId ? 'Active document tab' : 'Open document tab',
      command: { type: 'select-document-tab', tabId: tab.id },
    }));

    const sections: Record<string, WorkbenchSection> = {
      documents: {
        id: 'documents',
        title: 'Documents',
        items: documentItems,
      },
      scripts: {
        id: 'scripts',
        title: 'Scripts',
        items: [
          {
            id: 'open-palette',
            title: 'Command Palette',
            description: 'Search and run scripts',
            command: { type: 'open-command-palette' },
          },
        ],
      },
      sessions: {
        id: 'sessions',
        title: 'Sessions',
        items: [
          {
            id: 'open-sessions',
            title: 'Recent sessions',
            description: `${sessionCount} saved`,
            command: { type: 'open-sessions' },
          },
        ],
      },
      clipboard: {
        id: 'clipboard',
        title: 'Clipboard',
        items: [
          {
            id: 'open-clipboard',
            title: 'Clipboard history',
            description: `${clipboardCount} captured`,
            command: { type: 'open-clipboard' },
          },
        ],
      },
      settings: {
        id: 'settings',
        title: 'Settings',
        items: [
          {
            id: 'open-settings',
            title: 'Preferences',
            description: 'Configure Boop2',
            command: { type: 'open-settings' },
          },
        ],
      },
    };

    sectionIds.forEach((sectionId, index) => {
      if (!sections[sectionId]) {
        sections[sectionId] = {
          id: sectionId,
          title: `Custom ${index + 1}`,
          items: [],
        };
      }
    });

    return sections;
  }, [activeDocumentTabId, clipboardCount, documentTabs, sectionIds, sessionCount]);

  const sections = sectionIds
    .map((sectionId) => availableSections[sectionId])
    .filter((section): section is WorkbenchSection => Boolean(section));
  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];

  const addMenuSection = () => {
    const nextSectionId = createSectionId();
    setSectionIds((currentSectionIds) => [...currentSectionIds, nextSectionId]);
    setActiveSectionId(nextSectionId);
    setActiveItemId(undefined);
  };

  const selectMenuSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setActiveItemId(undefined);
  };

  const reorderMenuSections = (nextSectionIds: string[]) => {
    setSectionIds(nextSectionIds);
  };

  const selectContentTab = (tabId: string) => {
    setActiveSectionId('documents');
    setActiveItemId(tabId);
  };

  const openWorkbenchItem = (_section: WorkbenchSection, item: WorkbenchListItem) => {
    setActiveItemId(item.id);
    onCommand(item.command);
  };

  return {
    sections,
    activeSection,
    activeSectionId,
    activeItemId,
    addMenuSection,
    selectMenuSection,
    reorderMenuSections,
    selectContentTab,
    openWorkbenchItem,
  };
};
