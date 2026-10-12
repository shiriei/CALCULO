import React from 'react';
import styles from './UI.module.css';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  active?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  active = false,
  className = '',
  ...props
}) => {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? styles.chipActive : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};
