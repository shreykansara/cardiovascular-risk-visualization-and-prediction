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
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-2 px-3 text-[13px] leading-[20px] font-medium text-text-muted ${
                  col.isNumeric ? 'text-right' : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIdx) => (
            <tr key={keyExtractor(item, rowIdx)} className="border-b border-border hover:bg-panel">
              {columns.map((col, colIdx) => {
                const content =
                  typeof col.accessor === 'function'
                    ? col.accessor(item)
                    : (item[col.accessor] as unknown as React.ReactNode);

                return (
                  <td
                    key={colIdx}
                    className={`py-2.5 px-3 text-[14px] leading-[22px] text-text ${
                      col.isNumeric ? 'text-right tabular-nums' : 'text-left'
                    } ${col.className || ''}`}
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
