import React from 'react';
import styles from './UI.module.css';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'subtle';
  active?: boolean;
  icon?: React.ReactNode;
}

export const PillButton: React.FC<PillButtonProps> = ({
  children,
  variant = 'default',
  active = false,
  icon,
  className = '',
  ...props
}) => {
  const variantClass = variant === 'primary' ? styles.pillPrimary : styles.pillDefault;
  const activeClass = active ? styles.pillActive : '';

  return (
    <button
      className={`${styles.pill} ${variantClass} ${activeClass} ${className}`.trim()}
      {...props}
    >
      {icon && <span className={styles.iconWrapper}>{icon}</span>}
      {children}
    </button>
  );
};
