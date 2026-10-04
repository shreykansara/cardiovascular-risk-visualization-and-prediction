import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const shapeClass = {
    text: 'h-4 rounded',
    rect: 'rounded-md',
    circle: 'rounded-full',
  }[variant];

  return (
    <div
      className={`bg-[#1c2637]/70 animate-pulse ${shapeClass} ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};
