import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { muiColumnFilterFn } from "./filterFns";
import { renderGridActionsFromNodes } from "./GridActionsCell";
import type {
  GridAggregationModel,
  GridApiCommunity,
  GridAlignment,
  GridColDef,
  GridRenderCellParams,
  GridRenderHeaderParams,
  GridRowId,
  GridValidRowModel,
  GridValueOptionsList
} from "./types";

const DATE_BR_TZ = "America/Sao_Paulo";

function booleanCellAlignClass(align?: GridAlignment): string {
  if (align === "right") return "flex h-full min-h-0 w-full min-w-0 items-center justify-end";
  if (align === "left") return "flex h-full min-h-0 w-full min-w-0 items-center justify-start";
  return "flex h-full min-h-0 w-full min-w-0 items-center justify-center";
}

function renderBooleanCheckbox<R extends GridValidRowModel>(
  col: GridColDef<R>,
  checked: boolean,
  extra: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "checked">
): React.ReactNode {
  const box = React.createElement("input", {
    type: "checkbox",
    className:
      "h-3 w-3 shrink-0 cursor-default rounded border border-primary accent-primary",
    checked,
    ...extra
  });
  return React.createElement("div", { className: booleanCellAlignClass(col.align) }, box);
}

/** Formatação de células `date` / `dateTime` em pt-BR no fuso de Brasília. */
export function formatGridDateBr(raw: unknown, withTime: boolean): string {
  if (raw == null || raw === "") return "";
  let d: Date;
  if (raw instanceof Date) {
    d = raw;
  } else if (typeof raw === "number") {
    d = new Date(raw);
  } else if (typeof raw === "string") {
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    d = parsed;
  } else {
    return String(raw);
  }
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: DATE_BR_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {})
    }).format(d);
  } catch {
    return String(raw);
  }
}

/** Resolve `valueOptions` estático ou função (MUI X) para a linha indicada. */
export function resolveColValueOptions<R extends GridValidRowModel>(
  col: GridColDef<R>,
  id: GridRowId,
  row: R
): GridValueOptionsList | undefined {
  const vo = col.valueOptions;
  if (vo == null) return undefined;
  if (typeof vo === "function") {
    return vo({ id, field: col.field, row });
  }
  return vo;
}

/** Há opções de seleção (array não vazio ou função). */
export function colHasValueOptions<R extends GridValidRowModel>(col: GridColDef<R>): boolean {
  const vo = col.valueOptions;
  if (vo == null) return false;
  if (typeof vo === "function") return true;
  return vo.length > 0;
}

function formatSingleSelectDisplay(
  raw: unknown,
  options: GridValueOptionsList | undefined
): string {
  if (options == null || options.length === 0) return raw == null ? "" : String(raw);
  for (const o of options) {
    if (o !== null && typeof o === "object" && "value" in o) {
      const opt = o as { value: string | number; label: string };
      if (Object.is(opt.value, raw) || String(opt.value) === String(raw)) return opt.label;
    } else if (Object.is(o, raw) || String(o) === String(raw)) {
      return String(o);
    }
  }
  return raw == null ? "" : String(raw);
}

function mapAggregationFnId(id: string | undefined): string | undefined {
  if (!id) return undefined;
  if (id === "avg" || id === "average") return "mean";
  if (id === "size") return "count";
  return id;
}

export function defaultGetRowId<R extends GridValidRowModel>(row: R): GridRowId {
  const r = row as Record<string, unknown>;
  if (r.id !== undefined && r.id !== null) return r.id as GridRowId;
  if (r.key !== undefined && r.key !== null) return r.key as GridRowId;
  return JSON.stringify(row);
}

export function buildColumnDefs<R extends GridValidRowModel>(
  columns: GridColDef<R>[],
  ctx: {
    apiRef: React.MutableRefObject<GridApiCommunity<R> | null>;
    getRowId: (row: R) => GridRowId;
    disableColumnSort?: boolean;
    aggregationModel?: GridAggregationModel;
    showAggregationFooter?: boolean;
  }
): ColumnDef<R, unknown>[] {
  const sortOff = ctx.disableColumnSort === true;
  const aggModel = ctx.aggregationModel ?? {};
  return columns.map((col) => {
    const field = col.field;
    const aggRaw = aggModel[field];
    const aggId = mapAggregationFnId(
      typeof aggRaw === "string" ? aggRaw : undefined
    ) as ColumnDef<R, unknown>["aggregationFn"];
    const minW = col.minWidth ?? 50;
    const maxW = col.maxWidth ?? 2000;
    const clampSize = (n: number) => Math.min(maxW, Math.max(minW, Math.round(n)));
    const isActionsCol = col.type === "actions" || col.getActions != null;
    /** Largura em px (TanStack); `flex` sem `width` → semente proporcional, sempre dentro de min/max. */
    const size =
      col.width != null
        ? clampSize(col.width)
        : col.flex != null
          ? clampSize(col.flex * 100)
          : clampSize(isActionsCol ? 100 : 160);
    const sortableEffective =
      isActionsCol ? col.sortable === true : col.sortable !== false;

    const base = {
      id: field,
      header: col.headerName ?? field,
      size,
      minSize: minW,
      maxSize: maxW,
      enableSorting: !sortOff && sortableEffective,
      enableHiding:
        col.hideable !== false && col.hide !== true && !isActionsCol,
      enableColumnFilter: col.filterable !== false && col.type !== "actions" && col.getActions == null,
      enableResizing: col.resizable !== false,
      enablePinning: col.pinnable !== false,
      enableGrouping: col.groupable !== false,
      ...(aggId ? { aggregationFn: aggId } : {}),
      ...(ctx.showAggregationFooter && aggId
        ? {
            footer: (info: { column: { getAggregationValue: () => unknown } }) => {
              const v = info.column.getAggregationValue();
              if (v == null) return "";
              if (col.valueFormatter) {
                return col.valueFormatter({
                  id: "__aggregation_footer__" as GridRowId,
                  field,
                  row: {} as R,
                  value: v as never
                });
              }
              return String(v);
            }
          }
        : {}),
      filterFn: muiColumnFilterFn,
      meta: { gridColDef: col },
      ...(col.valueGetter
        ? {
            accessorFn: (row: R) =>
              col.valueGetter!({
                field,
                row,
                value: (row as Record<string, unknown>)[field]
              })
          }
        : { accessorKey: field as keyof R & string })
    } as ColumnDef<R, unknown>;

    base.cell = (info) => {
      const row = info.row.original;
      const id = ctx.getRowId(row);
      const raw = info.getValue();
      const api = ctx.apiRef.current;
      if (!api) {
        if (col.type === "boolean") {
          const v =
            raw === true ||
            raw === "true" ||
            (typeof raw === "string" && raw.toLowerCase() === "true");
          return renderBooleanCheckbox(col, v, {
            tabIndex: -1,
            "aria-label": String(col.headerName ?? field),
            onChange: () => {},
            style: { pointerEvents: "none" as const }
          });
        }
        if (col.type === "date") return formatGridDateBr(raw, false);
        if (col.type === "dateTime") return formatGridDateBr(raw, true);
        return raw == null ? "" : String(raw);
      }
      const params: GridRenderCellParams<R, unknown> = {
        id,
        field,
        row,
        value: raw as never,
        formattedValue:
          col.valueFormatter != null
            ? col.valueFormatter({
                id,
                field,
                row,
                value: raw as never
              })
            : raw,
        api,
        colDef: col,
        hasFocus: false,
        tabIndex: -1
      };
      if (col.renderCell) {
        return col.renderCell(params) as React.ReactNode;
      }
      if (col.getActions) {
        const nodes = col.getActions({
          id,
          field,
          row,
          api,
          colDef: col
        });
        return renderGridActionsFromNodes(nodes ?? [], col.align);
      }
      if (col.type === "boolean") {
        const v =
          raw === true ||
          raw === "true" ||
          (typeof raw === "string" && raw.toLowerCase() === "true");
        return renderBooleanCheckbox(col, v, {
          tabIndex: -1,
          "aria-label": String(col.headerName ?? field),
          onChange: () => {},
          style: { pointerEvents: "none" as const }
        });
      }
      if (col.valueFormatter) {
        return col.valueFormatter({
          id,
          field,
          row,
          value: raw as never
        });
      }
      if (col.type === "date") {
        return formatGridDateBr(raw, false);
      }
      if (col.type === "dateTime") {
        return formatGridDateBr(raw, true);
      }
      if (col.type === "singleSelect") {
        return formatSingleSelectDisplay(raw, resolveColValueOptions(col, id, row));
      }
      return raw == null ? "" : String(raw);
    };

    base.header = () => {
      const api = ctx.apiRef.current;
      if (!api) return col.headerName ?? field;
      if (col.renderHeader) {
        const p: GridRenderHeaderParams<R> = { field, colDef: col, api };
        return col.renderHeader(p) as React.ReactNode;
      }
      return col.headerName ?? field;
    };

    return base;
  });
}
