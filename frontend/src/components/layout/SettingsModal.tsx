import React from 'react';
import styles from './Layout.module.css';
import { CalculatorSettings, AppInfo } from '../../types/frontend';
import { PillButton } from '../ui/PillButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CalculatorSettings;
  onUpdateSettings: (newSettings: Partial<CalculatorSettings>) => void;
  appInfo: AppInfo | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  appInfo,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close Settings">✕</button>
        </div>

        <div className={styles.settingsBody}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <strong>Angle Mode</strong>
              <span className={styles.subText}>Trigonometric calculation interpretation</span>
            </div>
            <div className={styles.segmentedControl}>
              <button
                className={`${styles.segmentBtn} ${settings.angleMode === 'deg' ? styles.segmentActive : ''}`}
                onClick={() => onUpdateSettings({ angleMode: 'deg' })}
              >
                DEG
              </button>
              <button
                className={`${styles.segmentBtn} ${settings.angleMode === 'rad' ? styles.segmentActive : ''}`}
                onClick={() => onUpdateSettings({ angleMode: 'rad' })}
              >
                RAD
              </button>
            </div>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <strong>Precision ({settings.precision} decimals)</strong>
              <span className={styles.subText}>Rounding precision for numeric results (0–15)</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              value={settings.precision}
              onChange={(e) => onUpdateSettings({ precision: parseInt(e.target.value, 10) })}
              className={styles.rangeInput}
            />
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <strong>Appearance Theme</strong>
              <span className={styles.subText}>Interface color scheme</span>
            </div>
            <div className={styles.segmentedControl}>
              <button
                className={`${styles.segmentBtn} ${settings.theme === 'light' ? styles.segmentActive : ''}`}
                onClick={() => onUpdateSettings({ theme: 'light' })}
              >
                Light
              </button>
              <button
                className={`${styles.segmentBtn} ${settings.theme === 'dark' ? styles.segmentActive : ''}`}
                onClick={() => onUpdateSettings({ theme: 'dark' })}
              >
                Dark
              </button>
            </div>
          </div>

          {appInfo && (
            <div className={styles.appInfoSection}>
              <p className={styles.subText}>
                {appInfo.name} v{appInfo.version} &bull; Electron {appInfo.electronVersion}
              </p>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <PillButton variant="primary" onClick={onClose}>
            Done
          </PillButton>
        </div>
      </div>
    </div>
  );
};
