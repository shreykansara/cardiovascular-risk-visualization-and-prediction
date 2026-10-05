import React from 'react';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div
      role="tablist"
      className={`flex items-center ${className}`}
      style={{
        gap: '18px',
        borderBottom: '1px solid var(--bd)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--acc)' : '2px solid transparent',
              marginBottom: '-1px',
              padding: '6px 0',
              fontFamily: 'var(--fs)',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--ink)' : 'var(--mut)',
              cursor: 'pointer',
              outline: 'none',
              transition: 'color 120ms, border-color 120ms',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
