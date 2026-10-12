import React from 'react';
import styles from './Layout.module.css';
import { PillButton } from '../ui/PillButton';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  onToggleHistory: () => void;
  isHistoryOpen: boolean;
  onToggleTheme: () => void;
  currentTheme: 'light' | 'dark';
  onOpenSettings: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleHistory,
  isHistoryOpen,
  onToggleTheme,
  currentTheme,
  onOpenSettings,
  user,
  onOpenAuth,
  onSignOut,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 5h14M5 12h6M5 19h14M16 9v6M13 12h6" />
          </svg>
        </div>
        Calculo
      </div>

      <div className={styles.navSpacer} />

      <div className={styles.navRight}>
        <PillButton
          onClick={onToggleHistory}
          active={isHistoryOpen}
          title="Toggle calculation history drawer"
          id="hbtn"
        >
          &#8634; History
        </PillButton>

        <PillButton
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
          id="tbtn"
        >
          &#9680; {currentTheme === 'dark' ? 'Light' : 'Dark'}
        </PillButton>

        <PillButton
          onClick={onOpenSettings}
          title="Application settings"
        >
          ⚙ Settings
        </PillButton>

        {user ? (
          <PillButton
            variant="primary"
            onClick={onSignOut}
            title={`Signed in as ${user.email}. Click to sign out.`}
          >
            {user.email?.split('@')[0] || 'Sign out'}
          </PillButton>
        ) : (
          <PillButton
            variant="primary"
            onClick={onOpenAuth}
            title="Sign in to your account"
          >
            Sign in
          </PillButton>
        )}
      </div>
    </header>
  );
};
