import * as React from "react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowUpIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import { isDataCellInteractiveTarget } from "../../core/x-data-grid/src/isDataCellInteractiveTarget";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import type { ExportColumn } from "../export";
import { mergeHiveDataTableLocale, type HiveDataTableLocale } from "./hiveDataTableLocale";
import { useHiveDataTableCore } from "./useHiveDataTableCore";

export interface HiveDataTableProps<TData extends object> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  enableSorting?: boolean;
  enableGlobalFilter?: boolean;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  virtualize?: boolean;
  virtualRowHeight?: number;
  scrollHeight?: number;
  exportColumns?: ExportColumn<TData>[];
  showExportMenu?: boolean;
  emptyMessage?: string;
  /** Textos de UI (por defeito PT, alinhados ao espírito de `localeText` da DataGrid). */
  locale?: Partial<HiveDataTableLocale>;
  /** Ignora cliques em controlos interativos dentro da linha (mesma regra que `DataGrid` / `isDataCellInteractiveTarget`). */
  onRowClick?: (row: TData, event: React.MouseEvent) => void;
  className?: string;
  toolbarClassName?: string;
}

export function HiveDataTable<TData extends object>({
  data,
  columns,
  enableSorting = true,
  enableGlobalFilter = true,
  enableRowSelection = false,
  enablePagination = true,
  pageSize = 20,
  virtualize = false,
  virtualRowHeight = 44,
  scrollHeight = 480,
  exportColumns,
  showExportMenu = false,
  emptyMessage = "Sem resultados.",
  locale: localeProp,
  onRowClick,
  className,
  toolbarClassName
}: HiveDataTableProps<TData>) {
  const locale = React.useMemo(() => mergeHiveDataTableLocale(localeProp), [localeProp]);

  const {
    table,
    rows,
    parentRef,
    rowVirtualizer,
    gridTemplateColumns,
    headerGroup,
    exportCols,
    handleExportCsv,
    handleExportExcel,
    flexRender,
    selectedCount,
    pageCurrent,
    pageTotal
  } = useHiveDataTableCore({
    data,
    columns,
    enableSorting,
    enableRowSelection,
    enablePagination,
    pageSize,
    virtualize,
    virtualRowHeight,
    exportColumns,
    locale
  });

  const columnCount = table.getAllColumns().length;

  const handleRowClick = (row: Row<TData>, e: React.MouseEvent) => {
    if (!onRowClick) return;
    if (isDataCellInteractiveTarget(e.target)) return;
    onRowClick(row.original, e);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className={cn("flex flex-wrap items-center gap-2", toolbarClassName)}>
        {enableGlobalFilter && (
          <Input
            placeholder={locale.filterPlaceholder}
            value={table.getState().globalFilter ?? ""}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              {locale.columnsMenu}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{locale.columnsVisibility}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {showExportMenu && exportCols.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={locale.exportAriaLabel}>
                <ArrowDownTrayIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv}>{locale.exportCsv}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleExportExcel()}>{locale.exportExcel}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="rounded-md border">
        {virtualize ? (
          <div
            ref={parentRef}
            style={{ height: scrollHeight }}
            className="overflow-auto rounded-md"
          >
            {!rows.length ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <>
                <div
                  className="grid min-w-full border-b border-border bg-muted/50 px-2 py-3 text-left text-sm font-medium text-muted-foreground"
                  style={{ gridTemplateColumns }}
                >
                  {headerGroup?.headers.map((header) => (
                    <div key={header.id} className="flex items-center gap-1 px-2">
                      {header.isPlaceholder ? null : (
                        <>
                          <button
                            type="button"
                            className={cn(
                              "flex items-center gap-1 text-left",
                              enableSorting && header.column.getCanSort() && "cursor-pointer select-none"
                            )}
                            onClick={
                              enableSorting ? header.column.getToggleSortingHandler() : undefined
                            }
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </button>
                          {enableSorting && header.column.getIsSorted() === "asc" && (
                            <ArrowUpIcon className="h-4 w-4 shrink-0" />
                          )}
                          {enableSorting && header.column.getIsSorted() === "desc" && (
                            <ArrowDownIcon className="h-4 w-4 shrink-0" />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div
                  className="relative w-full"
                  style={{ height: rowVirtualizer.getTotalSize() }}
                >
                  {rowVirtualizer.getVirtualItems().map((vRow) => {
                    const row = rows[vRow.index];
                    if (!row) return null;
                    return (
                      <div
                        key={row.id}
                        className={cn(
                          "absolute left-0 top-0 grid w-full border-b border-border bg-card px-2 py-2 text-sm text-card-foreground",
                          onRowClick && "cursor-pointer"
                        )}
                        style={{
                          height: vRow.size,
                          transform: `translateY(${vRow.start}px)`,
                          gridTemplateColumns
                        }}
                        onClick={(e) => handleRowClick(row, e)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <div key={cell.id} className="flex items-center px-2">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <ScrollArea style={{ maxHeight: scrollHeight }} className="w-full">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroupInner) => (
                  <TableRow key={headerGroupInner.id}>
                    {headerGroupInner.headers.map((header) => (
                      <TableHead key={header.id} style={{ width: header.getSize() }}>
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className={cn(
                                "flex items-center gap-1 text-left",
                                enableSorting && header.column.getCanSort() && "cursor-pointer select-none"
                              )}
                              onClick={
                                enableSorting ? header.column.getToggleSortingHandler() : undefined
                              }
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </button>
                            {enableSorting && header.column.getIsSorted() === "asc" && (
                              <ArrowUpIcon className="h-4 w-4 shrink-0" />
                            )}
                            {enableSorting && header.column.getIsSorted() === "desc" && (
                              <ArrowDownIcon className="h-4 w-4 shrink-0" />
                            )}
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.length ? (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={onRowClick ? "cursor-pointer" : undefined}
                      onClick={(e) => handleRowClick(row, e)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>

      {enablePagination && !virtualize && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            {selectedCount > 0 && (
              <span>{locale.selectedRowsPrefix.replace("{count}", String(selectedCount))}</span>
            )}
            {locale.pageReport
              .replace("{current}", String(pageCurrent))
              .replace("{total}", String(pageTotal))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="hidden h-8 w-8 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden h-8 w-8 lg:flex"
              onClick={() => table.setPageIndex(Math.max(0, table.getPageCount() - 1))}
              disabled={!table.getCanNextPage()}
            >
              <ChevronDoubleRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
