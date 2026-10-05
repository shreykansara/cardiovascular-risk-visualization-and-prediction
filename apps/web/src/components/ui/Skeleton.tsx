import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  style,
}) => {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--bd)',
        borderRadius: '3px',
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : '16px',
        boxShadow: 'none',
        ...style,
      }}
    />
  );
};
