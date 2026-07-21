import { useMemo, useState } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import Button from "./Button";
import EmptyState from "./EmptyState";
import { SkeletonRows } from "./Skeleton";

/**
 * Generic sortable/paginated record list used by Bookings, Vendors,
 * Payments, Expenses and Cash Management. Renders each row as its own
 * card — generous height, hover lift, no full-bleed dividers — rather than
 * a semantic HTML `<table>`, matching the reference banking app's
 * transaction list. TanStack Table still owns column defs, sorting and
 * pagination; only the row/cell markup changed from `<tr>/<td>` to grid
 * `<div>`s.
 *
 * `columns[].meta.width` sets that column's CSS grid track (e.g. "2.5fr");
 * unset columns default to a wide first column and equal tracks after it.
 */
export default function DataTable({
  columns,
  data,
  loading = false,
  pageSize = 10,
  onRowClick,
  emptyIcon,
  emptyTitle = "Nothing here yet",
  emptyDescription,
}) {
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns: useMemo(() => columns, [columns]),
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const headers = table.getFlatHeaders();

  const gridTemplate = headers
    .map((header, i) => header.column.columnDef.meta?.width || (i === 0 ? "minmax(200px, 2.3fr)" : "minmax(90px, 1fr)"))
    .join(" ");

  return (
    <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)] overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div
            role="row"
            className="grid items-center gap-4 border-b border-[var(--color-border-subtle)]/70 px-6 py-3.5"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {headers.map((header) => {
              const align = header.column.columnDef.meta?.align;
              const sortable = header.column.columnDef.enableSorting !== false;
              const sortDir = sorting[0]?.id === header.column.id ? (sorting[0].desc ? "desc" : "asc") : null;
              return (
                <button
                  key={header.id}
                  type="button"
                  role="columnheader"
                  disabled={!sortable}
                  onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                  className={`flex items-center gap-1 text-xs font-semibold tracking-wide text-[var(--color-text-muted)] uppercase ${
                    align === "right" ? "justify-end text-right" : "text-left"
                  } ${sortable ? "cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" : "cursor-default"}`}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {sortable &&
                    (sortDir === "asc" ? (
                      <ChevronUp size={13} />
                    ) : sortDir === "desc" ? (
                      <ChevronDown size={13} />
                    ) : (
                      <ChevronsUpDown size={13} className="opacity-40" />
                    ))}
                </button>
              );
            })}
          </div>

          <div role="rowgroup" className="flex flex-col gap-1.5 p-3 md:p-4">
            {loading ? (
              <SkeletonRows rows={pageSize} gridTemplate={gridTemplate} />
            ) : (
              rows.map((row) => (
                <div
                  key={row.id}
                  role="row"
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter") onRowClick(row.original);
                        }
                      : undefined
                  }
                  style={{ gridTemplateColumns: gridTemplate }}
                  className={`grid items-center gap-4 rounded-2xl px-5 py-5 transition-all duration-200 ease-out ${
                    onRowClick
                      ? "cursor-pointer hover:-translate-y-0.5 hover:bg-[var(--color-surface-muted)] hover:shadow-[var(--shadow-soft)]"
                      : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => {
                    const align = cell.column.columnDef.meta?.align;
                    return (
                      <div
                        key={cell.id}
                        role="cell"
                        className={`text-slate-700 dark:text-slate-200 ${align === "right" ? "text-right" : "text-left"}`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {!loading && rows.length === 0 && (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      )}

      {!loading && rows.length > 0 && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] px-5 py-3.5 text-sm text-[var(--color-text-muted)]">
          <span>
            Page {pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={ChevronLeft} disabled={!table.getCanPreviousPage()} onPress={() => table.previousPage()} />
            <Button variant="outline" size="sm" icon={ChevronRight} disabled={!table.getCanNextPage()} onPress={() => table.nextPage()} />
          </div>
        </div>
      )}
    </div>
  );
}
