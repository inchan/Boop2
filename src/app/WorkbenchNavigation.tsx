import { useMemo, useState } from 'react';

export interface WorkbenchListItem {
  id: string;
  title: string;
  description?: string;
  contentTabIds?: string[];
}

export interface WorkbenchSection {
  id: string;
  title: string;
  items: WorkbenchListItem[];
}

interface WorkbenchMenuProps {
  sections: WorkbenchSection[];
  activeSectionId: string;
  onSelectSection: (sectionId: string) => void;
  onAddSection: () => void;
  onReorderSections: (sectionIds: string[]) => void;
}

interface WorkbenchListProps {
  section?: WorkbenchSection;
  activeItemId?: string;
  onOpenItem: (section: WorkbenchSection, item: WorkbenchListItem) => void;
}

export interface WorkbenchNavigationProps extends WorkbenchMenuProps, WorkbenchListProps {}

const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items;

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

export const WorkbenchMenu = ({
  sections,
  activeSectionId,
  onSelectSection,
  onAddSection,
  onReorderSections,
}: WorkbenchMenuProps) => {
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);

  const reorderSection = (targetSectionId: string) => {
    if (!draggedSectionId || draggedSectionId === targetSectionId) return;

    const fromIndex = sections.findIndex((section) => section.id === draggedSectionId);
    const toIndex = sections.findIndex((section) => section.id === targetSectionId);
    onReorderSections(moveItem(sections, fromIndex, toIndex).map((section) => section.id));
    setDraggedSectionId(null);
  };

  return (
    <nav className="app-shell__menu-items" aria-label="Primary workbench sections">
      <button
        type="button"
        className="app-shell__menu-add"
        data-testid="workbench-menu-add"
        onClick={onAddSection}
      >
        + Menu
      </button>
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          draggable
          className={`app-shell__menu-item${section.id === activeSectionId ? ' app-shell__menu-item--active' : ''}`}
          data-testid={`workbench-menu-${section.id}`}
          onClick={() => onSelectSection(section.id)}
          onDragStart={() => setDraggedSectionId(section.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            reorderSection(section.id);
          }}
        >
          {section.title}
        </button>
      ))}
    </nav>
  );
};

export const WorkbenchList = ({ section, activeItemId, onOpenItem }: WorkbenchListProps) => (
  <div className="app-shell__list-items" data-testid="workbench-list" aria-label="Workbench items">
    {section?.items.length ? (
      section.items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`app-shell__list-item${item.id === activeItemId ? ' app-shell__list-item--active' : ''}`}
          data-testid={`workbench-list-${item.id}`}
          onClick={() => onOpenItem(section, item)}
        >
          <span className="app-shell__list-title">{item.title}</span>
          {item.description && (
            <span className="app-shell__list-description">{item.description}</span>
          )}
        </button>
      ))
    ) : (
      <div className="app-shell__empty-list">No items yet</div>
    )}
  </div>
);

export const WorkbenchNavigation = ({
  sections,
  activeSectionId,
  activeItemId,
  onSelectSection,
  onAddSection,
  onReorderSections,
  onOpenItem,
}: WorkbenchNavigationProps) => {
  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) ?? sections[0],
    [activeSectionId, sections]
  );

  return (
    <>
      <WorkbenchMenu
        sections={sections}
        activeSectionId={activeSection?.id ?? activeSectionId}
        onSelectSection={onSelectSection}
        onAddSection={onAddSection}
        onReorderSections={onReorderSections}
      />
      <WorkbenchList section={activeSection} activeItemId={activeItemId} onOpenItem={onOpenItem} />
    </>
  );
};
