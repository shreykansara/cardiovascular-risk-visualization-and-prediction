import React from 'react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  isNumeric?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  className?: string;
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  className = '',
  emptyMessage = 'No records available',
}: TableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto border border-[#283548] rounded-md ${className}`}>
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-[#131a26] border-b border-[#283548]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-2.5 px-3 font-semibold text-slate-300 ${
                  col.align === 'right' || col.isNumeric
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#283548] bg-[#0b0f17]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-6 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-[#131a26]/60 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-2.5 px-3 text-slate-200 ${
                      col.align === 'right' || col.isNumeric
                        ? 'text-right font-mono-numbers'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
