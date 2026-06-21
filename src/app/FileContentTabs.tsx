import type { OpenFileTab } from './projectFileTypes';

interface FileContentTabsProps {
  tabs: OpenFileTab[];
  activeTabId?: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

export const FileContentTabs = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}: FileContentTabsProps) => {
  if (tabs.length === 0) {
    return <div className="file-content-tabs__empty">No file open</div>;
  }

  return (
    <div className="file-content-tabs" role="tablist" aria-label="Open file tabs">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`file-content-tabs__item${
            tab.id === activeTabId ? ' file-content-tabs__item--active' : ''
          }`}
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab.id === activeTabId}
            className="file-content-tabs__tab"
            data-testid={`file-content-tab-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
          >
            {tab.title}
          </button>
          <button
            type="button"
            className="file-content-tabs__close"
            data-testid={`file-content-tab-close-${tab.id}`}
            aria-label={`Close ${tab.title}`}
            onClick={() => onCloseTab(tab.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
