import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Checkbox } from "../components/ui/checkbox";
import {
  exportRowsToCsv,
  exportRowsToExcel,
  inferExportColumnsFromTanstackColumnDefs,
  type ExportColumn
} from "../export";
import type { HiveDataTableLocale } from "./hiveDataTableLocale";

export type UseHiveDataTableCoreParams<TData extends object> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  enableSorting: boolean;
  enableRowSelection: boolean;
  enablePagination: boolean;
  pageSize: number;
  virtualize: boolean;
  virtualRowHeight: number;
  exportColumns?: ExportColumn<TData>[];
  locale: HiveDataTableLocale;
};

export function useHiveDataTableCore<TData extends object>({
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
}: UseHiveDataTableCoreParams<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize
  });

  const selectionColumn = React.useMemo((): ColumnDef<TData, unknown> | null => {
    if (!enableRowSelection) return null;
    return {
      id: "__select__",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label={locale.selectAllRowsAria}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label={locale.selectRowAria}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 48
    };
  }, [enableRowSelection, locale.selectAllRowsAria, locale.selectRowAria]);

  const tableColumns = React.useMemo(() => {
    return selectionColumn ? [selectionColumn, ...columns] : columns;
  }, [columns, selectionColumn]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    defaultColumn: {
      size: 180,
      minSize: 80,
      maxSize: 800
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination && !virtualize ? getPaginationRowModel() : undefined,
    globalFilterFn: "includesString"
  });

  const rows = table.getRowModel().rows;
  const parentRef = React.useRef<HTMLDivElement>(null);
  const leafCols = table.getVisibleLeafColumns();

  const gridTemplateColumns = leafCols
    .map((c) => {
      const w = c.getSize();
      return w && w > 0 ? `${w}px` : "minmax(120px,1fr)";
    })
    .join(" ");

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => virtualRowHeight,
    overscan: 10,
    enabled: virtualize
  });

  const exportCols = exportColumns?.length
    ? exportColumns
    : inferExportColumnsFromTanstackColumnDefs<TData>(columns);

  const getRowsForExport = (): TData[] => {
    if (enableRowSelection) {
      const selected = table.getFilteredSelectedRowModel().rows;
      if (selected.length > 0) return selected.map((r) => r.original);
    }
    return table.getFilteredRowModel().rows.map((r) => r.original);
  };

  const handleExportCsv = () => {
    exportRowsToCsv(getRowsForExport(), exportCols, "export");
  };

  const handleExportExcel = async () => {
    await exportRowsToExcel(getRowsForExport(), exportCols, "export");
  };

  const headerGroup = table.getHeaderGroups()[0];

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const pageCurrent = table.getState().pagination.pageIndex + 1;
  const pageTotal = table.getPageCount() || 1;

  return {
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
  };
}
