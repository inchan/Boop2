export type ContentTabKind = 'document' | 'script' | 'settings' | 'diff' | 'log';

export interface ContentTab {
  id: string;
  title: string;
  kind: ContentTabKind;
}

export interface ContentTabsProps {
  tabs: ContentTab[];
  activeTabId: string;
  onSelect: (tabId: string) => void;
  onAdd: () => void;
}

export const ContentTabs = ({ tabs, activeTabId, onSelect, onAdd }: ContentTabsProps) => (
  <div className="content-tabs" role="tablist" aria-label="Content tabs">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={tab.id === activeTabId}
        className={`content-tabs__tab${tab.id === activeTabId ? ' content-tabs__tab--active' : ''}`}
        data-tab-kind={tab.kind}
        data-testid={`content-tab-${tab.id}`}
        onClick={() => onSelect(tab.id)}
      >
        <span className="content-tabs__kind">{tab.kind}</span>
        <span>{tab.title}</span>
      </button>
    ))}
    <button
      type="button"
      className="content-tabs__add"
      data-testid="content-tab-add"
      aria-label="Add content tab"
      onClick={onAdd}
    >
      +
    </button>
  </div>
);
