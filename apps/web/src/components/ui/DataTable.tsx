import React from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  isNumeric?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
  isSheet?: boolean; // if rendered inside report sheet
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  className = '',
  isSheet = false,
}: DataTableProps<T>) {
  const borderColor = isSheet ? 'var(--sbd)' : 'var(--bd)';
  const thColor = isSheet ? 'var(--sheetmut)' : 'var(--mut)';

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
          border: 'none',
        }}
      >
        <thead>
          <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: thColor,
                  padding: '5px 0',
                  textAlign: col.isNumeric ? 'right' : 'left',
                  borderBottom: `1px solid ${borderColor}`,
                }}
                className={col.className || ''}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIdx) => (
            <tr
              key={keyExtractor(item, rowIdx)}
              style={{
                borderBottom: `1px solid ${borderColor}`,
              }}
            >
              {columns.map((col, colIdx) => {
                const content =
                  typeof col.accessor === 'function'
                    ? col.accessor(item)
                    : (item[col.accessor] as unknown as React.ReactNode);

                const isFirstCol = colIdx === 0;

                return (
                  <td
                    key={colIdx}
                    style={{
                      fontFamily: isFirstCol && !col.isNumeric ? 'var(--fs)' : 'var(--fm)',
                      fontSize: '12px',
                      color: isSheet ? 'var(--sheetink)' : 'var(--ink)',
                      padding: '6px 0',
                      textAlign: col.isNumeric ? 'right' : 'left',
                      fontVariantNumeric: 'tabular-nums',
                      borderBottom: `1px solid ${borderColor}`,
                    }}
                    className={col.className || ''}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
