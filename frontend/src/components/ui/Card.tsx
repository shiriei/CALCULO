import React from 'react';
import styles from './UI.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`${styles.card} ${elevated ? styles.cardElevated : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};
