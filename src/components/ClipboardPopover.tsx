import './ClipboardPopover.css';

interface Props {
  history: string[];
  onSelect: (content: string) => void;
  onRemoveItem: (index: number) => void; // New prop for individual removal
  onClear: () => void;
  onClose: () => void;
}

export function ClipboardPopover({ history, onSelect, onRemoveItem, onClear, onClose }: Props) {
  return (
    <div className="clipboard-popover-overlay" onClick={onClose}>
      <div className="clipboard-popover" onClick={(e) => e.stopPropagation()}>
        <div className="popover-header">
          <span>CLIPBOARD HISTORY</span>
          <button className="clear-all-btn" onClick={onClear}>
            Clear All
          </button>
        </div>
        <div className="popover-content">
          {history.length === 0 ? (
            <div className="empty-message">No history yet</div>
          ) : (
            history.map((item, index) => (
              <div
                key={index}
                className="history-item"
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <div className="item-main">
                  <div className="item-text">{item}</div>
                  <div className="item-meta">{item.length} chars</div>
                </div>
                <button
                  className="remove-item-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(index);
                  }}
                  title="Remove item"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
