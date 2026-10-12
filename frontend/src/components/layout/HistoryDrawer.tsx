import React from 'react';
import styles from './Layout.module.css';
import { CalculationRecord } from '../../types/frontend';
import { PillButton } from '../ui/PillButton';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: CalculationRecord[];
  onSelectRecord: (record: CalculationRecord) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectRecord,
  onClearHistory,
}) => {
  return (
    <aside
      id="drawer"
      className={`${styles.drawer} ${!isOpen ? styles.drawerClosed : ''}`}
      aria-label="Calculation History"
    >
      <div className={styles.drawerHeader}>
        <div className={styles.drawerHeaderTitle}>
          <h2>History</h2>
          <p className={styles.subText}>Your recent calculations appear here.</p>
        </div>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close History"
          title="Close drawer"
        >
          ✕
        </button>
      </div>

      <div className={styles.drawerActions}>
        <PillButton
          onClick={onClearHistory}
          disabled={history.length === 0}
          title="Clear all history entries"
          style={{ padding: '6px 14px', fontSize: '13px' }}
        >
          Clear history
        </PillButton>
      </div>

      <ul className={styles.historyList}>
        {history.length === 0 ? (
          <li className={styles.emptyHistory}>No calculations yet</li>
        ) : (
          history.map((item) => (
            <li
              key={item.id}
              className={styles.historyItem}
              onClick={() => onSelectRecord(item)}
              title="Click to load into calculator"
            >
              <div className={styles.historyExpr}>{item.expression}</div>
              <div className={styles.historyRes}>= {item.result}</div>
              <div className={styles.historyMeta}>
                <span>{item.angleMode.toUpperCase()}</span>
                <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
};
