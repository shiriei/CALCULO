import React from 'react';
import styles from './Layout.module.css';
import { WorkspaceId } from '../../types/frontend';

interface SidebarProps {
  activeWorkspace: WorkspaceId;
  onSelectWorkspace: (workspace: WorkspaceId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeWorkspace,
  onSelectWorkspace,
}) => {
  return (
    <aside className={styles.sidebar}>
      <button
        className={`${styles.menuBtn} ${activeWorkspace === 'ask' ? styles.menuBtnActive : ''}`}
        onClick={() => onSelectWorkspace('ask')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z" />
        </svg>
        <span>Ask a question</span>
      </button>

      <button
        className={`${styles.menuBtn} ${activeWorkspace === 'algebra' ? styles.menuBtnActive : ''}`}
        onClick={() => onSelectWorkspace('algebra')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h8M8 3v8M14 17h6M5 17l5 4M10 17l-5 4" />
        </svg>
        <span>Algebra & Math</span>
      </button>

      <button
        className={`${styles.menuBtn} ${activeWorkspace === 'scientific' ? styles.menuBtnActive : ''}`}
        onClick={() => onSelectWorkspace('scientific')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="3" />
          <path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2" />
        </svg>
        <span>Scientific calculator</span>
      </button>

      <button
        className={`${styles.menuBtn} ${activeWorkspace === 'graphing' ? styles.menuBtnActive : ''}`}
        onClick={() => onSelectWorkspace('graphing')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
        <span>2D Graphing</span>
      </button>

      <button
        className={`${styles.menuBtn} ${activeWorkspace === 'tools' ? styles.menuBtnActive : ''}`}
        onClick={() => onSelectWorkspace('tools')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20 12 4l8 16zM4 20h16" />
        </svg>
        <span>Geometry Tools</span>
      </button>
    </aside>
  );
};
