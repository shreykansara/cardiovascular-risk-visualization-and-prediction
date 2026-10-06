import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({ children, className = '', style, ...rest }) => {
  return (
    <div
      className={`landing-container w-full ${className}`}
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        paddingLeft: 'var(--container-pad, 16px)',
        paddingRight: 'var(--container-pad, 16px)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Container;
