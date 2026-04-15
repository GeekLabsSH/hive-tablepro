import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type Column,
  type ColumnDef,
  type ColumnOrderState,
  type ColumnSizingInfoState,
  type ColumnSizingState,
  type ExpandedState,
  type GroupingState,
  type Header,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import * as React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { cn } from "../../../src/lib/utils";
import { Button } from "../../../src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../../../src/components/ui/dropdown-menu";
import { Input } from "../../../src/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "../../../src/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../../../src/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "../../../src/components/ui/table";
import { buildColumnDefs, colHasValueOptions, defaultGetRowId, resolveColValueOptions } from "./adapter";
import { resolveDensityDimensions } from "./gridDensityDefaults";
import {
  createGridApi,
  restoreHorizontalScrollSnapshots,
  snapshotHorizontalScrollAncestors
} from "./api";
import { ColumnFilterDialog } from "./ColumnFilterDialog";
import { GridColumnsPanel } from "./GridColumnsPanel";
import { GridFilterPanel } from "./GridFilterPanel";
import { GridDefaultRowEditActions } from "./GridRowEditActions";
import { GridToolbarFilterColumnsDensityRow } from "./gridToolbar";
import { isDataCellInteractiveTarget } from "./isDataCellInteractiveTarget";
import {
  isGlobalSelectAllExclude,
  normalizeSelectionIds,
  rowSelectionModelFromState,
  rowSelectionStateFromModel,
  selectedRowCountForFooter,
  selectionModelType
} from "./selectionUtils";
import type {
  DataGridProps,
  DataGridRowPresentation,
  GridFooterSlotProps,
  GridPaginationSlotProps
} from "./dataGridProps";
import type { HiveGlobalFilterBag } from "./filterFns";
import { rowPassesHiveGlobalFilter } from "./filterFns";
import type {
  GridAlignment,
  GridApiCommunity,
  GridCellParams,
  GridColDef,
  GridColumnOrderChangeParams,
  GridDensity,
  GridDetailPanelParams,
  GridEditCellProps,
  GridFilterModel,
  GridLocaleText,
  GridPaginationModel,
  GridRenderEditCellParams,
  GridRenderHeaderParams,
  GridRowEditStopReason,
  GridRowId,
  GridRowModeEntry,
  GridRowModesModel,
  GridRowUpdate,
  GridRowSelectionModel,
  GridStateSnapshot,
  GridSortModel,
  GridSubscriptionEvent,
  GridValidRowModel,
  GridValueOptionsList
} from "./types";
import { GridRowEditStopReasons, GridRowModes, rowModeEntryIsEdit } from "./types";

import {
  mergePersistedColumnOrder,
  mergePersistedColumnSizing,
  pickPersistableColumnSizing,
  readGridPreferencesFromStorage,
  writeGridPreferencesToStorage
} from "./persistGridPreferences";
import { buildClipboardPastePlan, parseClipboardTsv } from "./clipboardPaste";
import { announceTextForFilterModel, announceTextForSortModel } from "./gridAnnouncements";
import type { PersistedGridPreferences } from "./persistGridPreferences";
import { GridRootProvider, useGridRootContext } from "./GridRootContext";
import { hiveTableproObserve } from "./observability";

/**
 * Divisor vertical curto entre cabeçalhos (~30% menos alto que 22%/56%), traço fino;
 * só no hover da célula (sem «negrito» visual).
 */
const HEADER_COL_DIVIDER_CLASS =
  "before:pointer-events-none before:absolute before:left-0 before:top-[32%] before:z-[1] before:h-[36%] before:w-px before:bg-border/55 before:opacity-0 before:transition-opacity hover:before:opacity-100";

function gridRowIdsEqual(a: GridRowId, b: GridRowId): boolean {
  return Object.is(a, b) || String(a) === String(b);
}

const DISMISS_DRAFT_EDIT_STOP_REASONS = new Set<GridRowEditStopReason>([
  GridRowEditStopReasons.rowFocusOut,
  GridRowEditStopReasons.escapeKeyDown,
  GridRowEditStopReasons.tabKeyDown,
  GridRowEditStopReasons.shiftTabKeyDown
]);

/**
 * Cadeia horizontal para restauro: a partir de uma célula (como `setCellFocus`), não só do contentor da API —
 * evidência v7: `snapshotHorizontalScrollAncestors(getScrollContainer())` deu `[0,0]` enquanto a partir da célula `[1556,0]`.
 */
function buildHorizontalScrollRestoreChain(scrollRoot: HTMLElement | null): {
  chain: Array<{ el: HTMLElement; left: number }>;
  debug: Record<string, unknown>;
} {
  if (!scrollRoot) {
    return { chain: [], debug: { scrollRoot: false } };
  }
  const probe = (scrollRoot.querySelector("[data-hive-cell]") ?? scrollRoot) as HTMLElement;
  const raw = snapshotHorizontalScrollAncestors(probe);
  /**
   * Incluir scrollports que envolvem o contentor da API (ex. shell Proton com `overflow-x`) —
   * não podemos filtrar só por `.hive-data-grid`: os pais desse nó ficam de fora e era aí que o
   * `scrollLeft` real vivia nas sessões de debug.
   */
  const filtered = raw.filter(
    ({ el }) =>
      el === scrollRoot || scrollRoot.contains(el) || el.contains(scrollRoot)
  );
  return {
    chain: filtered.map((s) => ({ el: s.el, left: s.left })),
    debug: {
      probeIsDataHiveCell: probe.hasAttribute("data-hive-cell"),
      rawLen: raw.length,
      rawLefts: raw.map((r) => r.left),
      filteredLen: filtered.length,
      filteredLefts: filtered.map((r) => r.left),
      scrollRootTag: scrollRoot.tagName
    }
  };
}

/** `MouseEvent.target` pode ser `Text` — sem `closest`; normaliza para `HTMLElement`. */
function eventTargetElement(target: EventTarget | null): HTMLElement | null {
  if (target == null) return null;
  const n = target as Node;
  if (typeof n.nodeType === "number" && n.nodeType === 3) return n.parentElement ?? null;
  if (typeof Element !== "undefined" && target instanceof Element) return target as HTMLElement;
  return null;
}

/** Alvo real em `onInteractOutside` / `onPointerDownOutside` / `onFocusOutside` (Radix usa `detail.originalEvent`). */
function hiveDismissableOutsideTarget(ev: unknown): HTMLElement | null {
  if (ev == null || typeof ev !== "object") return null;
  const e = ev as { target?: EventTarget | null; detail?: { originalEvent?: Event } };
  return eventTargetElement(e.detail?.originalEvent?.target ?? e.target ?? null);
}

/**
 * Radix Select (portal) aberto: em alguns browsers/layers o `document` recebe um `click` cujo
 * `target` é `<html>` — `closest(portal)` falha e terminávamos edição à força (ver logs H5).
 */
function documentHasOpenRadixSelectDropdown(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.querySelector('[role="listbox"][data-state="open"]') != null ||
    document.querySelector("[data-radix-select-viewport]") != null ||
    document.querySelector('[data-hive-searchable-select-popover][data-state="open"]') != null
  );
}

/**
 * Sensores do @dnd-kit só existem quando este componente monta (reordenação ativa + cabeçalhos).
 * Declarar `useSensors` no pai com `DndContext` condicional mantinha os sensores sempre ativos e podia bloquear o browser.
 */
function ColumnReorderOptional({
  active,
  onDragEnd,
  children
}: {
  active: boolean;
  onDragEnd: (e: DragEndEvent) => void;
  children: React.ReactNode;
}) {
  if (!active) return <>{children}</>;
  return <ColumnReorderDndInner onDragEnd={onDragEnd}>{children}</ColumnReorderDndInner>;
}

function ColumnReorderDndInner({
  onDragEnd,
  children
}: {
  onDragEnd: (e: DragEndEvent) => void;
  children: React.ReactNode;
}) {
  const pointerActivationConstraint = React.useMemo(
    () => ({ activationConstraint: { distance: 8 } }),
    []
  );
  const sensors = useSensors(
    useSensor(PointerSensor, pointerActivationConstraint),
    useSensor(KeyboardSensor, {})
  );
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      {children}
    </DndContext>
  );
}

/** Modo tabela: scroll vertical no contentor (nativo ou `autoHeight`). */
function NonVirtualGridBody({
  autoHeight,
  autoHeightMaxHeight,
  scrollRef,
  onViewportScrollSync,
  children
}: {
  autoHeight: boolean;
  autoHeightMaxHeight?: number;
  scrollRef: React.RefObject<HTMLDivElement>;
  /** Atualiza ref de scroll da grelha (wheel/trackpad nem sempre dispara `scroll` no attach nativo). */
  onViewportScrollSync?: () => void;
  children: React.ReactNode;
}) {
  const rafWheelRef = React.useRef<number | null>(null);
  const scheduleWheelSync = React.useCallback(() => {
    if (rafWheelRef.current != null) cancelAnimationFrame(rafWheelRef.current);
    rafWheelRef.current = requestAnimationFrame(() => {
      rafWheelRef.current = null;
      onViewportScrollSync?.();
    });
  }, [onViewportScrollSync]);
  React.useEffect(
    () => () => {
      if (rafWheelRef.current != null) cancelAnimationFrame(rafWheelRef.current);
    },
    []
  );

  if (autoHeight) {
    return (
      <div
        ref={scrollRef}
        data-hive-grid-scroll
        className="min-h-[200px] w-full min-w-0 overflow-auto"
        style={
          autoHeightMaxHeight != null && Number.isFinite(autoHeightMaxHeight) && autoHeightMaxHeight > 0
            ? { maxHeight: autoHeightMaxHeight }
            : undefined
        }
        onScroll={() => onViewportScrollSync?.()}
        onWheel={scheduleWheelSync}
      >
        {children}
      </div>
    );
  }
  /** Scroll nativo: `ScrollArea` (Radix) + tabelas grandes tem casos de layout/medida que bloqueiam o thread em alguns browsers. */
  return (
    <div
      ref={scrollRef}
      className="max-h-[min(70vh,560px)] w-full min-w-0 overflow-auto"
      data-hive-grid-scroll
      onScroll={() => onViewportScrollSync?.()}
      onWheel={scheduleWheelSync}
    >
      {children}
    </div>
  );
}

function resolveCellClassNames<R extends GridValidRowModel, V = unknown>(
  colDef: GridColDef<R, V> | undefined,
  params: GridCellParams<R, V>,
  gridGetCellClassName?: (p: GridCellParams<R, V>) => string | undefined | null
): string | undefined {
  const fromProp =
    colDef && (colDef.cellClassName == null
      ? undefined
      : typeof colDef.cellClassName === "function"
        ? colDef.cellClassName(params)
        : colDef.cellClassName);
  const fromGetter = colDef?.getCellClassName?.(params);
  const fromGrid = gridGetCellClassName?.(params);
  return cn(fromProp, fromGetter, fromGrid);
}

function resolveHeaderExtraClassName<R extends GridValidRowModel>(
  colDef: GridColDef<R> | undefined,
  params: GridRenderHeaderParams<R>
): string | undefined {
  if (!colDef?.headerClassName) return undefined;
  return typeof colDef.headerClassName === "function"
    ? colDef.headerClassName(params)
    : colDef.headerClassName;
}

function expandedStateFromRowIds(ids: GridRowId[]): ExpandedState {
  const o: Record<string, boolean> = {};
  for (const id of ids) o[String(id)] = true;
  return o;
}

function buildTreeFromPaths<R extends GridValidRowModel>(
  flatRows: R[],
  getRowId: (row: R) => GridRowId,
  getTreeDataPath: (row: R) => readonly GridRowId[]
): { roots: R[]; childrenByParent: Map<string, R[]> } {
  const idSet = new Set(flatRows.map((r) => String(getRowId(r))));
  const childrenByParent = new Map<string, R[]>();
  const roots: R[] = [];
  for (const row of flatRows) {
    const path = getTreeDataPath(row).map(String);
    if (path.length === 0) continue;
    const id = String(getRowId(row));
    if (path[path.length - 1] !== id) continue;
    if (path.length === 1) {
      roots.push(row);
      continue;
    }
    const parentId = path[path.length - 2];
    if (!idSet.has(parentId)) continue;
    const list = childrenByParent.get(parentId);
    if (list) list.push(row);
    else childrenByParent.set(parentId, [row]);
  }
  return { roots, childrenByParent };
}

function sortModelToSortingState(m: GridSortModel): SortingState {
  return m
    .filter((s) => s.sort === "asc" || s.sort === "desc")
    .map((s) => ({ id: s.field, desc: s.sort === "desc" }));
}

function sortingStateToSortModel(s: SortingState): GridSortModel {
  return s.map((x) => ({ field: x.id, sort: x.desc ? "desc" : "asc" }));
}

function alignTextClass(a?: GridAlignment): string {
  if (a === "right") return "text-right";
  if (a === "left") return "text-left";
  return "text-center";
}

/** Centrar checkbox / coluna de seleção no eixo transversal ao `flex-col` da célula. */
function bodyCellIconCrossAxisClass(
  fieldId: string,
  gridColDef: { type?: string; align?: GridAlignment } | undefined
): string | undefined {
  if (fieldId === "__select__") return "items-center";
  if (gridColDef?.type === "boolean") {
    if (gridColDef.align === "right") return "items-center justify-end";
    if (gridColDef.align === "left") return "items-center justify-start";
    return "items-center justify-center";
  }
  return undefined;
}

function headerJustifyClass(a?: GridAlignment): string {
  if (a === "right") return "justify-end";
  if (a === "left") return "justify-start";
  return "justify-center";
}

function getOrderedLeafHeaders<R extends GridValidRowModel>(
  table: TanstackTable<R>
): Header<R, unknown>[] {
  const hg = table.getHeaderGroups()[0];
  if (!hg) return [];
  const map = new Map(hg.headers.map((h) => [h.column.id, h]));
  const out: Header<R, unknown>[] = [];
  for (const col of [
    ...table.getLeftLeafColumns(),
    ...table.getCenterLeafColumns(),
    ...table.getRightLeafColumns()
  ]) {
    const h = map.get(col.id);
    if (h) out.push(h);
  }
  return out;
}

/**
 * Só estes cabeçalhos usam `DraggableHeaderCell` + `useSortable`. Os restantes são `TableHead` sem sortable:
 * o `items` do `SortableContext` tem de listar **apenas** ids com `useSortable`, senão o @dnd-kit entra em estado inválido (travamento, layout partido).
 */
/** Evita `SortableContext` com `items` vazio ou sem `useSortable` nos filhos (quebra o @dnd-kit). */
function HeaderSortableWrap({
  bypass,
  items,
  children
}: {
  bypass: boolean;
  items: string[];
  children: React.ReactNode;
}) {
  if (bypass) return <>{children}</>;
  return (
    <SortableContext items={items} strategy={horizontalListSortingStrategy}>
      {children}
    </SortableContext>
  );
}

function leafHeaderIsDraggable<R extends GridValidRowModel>(
  header: Header<R, unknown>,
  columnsProp: GridColDef<R>[],
  disableColumnReorderGlobal?: boolean
): boolean {
  if (disableColumnReorderGlobal) return false;
  const id = header.column.id;
  const isPinned = header.column.getIsPinned() !== false;
  if (isPinned) return false;
  if (id === "__select__" || id === "__detail__" || id === "__tree__") return false;
  const colDef = columnsProp.find((c) => c.field === id);
  if (colDef?.disableReorder === true) return false;
  return true;
}

function cellEditorSupported<R extends GridValidRowModel>(col: GridColDef<R> | undefined): boolean {
  if (!col) return false;
  if (col.renderEditCell) return true;
  if (col.type === "singleSelect") {
    return (
      colHasValueOptions(col) || col.async === true || col.loadEditValueOptions != null
    );
  }
  if (col.type === "boolean") return true;
  if (col.type === "string" || col.type === "number") return true;
  if (col.type === undefined) return true;
  return false;
}

/** Uma linha de texto com reticências quando a célula não está em modo edição ativo (paridade MUI / densidade). */
function bodyCellShowsActiveEditor<R extends GridValidRowModel>(
  row: Row<R>,
  field: string,
  getRowId: (row: R) => GridRowId,
  editMode: "cell" | "row",
  rowModesModel: GridRowModesModel,
  editing: { rowId: GridRowId; field: string } | null,
  gridColDef: GridColDef<R> | undefined,
  isCellEditableGrid: ((p: GridCellParams<R>) => boolean) | undefined,
  hasProcessOrRowsChange: boolean
): boolean {
  if (row.getIsGrouped()) return false;
  const rowId = getRowId(row.original);
  const cellParams: GridCellParams<R> = {
    id: rowId,
    field,
    row: row.original,
    value: row.getValue(field)
  };
  const rowInEdit = editMode === "row" && rowModeEntryIsEdit(rowModesModel[String(rowId)]);
  const cellInEdit =
    editMode === "cell" &&
    editing != null &&
    String(editing.rowId) === String(rowId) &&
    editing.field === field;
  if (!(rowInEdit || cellInEdit) || !hasProcessOrRowsChange) return false;
  const gridAllowsEdit = isCellEditableGrid == null || isCellEditableGrid(cellParams);
  const colAllowsEdit =
    gridAllowsEdit &&
    gridColDef?.editable === true &&
    (gridColDef.isCellEditable == null || gridColDef.isCellEditable(cellParams)) &&
    cellEditorSupported(gridColDef);
  return colAllowsEdit;
}

function isIconLikeTableColumn<R extends GridValidRowModel>(
  fieldStr: string,
  gridColDef?: GridColDef<R, unknown>
): boolean {
  if (fieldStr === "__select__" || fieldStr === "__detail__" || fieldStr === "__tree__") return true;
  if (gridColDef?.type === "actions" || gridColDef?.getActions != null) return true;
  if (gridColDef?.type === "boolean") return true;
  return false;
}

function bodyCellDensityPaddingClass(density: GridDensity, opts?: { tight?: boolean }): string {
  const tight = opts?.tight === true;
  /** `!p-0` anula o `p-4` default do shadcn `TableCell` (`p-4` + `!px` não remove o padding vertical). */
  /** Células de texto: ~15px à esquerda (`0.9375rem`); colunas ícone/checkbox mantêm padding simétrico compacto. */
  if (density === "compact") {
    return tight ? "!p-0 !px-1.5 !py-0.5" : "!p-0 !py-0.5 !ps-[0.9375rem] !pe-1.5";
  }
  if (density === "comfortable") {
    return tight ? "!p-0 !px-3 !py-2" : "!p-0 !py-2 !ps-[0.9375rem] !pe-3";
  }
  return tight ? "!p-0 !px-2 !py-1" : "!p-0 !py-1 !ps-[0.9375rem] !pe-2";
}

/**
 * Caixa de conteúdo da célula (bloco dentro do `<td>`).
 * Em tabelas CSS, `height`/`maxHeight` no `<td>` é muitas vezes só mínimo ou ignorado; o `<th>` do cabeçalho
 * usa `minHeight`+`height` no estilo e por isso a densidade «parece» aplicar-se só ao header.
 */
function bodyCellContentBoxStyle(rowPx: number, cellInEdit: boolean): React.CSSProperties | undefined {
  if (cellInEdit) {
    return {
      minHeight: rowPx,
      height: rowPx,
      maxHeight: rowPx,
      boxSizing: "border-box",
      /** Contém editores na altura da linha (compact 15px); `visible` fazia sobrepor a linha seguinte. */
      overflow: "hidden"
    };
  }
  return { height: rowPx, maxHeight: rowPx, boxSizing: "border-box", overflow: "hidden" };
}

/** Padding horizontal/vertical do `<th>` alinhado à densidade; `!p-0` cobre o `px-4` / `h-12` implícitos do `TableHead`. */
function headerCellDensityPaddingClass(density: GridDensity, opts?: { tight?: boolean }): string {
  const tight = opts?.tight === true;
  if (density === "compact") {
    return tight ? "!p-0 !px-1.5 !py-1" : "!p-0 !ps-[0.9375rem] !pe-1.5 !py-1";
  }
  if (density === "comfortable") {
    return tight ? "!p-0 !px-3 !py-2" : "!p-0 !ps-[0.9375rem] !pe-3 !py-2";
  }
  return tight ? "!p-0 !px-2 !py-1.5" : "!p-0 !ps-[0.9375rem] !pe-2 !py-1.5";
}

/** Cópia rasa da linha ao entrar em edição por linha — `onRowEditStop.previousRow` (G5.5). */
function shallowRowSnapshotForEdit<R extends GridValidRowModel>(row: R): R {
  if (row !== null && typeof row === "object" && !Array.isArray(row)) {
    return { ...(row as object) } as R;
  }
  return row;
}

type HiveSelectOptionNorm = { value: string; label: string; raw: string | number };

function hiveNormalizeSelectOptions(options: GridValueOptionsList): HiveSelectOptionNorm[] {
  return options.map((o) => {
    if (o !== null && typeof o === "object" && "value" in o) {
      const x = o as { value: string | number; label: string };
      return { value: String(x.value), label: x.label, raw: x.value };
    }
    return { value: String(o), label: String(o), raw: o as string | number };
  });
}

function hiveCoerceSelectPrimitive(value: unknown): unknown {
  if (value != null && typeof value === "object" && !Array.isArray(value) && "value" in (value as object)) {
    return (value as { value: unknown }).value;
  }
  return value;
}

/** Corresponde valor da linha a uma opção (inclui etiqueta = "P" quando o `value` guardado é número 3, etc.). */
function hiveSelectMatchOption(opts: HiveSelectOptionNorm[], value: unknown): HiveSelectOptionNorm | undefined {
  if (opts.length === 0) return undefined;
  const coerced = hiveCoerceSelectPrimitive(value);
  const byPrimitive = opts.find(
    (o) =>
      Object.is(o.raw, coerced) ||
      Object.is(o.raw, value) ||
      String(o.raw) === String(coerced) ||
      o.value === String(coerced) ||
      (typeof o.raw === "number" &&
        typeof coerced === "string" &&
        coerced.trim() !== "" &&
        !Number.isNaN(Number(coerced)) &&
        o.raw === Number(coerced)) ||
      (typeof o.raw === "number" &&
        typeof coerced === "number" &&
        !Number.isNaN(coerced) &&
        o.raw === coerced) ||
      (o.raw != null &&
        coerced != null &&
        typeof o.raw !== "object" &&
        typeof coerced !== "object" &&
        (o.raw as unknown) == (coerced as unknown))
  );
  if (byPrimitive) return byPrimitive;
  const vStr = coerced == null ? "" : String(coerced).trim();
  if (!vStr.length) return undefined;
  const vLower = vStr.toLowerCase();
  return opts.find(
    (o) => o.label.trim() === vStr || o.label.trim().toLowerCase() === vLower
  );
}

function GridCellSearchableSelectEditor<R extends GridValidRowModel>({
  value,
  valueOptions,
  onCommit,
  ariaLabel,
  rowId,
  row,
  field,
  loadEditValueOptions,
  onCancel,
  editMode,
  onEnterSaveRow
}: {
  value: unknown;
  valueOptions: GridValueOptionsList;
  onCommit: (v: string | number | null) => void;
  onCancel: () => void;
  ariaLabel: string;
  rowId: GridRowId;
  row: R;
  field: string;
  /** Em modo linha: após Enter na lista, grava a linha (`api.commitRowEditSave`). */
  onEnterSaveRow?: () => void;
  editMode: "row" | "cell";
  loadEditValueOptions?: (
    input: string,
    params: { id: GridRowId; row: R; field: string }
  ) => Promise<GridValueOptionsList>;
}) {
  const gridRoot = useGridRootContext();
  const density = gridRoot?.density ?? "standard";
  const isCompact = density === "compact";
  const isComfortable = density === "comfortable";
  const allOpts = React.useMemo(() => hiveNormalizeSelectOptions(valueOptions), [valueOptions]);
  const [remoteOpts, setRemoteOpts] = React.useState<HiveSelectOptionNorm[] | null>(null);
  const [remoteLoading, setRemoteLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [filterQ, setFilterQ] = React.useState("");
  /** -1 = pesquisa; >=0 índice em `shown` */
  const [highlightIdx, setHighlightIdx] = React.useState(-1);
  /** Rótulo escolhido até `valueOptions`/`remoteOpts` conseguirem resolver o id (evita mostrar só o id). */
  const [pickedDisplay, setPickedDisplay] = React.useState<{
    raw: string | number;
    label: string;
  } | null>(null);
  const openReasonRef = React.useRef<"click" | "type" | "arrow" | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLElement | null>(null);
  const triggerBtnRef = React.useRef<HTMLButtonElement>(null);
  const filterInputRef = React.useRef<HTMLInputElement>(null);

  const shouldPreventOutsideClose = React.useCallback((ev: unknown) => {
    const el = hiveDismissableOutsideTarget(ev);
    if (!el) return false;
    return Boolean(rootRef.current?.contains(el) || contentRef.current?.contains(el));
  }, []);

  const match = React.useMemo(() => {
    const fromStatic = hiveSelectMatchOption(allOpts, value);
    if (fromStatic) return fromStatic;
    if (loadEditValueOptions && remoteOpts != null && remoteOpts.length > 0) {
      return hiveSelectMatchOption(remoteOpts, value);
    }
    return undefined;
  }, [allOpts, value, loadEditValueOptions, remoteOpts]);

  React.useEffect(() => {
    if (match?.label != null && String(match.label).trim().length > 0) {
      setPickedDisplay(null);
    }
  }, [match?.label]);

  React.useEffect(() => {
    setPickedDisplay((pd) => {
      if (pd == null) return pd;
      const v = hiveCoerceSelectPrimitive(value);
      const same =
        Object.is(pd.raw, v) ||
        Object.is(pd.raw, value) ||
        String(pd.raw) === String(v);
      return same ? pd : null;
    });
  }, [value]);

  const triggerLabel = React.useMemo(() => {
    if (match?.label != null && String(match.label).trim().length > 0) return match.label;
    if (pickedDisplay != null) {
      const v = hiveCoerceSelectPrimitive(value);
      const same =
        Object.is(pickedDisplay.raw, v) ||
        Object.is(pickedDisplay.raw, value) ||
        String(pickedDisplay.raw) === String(v);
      if (same && pickedDisplay.label.trim().length > 0) return pickedDisplay.label;
    }
    const c = hiveCoerceSelectPrimitive(value);
    if (c == null || c === "") return "";
    if (typeof c === "object") return "";
    return String(c);
  }, [match?.label, value, pickedDisplay]);

  const tooltipFullText = (match?.label ?? triggerLabel).trim();

  React.useEffect(() => {
    if (!open) {
      setHighlightIdx(-1);
      return;
    }
    if (openReasonRef.current === "type") {
      openReasonRef.current = null;
      return;
    }
    if (openReasonRef.current === "arrow") {
      openReasonRef.current = null;
      setFilterQ("");
      setHighlightIdx(0);
      return;
    }
    setFilterQ("");
    setHighlightIdx(-1);
    openReasonRef.current = null;
  }, [open]);

  React.useEffect(() => {
    if (!loadEditValueOptions) {
      setRemoteOpts(null);
      return;
    }
    let cancelled = false;
    setRemoteLoading(true);
    const t = window.setTimeout(() => {
      void loadEditValueOptions(filterQ, { id: rowId, row, field })
        .then((raw) => {
          if (!cancelled) setRemoteOpts(hiveNormalizeSelectOptions(raw ?? []));
        })
        .finally(() => {
          if (!cancelled) setRemoteLoading(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [filterQ, loadEditValueOptions, rowId, row, field]);

  const shown = React.useMemo(() => {
    const ft = filterQ.trim().toLowerCase();
    if (loadEditValueOptions) {
      const base = remoteOpts ?? [];
      if (!ft.length) return base;
      return base.filter((o) => o.label.toLowerCase().includes(ft));
    }
    if (!ft.length) return allOpts;
    return allOpts.filter((o) => o.label.toLowerCase().includes(ft));
  }, [allOpts, filterQ, loadEditValueOptions, remoteOpts]);

  const shownRef = React.useRef(shown);
  shownRef.current = shown;

  React.useEffect(() => {
    /** Com `loadEditValueOptions`, `shown` pode estar vazio enquanto `remoteLoading`; não rebater o índice 0 antes da lista existir. */
    if (remoteLoading && loadEditValueOptions && shown.length === 0) return;
    if (highlightIdx >= 0 && highlightIdx >= shown.length) {
      setHighlightIdx(shown.length > 0 ? shown.length - 1 : -1);
    }
  }, [highlightIdx, shown.length, remoteLoading, loadEditValueOptions]);

  const primitiveId = hiveCoerceSelectPrimitive(value);
  const hasCommittedSelection =
    primitiveId !== null &&
    primitiveId !== undefined &&
    primitiveId !== "" &&
    !(typeof primitiveId === "number" && Number.isNaN(primitiveId));

  const clearSelection = () => {
    setPickedDisplay(null);
    setOpen(false);
    setFilterQ("");
    setHighlightIdx(-1);
    onCommit(null);
  };

  const handleOpenChange = React.useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setFilterQ("");
      setHighlightIdx(-1);
    }
  }, []);

  const commitOption = React.useCallback(
    (raw: string | number, mode: "enter" | "space" | "click", displayLabel?: string) => {
      const label =
        displayLabel?.trim() ??
        shownRef.current.find(
          (o) =>
            Object.is(o.raw, raw) ||
            String(o.raw) === String(raw) ||
            o.value === String(raw)
        )?.label;
      if (label != null && String(label).trim().length > 0) {
        setPickedDisplay({ raw, label: String(label) });
      }
      onCommit(raw);
      handleOpenChange(false);
      if (mode === "enter" && editMode === "row" && onEnterSaveRow) {
        window.queueMicrotask(() => {
          onEnterSaveRow();
        });
      }
    },
    [onCommit, handleOpenChange, editMode, onEnterSaveRow]
  );

  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      triggerBtnRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  /**
   * Foco no filtro ou na opção só ao abrir ou ao mudar destaque (↑/↓).
   * Usa rAF + retries: o conteúdo do Popover está num portal e no layout seguinte ao `open`
   * o `input` ainda pode não existir — focar cedo falhava e o ref "já aberto" impedia nova tentativa.
   * `focusNavPrevRef` só avança após foco bem-sucedido (ou esgotar retries) para o Strict Mode não saltar a 2.ª tentativa.
   */
  const focusNavPrevRef = React.useRef<{ open: boolean; hl: number }>({ open: false, hl: -1 });
  React.useEffect(() => {
    if (!open) {
      focusNavPrevRef.current = { open: false, hl: highlightIdx };
      return;
    }
    const prev = focusNavPrevRef.current;
    const openedNow = open && !prev.open;
    const hlMoved = highlightIdx !== prev.hl;
    if (!openedNow && !hlMoved) return;

    let cancelled = false;
    let n = 0;
    const maxN = 24;
    const snapHl = highlightIdx;

    const finish = () => {
      focusNavPrevRef.current = { open: true, hl: snapHl };
    };

    const pump = () => {
      if (cancelled) return;
      const list = shownRef.current;
      if (snapHl >= 0 && snapHl < list.length) {
        const btn = contentRef.current?.querySelector<HTMLButtonElement>(
          `button[data-hive-opt-idx="${snapHl}"]`
        );
        btn?.focus();
        if (document.activeElement === btn) {
          finish();
          return;
        }
      } else {
        filterInputRef.current?.focus();
        if (document.activeElement === filterInputRef.current) {
          finish();
          return;
        }
      }
      n += 1;
      if (n >= maxN) {
        finish();
        return;
      }
      requestAnimationFrame(pump);
    };

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(pump);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [open, highlightIdx]);

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const len = shownRef.current.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => {
        if (i < len - 1) return i + 1;
        if (i === -1 && len > 0) return 0;
        return i;
      });
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => {
        if (i > 0) return i - 1;
        if (i === 0) return -1;
        return i;
      });
    }
  };

  const chromeRow = cn(
    "relative flex min-h-0 min-w-0 max-w-full flex-1 flex-row overflow-hidden rounded-none border border-input bg-background text-foreground",
    /** Destaque forte: trigger/filtro com foco ou popover aberto. */
    "focus-within:bg-muted/70 focus-within:ring-2 focus-within:ring-ring/80",
    open && "bg-muted/60 ring-2 ring-ring/70 shadow-sm",
    isCompact && "items-center gap-0 py-0 ps-0.5 pe-0",
    isComfortable && "items-stretch gap-1 py-1 ps-2 pe-1",
    !isCompact && !isComfortable && "items-stretch gap-0.5 py-0.5 ps-1 pe-0.5"
  );

  const triggerBtnClass = cn(
    "flex min-h-0 min-w-0 flex-1 flex-row items-center justify-between overflow-hidden rounded-none border-0 bg-transparent text-left !text-foreground shadow-none outline-none ring-0",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
    isCompact && "h-full max-h-full gap-0 px-0.5 py-0 text-[11px] leading-normal",
    !isCompact && "gap-1",
    isComfortable && "min-h-[2rem] px-2 py-0.5 text-base leading-snug",
    !isCompact && !isComfortable && "min-h-[1.75rem] px-2 py-0 text-sm leading-tight"
  );

  const filterInputClass = cn(
    "w-full min-w-0 rounded-none border-0 border-b border-border bg-transparent !text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
    isCompact &&
      "!h-6 !min-h-0 !max-h-6 px-1.5 py-0 text-[11px] leading-tight placeholder:text-muted-foreground/90",
    isComfortable && "h-10 px-2.5 py-2 text-base placeholder:text-muted-foreground",
    !isCompact && !isComfortable && "h-9 px-2 py-1.5 text-sm placeholder:text-muted-foreground"
  );

  const listBtnBaseClass = cn(
    "flex w-full min-w-0 max-w-full cursor-default items-center overflow-hidden text-left hover:bg-accent",
    "whitespace-nowrap",
    isCompact ? "px-1.5 py-0.5 text-[11px] leading-tight" : isComfortable ? "px-2 py-2 text-base" : "px-2 py-1.5 text-sm"
  );

  /** Painel fixo 200×500px (altura máx. respeita viewport); lista ocupa o resto com scroll. */
  const popoverPanelClass = cn(
    "z-[9999] flex w-[200px] min-w-[200px] max-w-[200px] flex-col overflow-hidden border border-border p-0 shadow-md",
    "h-[min(500px,calc(100dvh-16px))] max-h-[min(500px,calc(100dvh-16px))]"
  );

  const listScrollClass = cn(
    "min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-none bg-popover",
    isCompact ? "text-[11px] leading-tight" : isComfortable ? "text-base" : "text-sm"
  );

  return (
    <div
      ref={rootRef}
      data-hive-edit-root
      data-hive-searchable-select
      dir="ltr"
      className="relative flex h-full min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden px-[3px]"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Popover modal={false} open={open} onOpenChange={handleOpenChange}>
        <div dir="ltr" className={chromeRow}>
          <PopoverAnchor asChild>
            <button
              ref={triggerBtnRef}
              type="button"
              className={triggerBtnClass}
              aria-label={ariaLabel}
              aria-expanded={open}
              aria-haspopup="listbox"
              title={isCompact && tooltipFullText.length > 0 ? tooltipFullText : undefined}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                openReasonRef.current = "click";
                handleOpenChange(!open);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  if (open) handleOpenChange(false);
                  else onCancel();
                  return;
                }
                const printable =
                  e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== " ";
                if (!open && printable) {
                  e.preventDefault();
                  openReasonRef.current = "type";
                  setFilterQ(e.key);
                  setOpen(true);
                  return;
                }
                if (!open && e.key === "ArrowDown") {
                  e.preventDefault();
                  openReasonRef.current = "arrow";
                  setOpen(true);
                  return;
                }
                if (!open && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  openReasonRef.current = "click";
                  setOpen(true);
                }
              }}
            >
              <span className="min-w-0 flex-1 truncate leading-none">
                {triggerLabel.length > 0 ? triggerLabel : "\u00a0"}
              </span>
              {isCompact ? (
                <span
                  className="pointer-events-none shrink-0 select-none text-[9px] leading-none text-muted-foreground"
                  aria-hidden
                >
                  ▾
                </span>
              ) : (
                <ChevronDownIcon
                  className={cn(
                    "shrink-0 opacity-60",
                    isComfortable ? "h-4 w-4" : "h-3.5 w-3.5"
                  )}
                  aria-hidden
                />
              )}
            </button>
          </PopoverAnchor>
          {hasCommittedSelection || triggerLabel.trim().length > 0 ? (
            isCompact ? (
              <button
                type="button"
                className="ms-0.5 flex h-2.5 w-2.5 shrink-0 items-center justify-center self-center rounded-sm border-0 bg-transparent p-0 text-muted-foreground hover:bg-accent/90 hover:text-foreground"
                aria-label="Limpar"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (hasCommittedSelection) {
                    clearSelection();
                  } else {
                    openReasonRef.current = "click";
                    setFilterQ("");
                    setOpen(true);
                  }
                }}
              >
                <XMarkIcon className="h-2 w-2 shrink-0" aria-hidden />
              </button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "ms-0.5 shrink-0 self-center rounded-none p-0 hover:bg-accent/90",
                  isComfortable ? "h-9 w-9" : "h-7 w-7"
                )}
                aria-label="Limpar"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (hasCommittedSelection) {
                    clearSelection();
                  } else {
                    openReasonRef.current = "click";
                    setFilterQ("");
                    setOpen(true);
                  }
                }}
              >
                <XMarkIcon className={cn("shrink-0", isComfortable ? "h-4 w-4" : "h-3 w-3")} aria-hidden />
              </Button>
            )
          ) : null}
        </div>
        <PopoverContent
          ref={(node) => {
            contentRef.current = node;
          }}
          data-hive-searchable-select-popover
          align="start"
          side="bottom"
          sideOffset={isCompact ? 1 : 2}
          collisionPadding={4}
          className={popoverPanelClass}
          onKeyDown={onMenuKeyDown}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            triggerBtnRef.current?.focus();
          }}
          onEscapeKeyDown={(e) => {
            e.stopPropagation();
            handleOpenChange(false);
          }}
          onPointerDownOutside={(e) => {
            if (shouldPreventOutsideClose(e)) e.preventDefault();
          }}
          onFocusOutside={(e) => {
            if (shouldPreventOutsideClose(e)) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (shouldPreventOutsideClose(e)) e.preventDefault();
          }}
        >
          <div className={cn("shrink-0 border-b border-border", isCompact ? "p-0.5" : "p-1")}>
            <Input
              ref={filterInputRef}
              value={filterQ}
              onChange={(e) => setFilterQ(e.target.value)}
              className={cn(filterInputClass, "truncate")}
              title={filterQ.trim().length > 0 ? filterQ : undefined}
              placeholder="Pesquisar…"
              aria-label="Pesquisar opções"
              autoComplete="off"
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  handleOpenChange(false);
                  return;
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (shown.length > 0) setHighlightIdx(0);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  e.stopPropagation();
                  setHighlightIdx((i) => (i > 0 ? i - 1 : i === 0 ? -1 : i));
                  return;
                }
                if (e.key === "Enter" && shown.length === 1) {
                  e.preventDefault();
                  commitOption(shown[0]!.raw, "enter", shown[0]!.label);
                }
              }}
            />
          </div>
          <ul role="listbox" className={listScrollClass}>
            {remoteLoading && loadEditValueOptions ? (
              <li className="px-2 py-1.5 text-muted-foreground">…</li>
            ) : null}
            {!remoteLoading &&
              shown.map((o, idx) => (
                <li key={o.value} className="min-w-0">
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        role="option"
                        data-hive-opt-idx={idx}
                        aria-selected={highlightIdx === idx}
                        title={o.label}
                        aria-label={o.label}
                        className={cn(
                          listBtnBaseClass,
                          highlightIdx === idx && "bg-accent/90 text-accent-foreground ring-1 ring-ring/80"
                        )}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          commitOption(o.raw, "click", o.label);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                            onMenuKeyDown(e);
                            return;
                          }
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitOption(o.raw, "enter", o.label);
                            return;
                          }
                          if (e.key === " ") {
                            e.preventDefault();
                            commitOption(o.raw, "space", o.label);
                          }
                        }}
                      >
                        <span className="block min-w-0 truncate">{o.label}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start" className="z-[10050] max-w-sm text-pretty">
                      {o.label}
                    </TooltipContent>
                  </Tooltip>
                </li>
              ))}
            {!remoteLoading && shown.length === 0 ? (
              <li className="px-2 py-1.5 text-muted-foreground">—</li>
            ) : null}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function GridCellBooleanEditor({
  value,
  onCommit,
  trueLabel,
  falseLabel,
  ariaLabel
}: {
  value: unknown;
  onCommit: (v: boolean) => void;
  onCancel: () => void;
  trueLabel: string;
  falseLabel: string;
  ariaLabel: string;
}) {
  const gridRoot = useGridRootContext();
  const density = gridRoot?.density ?? "standard";
  const isCompact = density === "compact";
  const isComfortable = density === "comfortable";
  const checked =
    value === true || value === "true" || String(value).toLowerCase() === "true";
  return (
    <div
      data-hive-edit-root
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 items-center justify-center py-0",
        isComfortable ? "gap-2" : "gap-1"
      )}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className={cn(
          "shrink-0 cursor-pointer rounded border border-primary accent-primary ring-2 ring-transparent ring-offset-2 ring-offset-background transition-[box-shadow,ring-color] focus-visible:outline-none focus-visible:ring-foreground/80",
          isCompact && "h-2.5 w-2.5",
          isComfortable && "h-4 w-4",
          !isCompact && !isComfortable && "h-3 w-3"
        )}
        checked={checked}
        onChange={(e) => onCommit(e.target.checked)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          e.stopPropagation();
          onCommit(!checked);
        }}
        aria-label={ariaLabel}
        title={`${falseLabel} / ${trueLabel}`}
      />
    </div>
  );
}

function isThenable(x: unknown): x is Promise<unknown> {
  return x != null && typeof x === "object" && typeof (x as Promise<unknown>).then === "function";
}

function ensureRowEditCellPropsBag<R extends GridValidRowModel>(
  rowId: GridRowId,
  row: R,
  allCols: GridColDef<R>[],
  drafts: Record<string, unknown> | undefined,
  bagRef: React.MutableRefObject<Record<string, Record<string, GridEditCellProps>>>
): Record<string, GridEditCellProps> {
  const s = String(rowId);
  let rowBag = bagRef.current[s];
  const rowRec = row as Record<string, unknown>;
  if (!rowBag) {
    rowBag = bagRef.current[s] = {};
    for (const col of allCols) {
      if (!col.editable || col.field.startsWith("__") || col.type === "actions") continue;
      const f = col.field;
      const dv = drafts?.[f];
      rowBag[f] = { value: dv !== undefined ? dv : rowRec[f] };
    }
    return rowBag;
  }
  for (const col of allCols) {
    if (!col.editable || col.field.startsWith("__") || col.type === "actions") continue;
    const f = col.field;
    if (!rowBag[f]) rowBag[f] = {};
    if (drafts != null && Object.prototype.hasOwnProperty.call(drafts, f)) {
      rowBag[f]!.value = drafts[f];
    }
  }
  return rowBag;
}

function GridCellTextEditor({
  colType,
  defaultValue,
  onCommit,
  onCancel,
  error,
  helperText,
  ariaLabel
}: {
  colType: "string" | "number";
  defaultValue: string;
  onCommit: (v: string | number) => void;
  onCancel: () => void;
  error?: boolean;
  helperText?: string;
  ariaLabel?: string;
}) {
  const gridRoot = useGridRootContext();
  const density = gridRoot?.density ?? "standard";
  const isCompact = density === "compact";
  const isComfortable = density === "comfortable";
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const submit = () => {
    const el = ref.current;
    if (!el) return;
    if (colType === "number") {
      const n = Number(el.value.replace(",", "."));
      if (Number.isFinite(n)) onCommit(n);
      else onCancel();
    } else {
      onCommit(el.value);
    }
  };
  return (
    <div
      data-hive-edit-root
      className="flex h-full min-h-0 w-full min-w-0 max-w-full flex-col justify-center overflow-hidden px-[3px]"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex min-h-0 w-full flex-1 items-center">
        <Input
          ref={ref}
          type={colType === "number" ? "number" : "text"}
          defaultValue={defaultValue}
          aria-invalid={error || undefined}
          aria-label={ariaLabel}
          className={cn(
            "!block !h-auto !min-h-0 !max-h-full !min-w-0 !max-w-full !w-full !py-1 !text-foreground",
            isCompact && "!px-1 text-[11px] leading-normal",
            isComfortable && "px-2.5 text-base leading-snug",
            !isCompact && !isComfortable && "px-2 text-sm leading-normal",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
      </div>
      {helperText ? (
        <p className="mt-0.5 text-xs text-destructive" role="alert">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

type BodyCellInnerOpts<R extends GridValidRowModel> = {
  groupingActive: boolean;
  density: GridDensity;
  localeText?: Partial<GridLocaleText>;
  editMode: "cell" | "row";
  rowModesModel: GridRowModesModel;
  editing: { rowId: GridRowId; field: string } | null;
  getRowId: (row: R) => GridRowId;
  processRowUpdate?: (newRow: R, oldRow: R) => Promise<R> | R;
  onExitEdit: () => void;
  onCancelRowEdit: (rowId: GridRowId) => void;
  getApi: () => GridApiCommunity<R> | null;
  /** Predicado MUI ao nível da grelha; combina com `colDef.isCellEditable`. */
  isCellEditableGrid?: (params: GridCellParams<R>) => boolean;
  /** Modo linha: atualiza rascunho local sem `processRowUpdate` até Gravar. */
  onRowEditDraftCommit?: (rowId: GridRowId, field: string, value: unknown) => void;
  /** Modo célula: enquanto `processRowUpdate` assíncrono corre, bloqueia saída por clique global (paridade MUI). */
  beginAsyncCellCommit?: () => void;
  endAsyncCellCommit?: () => void;
  /** Colunas da grelha (meta) — para `preProcessEditCellProps` / `otherFieldsProps` em modo linha. */
  allColumnDefs: GridColDef<R>[];
  rowEditCellPropsBagRef: React.MutableRefObject<Record<string, Record<string, GridEditCellProps>>>;
  getRowEditDraftSlice?: (rowId: GridRowId) => Record<string, unknown> | undefined;
  /** Enfileira fusão de rascunho após mutações em `otherFieldsProps` (microtask). */
  scheduleRowEditDraftSync?: (rowId: GridRowId, field: string, value: unknown) => void;
};

function renderBodyCellInner<R extends GridValidRowModel>(
  cell: Cell<R, unknown>,
  opts: BodyCellInnerOpts<R>
): React.ReactNode {
  if (cell.getIsPlaceholder()) return null;
  const row = cell.row;
  const lte = (key: keyof GridLocaleText, fallback: string) => opts.localeText?.[key] ?? fallback;
  if (opts.groupingActive && cell.getIsGrouped()) {
    const compact = opts.density === "compact";
    return (
      <div className="flex min-w-0 items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("shrink-0", compact ? "h-[15px] w-[15px] min-h-0 min-w-0" : "h-8 w-8")}
          aria-expanded={row.getIsExpanded()}
          aria-label={
            row.getIsExpanded()
              ? (opts.localeText?.collapseGroup ?? "Recolher grupo")
              : (opts.localeText?.expandGroup ?? "Expandir grupo")
          }
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
        >
          {row.getIsExpanded() ? (
            <ChevronDownIcon className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronRightIcon className="h-3 w-3 shrink-0" />
          )}
        </Button>
        <span className="min-w-0 truncate font-normal">{String(cell.getValue() ?? "")}</span>
        <span className="shrink-0 text-xs text-hiveGrid-headerMuted">
          ({row.subRows?.length ?? 0})
        </span>
      </div>
    );
  }

  const gridColDef = (cell.column.columnDef.meta as { gridColDef?: GridColDef<R> })?.gridColDef;
  const field = String(cell.column.id);
  const rowId = opts.getRowId(row.original);
  const rowInEdit =
    opts.editMode === "row" && rowModeEntryIsEdit(opts.rowModesModel[String(rowId)]);
  const cellInEdit =
    opts.editMode === "cell" &&
    opts.editing != null &&
    String(opts.editing.rowId) === String(rowId) &&
    opts.editing.field === field;
  const isRowOrCellEditing = rowInEdit || cellInEdit;

  const cellParams: GridCellParams<R> = {
    id: rowId,
    field,
    row: row.original,
    value: cell.getValue()
  };
  const gridAllowsEdit =
    opts.isCellEditableGrid == null || opts.isCellEditableGrid(cellParams);
  const colAllowsEdit =
    gridAllowsEdit &&
    gridColDef?.editable === true &&
    (gridColDef.isCellEditable == null || gridColDef.isCellEditable(cellParams)) &&
    cellEditorSupported(gridColDef);

  if (isRowOrCellEditing && opts.processRowUpdate && colAllowsEdit) {
    const api = opts.getApi();
    if (!api) return flexRender(cell.column.columnDef.cell, cell.getContext());

    const rawValue = cell.getValue();
    const commit = (value: unknown) => {
      if (opts.editMode === "row") {
        opts.onRowEditDraftCommit?.(rowId, field, value);
        return;
      }
      opts.beginAsyncCellCommit?.();
      void (async () => {
        const oldRow = row.original;
        const newRow = { ...(oldRow as object), [field]: value } as R;
        try {
          await Promise.resolve(opts.processRowUpdate!(newRow, oldRow));
          opts.onExitEdit();
        } catch {
          /* rejeição: manter edição */
        } finally {
          opts.endAsyncCellCommit?.();
        }
      })();
    };
    const cancel = () =>
      opts.editMode === "row" ? opts.onCancelRowEdit(rowId) : opts.onExitEdit();

    let processedEditProps: GridEditCellProps | undefined;

    if (opts.editMode === "row" && rowInEdit) {
      const drafts = opts.getRowEditDraftSlice?.(rowId);
      ensureRowEditCellPropsBag(
        rowId,
        row.original,
        opts.allColumnDefs,
        drafts,
        opts.rowEditCellPropsBagRef
      );
      const rowBag = opts.rowEditCellPropsBagRef.current[String(rowId)];
      if (rowBag && gridColDef.preProcessEditCellProps) {
        const snap: Record<string, unknown> = {};
        for (const k of Object.keys(rowBag)) snap[k] = rowBag[k]!.value;
        const otherFieldsProps: Record<string, GridEditCellProps<unknown>> = { ...rowBag };
        delete otherFieldsProps[field];
        const out = gridColDef.preProcessEditCellProps({
          id: rowId,
          row: row.original,
          props: { ...rowBag[field] },
          hasChanged: false,
          otherFieldsProps
        });
        if (!isThenable(out) && out && typeof out === "object") {
          Object.assign(rowBag[field]!, out as object);
        }
        processedEditProps = { ...rowBag[field] };
        if (opts.scheduleRowEditDraftSync) {
          for (const k of Object.keys(rowBag)) {
            if (!Object.is(rowBag[k]!.value, snap[k])) {
              opts.scheduleRowEditDraftSync(rowId, k, rowBag[k]!.value);
            }
          }
        }
      }
    } else if (opts.editMode === "cell" && cellInEdit && gridColDef.preProcessEditCellProps) {
      const out = gridColDef.preProcessEditCellProps({
        id: rowId,
        row: row.original,
        props: { value: rawValue },
        hasChanged: true
      });
      if (!isThenable(out) && out && typeof out === "object") {
        processedEditProps = out as GridEditCellProps;
      }
    }

    let valueForEdit: unknown = rawValue;
    if (opts.editMode === "row" && rowInEdit) {
      const rb = opts.rowEditCellPropsBagRef.current[String(rowId)];
      if (rb?.[field] != null) {
        valueForEdit = rb[field]!.value;
      }
    } else if (processedEditProps?.value !== undefined) {
      valueForEdit = processedEditProps.value;
    }

    if (gridColDef.renderEditCell) {
      const fmt =
        gridColDef.valueFormatter?.({
          id: rowId,
          field,
          row: row.original,
          value: valueForEdit as never
        }) ?? valueForEdit;
      const p: GridRenderEditCellParams<R, unknown> = {
        id: rowId,
        field,
        row: row.original,
        value: valueForEdit,
        formattedValue: fmt,
        api,
        colDef: gridColDef,
        hasFocus: true,
        tabIndex: 0,
        commit: commit as GridRenderEditCellParams<R, unknown>["commit"],
        cancel,
        processedEditProps
      };
      return gridColDef.renderEditCell(p);
    }
    const resolvedSelectOpts =
      gridColDef.type === "singleSelect"
        ? resolveColValueOptions(gridColDef, rowId, row.original)
        : undefined;
    if (gridColDef.type === "singleSelect") {
      const asyncEditor =
        gridColDef.async === true || gridColDef.loadEditValueOptions != null;
      const selectOpts = resolvedSelectOpts ?? [];
      if (asyncEditor || selectOpts.length > 0) {
        return (
          <GridCellSearchableSelectEditor<R>
            key={
              asyncEditor
                ? `hive-ss-async-${String(rowId)}-${field}`
                : `hive-ss-${String(rowId)}-${field}-${String(valueForEdit ?? "")}-${selectOpts.length}`
            }
            value={valueForEdit}
            valueOptions={selectOpts}
            onCommit={(v) => commit(v)}
            onCancel={cancel}
            ariaLabel={lte("editCellOpenSelect", "Escolher valor")}
            rowId={rowId}
            row={row.original}
            field={field}
            loadEditValueOptions={asyncEditor ? gridColDef.loadEditValueOptions : undefined}
            editMode={opts.editMode}
            onEnterSaveRow={
              opts.editMode === "row"
                ? () => {
                    void api?.commitRowEditSave?.(rowId);
                  }
                : undefined
            }
          />
        );
      }
    }
    if (gridColDef.type === "boolean") {
      return (
        <GridCellBooleanEditor
          value={valueForEdit}
          onCommit={(v) => commit(v)}
          onCancel={cancel}
          trueLabel={lte("filterBooleanTrue", "Sim")}
          falseLabel={lte("filterBooleanFalse", "Não")}
          ariaLabel={lte("editCellOpenSelect", "Escolher valor")}
        />
      );
    }
    const t = gridColDef.type;
    if (t === "string" || t === "number" || t === undefined) {
      const dv = valueForEdit == null ? "" : String(valueForEdit);
      const ht =
        typeof processedEditProps?.helperText === "string" ? processedEditProps.helperText : undefined;
      return (
        <GridCellTextEditor
          key={t === "number" ? `hive-cell-edit-${String(rowId)}-${field}-${dv}` : undefined}
          colType={t === "number" ? "number" : "string"}
          defaultValue={dv}
          onCommit={(v) => commit(v)}
          onCancel={cancel}
          error={processedEditProps?.error === true}
          helperText={ht}
          ariaLabel={gridColDef.headerName ?? field}
        />
      );
    }
  }

  return flexRender(cell.column.columnDef.cell, cell.getContext());
}

function getPinnedStickyStyle<R extends GridValidRowModel>(
  column: Column<R, unknown>,
  table: TanstackTable<R>,
  variant: "header" | "body"
): React.CSSProperties | undefined {
  const pin = column.getIsPinned();
  if (!pin) return undefined;
  /** Corpo: alinhar ao fundo do tema (`--background`) para colunas fixas sobrepostas ao scroll. */
  const bg = variant === "header" ? "hsl(var(--muted) / 0.55)" : "hsl(var(--background))";
  if (pin === "left") {
    const leftCols = table.getLeftLeafColumns();
    let leftPx = 0;
    for (const c of leftCols) {
      if (c.id === column.id) break;
      leftPx += c.getSize();
    }
    return {
      position: "sticky",
      left: leftPx,
      zIndex: variant === "header" ? 4 : 3,
      backgroundColor: bg,
      boxShadow: "1px 0 0 hsl(var(--border))",
      /** Reduz artefactos visuais ao mudar altura da linha em edição (scrollLeft estável nos logs v18 — salto percecionado vs colunas fixas). */
      ...(variant === "body"
        ? {
            transform: "translateZ(0)",
            backfaceVisibility: "hidden"
          }
        : {})
    };
  }
  const rightCols = table.getRightLeafColumns();
  let rightPx = 0;
  for (let i = rightCols.length - 1; i >= 0; i--) {
    const c = rightCols[i];
    if (c.id === column.id) break;
    rightPx += c.getSize();
  }
  return {
    position: "sticky",
    right: rightPx,
    zIndex: variant === "header" ? 4 : 3,
    backgroundColor: bg,
    boxShadow: "-1px 0 0 hsl(var(--border))",
    ...(variant === "body"
      ? { transform: "translateZ(0)", backfaceVisibility: "hidden" }
      : {})
  };
}

function DraggableHeaderCell({
  id,
  disabled,
  dragDisabled,
  justifyHeadClassName,
  centerColumnHeader,
  resizeSlot,
  className,
  layout = "table",
  pinStyle,
  /** Largura em px (modo tabela + `table-layout:fixed`): alinha `<th>` ao `width` das células. */
  columnWidth,
  ariaColIndex,
  fixedHeaderHeight,
  reorderAriaLabel = "Reorder column"
}: {
  id: string;
  disabled?: boolean;
  /** Quando true, não participa no DnD (ex.: coluna fixa). */
  dragDisabled?: boolean;
  /** Título + menu (área arrastável; clique no botão de ordenação mantém sort). */
  centerColumnHeader: React.ReactNode;
  /** Grip de resize — fora dos `listeners` do sortable. */
  resizeSlot: React.ReactNode | null;
  justifyHeadClassName: string;
  className?: string;
  layout?: "table" | "grid";
  pinStyle?: React.CSSProperties;
  columnWidth?: number;
  /** 1-based, alinhado com `aria-colcount` da grelha. */
  ariaColIndex?: number;
  /** `columnHeaderHeight` da grelha: altura fixa da célula de cabeçalho. */
  fixedHeaderHeight?: number;
  reorderAriaLabel?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: disabled || dragDisabled
  });
  const dragStyle: React.CSSProperties = {
    ...pinStyle,
    ...(layout === "table" && columnWidth != null ? { width: columnWidth } : {}),
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1
  };
  const fixedHStyle: React.CSSProperties =
    fixedHeaderHeight != null
      ? { minHeight: fixedHeaderHeight, height: fixedHeaderHeight }
      : {};
  /** Área do título: arrastar reordena; `PointerSensor` com distância evita roubar o clique de ordenação. */
  const titleRow = (
    <div
      className={cn(
        "flex min-w-0 flex-1 cursor-grab touch-none items-center gap-0.5 active:cursor-grabbing",
        justifyHeadClassName
      )}
      {...(!disabled && !dragDisabled ? { ...attributes, ...listeners } : {})}
      aria-label={reorderAriaLabel}
    >
      {centerColumnHeader}
    </div>
  );
  /** `w-full min-w-0`: o bloco `flex-1` do título + resize alinha ao `th`. */
  const inner = (
    <div className="flex w-full min-w-0 flex-1 items-stretch overflow-visible">
      {titleRow}
      {resizeSlot}
    </div>
  );
  if (layout === "grid") {
    return (
      <div
        ref={setNodeRef}
        role="columnheader"
        aria-colindex={ariaColIndex}
        className={cn(
          "group/header relative flex items-center border-b border-hiveGrid-chromeBorder bg-hiveGrid-headerCell text-sm font-normal text-hiveGrid-headerMuted",
          fixedHeaderHeight == null && "min-h-[40px]",
          className
        )}
        style={{ ...dragStyle, ...fixedHStyle }}
      >
        {inner}
      </div>
    );
  }
  return (
    <TableHead
      ref={setNodeRef}
      className={cn(
        "group/header relative overflow-visible min-h-0 font-normal",
        fixedHeaderHeight != null && "h-full align-middle",
        className
      )}
      style={{ ...dragStyle, ...fixedHStyle }}
      aria-colindex={ariaColIndex}
    >
      {inner}
    </TableHead>
  );
}

function getDefaultColumnSizingInfoState(): ColumnSizingInfoState {
  return {
    columnSizingStart: [],
    deltaOffset: null,
    deltaPercentage: null,
    isResizingColumn: false,
    startOffset: null,
    startSize: null
  };
}

function mergeRowPresentationStyle(
  rowPresentation: DataGridRowPresentation | undefined
): React.CSSProperties {
  if (!rowPresentation) return {};
  const s = {} as Record<string, string>;
  if (rowPresentation.rowHoverBg) s["--hive-grid-row-hover-bg"] = rowPresentation.rowHoverBg;
  if (rowPresentation.rowSelectedBg) s["--hive-grid-row-selected-bg"] = rowPresentation.rowSelectedBg;
  if (rowPresentation.rowEditingBg) s["--hive-grid-row-editing-bg"] = rowPresentation.rowEditingBg;
  if (rowPresentation.rowEditingRing) s["--hive-grid-row-editing-ring"] = rowPresentation.rowEditingRing;
  return s as React.CSSProperties;
}

export function DataGrid<R extends GridValidRowModel>(props: DataGridProps<R>) {
  const {
    rows,
    columns: columnsProp,
    loading,
    getRowId: getRowIdProp,
    apiRef,
    sortModel: sortModelProp,
    onSortModelChange,
    sortingMode = "client",
    filterModel: filterModelProp,
    onFilterModelChange,
    filterMode = "client",
    disableColumnFilter,
    quickFilterValue: quickFilterProp,
    onQuickFilterValueChange,
    paginationModel: paginationModelProp,
    onPaginationModelChange,
    paginationMode = "client",
    rowCount,
    paginationMeta,
    pageSizeOptions = [10, 20, 50, 100],
    pagination = true,
    hideFooter,
    hideFooterPagination,
    hideFooterSelectedRowCount,
    checkboxSelection,
    radioSelection = false,
    /** Com `paginationMode="server"` e `rowCount` conhecido: cabeçalho seleciona/deseleciona todas as linhas (`exclude` vazio / `include` vazio). Requer `onRowSelectionModelChange`. */
    checkboxSelectionSelectAllPages = false,
    rowSelectionModel: rowSelectionModelProp,
    onRowSelectionModelChange,
    disableMultipleRowSelection,
    disableRowSelectionOnClick,
    isRowSelectable,
    columnVisibilityModel: columnVisibilityProp,
    onColumnVisibilityModelChange,
    disableColumnResize,
    onColumnWidthChange,
    onColumnOrderChange,
    disableColumnReorder = false,
    disableVirtualization = false,
    autoHeight,
    autoHeightMaxHeight,
    rowHeight: rowHeightProp,
    columnHeaderHeight: columnHeaderFromProp,
    density: densityProp,
    densityDimensions,
    onDensityChange,
    editMode: editModeProp,
    rowModesModel: rowModesModelProp,
    onRowModesModelChange,
    onRowEditStart,
    onRowEditStop,
    showRowEditActions,
    disableColumnSelector,
    disableDensitySelector = false,
    hideBuiltInFilterAndColumnsRow = false,
    stickyToolbar = false,
    commitRowEditOnBlur = false,
    dismissDraftRowOnEditExit,
    className,
    style,
    slots,
    slotProps,
    initialState,
    csvOptions,
    sortingOrder = ["asc", "desc"],
    disableColumnSort = false,
    disableColumnMenu = false,
    localeText,
    onRowClick,
    onRowDoubleClick,
    getRowClassName,
    getCellClassName,
    isCellEditable: isCellEditableGrid,
    rowEditInitialFieldCandidates,
    rowPresentation,
    getRowAriaLabel,
    onCellClick,
    onCellDoubleClick,
    onCellKeyDown,
    onColumnHeaderClick,
    onStateChange,
    scrollEndThreshold,
    onRowsScrollEnd,
    pinnedColumns: pinnedColumnsProp,
    onPinnedColumnsChange,
    disableColumnPinning = false,
    getDetailPanelContent,
    getDetailPanelHeight,
    detailPanelExpandedRowIds: detailPanelExpandedRowIdsProp,
    onDetailPanelExpandedRowIdsChange,
    isDetailPanelExpandable,
    treeData,
    getTreeDataPath,
    treeExpandedRowIds: treeExpandedRowIdsProp,
    onTreeExpandedRowIdsChange,
    rowGroupingModel: rowGroupingModelProp,
    onRowGroupingModelChange,
    aggregationModel,
    showAggregationFooter = false,
    excelOptions,
    disableClipboardCopy = false,
    /** Se true, não cola TSV multi-célula (comportamento G5.1); `onClipboardPaste` continua a ser chamado se existir. */
    disableClipboardPaste = false,
    onClipboardPaste,
    disableAccessibilityAnnouncements = false,
    processRowUpdate,
    onRowsChange,
    onRowTransaction,
    children,
    columnVirtualization = false,
    getEstimatedRowHeight: getEstimatedRowHeightProp,
    enableVariableRowHeight = false,
    preferencesKey,
    preferencesStorage: preferencesStorageProp,
    preferencesDebounceMs = 400,
    onPreferencesChange,
    defaultPreferences
  } = props;

  const RowEditActionsComponent = slots?.rowEditActions ?? GridDefaultRowEditActions;

  const sortModelPropRef = React.useRef(sortModelProp);
  sortModelPropRef.current = sortModelProp;
  const filterModelPropRef = React.useRef(filterModelProp);
  filterModelPropRef.current = filterModelProp;
  const paginationModelPropRef = React.useRef(paginationModelProp);
  paginationModelPropRef.current = paginationModelProp;
  const columnVisibilityPropRef = React.useRef(columnVisibilityProp);
  columnVisibilityPropRef.current = columnVisibilityProp;
  const rowSelectionModelPropRef = React.useRef(rowSelectionModelProp);
  rowSelectionModelPropRef.current = rowSelectionModelProp;
  const pinnedColumnsPropRef = React.useRef(pinnedColumnsProp);
  pinnedColumnsPropRef.current = pinnedColumnsProp;

  const onSortModelChangeRef = React.useRef(onSortModelChange);
  onSortModelChangeRef.current = onSortModelChange;
  const onFilterModelChangeRef = React.useRef(onFilterModelChange);
  onFilterModelChangeRef.current = onFilterModelChange;
  const onPaginationModelChangeRef = React.useRef(onPaginationModelChange);
  onPaginationModelChangeRef.current = onPaginationModelChange;
  const onColumnVisibilityModelChangeRef = React.useRef(onColumnVisibilityModelChange);
  onColumnVisibilityModelChangeRef.current = onColumnVisibilityModelChange;
  const onRowSelectionModelChangeRef = React.useRef(onRowSelectionModelChange);
  onRowSelectionModelChangeRef.current = onRowSelectionModelChange;
  const onPinnedColumnsChangeRef = React.useRef(onPinnedColumnsChange);
  onPinnedColumnsChangeRef.current = onPinnedColumnsChange;
  const onColumnOrderChangeRef = React.useRef(onColumnOrderChange);
  onColumnOrderChangeRef.current = onColumnOrderChange;
  const onColumnWidthChangeRef = React.useRef(onColumnWidthChange);
  onColumnWidthChangeRef.current = onColumnWidthChange;
  const onQuickFilterValueChangeRef = React.useRef(onQuickFilterValueChange);
  onQuickFilterValueChangeRef.current = onQuickFilterValueChange;
  const rowGroupingModelPropRef = React.useRef(rowGroupingModelProp);
  rowGroupingModelPropRef.current = rowGroupingModelProp;
  const onRowGroupingModelChangeRef = React.useRef(onRowGroupingModelChange);
  onRowGroupingModelChangeRef.current = onRowGroupingModelChange;
  const treeExpandedRowIdsPropRef = React.useRef(treeExpandedRowIdsProp);
  treeExpandedRowIdsPropRef.current = treeExpandedRowIdsProp;
  const detailPanelExpandedRowIdsPropRef = React.useRef(detailPanelExpandedRowIdsProp);
  detailPanelExpandedRowIdsPropRef.current = detailPanelExpandedRowIdsProp;
  const onTreeExpandedRowIdsChangeRef = React.useRef(onTreeExpandedRowIdsChange);
  onTreeExpandedRowIdsChangeRef.current = onTreeExpandedRowIdsChange;
  const onDetailPanelExpandedRowIdsChangeRef = React.useRef(onDetailPanelExpandedRowIdsChange);
  onDetailPanelExpandedRowIdsChangeRef.current = onDetailPanelExpandedRowIdsChange;
  const onPreferencesChangeRef = React.useRef(onPreferencesChange);
  onPreferencesChangeRef.current = onPreferencesChange;
  const onDensityChangeRef = React.useRef(onDensityChange);
  onDensityChangeRef.current = onDensityChange;
  const rowModesModelPropRef = React.useRef(rowModesModelProp);
  rowModesModelPropRef.current = rowModesModelProp;

  const columnsPropRef = React.useRef(columnsProp);
  columnsPropRef.current = columnsProp;
  const rowsRef = React.useRef(rows);
  rowsRef.current = rows;
  const isRowSelectableRef = React.useRef(isRowSelectable);
  isRowSelectableRef.current = isRowSelectable;
  const isDetailPanelExpandableRef = React.useRef(isDetailPanelExpandable);
  isDetailPanelExpandableRef.current = isDetailPanelExpandable;
  const getRowClassNameRef = React.useRef(getRowClassName);
  getRowClassNameRef.current = getRowClassName;
  const getCellClassNameRef = React.useRef(getCellClassName);
  getCellClassNameRef.current = getCellClassName;
  const isCellEditableGridRef = React.useRef(isCellEditableGrid);
  isCellEditableGridRef.current = isCellEditableGrid;
  const processRowUpdateRef = React.useRef(processRowUpdate);
  processRowUpdateRef.current = processRowUpdate;
  const csvOptionsRef = React.useRef(csvOptions);
  csvOptionsRef.current = csvOptions;
  const excelOptionsRef = React.useRef(excelOptions);
  excelOptionsRef.current = excelOptions;

  const [densityInternal, setDensityInternal] = React.useState<GridDensity>(
    () => initialState?.density ?? "standard"
  );
  const density = densityProp ?? densityInternal;
  const densityRef = React.useRef(density);
  densityRef.current = density;
  const resolvedDensity = React.useMemo(
    () => resolveDensityDimensions(density, densityDimensions),
    [density, densityDimensions]
  );
  const applyDensity = React.useCallback(
    (d: GridDensity) => {
      if (densityProp === undefined) setDensityInternal(d);
      onDensityChangeRef.current?.(d);
    },
    [densityProp]
  );

  const [rowModesInternal, setRowModesInternal] = React.useState<GridRowModesModel>(
    () => initialState?.rowModesModel ?? {}
  );
  const rowModesModel = rowModesModelProp ?? rowModesInternal;
  const rowModesModelRef = React.useRef(rowModesModel);
  rowModesModelRef.current = rowModesModel;
  /** Snapshot por `id` ao iniciar `GridRowModes.Edit` — `previousRow` em `onRowEditStop`. */
  const rowEditStartSnapshotRef = React.useRef<Partial<Record<string, R>>>({});
  const onRowModesModelChangeRef = React.useRef(onRowModesModelChange);
  onRowModesModelChangeRef.current = onRowModesModelChange;
  /** Evento React da última ação que altera `rowModesModel` (duplo clique, botões Gravar/Cancelar). */
  const rowEditInteractionEventRef = React.useRef<React.SyntheticEvent | undefined>(undefined);
  type RowModesCommitOptions = {
    event?: React.SyntheticEvent;
    /** Aplicado a cada linha que sai de edição sem entrada em `perRow`. */
    defaultRowStop?: { reason: GridRowEditStopReason; field?: string };
    perRow?: Record<string, { reason: GridRowEditStopReason; field?: string }>;
  };
  const rowModesCommitOptionsRef = React.useRef<RowModesCommitOptions | undefined>(undefined);
  const commitRowModesModelFnRef = React.useRef<(next: GridRowModesModel) => void>((next) => {
    if (rowModesModelPropRef.current === undefined) setRowModesInternal(next);
    onRowModesModelChangeRef.current?.(next);
  });
  const completeRowEditSaveRef = React.useRef<
    (rid: GridRowId, ev?: React.MouseEvent<HTMLButtonElement>) => Promise<void>
  >(async () => {});

  const commitRowModesModel = React.useCallback(
    (next: GridRowModesModel, options?: RowModesCommitOptions) => {
      rowEditInteractionEventRef.current = options?.event;
      rowModesCommitOptionsRef.current = options;
      try {
        commitRowModesModelFnRef.current(next);
      } finally {
        rowModesCommitOptionsRef.current = undefined;
        rowEditInteractionEventRef.current = undefined;
      }
    },
    []
  );
  const editModeResolved = editModeProp ?? initialState?.editMode ?? "cell";
  const editModeRef = React.useRef(editModeResolved);
  editModeRef.current = editModeResolved;
  const showRowEditActionsUi = editModeResolved === "row" && showRowEditActions !== false;

  const rowHeightResolved = rowHeightProp ?? initialState?.rowHeight;
  const columnHeaderHeightPx =
    columnHeaderFromProp ?? initialState?.columnHeaderHeight ?? resolvedDensity.defaultHeaderPx;
  const columnHeaderHeightPxRef = React.useRef(columnHeaderHeightPx);
  columnHeaderHeightPxRef.current = columnHeaderHeightPx;

  const getRowId = React.useCallback(
    (row: R) => (getRowIdProp ? getRowIdProp(row) : defaultGetRowId(row)),
    [getRowIdProp]
  );
  const getRowIdRef = React.useRef(getRowId);
  getRowIdRef.current = getRowId;

  const rowAriaLabelProps = React.useCallback(
    (row: Row<R>) => {
      if (!getRowAriaLabel) return {};
      const label = getRowAriaLabel({ id: getRowId(row.original), row: row.original });
      const t = typeof label === "string" ? label.trim() : "";
      return t ? ({ "aria-label": t } as const) : {};
    },
    [getRowAriaLabel, getRowId]
  );

  const treeActive = !!treeData && typeof getTreeDataPath === "function";
  const treeActiveRef = React.useRef(treeActive);
  treeActiveRef.current = treeActive;

  const [rowGroupingInternal, setRowGroupingInternal] = React.useState<GroupingState>(
    () => initialState?.rowGrouping?.model ?? []
  );
  const rowGroupingResolved = rowGroupingModelProp ?? rowGroupingInternal;
  const groupingState = React.useMemo(() => {
    const valid = new Set(columnsProp.map((c) => c.field));
    return rowGroupingResolved.filter((id) => valid.has(String(id)));
  }, [columnsProp, rowGroupingResolved]);

  const groupingActive = !treeActive && groupingState.length > 0;
  const detailActive = !!getDetailPanelContent && !treeActive && !groupingActive;

  const treeStructure = React.useMemo(() => {
    if (!treeActive || !getTreeDataPath) {
      return { roots: rows, childrenByParent: new Map<string, R[]>() };
    }
    return buildTreeFromPaths(rows, getRowId, getTreeDataPath);
  }, [rows, treeActive, getTreeDataPath, getRowId]);

  const treeStructureRef = React.useRef(treeStructure);
  treeStructureRef.current = treeStructure;

  const [sortInternal, setSortInternal] = React.useState<GridSortModel>(
    () => sortModelProp ?? initialState?.sorting?.sortModel ?? []
  );
  const sortModel = sortModelProp ?? sortInternal;

  const [filterInternal, setFilterInternal] = React.useState<GridFilterModel>(
    () => filterModelProp ?? initialState?.filter?.filterModel ?? { items: [] }
  );
  const filterModel = filterModelProp ?? filterInternal;
  const filterModelRef = React.useRef(filterModel);
  filterModelRef.current = filterModel;

  const onStateChangeRef = React.useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const onRowsChangeRef = React.useRef(onRowsChange);
  onRowsChangeRef.current = onRowsChange;

  const onClipboardPasteRef = React.useRef(onClipboardPaste);
  onClipboardPasteRef.current = onClipboardPaste;

  const onRowTransactionRef = React.useRef(onRowTransaction);
  onRowTransactionRef.current = onRowTransaction;

  const [columnFilterField, setColumnFilterField] = React.useState<string | null>(null);
  const [filterPanelOpen, setFilterPanelOpen] = React.useState(false);
  const [columnsMenuOpen, setColumnsMenuOpen] = React.useState(false);
  const filterPanelAnchorRef = React.useRef<HTMLElement | null>(null);
  const columnsPanelAnchorRef = React.useRef<HTMLElement | null>(null);
  const closeAllFilterUi = React.useCallback(() => {
    setColumnFilterField(null);
    setFilterPanelOpen(false);
  }, []);
  const openGlobalFilterPanel = React.useCallback((anchor?: HTMLElement | null) => {
    setColumnsMenuOpen(false);
    setColumnFilterField(null);
    if (anchor) filterPanelAnchorRef.current = anchor;
    setFilterPanelOpen(true);
  }, []);
  const openGlobalColumnsPanel = React.useCallback((anchor?: HTMLElement | null) => {
    setFilterPanelOpen(false);
    setColumnFilterField(null);
    if (anchor) columnsPanelAnchorRef.current = anchor;
    setColumnsMenuOpen(true);
  }, []);

  const [editingCell, setEditingCell] = React.useState<{
    rowId: GridRowId;
    field: string;
  } | null>(null);
  const editingCellRef = React.useRef(editingCell);
  editingCellRef.current = editingCell;
  const onExitEdit = React.useCallback(() => setEditingCell(null), []);

  /** Após `pointerup` do grip de resize: o `click` pode cair no título/menu do `<th>` (não no grip) e disparar `exitAllEditing`. */
  const columnResizeHeaderCooldownUntilRef = React.useRef(0);
  const scheduleColumnResizeHeaderCooldown = React.useCallback(() => {
    const onRelease = () => {
      columnResizeHeaderCooldownUntilRef.current = Date.now() + 400;
      window.removeEventListener("pointerup", onRelease, true);
      window.removeEventListener("touchend", onRelease, true);
    };
    window.addEventListener("pointerup", onRelease, { capture: true });
    window.addEventListener("touchend", onRelease, { capture: true });
  }, []);

  /** Evita `exitAllEditing` por clique no documento durante `processRowUpdate` assíncrono (modo célula). */
  const asyncCellCommitDepthRef = React.useRef(0);
  const beginAsyncCellCommit = React.useCallback(() => {
    asyncCellCommitDepthRef.current += 1;
  }, []);
  const endAsyncCellCommit = React.useCallback(() => {
    asyncCellCommitDepthRef.current = Math.max(0, asyncCellCommitDepthRef.current - 1);
  }, []);

  /** Rascunho por id de linha em `editMode="row"` — `processRowUpdate` só ao Gravar. */
  const [rowFieldDrafts, setRowFieldDrafts] = React.useState<
    Record<string, Record<string, unknown>>
  >({});
  const rowFieldDraftsRef = React.useRef(rowFieldDrafts);
  rowFieldDraftsRef.current = rowFieldDrafts;

  const applyRowEditDraft = React.useCallback((rowId: GridRowId, field: string, value: unknown) => {
    const s = String(rowId);
    setRowFieldDrafts((prev) => ({
      ...prev,
      [s]: { ...(prev[s] ?? {}), [field]: value }
    }));
  }, []);

  const rowEditCellPropsBagRef = React.useRef<Record<string, Record<string, GridEditCellProps>>>({});
  const rowEditPreprocessFlushScheduled = React.useRef(false);
  const rowEditPreprocessPendingRef = React.useRef<
    Array<{ rowId: GridRowId; field: string; value: unknown }>
  >([]);

  const scheduleRowEditDraftSync = React.useCallback((rowId: GridRowId, field: string, value: unknown) => {
    rowEditPreprocessPendingRef.current.push({ rowId, field, value });
    if (rowEditPreprocessFlushScheduled.current) return;
    rowEditPreprocessFlushScheduled.current = true;
    queueMicrotask(() => {
      rowEditPreprocessFlushScheduled.current = false;
      const batch = rowEditPreprocessPendingRef.current;
      rowEditPreprocessPendingRef.current = [];
      if (!batch.length) return;
      setRowFieldDrafts((prev) => {
        let next = prev;
        for (const { rowId: rid, field: f, value: v } of batch) {
          const s = String(rid);
          const cur = next[s]?.[f];
          if (Object.is(cur, v)) continue;
          if (next === prev) next = { ...prev };
          next[s] = { ...(next[s] ?? {}), [f]: v };
        }
        return next;
      });
    });
  }, []);

  const getRowEditDraftSlice = React.useCallback(
    (rowId: GridRowId) => rowFieldDrafts[String(rowId)],
    [rowFieldDrafts]
  );

  React.useEffect(() => {
    const editing = new Set(
      Object.entries(rowModesModel)
        .filter(([, v]) => rowModeEntryIsEdit(v))
        .map(([k]) => k)
    );
    const bag = rowEditCellPropsBagRef.current;
    for (const key of Object.keys(bag)) {
      if (!editing.has(key)) delete bag[key];
    }
  }, [rowModesModel]);

  const cancelRowEdit = React.useCallback(
    (rid: GridRowId, sourceEvent?: React.SyntheticEvent) => {
      const s = String(rid);
      const next = { ...rowModesModelRef.current };
      delete next[s];
      commitRowModesModel(next, {
        event: sourceEvent,
        perRow: { [s]: { reason: GridRowEditStopReasons.cancelButtonClick } }
      });
    },
    [commitRowModesModel]
  );

  const commitRowEditOnBlurRef = React.useRef(commitRowEditOnBlur);
  commitRowEditOnBlurRef.current = commitRowEditOnBlur;
  const dismissDraftRowOnEditExitRef = React.useRef(dismissDraftRowOnEditExit);
  dismissDraftRowOnEditExitRef.current = dismissDraftRowOnEditExit;

  const exitAllEditing = React.useCallback(
    (defaultRowStop?: { reason: GridRowEditStopReason; field?: string }) => {
      setEditingCell(null);
      const reason = defaultRowStop?.reason ?? GridRowEditStopReasons.rowFocusOut;
      if (
        commitRowEditOnBlurRef.current &&
        editModeRef.current === "row" &&
        reason === GridRowEditStopReasons.rowFocusOut
      ) {
        const editingIds = Object.entries(rowModesModelRef.current)
          .filter(([, v]) => rowModeEntryIsEdit(v))
          .map(([k]) => k);
        if (editingIds.length > 0) {
          void (async () => {
            const dcfg = dismissDraftRowOnEditExitRef.current;
            const nextModes = { ...rowModesModelRef.current };
            let clearedDraft = false;
            const perDraft: Record<string, { reason: GridRowEditStopReason }> = {};
            for (const idStr of editingIds) {
              const rid = idStr as GridRowId;
              if (dcfg != null && gridRowIdsEqual(rid, dcfg.draftRowId)) {
                delete nextModes[idStr];
                perDraft[idStr] = { reason: GridRowEditStopReasons.rowFocusOut };
                clearedDraft = true;
              }
            }
            if (clearedDraft) {
              commitRowModesModel(nextModes, {
                defaultRowStop: { reason: GridRowEditStopReasons.rowFocusOut },
                perRow: perDraft
              });
            }
            for (const idStr of editingIds) {
              const rid = idStr as GridRowId;
              if (dcfg != null && gridRowIdsEqual(rid, dcfg.draftRowId)) continue;
              await completeRowEditSaveRef.current(rid);
            }
          })();
          return;
        }
      }
      commitRowModesModel(
        {},
        {
          defaultRowStop: defaultRowStop ?? { reason: GridRowEditStopReasons.rowFocusOut }
        }
      );
    },
    [commitRowModesModel]
  );

  const tryStartCellEdit = React.useCallback(
    (row: Row<R>, field: string, sourceEvent?: React.SyntheticEvent): boolean => {
      if ((!processRowUpdateRef.current && !onRowsChangeRef.current) || row.getIsGrouped())
        return false;
      if (field.startsWith("__")) return false;
      const gridColDef = columnsPropRef.current.find((c) => c.field === field);
      if (!gridColDef || gridColDef.editable !== true) return false;
      const rid = getRowId(row.original);
      const cellParams: GridCellParams<R> = {
        id: rid,
        field,
        row: row.original,
        value: row.getValue(field)
      };
      if (gridColDef.isCellEditable && !gridColDef.isCellEditable(cellParams)) return false;
      const ig = isCellEditableGridRef.current;
      if (ig && !ig(cellParams)) return false;
      if (!cellEditorSupported(gridColDef)) return false;
      if (editModeRef.current === "row") {
        const base: GridRowModesModel = { ...rowModesModelRef.current };
        for (const k of Object.keys(base)) {
          if (String(k) === String(rid)) continue;
          const ent = base[k as GridRowId];
          if (rowModeEntryIsEdit(ent)) {
            base[k as GridRowId] = { mode: GridRowModes.View, ignoreModifications: true };
          }
        }
        base[String(rid) as GridRowId] = { mode: GridRowModes.Edit, fieldToFocus: field };
        commitRowModesModel(base, { event: sourceEvent });
        return true;
      }
      setEditingCell({ rowId: rid, field });
      return true;
    },
    [getRowId, commitRowModesModel]
  );
  const tryStartCellEditRef = React.useRef(tryStartCellEdit);
  tryStartCellEditRef.current = tryStartCellEdit;

  const rowModesEditKey = React.useMemo(() => JSON.stringify(rowModesModel), [rowModesModel]);

  React.useEffect(() => {
    const editingIds = new Set(
      Object.entries(rowModesModel)
        .filter(([, v]) => rowModeEntryIsEdit(v))
        .map(([k]) => k)
    );
    setRowFieldDrafts((prev) => {
      const next: Record<string, Record<string, unknown>> = {};
      for (const id of editingIds) {
        next[id] = prev[id] ?? {};
      }
      return next;
    });
  }, [rowModesEditKey]);

  React.useEffect(() => {
    const rowEditing =
      editingCell != null ||
      Object.values(rowModesModel).some((m) => rowModeEntryIsEdit(m));
    if (!rowEditing) return;
    /** `click` em vez de `pointerdown`: scroll (wheel, barra, trackpad) não dispara clique nas células e não termina edição. */
    const onDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      const t = eventTargetElement(e.target);
      if (!t) return;
      if (asyncCellCommitDepthRef.current > 0) return;
      if (documentHasOpenRadixSelectDropdown()) {
        return;
      }
      /** O grip de resize está no `<th>` (não em `[data-hive-cell]`); o `click` após o arrastar terminava edição à força. */
      if (t.closest("[data-hive-column-resize]")) return;
      if (
        Date.now() < columnResizeHeaderCooldownUntilRef.current &&
        t.closest(
          "[data-hive-grid-scroll] thead, [data-hive-grid-scroll] [data-hive-header-row]"
        )
      ) {
        return;
      }
      /** Toolbar, filtros, `children` e área vazia do scroll (ex.: barra nativa) não terminam edição. */
      if (t.closest("[data-hive-grid-chrome]")) return;
      /**
       * Modo linha: qualquer clique dentro de uma célula de dados da **linha em edição**
       * não termina edição (editores async/custom podem não usar `data-hive-edit-root`;
       * portais Radix/MUI são tratados abaixo).
       */
      if (editModeRef.current === "row") {
        const cellHost = t.closest("[data-hive-cell][data-row-id]");
        if (cellHost) {
          const ridAttr = cellHost.getAttribute("data-row-id");
          const rid = ridAttr ? decodeURIComponent(ridAttr) : "";
          if (rid && rowModeEntryIsEdit(rowModesModelRef.current[rid])) {
            return;
          }
        }
      }
      /**
       * Modo célula: clique dentro da **célula atualmente em edição** não termina edição
       * (select/async podem não expor `role=combobox` / `data-hive-edit-root` até abrir).
       */
      if (editModeRef.current === "cell") {
        const ec = editingCellRef.current;
        if (ec != null) {
          const cellHost = t.closest("[data-hive-cell][data-row-id]");
          if (cellHost) {
            const ridAttr = cellHost.getAttribute("data-row-id");
            const fldAttr = cellHost.getAttribute("data-field");
            const rid = ridAttr ? decodeURIComponent(ridAttr) : "";
            const fld = fldAttr ? decodeURIComponent(fldAttr) : "";
            if (rid && fld && String(ec.rowId) === rid && ec.field === fld) {
              return;
            }
          }
        }
      }
      const inScroll = t.closest("[data-hive-grid-scroll]");
      if (
        inScroll &&
        !t.closest(
          "td, th, [role='gridcell'], [role='columnheader'], [data-hive-cell], [data-hive-row-edit-actions]"
        )
      ) {
        return;
      }
      /**
       * Editores custom (`renderEditCell`) podem omitir `data-hive-edit-root`; o MUI usa `cellFocusOut`,
       * não clique global. Ignoramos cliques em controlos típicos **dentro** da área de scroll.
       */
      if (
        inScroll &&
        t.closest(
          "[data-hive-edit-root], input, textarea, select, [contenteditable='true'], [role='combobox'], [role='textbox'], [role='searchbox']"
        )
      ) {
        return;
      }
      if (t.closest("[data-hive-edit-root]")) return;
      if (t.closest("[data-hive-row-edit-actions]")) return;
      if (t.closest("[data-hive-actions-cell]")) return;
      if (t.closest("[data-radix-popper-content-wrapper]")) return;
      /** Radix Select não define `data-radix-select-content` no Content — só viewport + listbox. */
      if (t.closest("[data-radix-select-viewport]")) return;
      if (t.closest("[data-radix-select-content]")) return;
      if (t.closest("[role='option']")) return;
      if (t.closest("[data-radix-popover-content]")) return;
      if (t.closest("[data-radix-dropdown-menu-content]")) return;
      if (t.closest("[data-radix-context-menu-content]")) return;
      /** Autocomplete / Popper MUI em portal (fora de `[data-hive-cell]`). */
      if (t.closest(".MuiAutocomplete-popper")) return;
      if (t.closest(".MuiPopper-root")) return;
      if (t.closest("[role='listbox']")) return;
      exitAllEditing({ reason: GridRowEditStopReasons.rowFocusOut });
    };
    document.addEventListener("click", onDocumentClick, false);
    return () => document.removeEventListener("click", onDocumentClick, false);
  }, [editingCell, rowModesEditKey, exitAllEditing]);

  React.useEffect(() => {
    const rowEditing =
      editingCell != null ||
      Object.values(rowModesModel).some((m) => rowModeEntryIsEdit(m));
    if (!rowEditing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitAllEditing({ reason: GridRowEditStopReasons.escapeKeyDown });
      if (e.key !== "Enter" || e.repeat) return;
      if (editModeRef.current !== "row") return;
      if (documentHasOpenRadixSelectDropdown()) return;
      const editingIds = Object.entries(rowModesModelRef.current)
        .filter(([, v]) => rowModeEntryIsEdit(v))
        .map(([k]) => k);
      if (editingIds.length !== 1) return;
      const t = e.target as Node | null;
      if (t instanceof HTMLElement && t.closest("[data-hive-grid-chrome]")) return;
      if (t instanceof HTMLTextAreaElement) return;
      if (
        t instanceof HTMLInputElement &&
        (t.type === "submit" || t.type === "button" || t.type === "reset")
      ) {
        return;
      }
      if (
        t instanceof HTMLInputElement &&
        t.type === "checkbox" &&
        t.closest("[data-hive-edit-root]")
      ) {
        return;
      }
      e.preventDefault();
      void completeRowEditSaveRef.current(editingIds[0]! as GridRowId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingCell, rowModesEditKey, exitAllEditing]);

  const [paginationInternal, setPaginationInternal] = React.useState<GridPaginationModel>(() =>
    paginationModelProp ??
      initialState?.pagination?.paginationModel ?? { page: 0, pageSize: pageSizeOptions[1] ?? 20 }
  );
  const paginationInternalRef = React.useRef(paginationInternal);
  paginationInternalRef.current = paginationInternal;
  const paginationModel = paginationModelProp ?? paginationInternal;

  /** Com `autoResetPageIndex: false` no TanStack, repomos a página ao mudar filtros (comportamento típico). */
  const resetPaginationToFirstPage = React.useCallback(() => {
    if (paginationModelPropRef.current !== undefined) {
      const p = paginationModelPropRef.current;
      if (p.page === 0) return;
      onPaginationModelChangeRef.current?.({ ...p, page: 0 });
      return;
    }
    setPaginationInternal((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
  }, []);

  const [visibilityInternal, setVisibilityInternal] = React.useState<Record<string, boolean>>(
    () => columnVisibilityProp ?? initialState?.columns?.columnVisibilityModel ?? {}
  );
  const columnVisibilityModel = columnVisibilityProp ?? visibilityInternal;

  const [pinningInternal, setPinningInternal] = React.useState(() => ({
    left: (initialState?.columns?.pinnedColumns?.left ?? []).filter(Boolean) as string[],
    right: (initialState?.columns?.pinnedColumns?.right ?? []).filter(Boolean) as string[]
  }));

  const pinningResolved = pinnedColumnsProp ?? pinningInternal;
  /** Referência estável quando os ids fixados não mudam — evita `setOptions`/re-render em cadeia no TanStack. */
  const columnPinningState = React.useMemo(
    () => ({
      left: pinningResolved.left ?? [],
      right: pinningResolved.right ?? []
    }),
    [(pinningResolved.left ?? []).join("\0"), (pinningResolved.right ?? []).join("\0")]
  );

  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(
    () => initialState?.columns?.columnSizing ?? {}
  );

  const [columnSizingInfo, setColumnSizingInfo] = React.useState<ColumnSizingInfoState>(
    getDefaultColumnSizingInfoState
  );

  const [columnResizeDirection, setColumnResizeDirection] = React.useState<"ltr" | "rtl">(() =>
    typeof document !== "undefined" && document.documentElement.dir === "rtl" ? "rtl" : "ltr"
  );
  React.useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.documentElement;
    const sync = () => {
      setColumnResizeDirection(el.dir === "rtl" ? "rtl" : "ltr");
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ["dir"] });
    return () => mo.disconnect();
  }, []);

  const prefsHydratedRef = React.useRef(false);

  const [detailExpandedInternal, setDetailExpandedInternal] = React.useState<ExpandedState>(() =>
    expandedStateFromRowIds(initialState?.detailPanel?.expandedRowIds ?? [])
  );

  const [treeExpandedInternal, setTreeExpandedInternal] = React.useState<ExpandedState>(() =>
    expandedStateFromRowIds(initialState?.treeData?.expandedRowIds ?? [])
  );

  const [groupExpandedInternal, setGroupExpandedInternal] = React.useState<ExpandedState>(() => ({}));

  const detailExpandedControlled = React.useMemo((): ExpandedState | undefined => {
    if (detailPanelExpandedRowIdsProp === undefined) return undefined;
    return expandedStateFromRowIds(detailPanelExpandedRowIdsProp);
  }, [JSON.stringify(detailPanelExpandedRowIdsProp ?? null)]);

  const treeExpandedControlled = React.useMemo((): ExpandedState | undefined => {
    if (treeExpandedRowIdsProp === undefined) return undefined;
    return expandedStateFromRowIds(treeExpandedRowIdsProp);
  }, [JSON.stringify(treeExpandedRowIdsProp ?? null)]);

  const expandedStateResolved = treeActive
    ? (treeExpandedControlled ?? treeExpandedInternal)
    : groupingActive
      ? groupExpandedInternal
      : (detailExpandedControlled ?? detailExpandedInternal);

  const showSelectColumn = checkboxSelection || radioSelection;
  const useRadioColumn = radioSelection && !checkboxSelection;
  /** Seleção por clique na linha (sem coluna `__select__`) quando há `onRowSelectionModelChange` e `disableRowSelectionOnClick` é falso. */
  const implicitRowClickSelection =
    onRowSelectionModelChange != null &&
    !showSelectColumn &&
    !disableRowSelectionOnClick;
  /** ARIA: multiseleção com checkboxes ou com seleção implícita por clique. */
  const ariaMultiSelectable =
    (checkboxSelection === true && disableMultipleRowSelection !== true && !useRadioColumn) ||
    (implicitRowClickSelection && disableMultipleRowSelection !== true);
  const selectRadioGroupName = React.useId();

  const baseOrder = React.useMemo(() => {
    const fields = columnsProp.map((c) => c.field);
    let ordered = fields as ColumnOrderState;
    if (detailActive) ordered = ["__detail__", ...ordered] as ColumnOrderState;
    if (treeActive) ordered = ["__tree__", ...ordered] as ColumnOrderState;
    return showSelectColumn ? (["__select__", ...ordered] as ColumnOrderState) : ordered;
  }, [columnsProp, showSelectColumn, detailActive, treeActive]);

  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    () => initialState?.columns?.columnOrder ?? baseOrder
  );

  React.useEffect(() => {
    setColumnOrder((prev) => {
      const merged = baseOrder.filter((id) => prev.includes(id) || baseOrder.includes(id));
      if (merged.length !== baseOrder.length) return baseOrder;
      return prev;
    });
  }, [baseOrder]);

  React.useEffect(() => {
    if (!preferencesKey || prefsHydratedRef.current) return;
    const storage = preferencesStorageProp ?? (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage) {
      prefsHydratedRef.current = true;
      return;
    }
    const stored = readGridPreferencesFromStorage(preferencesKey, storage);
    prefsHydratedRef.current = true;
    const def = defaultPreferences;
    const sortToApply = stored?.sortModel ?? def?.sortModel;
    const filterToApply = stored?.filterModel ?? def?.filterModel;
    const paginationToApply = stored?.paginationModel ?? def?.paginationModel;
    const visibilityToApply = stored?.columnVisibilityModel ?? def?.columnVisibilityModel;
    const pinToApply = stored?.pinnedColumns ?? def?.pinnedColumns;
    const densityToApply = stored?.density ?? def?.density;
    const columnOrderToApply = stored?.columnOrder ?? def?.columnOrder;
    const rowGroupingToApply = stored?.rowGroupingModel ?? def?.rowGroupingModel;
    const columnSizingToApply = stored?.columnSizing ?? def?.columnSizing;

    if (sortModelProp === undefined && sortToApply?.length) setSortInternal(sortToApply);
    if (filterModelProp === undefined && filterToApply)
      setFilterInternal({ ...filterToApply, items: filterToApply.items ?? [] });
    if (paginationModelProp === undefined && paginationToApply) setPaginationInternal(paginationToApply);
    if (columnVisibilityProp === undefined && visibilityToApply)
      setVisibilityInternal(visibilityToApply);
    if (pinnedColumnsProp === undefined && pinToApply) {
      setPinningInternal({
        left: pinToApply.left ?? [],
        right: pinToApply.right ?? []
      });
    }
    if (densityProp === undefined && densityToApply) setDensityInternal(densityToApply);
    if (columnOrderToApply?.length) {
      setColumnOrder(mergePersistedColumnOrder(baseOrder, columnOrderToApply));
    }
    if (rowGroupingModelProp === undefined && rowGroupingToApply?.length && !treeActive) {
      const valid = new Set(columnsProp.map((c) => c.field));
      setRowGroupingInternal(rowGroupingToApply.filter((id) => valid.has(String(id))));
    }
    if (columnSizingToApply && Object.keys(columnSizingToApply).length) {
      setColumnSizing(mergePersistedColumnSizing(baseOrder, columnSizingToApply));
    }
  }, [
    preferencesKey,
    preferencesStorageProp,
    defaultPreferences,
    sortModelProp,
    filterModelProp,
    paginationModelProp,
    columnVisibilityProp,
    pinnedColumnsProp,
    densityProp,
    rowGroupingModelProp,
    baseOrder,
    treeActive,
    columnsProp
  ]);

  const [quickInternal, setQuickInternal] = React.useState(() => {
    const iv = filterModelProp ?? initialState?.filter?.filterModel;
    const qv = iv?.quickFilterValues;
    return qv?.length ? qv.join(" ") : "";
  });
  const quickFilterValue = quickFilterProp ?? quickInternal;

  const lastEmittedModelRef = React.useRef<GridRowSelectionModel | undefined>(rowSelectionModelProp);
  const tableInstanceRef = React.useRef<TanstackTable<R> | null>(null);
  /** Âncora para Shift+clique em modo seleção por linha (sem checkboxes). */
  const rowSelectionAnchorIdRef = React.useRef<string | null>(null);
  const [rowSelectionFocusId, setRowSelectionFocusId] = React.useState<GridRowId | null>(null);

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(() =>
    rowSelectionStateFromModel(
      rowSelectionModelProp,
      treeActive ? treeStructure.roots : rows,
      getRowId,
      isRowSelectable
    )
  );

  React.useEffect(() => {
    if (rowSelectionModelProp === undefined) return;
    setRowSelection(
      rowSelectionStateFromModel(
        rowSelectionModelProp,
        treeActive ? treeStructure.roots : rows,
        getRowId,
        isRowSelectable
      )
    );
    lastEmittedModelRef.current = rowSelectionModelProp;
  }, [rowSelectionModelProp, treeActive, treeStructure.roots, rows, getRowId, isRowSelectable]);

  React.useEffect(() => {
    if (!implicitRowClickSelection) return;
    if (rowSelectionModelProp === undefined) return;
    if (normalizeSelectionIds(rowSelectionModelProp).length === 0) {
      setRowSelectionFocusId(null);
      rowSelectionAnchorIdRef.current = null;
    }
  }, [rowSelectionModelProp, implicitRowClickSelection]);

  React.useEffect(() => {
    if (sortModelProp) setSortInternal(sortModelProp);
  }, [sortModelProp]);

  const apiHolder = React.useRef<GridApiCommunity<R> | null>(apiRef?.current ?? null);

  const selectionColumn: ColumnDef<R, unknown> | null = React.useMemo(() => {
    if (!showSelectColumn) return null;
    const compact = density === "compact";
    if (useRadioColumn) {
      return {
        id: "__select__",
        size: 48,
        minSize: 48,
        maxSize: 48,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        enablePinning: true,
        header: () => <span className="inline-block w-3 shrink-0" aria-hidden="true" />,
        cell: ({ row, table }) => {
          if (row.getIsGrouped()) return null;
          const id = String(getRowIdRef.current(row.original));
          const sel = isRowSelectableRef.current;
          const selectable = sel ? sel({ id, row: row.original }) : true;
          if (!selectable) return null;
          return (
            <input
              type="radio"
              name={selectRadioGroupName}
              className={cn(
                "shrink-0 accent-primary",
                compact ? "h-3 w-3" : "h-4 w-4"
              )}
              checked={row.getIsSelected()}
              onChange={() => {
                table.setRowSelection({ [row.id]: true });
              }}
              onClick={(e) => disableRowSelectionOnClick && e.stopPropagation()}
              aria-label={localeText?.checkboxSelectionSelectRow ?? "Selecionar linha"}
            />
          );
        }
      };
    }
    return {
      id: "__select__",
      size: 48,
      minSize: 48,
      maxSize: 48,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      enablePinning: true,
      header: ({ table }) => {
        const rowCountKnown = rowCount != null && rowCount >= 0;
        const serverSelectAll =
          checkboxSelectionSelectAllPages &&
          paginationMode === "server" &&
          rowCountKnown &&
          !!onRowSelectionModelChangeRef.current;
        const globalAll =
          serverSelectAll && isGlobalSelectAllExclude(rowSelectionModelPropRef.current);
        const checked = globalAll
          ? true
          : table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false;
        return (
          <input
            type="checkbox"
            className={cn(
              "shrink-0 cursor-pointer rounded border border-primary accent-primary",
              compact ? "h-3 w-3" : "h-4 w-4"
            )}
            checked={checked === true}
            ref={(el) => {
              if (el) el.indeterminate = checked === "indeterminate";
            }}
            onChange={(e) => {
              const v = e.target.checked;
              if (serverSelectAll) {
                const notify = onRowSelectionModelChangeRef.current;
                if (v) {
                  notify?.({ type: "exclude", ids: [] });
                } else {
                  notify?.({ type: "include", ids: [] });
                }
                return;
              }
              table.toggleAllPageRowsSelected(v);
            }}
            aria-label={localeText?.checkboxSelectionSelectAll ?? "Selecionar todas"}
          />
        );
      },
      cell: ({ row }) => {
        if (row.getIsGrouped()) return null;
        const id = String(getRowIdRef.current(row.original));
        const sel = isRowSelectableRef.current;
        const selectable = sel ? sel({ id, row: row.original }) : true;
        if (!selectable) return null;
        return (
          <input
            type="checkbox"
            className={cn(
              "shrink-0 cursor-pointer rounded border border-primary accent-primary",
              compact ? "h-3 w-3" : "h-4 w-4"
            )}
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            onClick={(e) => disableRowSelectionOnClick && e.stopPropagation()}
            aria-label={localeText?.checkboxSelectionSelectRow ?? "Selecionar linha"}
          />
        );
      }
    };
  }, [
    showSelectColumn,
    useRadioColumn,
    selectRadioGroupName,
    disableRowSelectionOnClick,
    paginationMode,
    rowCount,
    checkboxSelectionSelectAllPages,
    localeText?.checkboxSelectionSelectAll,
    localeText?.checkboxSelectionSelectRow,
    density
  ]);

  const treeToggleColumn: ColumnDef<R, unknown> | null = React.useMemo(
    () =>
      treeActive
        ? {
            id: "__tree__",
            size: 44,
            minSize: 44,
            maxSize: 44,
            enableSorting: false,
            enableHiding: false,
            enableResizing: false,
            enablePinning: true,
            header: () => (
              <span className="sr-only">
                {localeText?.treeDataColumn ?? "Árvore"}
              </span>
            ),
            cell: ({ row }) => {
              const paddingLeft = Math.max(0, row.depth) * 12;
              const compact = density === "compact";
              if (!row.getCanExpand()) {
                return (
                  <div
                    className={cn("flex items-center", compact ? "h-[15px]" : "h-8")}
                    style={{ paddingLeft }}
                    aria-hidden
                  />
                );
              }
              return (
                <div className={cn("flex items-center", compact ? "h-[15px]" : "h-8")} style={{ paddingLeft }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("shrink-0", compact ? "h-[15px] w-[15px] min-h-0 min-w-0" : "h-8 w-8")}
                    aria-expanded={row.getIsExpanded()}
                    aria-label={
                      row.getIsExpanded()
                        ? (localeText?.collapseTree ?? "Recolher ramo")
                        : (localeText?.expandTree ?? "Expandir ramo")
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      row.toggleExpanded();
                    }}
                  >
                    {row.getIsExpanded() ? (
                      <ChevronDownIcon className="h-3 w-3 shrink-0" />
                    ) : (
                      <ChevronRightIcon className="h-3 w-3 shrink-0" />
                    )}
                  </Button>
                </div>
              );
            }
          }
        : null,
    [treeActive, localeText, density]
  );

  const detailToggleColumn: ColumnDef<R, unknown> | null = React.useMemo(
    () =>
      detailActive
        ? {
            id: "__detail__",
            size: 40,
            minSize: 40,
            maxSize: 40,
            enableSorting: false,
            enableHiding: false,
            enableResizing: false,
            enablePinning: true,
            header: () => (
              <span className="sr-only">
                {localeText?.detailPanelColumn ?? "Painel de detalhe"}
              </span>
            ),
            cell: ({ row }) => {
              if (!row.getCanExpand()) return null;
              const compact = density === "compact";
              return (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("shrink-0", compact ? "h-[15px] w-[15px] min-h-0 min-w-0" : "h-8 w-8")}
                  aria-expanded={row.getIsExpanded()}
                  aria-label={
                    row.getIsExpanded()
                      ? (localeText?.collapseDetail ?? "Fechar detalhe")
                      : (localeText?.expandDetail ?? "Abrir detalhe")
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    row.toggleExpanded();
                  }}
                >
                  {row.getIsExpanded() ? (
                    <ChevronDownIcon className="h-3 w-3 shrink-0" />
                  ) : (
                    <ChevronRightIcon className="h-3 w-3 shrink-0" />
                  )}
                </Button>
              );
            }
          }
        : null,
    [detailActive, localeText, density]
  );

  const columnDefs = React.useMemo(() => {
    const ctx = {
      apiRef: apiRef ?? apiHolder,
      getRowId,
      disableColumnSort,
      aggregationModel,
      showAggregationFooter
    };
    return buildColumnDefs(columnsProp, ctx);
  }, [columnsProp, getRowId, apiRef, disableColumnSort, aggregationModel, showAggregationFooter]);

  const tableColumns = React.useMemo(() => {
    let cols: ColumnDef<R, unknown>[] = [...columnDefs];
    if (detailToggleColumn) cols = [detailToggleColumn, ...cols];
    if (treeToggleColumn) cols = [treeToggleColumn, ...cols];
    if (selectionColumn) cols = [selectionColumn, ...cols];
    return cols;
  }, [columnDefs, detailToggleColumn, treeToggleColumn, selectionColumn]);

  const sortingState = React.useMemo(
    () => sortModelToSortingState(sortModel),
    [JSON.stringify(sortModel)]
  );

  const columnsByFieldForFilter = React.useMemo(() => {
    const m = new Map<string, GridColDef<R>>();
    for (const c of columnsProp) m.set(c.field, c);
    return m;
  }, [columnsProp]);

  const globalFilterBag = React.useMemo((): HiveGlobalFilterBag<R> | "" => {
    if (filterMode === "server") return "";
    return {
      __hive: true,
      quickTyped: quickFilterProp ?? quickInternal,
      filterModel,
      disableQuick: !!disableColumnFilter,
      getApi: () => apiHolder.current,
      columnsByField: columnsByFieldForFilter
    };
  }, [
    filterMode,
    quickFilterProp,
    quickInternal,
    JSON.stringify(filterModel),
    disableColumnFilter,
    columnsByFieldForFilter
  ]);

  const visibilityState: VisibilityState = React.useMemo(() => {
    const v: VisibilityState = {};
    for (const c of columnsProp) {
      const vis = columnVisibilityModel[c.field];
      if (vis === false) v[c.field] = false;
    }
    return v;
  }, [columnsProp, JSON.stringify(columnVisibilityModel)]);

  const paginationState: PaginationState = React.useMemo(
    () => ({
      pageIndex: paginationModel.page,
      pageSize: paginationModel.pageSize
    }),
    [paginationModel.page, paginationModel.pageSize]
  );

  const serverPageCount = React.useMemo(() => {
    if (paginationMode !== "server") return undefined;
    const rc = rowCount;
    const knownTotal = rc != null && rc >= 0;
    if (knownTotal) return Math.max(1, Math.ceil(rc / paginationModel.pageSize));
    const hasNext = paginationMeta?.hasNextPage === true;
    const minFromNav = Math.max(1, paginationModel.page + 1 + (hasNext ? 1 : 0));
    const est = paginationMeta?.estimatedRowCount;
    if (est != null && est >= 0) {
      const fromEst = Math.max(1, Math.ceil(est / paginationModel.pageSize));
      return Math.max(fromEst, minFromNav);
    }
    return minFromNav;
  }, [
    paginationMode,
    rowCount,
    paginationModel.page,
    paginationModel.pageSize,
    JSON.stringify(paginationMeta ?? null)
  ]);

  const columnOrderResolved = React.useMemo(() => {
    const fields = new Set(tableColumns.map((c) => c.id as string));
    const ordered = columnOrder.filter((id) => fields.has(id));
    const rest = tableColumns.map((c) => c.id as string).filter((id) => !ordered.includes(id));
    return [...ordered, ...rest];
  }, [columnOrder, tableColumns]);

  const rowsWithRowEditDrafts = React.useMemo(() => {
    if (treeActive) return rows;
    if (Object.keys(rowFieldDrafts).length === 0) return rows;
    return rows.map((r) => {
      const id = String(getRowId(r));
      const patch = rowFieldDrafts[id];
      if (!patch || Object.keys(patch).length === 0) return r;
      return { ...(r as object), ...patch } as R;
    });
  }, [rows, rowFieldDrafts, getRowId, treeActive]);

  const table = useReactTable({
    data: treeActive ? treeStructure.roots : rowsWithRowEditDrafts,
    columns: tableColumns,
    getRowId: (row) => String(getRowId(row)),
    state: {
      sorting: sortingState,
      columnFilters: [],
      globalFilter: globalFilterBag,
      columnVisibility: visibilityState,
      rowSelection,
      pagination: paginationState,
      columnOrder: columnOrderResolved,
      columnSizing,
      columnSizingInfo,
      columnPinning: columnPinningState,
      expanded: expandedStateResolved,
      grouping: groupingState
    },
    globalFilterFn: (row, _cid, fv) => {
      if (filterMode === "server") return true;
      if (fv && typeof fv === "object" && (fv as HiveGlobalFilterBag<R>).__hive) {
        return rowPassesHiveGlobalFilter(row, fv as HiveGlobalFilterBag<R>);
      }
      return true;
    },
    manualFiltering: filterMode === "server",
    manualSorting: sortingMode === "server",
    manualPagination: paginationMode === "server",
    /** Evita `resetPageIndex` em microtask a competir com estado controlado em React (cliques no rodapé a bloquear o renderer). */
    autoResetPageIndex: false,
    pageCount: serverPageCount,
    enableColumnResizing: !disableColumnResize,
    /** `onChange` dá feedback imediato ao arrastar (onEnd só atualiza ao largar). */
    columnResizeMode: "onChange",
    columnResizeDirection,
    enableRowSelection:
      showSelectColumn || implicitRowClickSelection
        ? (row) => !row.getIsGrouped()
        : false,
    enableMultiRowSelection: !disableMultipleRowSelection && !useRadioColumn,
    enableSorting: !disableColumnSort,
    sortDescFirst: sortingOrder[0] === "desc",
    enableSortingRemoval: true,
    isMultiSortEvent: (e) =>
      typeof e === "object" &&
      e !== null &&
      "shiftKey" in e &&
      !!(e as React.MouseEvent).shiftKey,
    maxMultiSortColCount: 8,
    getSubRows: treeActive
      ? (row) =>
          treeStructure.childrenByParent.get(String(getRowIdRef.current(row))) ?? []
      : undefined,
    enableGrouping: true,
    groupedColumnMode: groupingActive ? "reorder" : false,
    onGroupingChange: (updater) => {
      const next = typeof updater === "function" ? updater(groupingState) : updater;
      if (rowGroupingModelPropRef.current === undefined) setRowGroupingInternal(next);
      onRowGroupingModelChangeRef.current?.(next);
    },
    enableExpanding: treeActive || detailActive || groupingActive,
    manualExpanding: true,
    paginateExpandedRows: false,
    ...(groupingActive
      ? {}
      : {
          getRowCanExpand: (row: Row<R>) => {
            if (treeActive) {
              const kids = treeStructure.childrenByParent.get(
                String(getRowIdRef.current(row.original))
              );
              return (kids?.length ?? 0) > 0;
            }
            if (detailActive) {
              const canExpandRow = isDetailPanelExpandableRef.current;
              if (
                canExpandRow &&
                !canExpandRow({ id: getRowIdRef.current(row.original), row: row.original })
              ) {
                return false;
              }
              return true;
            }
            return false;
          }
        }),
    onExpandedChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(expandedStateResolved) : updater;
      if (next === true) {
        if (groupingActive) {
          setGroupExpandedInternal(true);
          return;
        }
        const rec: Record<string, boolean> = {};
        const ids: GridRowId[] = [];
        if (treeActive) {
          const walk = (r: R) => {
            const idStr = String(getRowIdRef.current(r));
            const kids = treeStructure.childrenByParent.get(idStr);
            if (kids?.length) {
              rec[idStr] = true;
              ids.push(getRowIdRef.current(r));
              for (const c of kids) walk(c);
            }
          };
          for (const r of treeStructure.roots) walk(r);
          if (treeExpandedRowIdsPropRef.current === undefined) setTreeExpandedInternal(rec);
          onTreeExpandedRowIdsChangeRef.current?.(ids);
          return;
        }
        if (detailActive) {
          const canExpandRow = isDetailPanelExpandableRef.current;
          for (const row of rows) {
            const id = getRowIdRef.current(row);
            const allowed =
              !canExpandRow ||
              canExpandRow({ id, row });
            if (allowed) {
              rec[String(id)] = true;
              ids.push(id);
            }
          }
          if (detailPanelExpandedRowIdsPropRef.current === undefined) setDetailExpandedInternal(rec);
          onDetailPanelExpandedRowIdsChangeRef.current?.(ids);
        }
        return;
      }
      const rec: Record<string, boolean> = { ...(next as Record<string, boolean>) };
      const ids = Object.keys(rec).filter((k) => rec[k]);
      if (treeActive) {
        if (treeExpandedRowIdsPropRef.current === undefined) setTreeExpandedInternal(rec);
        onTreeExpandedRowIdsChangeRef.current?.(ids);
      } else if (groupingActive) {
        setGroupExpandedInternal(rec);
      } else if (detailActive) {
        if (detailPanelExpandedRowIdsPropRef.current === undefined) setDetailExpandedInternal(rec);
        onDetailPanelExpandedRowIdsChangeRef.current?.(ids);
      }
    },
    enableColumnPinning: !disableColumnPinning,
    onColumnPinningChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(columnPinningState) : updater;
      const normalized = { left: next.left ?? [], right: next.right ?? [] };
      if (pinnedColumnsPropRef.current === undefined) setPinningInternal(normalized);
      onPinnedColumnsChangeRef.current?.(normalized);
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sortingState) : updater;
      const sm = sortingStateToSortModel(next);
      if (sortModelPropRef.current === undefined) setSortInternal(sm);
      onSortModelChangeRef.current?.(sm);
    },
    onGlobalFilterChange: (updater) => {
      if (filterMode !== "client") return;
      const prev: HiveGlobalFilterBag<R> = {
        __hive: true,
        quickTyped: quickFilterProp ?? quickInternal,
        filterModel,
        disableQuick: !!disableColumnFilter
      };
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (next && typeof next === "object" && (next as HiveGlobalFilterBag<R>).__hive) {
        const t = (next as HiveGlobalFilterBag<R>).quickTyped ?? "";
        if (quickFilterProp === undefined) setQuickInternal(String(t));
        onQuickFilterValueChangeRef.current?.(String(t));
      }
    },
    onColumnVisibilityChange: (updater) => {
      const prev = visibilityState;
      const next = typeof updater === "function" ? updater(prev) : updater;
      const model: Record<string, boolean> = { ...columnVisibilityModel };
      for (const k of Object.keys(next)) {
        model[k] = next[k] !== false;
      }
      if (columnVisibilityPropRef.current === undefined) setVisibilityInternal(model);
      onColumnVisibilityModelChangeRef.current?.(model);
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);
      const notify = onRowSelectionModelChangeRef.current;
      if (!notify) return;
      const t = tableInstanceRef.current;
      const pageRows = t
        ? t
            .getRowModel()
            .rows.filter((r) => !r.getIsGrouped())
            .map((r) => r.original as R)
        : treeActive
          ? treeStructure.roots
          : rows;
      const prev = rowSelectionModelPropRef.current ?? lastEmittedModelRef.current;
      const type = selectionModelType(prev);
      const model = rowSelectionModelFromState(
        next,
        pageRows,
        getRowIdRef.current,
        type,
        prev,
        isRowSelectableRef.current
      );
      lastEmittedModelRef.current = model;
      notify(model);
    },
    onPaginationChange: (updater) => {
      queueMicrotask(() => {
        if (paginationModelPropRef.current !== undefined) {
          const prevPm = paginationModelPropRef.current;
          const currentState: PaginationState = { pageIndex: prevPm.page, pageSize: prevPm.pageSize };
          const next =
            typeof updater === "function"
              ? (updater as (old: PaginationState) => PaginationState)(currentState)
              : updater;
          const pm: GridPaginationModel = { page: next.pageIndex, pageSize: next.pageSize };
          onPaginationModelChangeRef.current?.(pm);
          return;
        }
        const prevPm = paginationInternalRef.current;
        const currentState: PaginationState = { pageIndex: prevPm.page, pageSize: prevPm.pageSize };
        const next =
          typeof updater === "function"
            ? (updater as (old: PaginationState) => PaginationState)(currentState)
            : updater;
        const pm: GridPaginationModel = { page: next.pageIndex, pageSize: next.pageSize };
        setPaginationInternal(pm);
        onPaginationModelChangeRef.current?.(pm);
      });
    },
    onColumnOrderChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnOrderResolved) : updater;
      setColumnOrder(next);
    },
    onColumnSizingChange: (updater) => {
      setColumnSizing((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (old: ColumnSizingState) => ColumnSizingState)(prev)
            : updater;
        const widthCb = onColumnWidthChangeRef.current;
        if (widthCb) {
          for (const key of Object.keys(next)) {
            if (key === "__select__" || key === "__detail__" || key === "__tree__") continue;
            const prevW = prev[key];
            const w = next[key];
            if (w !== undefined && w !== prevW) {
              widthCb({ colDef: { field: key }, width: w });
            }
          }
        }
        return next;
      });
    },
    onColumnSizingInfoChange: setColumnSizingInfo,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: groupingActive ? getGroupedRowModel() : undefined,
    getExpandedRowModel:
      treeActive || groupingActive ? getExpandedRowModel() : undefined,
    getSortedRowModel: sortingMode === "client" ? getSortedRowModel() : undefined,
    getFilteredRowModel: filterMode === "client" ? getFilteredRowModel() : undefined,
    getPaginationRowModel:
      pagination && paginationMode === "client" ? getPaginationRowModel() : undefined
  });

  tableInstanceRef.current = table;

  const tableRefForApi = React.useRef(table);
  tableRefForApi.current = table;
  /** Instância TanStack sempre atual via ref — evita recriar `gridApi` quando `table` muda de referência a cada interação. */
  const getTableForApi = React.useCallback(() => tableRefForApi.current, []);

  const applyImplicitRowSelectionFromRowClick = React.useCallback(
    (row: Row<R>, e: React.MouseEvent) => {
      if (!implicitRowClickSelection) return false;
      if (row.getIsGrouped()) return false;
      const id = getRowIdRef.current(row.original);
      const sel = isRowSelectableRef.current;
      if (sel && !sel({ id, row: row.original })) return false;

      const t = getTableForApi();
      const dataRows = t.getRowModel().rows.filter((r) => !r.getIsGrouped());
      const currentIdx = dataRows.findIndex((r) => r.id === row.id);

      let next: RowSelectionState;

      if (
        e.shiftKey &&
        rowSelectionAnchorIdRef.current != null &&
        disableMultipleRowSelection !== true
      ) {
        const anchorIdx = dataRows.findIndex((r) => r.id === rowSelectionAnchorIdRef.current);
        if (anchorIdx >= 0 && currentIdx >= 0) {
          const [from, to] =
            anchorIdx <= currentIdx ? [anchorIdx, currentIdx] : [currentIdx, anchorIdx];
          next = {};
          for (let i = from; i <= to; i++) {
            const dr = dataRows[i]!;
            const rid = getRowIdRef.current(dr.original);
            if (!sel || sel({ id: rid, row: dr.original })) {
              next[dr.id] = true;
            }
          }
        } else {
          next = { [row.id]: true };
        }
      } else if ((e.metaKey || e.ctrlKey) && disableMultipleRowSelection !== true) {
        next = { ...t.getState().rowSelection };
        next[row.id] = !next[row.id];
      } else {
        next = { [row.id]: true };
      }

      if (!e.shiftKey) {
        rowSelectionAnchorIdRef.current = row.id;
      }

      t.setRowSelection(next);
      setRowSelectionFocusId(id);
      return true;
    },
    [
      implicitRowClickSelection,
      disableMultipleRowSelection,
      getTableForApi
    ]
  );

  const completeRowEditSave = React.useCallback(
    async (rid: GridRowId, ev?: React.MouseEvent<HTMLButtonElement>) => {
      const s = String(rid);
      const draft = rowFieldDraftsRef.current[s] ?? {};
      const baseRow =
        rowsRef.current.find((r) => String(getRowIdRef.current(r)) === s) ??
        (() => {
          const t = getTableForApi();
          const fr = t.getRowModel().flatRows.find(
            (r) =>
              !r.getIsGrouped() && String(getRowIdRef.current(r.original)) === s
          );
          return fr?.original as R | undefined;
        })();
      if (baseRow === undefined) return;
      const merged =
        draft && Object.keys(draft).length > 0
          ? ({ ...(baseRow as object), ...draft } as R)
          : baseRow;
      const snap = rowEditStartSnapshotRef.current[s];
      const oldRowForPru = snap !== undefined ? (snap as R) : baseRow;
      if (!processRowUpdateRef.current && !onRowsChangeRef.current) return;
      try {
        if (processRowUpdateRef.current) {
          await Promise.resolve(processRowUpdateRef.current(merged, oldRowForPru));
        } else {
          onRowsChangeRef.current?.([merged as GridRowUpdate<R>]);
        }
        const next = { ...rowModesModelRef.current };
        delete next[s];
        commitRowModesModel(next, {
          event: ev,
          perRow: { [s]: { reason: GridRowEditStopReasons.saveButtonClick } }
        });
      } catch {
        /* rejeição: manter edição */
      }
    },
    [commitRowModesModel, getTableForApi]
  );
  completeRowEditSaveRef.current = completeRowEditSave;

  const onRowEditStartRef = React.useRef(onRowEditStart);
  onRowEditStartRef.current = onRowEditStart;
  const onRowEditStopRef = React.useRef(onRowEditStop);
  onRowEditStopRef.current = onRowEditStop;

  commitRowModesModelFnRef.current = (next: GridRowModesModel) => {
    const prev = rowModesModelRef.current;
    const keySet = new Set([...Object.keys(prev), ...Object.keys(next)]);
    for (const k of keySet) {
      const id = k as GridRowId;
      const wasEdit = rowModeEntryIsEdit(prev[id]);
      const willEdit = rowModeEntryIsEdit(next[id]);
      if (!wasEdit && willEdit) {
        const fromTable = (() => {
          const t = getTableForApi();
          const fr = t.getRowModel().flatRows.find(
            (r) =>
              !r.getIsGrouped() && String(getRowIdRef.current(r.original)) === String(id)
          );
          return fr?.original as R | undefined;
        })();
        const row =
          fromTable ??
          rowsRef.current.find((r) => String(getRowIdRef.current(r)) === String(id));
        if (row !== undefined) {
          rowEditStartSnapshotRef.current[String(id)] = shallowRowSnapshotForEdit(row);
          onRowEditStartRef.current?.({ id, row }, rowEditInteractionEventRef.current);
        }
      }
      if (wasEdit && !willEdit) {
        const fromTable = (() => {
          const t = getTableForApi();
          const fr = t.getRowModel().flatRows.find(
            (r) =>
              !r.getIsGrouped() && String(getRowIdRef.current(r.original)) === String(id)
          );
          return fr?.original as R | undefined;
        })();
        const row =
          fromTable ??
          rowsRef.current.find((r) => String(getRowIdRef.current(r)) === String(id));
        const idStr = String(id);
        const previousRow = rowEditStartSnapshotRef.current[idStr];
        delete rowEditStartSnapshotRef.current[idStr];
        if (row !== undefined) {
          const opts = rowModesCommitOptionsRef.current;
          const per = opts?.perRow?.[String(id)];
          const def = opts?.defaultRowStop;
          onRowEditStopRef.current?.(
            {
              id,
              row,
              ...(previousRow !== undefined ? { previousRow } : {}),
              reason: per?.reason ?? def?.reason ?? GridRowEditStopReasons.rowFocusOut,
              field: per?.field ?? def?.field
            },
            rowEditInteractionEventRef.current
          );
        }
        const dismissCfg = dismissDraftRowOnEditExitRef.current;
        if (dismissCfg != null && gridRowIdsEqual(id, dismissCfg.draftRowId)) {
          const opts2 = rowModesCommitOptionsRef.current;
          const per2 = opts2?.perRow?.[String(id)];
          const def2 = opts2?.defaultRowStop;
          const reasonDismiss = per2?.reason ?? def2?.reason ?? GridRowEditStopReasons.rowFocusOut;
          if (DISMISS_DRAFT_EDIT_STOP_REASONS.has(reasonDismiss)) {
            dismissCfg.onDismiss(id);
          }
        }
      }
    }
    if (rowModesModelPropRef.current === undefined) setRowModesInternal(next);
    onRowModesModelChangeRef.current?.(next);
  };

  const getTable = React.useCallback(() => table, [table]);

  const tableRows = table.getRowModel().rows;
  const scrollParentRef = React.useRef<HTMLDivElement>(null);
  const scrollAreaRootRef = React.useRef<HTMLDivElement>(null);
  const nonVirtualTableDomRef = React.useRef<HTMLTableElement | null>(null);
  const densityFactor = resolvedDensity.rowFactor;
  /**
   * Alturas por densidade (pedido ProtonWeb): compacto e confortável fixos; «standard» = `rowHeight`
   * do consumidor ou altura base em modo standard sem prop.
   * Não usar `display:flex` no `<td>` — quebra o modelo de tabela e empilha células.
   */
  const standardDims = resolveDensityDimensions("standard", densityDimensions);
  const standardDefaultRowPx = Math.max(
    10,
    Math.round(standardDims.baseRowPx * standardDims.rowFactor)
  );
  const standardRowPx =
    rowHeightResolved != null ? Math.round(rowHeightResolved) : standardDefaultRowPx;
  const ROW_PX_COMPACT = 15;
  const ROW_PX_COMFORTABLE = 25;
  const rowPx =
    density === "compact"
      ? ROW_PX_COMPACT
      : density === "comfortable"
        ? ROW_PX_COMFORTABLE
        : standardRowPx;
  const rowPxRef = React.useRef(rowPx);
  rowPxRef.current = rowPx;

  const orderedLeafColumns = React.useMemo(
    () => [
      ...table.getLeftLeafColumns(),
      ...table.getCenterLeafColumns(),
      ...table.getRightLeafColumns()
    ],
    [
      table,
      JSON.stringify(columnVisibilityModel),
      columnPinningState.left.join(","),
      columnPinningState.right.join(","),
      columnOrderResolved.join(",")
    ]
  );

  /**
   * Incluir `columnSizing` e `columnSizingInfo` serializados: `orderedLeafColumns` mantém referência estável;
   * durante o arrasto `deltaOffset` / `startOffset` mudam em frames em que só `isResizingColumn` não chega para invalidar.
   */
  const columnSizesFingerprint = React.useMemo(
    () =>
      [
        orderedLeafColumns.map((c) => c.getSize()).join(","),
        JSON.stringify(columnSizing),
        JSON.stringify(columnSizingInfo)
      ].join("||"),
    [orderedLeafColumns, columnSizing, columnSizingInfo]
  );

  const leafHeadersOrdered = React.useMemo(
    () => getOrderedLeafHeaders(table),
    [
      table,
      JSON.stringify(columnVisibilityModel),
      columnOrderResolved.join(","),
      columnPinningState.left.join(","),
      columnPinningState.right.join(",")
    ]
  );

  /** Ids com `useSortable` apenas — alinhado a `DraggableHeaderCell`, não a todos os `<th>`. */
  const sortableHeaderIds = React.useMemo(
    () =>
      leafHeadersOrdered
        .filter((h) => leafHeaderIsDraggable(h, columnsProp, disableColumnReorder))
        .map((h) => String(h.column.id)),
    [leafHeadersOrdered, columnsProp, disableColumnReorder]
  );

  const gridTemplateColumns = orderedLeafColumns
    .map((c) => {
      const w = c.getSize();
      const meta = c.columnDef.meta as { gridColDef?: GridColDef<R> } | undefined;
      const colMin = meta?.gridColDef?.minWidth ?? 50;
      if (w && w > 0) return `${w}px`;
      return `minmax(${colMin}px,1fr)`;
    })
    .join(" ");

  const aggregationFooterVisible =
    showAggregationFooter &&
    table.getFooterGroups().some((fg) => fg.headers.some((h) => h.column.columnDef.footer));

  const hasPinnedColumns = table.getIsSomeColumnsPinned();
  const hasExpandedDetail =
    detailActive &&
    (expandedStateResolved === true ||
      (typeof expandedStateResolved === "object" &&
        Object.values(expandedStateResolved).some(Boolean)));
  const hasExpandedTree =
    treeActive &&
    (expandedStateResolved === true ||
      (typeof expandedStateResolved === "object" &&
        Object.values(expandedStateResolved).some(Boolean)));
  const hasExpandedGrouping =
    groupingActive &&
    (expandedStateResolved === true ||
      (typeof expandedStateResolved === "object" &&
        Object.values(expandedStateResolved).some(Boolean)));
  const useRowVirtualization =
    !disableVirtualization &&
    !autoHeight &&
    !hasPinnedColumns &&
    !hasExpandedDetail &&
    !hasExpandedTree &&
    !hasExpandedGrouping;

  const useRowVirtualizationRef = React.useRef(useRowVirtualization);
  useRowVirtualizationRef.current = useRowVirtualization;

  const useColumnVirtualizationEffective =
    columnVirtualization === true &&
    useRowVirtualization &&
    !hasPinnedColumns &&
    orderedLeafColumns.length > 0;

  /** Com virtualização de colunas, não há coluna extra estável — usar `showRowEditActions={false}` ou coluna `actions` manual. */
  const showRowEditActionsEffective =
    showRowEditActionsUi && !useColumnVirtualizationEffective;

  const gridTemplateColumnsRowEdit = React.useMemo(
    () =>
      showRowEditActionsEffective
        ? `${gridTemplateColumns} minmax(108px,160px)`
        : gridTemplateColumns,
    [gridTemplateColumns, showRowEditActionsEffective]
  );

  const gridAriaCounts = React.useMemo(() => {
    const headerRowCount = table.getHeaderGroups().length;
    const bodyRowCount = tableRows.length === 0 ? 1 : tableRows.length;
    const footerRowCount = aggregationFooterVisible ? 1 : 0;
    const colExtra = showRowEditActionsEffective ? 1 : 0;
    return {
      ariaRowCount: headerRowCount + bodyRowCount + footerRowCount,
      ariaColCount: orderedLeafColumns.length + colExtra,
      headerRowCount
    };
  }, [
    table,
    tableRows.length,
    aggregationFooterVisible,
    orderedLeafColumns.length,
    showRowEditActionsEffective
  ]);

  const leafColumnCountWithRowEdit =
    orderedLeafColumns.length + (showRowEditActionsEffective ? 1 : 0);

  const colVirtualizer = useVirtualizer({
    horizontal: true,
    count: orderedLeafColumns.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: (index) => {
      const c = orderedLeafColumns[index];
      return c ? Math.max(40, c.getSize()) : 80;
    },
    overscan: 3,
    enabled: useColumnVirtualizationEffective
  });

  const autoHeightRef = React.useRef(!!autoHeight);
  autoHeightRef.current = !!autoHeight;

  const getScrollContainer = React.useCallback((): HTMLElement | null => {
    if (useRowVirtualizationRef.current) return scrollParentRef.current;
    if (autoHeightRef.current) return scrollAreaRootRef.current;
    const root = scrollAreaRootRef.current;
    if (!root) return null;
    const radixVp = root.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
    if (radixVp) return radixVp;
    if (root.hasAttribute("data-hive-grid-scroll")) return root;
    return root;
  }, []);

  const eventSubscribersRef = React.useRef<
    Partial<Record<GridSubscriptionEvent, Set<(s: GridStateSnapshot) => void>>>
  >({});

  const subscribeEventDispatch = React.useCallback(
    (event: GridSubscriptionEvent, handler: (snapshot: GridStateSnapshot) => void) => {
      const map = eventSubscribersRef.current;
      let set = map[event];
      if (!set) {
        set = new Set();
        map[event] = set;
      }
      set.add(handler);
      const captured = set;
      return () => {
        captured.delete(handler);
      };
    },
    []
  );

  const rowSelectionKey = React.useMemo(() => JSON.stringify(rowSelection), [rowSelection]);

  const getStateSnapshot = React.useCallback((): GridStateSnapshot => {
    const rs = table.getState().rowSelection;
    const selectedRowIds = Object.keys(rs).filter((k) => rs[k]) as GridRowId[];
    return {
      sortModel,
      filterModel,
      paginationModel,
      ...(paginationMode === "server" && paginationMeta != null
        ? { paginationMeta }
        : {}),
      columnVisibilityModel,
      pinnedColumns: pinningResolved,
      columnOrder: [...columnOrderResolved],
      columnSizing: pickPersistableColumnSizing(columnSizing),
      selectedRowIds,
      rowGroupingModel: [...groupingState],
      density,
      editMode: editModeResolved,
      rowModesModel
    };
  }, [
    table,
    JSON.stringify(sortModel),
    JSON.stringify(filterModel),
    paginationModel.page,
    paginationModel.pageSize,
    paginationMode,
    JSON.stringify(paginationMeta ?? null),
    JSON.stringify(columnVisibilityModel),
    (pinningResolved.left ?? []).join("\0"),
    (pinningResolved.right ?? []).join("\0"),
    columnOrderResolved.join(","),
    groupingState.join("|"),
    rowSelectionKey,
    density,
    editModeResolved,
    JSON.stringify(rowModesModel),
    JSON.stringify(columnSizing)
  ]);

  /** Evita recriar `gridApi` e reexecutar efeitos em cada mudança de seleção só porque a identidade de `getStateSnapshot` mudou. */
  const getStateSnapshotRef = React.useRef(getStateSnapshot);
  getStateSnapshotRef.current = getStateSnapshot;
  const getStateSnapshotForApi = React.useCallback((): GridStateSnapshot => {
    return getStateSnapshotRef.current();
  }, []);

  const quickFilterInputRef = React.useRef<HTMLInputElement>(null);
  const focusQuickFilter = React.useCallback(() => {
    quickFilterInputRef.current?.focus();
  }, []);

  const getColumnsForApi = React.useCallback(() => columnsPropRef.current, []);

  const gridApi = React.useMemo(
    () =>
      createGridApi(getTableForApi, {
        getColumns: getColumnsForApi,
        getRowId: (row) => getRowIdRef.current(row),
        setSortModel: (m) => {
          if (sortModelPropRef.current === undefined) setSortInternal(m);
          onSortModelChangeRef.current?.(m);
        },
        setFilterModel: (m) => {
          if (filterModelPropRef.current === undefined) setFilterInternal(m);
          onFilterModelChangeRef.current?.(m);
        },
        setPaginationModel: (m) => {
          if (paginationModelPropRef.current === undefined) setPaginationInternal(m);
          onPaginationModelChangeRef.current?.(m);
        },
        setColumnVisibility: (m) => {
          if (columnVisibilityPropRef.current === undefined) setVisibilityInternal(m);
          onColumnVisibilityModelChangeRef.current?.(m);
        },
        setRowSelectionModel: (m) => {
          const dataSource = treeActiveRef.current ? treeStructureRef.current.roots : rowsRef.current;
          setRowSelection(
            rowSelectionStateFromModel(m, dataSource, getRowIdRef.current, isRowSelectableRef.current)
          );
          lastEmittedModelRef.current = m;
          onRowSelectionModelChangeRef.current?.(m);
        },
        getRowSelectionModel: () => {
          if (rowSelectionModelPropRef.current !== undefined) return rowSelectionModelPropRef.current;
          const t = getTable();
          const rs = t.getState().rowSelection;
          const pageRows = t
            .getRowModel()
            .rows.filter((r) => !r.getIsGrouped())
            .map((r) => r.original as R);
          const prev = lastEmittedModelRef.current;
          return rowSelectionModelFromState(
            rs,
            pageRows,
            getRowIdRef.current,
            selectionModelType(prev),
            prev,
            isRowSelectableRef.current
          );
        },
        getSortModel: () => sortingStateToSortModel(getTable().getState().sorting),
        getFilterModel: () => filterModelRef.current,
        getPaginationModel: () => ({
          page: getTable().getState().pagination.pageIndex,
          pageSize: getTable().getState().pagination.pageSize
        }),
        getColumnVisibilityModel: () => {
          const vis: Record<string, boolean> = {};
          for (const c of columnsPropRef.current) {
            vis[c.field] = getTable().getColumn(c.field)?.getIsVisible() !== false;
          }
          return vis;
        },
        setPinnedColumns: (m) => {
          const normalized = { left: m.left ?? [], right: m.right ?? [] };
          if (pinnedColumnsPropRef.current === undefined) setPinningInternal(normalized);
          onPinnedColumnsChangeRef.current?.(normalized);
        },
        getPinnedColumns: () => {
          const s = getTable().getState().columnPinning;
          return { left: s.left ?? [], right: s.right ?? [] };
        },
        csvFileName: csvOptionsRef.current?.fileName,
        csvUtf8WithBomDefault: csvOptionsRef.current?.utf8WithBom !== false,
        excelFileName: excelOptionsRef.current?.fileName,
        excelSheetName: excelOptionsRef.current?.sheetName,
        getScrollContainer,
        getEstimatedRowHeight: () => rowPxRef.current,
        getHeaderBlockHeight: () => {
          const t = getTable();
          const headerRowCount = t.getHeaderGroups().length;
          const h = columnHeaderHeightPxRef.current ?? 40;
          return headerRowCount * h;
        },
        getStateSnapshot: getStateSnapshotForApi,
        subscribeEventDispatch,
        focusQuickFilter,
        closeFilterPanel: closeAllFilterUi,
        openFilterPanel: openGlobalFilterPanel,
        openColumnsPanel: openGlobalColumnsPanel,
        closeColumnsPanel: () => setColumnsMenuOpen(false),
        onRowsChange: (updates) => onRowsChangeRef.current?.(updates),
        onRowTransaction: (tx) => onRowTransactionRef.current?.(tx),
        getCellMode: (params) => {
          const t = getTable();
          const fr = t.getRowModel().flatRows.find(
            (r) => !r.getIsGrouped() && String(getRowIdRef.current(r.original)) === String(params.id)
          );
          const col = columnsPropRef.current.find((c) => c.field === params.field);
          if (editModeRef.current === "row") {
            if (!rowModeEntryIsEdit(rowModesModelRef.current[String(params.id)])) return "view";
            if (!col || col.editable !== true || !fr) return "view";
            const cp: GridCellParams<R> = {
              id: params.id,
              field: params.field,
              row: fr.original,
              value: fr.getValue(params.field)
            };
            if (col.isCellEditable && !col.isCellEditable(cp)) return "view";
            return "edit";
          }
          if (
            editingCellRef.current &&
            String(editingCellRef.current.rowId) === String(params.id) &&
            editingCellRef.current.field === params.field
          ) {
            if (!col || !fr || col.editable !== true) return "view";
            const cp: GridCellParams<R> = {
              id: params.id,
              field: params.field,
              row: fr.original,
              value: fr.getValue(params.field)
            };
            if (col.isCellEditable && !col.isCellEditable(cp)) return "view";
            return "edit";
          }
          return "view";
        },
        setEditCellValue: (params) => {
          if (!onRowsChangeRef.current) return false;
          const t = getTable();
          const fr = t.getRowModel().flatRows.find(
            (r) => !r.getIsGrouped() && String(getRowIdRef.current(r.original)) === String(params.id)
          );
          if (!fr) return false;
          onRowsChangeRef.current([
            { id: params.id, [params.field]: params.value } as GridRowUpdate<R>
          ]);
          return true;
        },
        startCellEditMode: (params) => {
          const row = getTable()
            .getRowModel()
            .flatRows.find(
              (r) => !r.getIsGrouped() && String(getRowIdRef.current(r.original)) === String(params.id)
            );
          if (!row) return false;
          return tryStartCellEditRef.current(row, params.field);
        },
        stopCellEditMode: exitAllEditing,
        getRowModesModel: () => rowModesModelRef.current,
        setRowModesModel: (model) => {
          const prev = rowModesModelRef.current;
          const next = typeof model === "function" ? model(prev) : model;
          commitRowModesModel(next);
        },
        getDensity: () => densityRef.current,
        setDensity: (d) => applyDensity(d),
        commitRowEditSave: (rowId: GridRowId) => completeRowEditSaveRef.current(rowId)
      }),
    [
      getTableForApi,
      getColumnsForApi,
      getStateSnapshotForApi,
      getScrollContainer,
      subscribeEventDispatch,
      focusQuickFilter,
      closeAllFilterUi,
      openGlobalFilterPanel,
      openGlobalColumnsPanel,
      exitAllEditing,
      applyDensity,
      commitRowModesModel
    ]
  );

  const setQuickFilterValueContext = React.useCallback(
    (v: string) => {
      resetPaginationToFirstPage();
      if (quickFilterProp === undefined) setQuickInternal(v);
      onQuickFilterValueChangeRef.current?.(v);
      const fm = filterModelRef.current;
      const nextModel: GridFilterModel = {
        ...fm,
        quickFilterValues: v.trim() ? [v.trim()] : [],
        quickFilterLogicOperator: fm.quickFilterLogicOperator ?? "And"
      };
      if (filterModelPropRef.current === undefined) setFilterInternal(nextModel);
      onFilterModelChangeRef.current?.(nextModel);
    },
    [quickFilterProp, resetPaginationToFirstPage]
  );

  const gridRootContextValue = React.useMemo(
    () => ({
      api: gridApi,
      scrollContainerRef: scrollParentRef,
      density,
      setDensity: applyDensity,
      quickFilterValue,
      setQuickFilterValue: setQuickFilterValueContext,
      filterPanelAnchorRef,
      columnsPanelAnchorRef,
      editToolbarCompat: {
        disableColumnFilter: !!disableColumnFilter,
        disableColumnSelector: !!disableColumnSelector,
        disableDensitySelector: !!disableDensitySelector
      }
    }),
    [
      gridApi,
      density,
      applyDensity,
      quickFilterValue,
      setQuickFilterValueContext,
      disableColumnFilter,
      disableColumnSelector,
      disableDensitySelector
    ]
  );

  /**
   * Edição por linha: Tab / Shift+Tab entre células editáveis; na última / primeira sai com
   * `tabKeyDown` / `shiftTabKeyDown` (paridade MUI `GridRowEditStopReasons`).
   */
  const rowEditTabNavigate = React.useCallback(
    (e: React.KeyboardEvent, row: Row<R>, field: string): boolean => {
      if (e.key !== "Tab") return false;
      const ne = e.nativeEvent as KeyboardEvent;
      if (ne.isComposing || ne.keyCode === 229) return false;

      const rowRid = getRowIdRef.current(row.original);
      const visibleLeaf = orderedLeafColumns.filter((c) => c.getIsVisible());
      const editableFields: string[] = [];
      for (const c of visibleLeaf) {
        const fid = String(c.id);
        if (fid === "__select__" || fid === "__detail__" || fid === "__tree__") continue;
        const col = columnsPropRef.current.find((x) => x.field === fid);
        if (!col || col.editable !== true) continue;
        const cp: GridCellParams<R> = {
          id: rowRid,
          field: fid,
          row: row.original,
          value: row.getValue(fid)
        };
        if (col.isCellEditable && !col.isCellEditable(cp)) continue;
        const ig = isCellEditableGridRef.current;
        if (ig && !ig(cp)) continue;
        if (!cellEditorSupported(col)) continue;
        editableFields.push(fid);
      }
      if (editableFields.length === 0) return false;

      const idx = editableFields.indexOf(field);
      if (idx < 0) return false;

      const last = editableFields.length - 1;
      const s = String(rowRid);

      if (e.shiftKey) {
        if (idx === 0) {
          e.preventDefault();
          const next = { ...rowModesModelRef.current };
          delete next[s];
          commitRowModesModel(next, {
            event: e,
            perRow: {
              [s]: { reason: GridRowEditStopReasons.shiftTabKeyDown, field }
            }
          });
          return true;
        }
        e.preventDefault();
        const { chain } = buildHorizontalScrollRestoreChain(getScrollContainer());
        gridApi.setCellFocus({
          id: rowRid,
          field: editableFields[idx - 1]!,
          horizontalScrollSnapshots: chain.length > 0 ? chain : undefined
        });
        return true;
      }

      if (idx === last) {
        e.preventDefault();
        const next = { ...rowModesModelRef.current };
        delete next[s];
        commitRowModesModel(next, {
          event: e,
          perRow: { [s]: { reason: GridRowEditStopReasons.tabKeyDown, field } }
        });
        return true;
      }

      e.preventDefault();
      const { chain } = buildHorizontalScrollRestoreChain(getScrollContainer());
      gridApi.setCellFocus({
        id: rowRid,
        field: editableFields[idx + 1]!,
        horizontalScrollSnapshots: chain.length > 0 ? chain : undefined
      });
      return true;
    },
    [orderedLeafColumns, commitRowModesModel, gridApi, getScrollContainer]
  );

  const navigateCellFromKeys = React.useCallback(
    (e: React.KeyboardEvent, row: Row<R>, field: string) => {
      const k = e.key;
      if (
        k !== "ArrowUp" &&
        k !== "ArrowDown" &&
        k !== "ArrowLeft" &&
        k !== "ArrowRight" &&
        k !== "Home" &&
        k !== "End" &&
        k !== "Tab" &&
        k !== "PageDown" &&
        k !== "PageUp"
      ) {
        return;
      }

      const ctrlMeta = e.ctrlKey || e.metaKey;
      if (e.altKey) return;
      if (ctrlMeta && k !== "Home" && k !== "End") return;

      const rowRid = getRowIdRef.current(row.original);
      if (editModeRef.current === "row") {
        if (rowModeEntryIsEdit(rowModesModelRef.current[String(rowRid)])) {
          /* Tab em modo linha: `onKeyDownCapture` na célula (antes do input). */
          return;
        }
      } else if (
        editingCellRef.current &&
        String(editingCellRef.current.rowId) === String(rowRid)
      ) {
        return;
      }

      const target = e.target as HTMLElement | null;
      if (
        target?.closest?.(
          "[data-hive-edit-root], input, textarea, select, [contenteditable=true]"
        )
      ) {
        return;
      }

      const visibleLeaf = orderedLeafColumns.filter((c) => c.getIsVisible());
      const colIds = visibleLeaf.map((c) => String(c.id));
      if (colIds.length === 0) return;

      const rowIndex = tableRows.findIndex((r2) => r2.id === row.id);
      if (rowIndex < 0 || row.getIsGrouped()) return;

      const ci = colIds.indexOf(field);
      if (ci < 0) return;

      const walkPrev = (from: number) => {
        for (let i = from; i >= 0; i--) {
          const r2 = tableRows[i];
          if (r2 && !r2.getIsGrouped()) return i;
        }
        return -1;
      };
      const walkNext = (from: number) => {
        for (let i = from; i < tableRows.length; i++) {
          const r2 = tableRows[i];
          if (r2 && !r2.getIsGrouped()) return i;
        }
        return -1;
      };

      const dataRowIndices: number[] = [];
      for (let i = 0; i < tableRows.length; i++) {
        if (!tableRows[i].getIsGrouped()) dataRowIndices.push(i);
      }

      const pageStep = () => {
        const el = getScrollContainer();
        const h = el?.clientHeight ?? 0;
        if (h > 0 && rowPx > 0) {
          let usable = h;
          if (useRowVirtualization) {
            const headerRows = table.getHeaderGroups().length;
            const hh = columnHeaderHeightPx ?? 40;
            usable = Math.max(0, h - headerRows * hh);
          }
          return Math.max(1, Math.floor(usable / rowPx));
        }
        const ps = table.getState().pagination.pageSize;
        return Math.max(1, Number.isFinite(ps) && ps > 0 ? ps : 10);
      };

      let nextRowIndex = rowIndex;
      let nextColIndex = ci;
      const lastCol = colIds.length - 1;

      if ((k === "Home" || k === "End") && ctrlMeta) {
        if (dataRowIndices.length === 0) return;
        nextRowIndex = k === "Home" ? dataRowIndices[0]! : dataRowIndices[dataRowIndices.length - 1]!;
      } else {
        const eff = k === "Tab" ? (e.shiftKey ? "ArrowLeft" : "ArrowRight") : k;

        switch (eff) {
        case "ArrowLeft":
          if (ci > 0) nextColIndex = ci - 1;
          else {
            const p = walkPrev(rowIndex - 1);
            if (p >= 0) {
              nextRowIndex = p;
              nextColIndex = lastCol;
            }
          }
          break;
        case "ArrowRight":
          if (ci < lastCol) nextColIndex = ci + 1;
          else {
            const n = walkNext(rowIndex + 1);
            if (n >= 0) {
              nextRowIndex = n;
              nextColIndex = 0;
            }
          }
          break;
        case "ArrowUp": {
          const p = walkPrev(rowIndex - 1);
          if (p >= 0) nextRowIndex = p;
          break;
        }
        case "ArrowDown": {
          const n = walkNext(rowIndex + 1);
          if (n >= 0) nextRowIndex = n;
          break;
        }
        case "Home":
          nextColIndex = 0;
          break;
        case "End":
          nextColIndex = lastCol;
          break;
        case "PageDown": {
          const pos = dataRowIndices.indexOf(rowIndex);
          if (pos < 0) return;
          const step = pageStep();
          const newPos = Math.min(dataRowIndices.length - 1, pos + step);
          nextRowIndex = dataRowIndices[newPos]!;
          break;
        }
        case "PageUp": {
          const pos = dataRowIndices.indexOf(rowIndex);
          if (pos < 0) return;
          const step = pageStep();
          const newPos = Math.max(0, pos - step);
          nextRowIndex = dataRowIndices[newPos]!;
          break;
        }
        default:
          return;
        }
      }

      if (nextRowIndex === rowIndex && nextColIndex === ci) return;

      const nextRow = tableRows[nextRowIndex];
      const nextField = colIds[nextColIndex];
      if (!nextRow || nextRow.getIsGrouped() || !nextField) return;

      e.preventDefault();
      const leafIdx = orderedLeafColumns.findIndex((c) => String(c.id) === nextField);
      if (useRowVirtualization) {
        gridApi.scrollToIndexes({
          rowIndex: nextRowIndex,
          colIndex: leafIdx >= 0 ? leafIdx : undefined
        });
      }
      const rid = getRowId(nextRow.original);
      const { chain } = buildHorizontalScrollRestoreChain(getScrollContainer());
      const scrollSnap = chain.length > 0 ? chain : undefined;
      const runFocus = () =>
        gridApi.setCellFocus({ id: rid, field: nextField, horizontalScrollSnapshots: scrollSnap });
      if (useRowVirtualization) {
        requestAnimationFrame(() => {
          requestAnimationFrame(runFocus);
        });
      } else {
        runFocus();
      }
    },
    [
      tableRows,
      orderedLeafColumns,
      getRowId,
      gridApi,
      useRowVirtualization,
      getScrollContainer,
      rowPx,
      table,
      columnHeaderHeightPx
    ]
  );

  const handleRootPasteCapture = React.useCallback(
    (e: React.ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]")) return;

      const text = e.clipboardData?.getData("text/plain") ?? "";
      const runBuiltin =
        !disableClipboardPaste && Boolean(onRowsChangeRef.current);

      if (!runBuiltin && !onClipboardPasteRef.current) return;

      e.preventDefault();

      const notify = () => onClipboardPasteRef.current?.({ text });

      if (!runBuiltin) {
        notify();
        return;
      }

      const active = document.activeElement as HTMLElement | null;
      const cellEl =
        active?.hasAttribute("data-hive-cell") === true
          ? active
          : (active?.closest("[data-hive-cell]") as HTMLElement | null);
      if (!cellEl) {
        notify();
        return;
      }

      const ridAttr = cellEl.getAttribute("data-row-id");
      const fldAttr = cellEl.getAttribute("data-field");
      if (!ridAttr || !fldAttr) {
        notify();
        return;
      }

      const matrix = parseClipboardTsv(text);
      if (matrix.length === 0) {
        notify();
        return;
      }

      const visibleLeaf = orderedLeafColumns.filter((c) => c.getIsVisible());
      const visibleFields = visibleLeaf.map((c) => String(c.id));
      const columnsByField = new Map<string, GridColDef<R>>();
      for (const c of columnsPropRef.current) {
        columnsByField.set(c.field, c);
      }

      const rowIdDec = decodeURIComponent(ridAttr);
      const startField = decodeURIComponent(fldAttr);
      const startColIndex = visibleFields.indexOf(startField);
      if (startColIndex < 0) {
        notify();
        return;
      }

      const rowIndex = tableRows.findIndex(
        (r2) =>
          !r2.getIsGrouped() && String(getRowIdRef.current(r2.original)) === String(rowIdDec)
      );
      if (rowIndex < 0) {
        notify();
        return;
      }

      const plan = buildClipboardPastePlan({
        matrix,
        tableRows,
        visibleFields,
        columnsByField,
        startRowIndex: rowIndex,
        startColIndex,
        getRowId: getRowIdRef.current
      });

      if (!plan?.updates.length) {
        notify();
        return;
      }

      void (async () => {
        const pru = processRowUpdateRef.current;
        try {
          if (pru) {
            for (const u of plan.updates) {
              const oldRow = rowsRef.current.find(
                (r) => String(getRowIdRef.current(r)) === String(u.id)
              );
              if (!oldRow) continue;
              const entries = Object.entries(u as object).filter(([k]) => k !== "id");
              const newRow = { ...(oldRow as object), ...Object.fromEntries(entries) } as R;
              await Promise.resolve(pru(newRow, oldRow));
            }
          } else {
            onRowsChangeRef.current?.(plan.updates);
          }
        } finally {
          notify();
        }
      })();
    },
    [disableClipboardPaste, orderedLeafColumns, tableRows]
  );

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: (index) => {
      const row = tableRows[index];
      if (getEstimatedRowHeightProp && row && !row.getIsGrouped()) {
        const base = getEstimatedRowHeightProp({
          index,
          row: row.original,
          id: getRowId(row.original),
          densityFactor
        });
        if (typeof base === "number" && Number.isFinite(base)) {
          return Math.max(10, Math.round(base));
        }
      }
      return rowPx;
    },
    overscan: 10,
    enabled: useRowVirtualization && tableRows.length > 0
  });

  const rowVirtualizerRef = React.useRef(rowVirtualizer);
  rowVirtualizerRef.current = rowVirtualizer;

  React.useLayoutEffect(() => {
    if (!useRowVirtualization) return;
    rowVirtualizerRef.current.measure();
  }, [rowPx, density, useRowVirtualization, tableRows.length, getEstimatedRowHeightProp]);

  const colVirtualizerRef = React.useRef(colVirtualizer);
  colVirtualizerRef.current = colVirtualizer;
  /** Sincrono: `rAF` atrasava `measure()` um frame e o cabeçalho/células podiam ficar com `vc.size` stale durante o arrasto. */
  React.useLayoutEffect(() => {
    if (!useColumnVirtualizationEffective) return;
    colVirtualizerRef.current.measure();
  }, [useColumnVirtualizationEffective, columnSizesFingerprint]);

  React.useEffect(() => {
    const el = getScrollContainer();
    if (el) el.scrollTop = 0;
    if (useRowVirtualization) {
      queueMicrotask(() => {
        try {
          rowVirtualizerRef.current.scrollToIndex(0);
        } catch {
          /* montagem do virtualizer */
        }
      });
    }
  }, [paginationModel.page, paginationModel.pageSize, getScrollContainer, useRowVirtualization]);

  apiHolder.current = gridApi;
  if (apiRef) apiRef.current = gridApi;

  const prevRowModesForFocusRef = React.useRef<GridRowModesModel>({});
  /**
   * Cadeia de scroll horizontal (ascendentes desde `[data-hive-cell]` dentro do contentor).
   * Evidência v7: snapshot só a partir de `getScrollContainer()` → `chainLefts [0,0]`; a partir da célula → `[1556,0]`.
   */
  const lastHorizontalScrollChainRef = React.useRef<Array<{ el: HTMLElement; left: number }>>([]);
  const captureHorizontalScrollChainFromRoot = React.useCallback(() => {
    const { chain } = buildHorizontalScrollRestoreChain(getScrollContainer());
    lastHorizontalScrollChainRef.current = chain;
  }, [getScrollContainer]);
  const syncGridScrollRefFromDom = React.useCallback(() => {
    captureHorizontalScrollChainFromRoot();
  }, [captureHorizontalScrollChainFromRoot]);
  React.useEffect(() => {
    const onPointerDownCapture = () => {
      captureHorizontalScrollChainFromRoot();
    };
    document.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => document.removeEventListener("pointerdown", onPointerDownCapture, true);
  }, [captureHorizontalScrollChainFromRoot]);
  /** `useLayoutEffect` + foco síncrono: `useEffect`+`rAF` pintava um frame com a linha em edição antes do `setCellFocus`, causando salto de scroll visível (logs v11: scroll estável após foco). */
  React.useLayoutEffect(() => {
    const prev = prevRowModesForFocusRef.current;
    const t = getTableForApi();
    /** Repor toda a cadeia (incl. ancestral com `scrollLeft` real) antes do foco. */
    if (lastHorizontalScrollChainRef.current.length > 0) {
      restoreHorizontalScrollSnapshots(lastHorizontalScrollChainRef.current);
    }

    const resolveFocusField = (rowIdStr: string, modeEntry: GridRowModeEntry | undefined): string | undefined => {
      if (!rowModeEntryIsEdit(modeEntry)) return undefined;
      const preferred =
        typeof modeEntry === "object" && modeEntry != null && "fieldToFocus" in modeEntry
          ? (modeEntry as { fieldToFocus?: string }).fieldToFocus
          : undefined;

      const row = t
        .getRowModel()
        .flatRows.find(
          (r) => !r.getIsGrouped() && String(getRowIdRef.current(r.original)) === rowIdStr
        );
      if (!row) return undefined;
      const rowRid = getRowIdRef.current(row.original);

      const fieldAllowed = (fid: string): boolean => {
        if (fid === "__select__" || fid === "__detail__" || fid === "__tree__") return false;
        const leaf = orderedLeafColumns.find((c) => String(c.id) === fid);
        if (!leaf || !leaf.getIsVisible()) return false;
        const col = columnsPropRef.current.find((c) => c.field === fid);
        if (!col || col.editable !== true) return false;
        const cp: GridCellParams<R> = {
          id: rowRid,
          field: fid,
          row: row.original,
          value: row.getValue(fid)
        };
        if (col.isCellEditable && !col.isCellEditable(cp)) return false;
        const ig = isCellEditableGridRef.current;
        if (ig && !ig(cp)) return false;
        if (!cellEditorSupported(col)) return false;
        return true;
      };

      if (preferred != null && preferred.trim() !== "" && fieldAllowed(preferred)) {
        return preferred;
      }

      const tried = new Set<string>();
      if (preferred != null && preferred.trim() !== "") tried.add(preferred.trim());
      const candidates = rowEditInitialFieldCandidates ?? [];
      for (const fid of candidates) {
        if (tried.has(fid)) continue;
        tried.add(fid);
        if (fieldAllowed(fid)) return fid;
      }

      let fieldToFocus: string | undefined;
      /** Ordem visual (folhas visíveis), não a ordem do array `columns` em props. */
      for (const leafCol of orderedLeafColumns) {
        if (!leafCol.getIsVisible()) continue;
        const fid = String(leafCol.id);
        if (tried.has(fid)) continue;
        if (!fieldAllowed(fid)) continue;
        fieldToFocus = fid;
        break;
      }
      return fieldToFocus != null && fieldToFocus !== "" ? fieldToFocus : undefined;
    };

    for (const [idStr, entry] of Object.entries(rowModesModel)) {
      if (!rowModeEntryIsEdit(entry)) continue;
      const focusField = resolveFocusField(idStr, entry);
      if (focusField == null || focusField === "") continue;
      const wasEdit = rowModeEntryIsEdit(prev[idStr as GridRowId]);
      const prevEntry = prev[idStr as GridRowId];
      const prevFocusField = wasEdit ? resolveFocusField(idStr, prevEntry) : undefined;
      if (wasEdit && prevFocusField === focusField) continue;
      const scrollSnap = lastHorizontalScrollChainRef.current;
      apiHolder.current?.setCellFocus?.({
        id: idStr as GridRowId,
        field: focusField,
        horizontalScrollSnapshots: scrollSnap.length > 0 ? [...scrollSnap] : undefined
      });
    }
    prevRowModesForFocusRef.current = rowModesModel;
  }, [
    rowModesEditKey,
    orderedLeafColumns,
    getTableForApi,
    getScrollContainer,
    rowEditInitialFieldCandidates
  ]);

  React.useEffect(() => {
    const snap = getStateSnapshotRef.current();
    eventSubscribersRef.current.stateChange?.forEach((fn) => fn(snap));
    onStateChangeRef.current?.(snap);
  }, [
    rowSelectionKey,
    JSON.stringify(sortModel),
    JSON.stringify(filterModel),
    paginationModel.page,
    paginationModel.pageSize,
    JSON.stringify(columnVisibilityModel),
    (pinningResolved.left ?? []).join("\0"),
    (pinningResolved.right ?? []).join("\0"),
    columnOrderResolved.join(","),
    groupingState.join("|"),
    paginationMode,
    JSON.stringify(paginationMeta ?? null),
    density,
    editModeResolved,
    JSON.stringify(rowModesModel),
    JSON.stringify(columnSizing)
  ]);

  React.useEffect(() => {
    const snap = getStateSnapshotRef.current();
    eventSubscribersRef.current.densityChange?.forEach((fn) => fn(snap));
  }, [density]);

  React.useEffect(() => {
    const snap = getStateSnapshotRef.current();
    eventSubscribersRef.current.rowModesModelChange?.forEach((fn) => fn(snap));
  }, [JSON.stringify(rowModesModel)]);

  React.useEffect(() => {
    const snap = getStateSnapshotRef.current();
    eventSubscribersRef.current.rowSelectionChange?.forEach((fn) => fn(snap));
  }, [rowSelectionKey]);

  React.useEffect(() => {
    const snap = getStateSnapshotRef.current();
    eventSubscribersRef.current.filterChange?.forEach((fn) => fn(snap));
  }, [JSON.stringify(filterModel)]);

  React.useEffect(() => {
    const snap = getStateSnapshotRef.current();
    eventSubscribersRef.current.sortChange?.forEach((fn) => fn(snap));
  }, [JSON.stringify(sortModel)]);

  React.useEffect(() => {
    const snap = getStateSnapshotRef.current();
    eventSubscribersRef.current.paginationChange?.forEach((fn) => fn(snap));
  }, [paginationModel.page, paginationModel.pageSize]);

  React.useEffect(() => {
    const snap = getStateSnapshotRef.current();
    eventSubscribersRef.current.columnVisibilityChange?.forEach((fn) => fn(snap));
  }, [JSON.stringify(columnVisibilityModel)]);

  React.useEffect(() => {
    const snap = getStateSnapshotRef.current();
    eventSubscribersRef.current.pinnedColumnsChange?.forEach((fn) => fn(snap));
  }, [(pinningResolved.left ?? []).join("\0"), (pinningResolved.right ?? []).join("\0")]);

  React.useEffect(() => {
    const snap = getStateSnapshotRef.current();
    eventSubscribersRef.current.columnOrderChange?.forEach((fn) => fn(snap));
  }, [columnOrderResolved.join(",")]);

  React.useEffect(() => {
    const snap = getStateSnapshotRef.current();
    eventSubscribersRef.current.rowGroupingModelChange?.forEach((fn) => fn(snap));
  }, [groupingState.join("|")]);

  React.useEffect(() => {
    const snap = getStateSnapshotRef.current();
    eventSubscribersRef.current.columnSizingChange?.forEach((fn) => fn(snap));
  }, [JSON.stringify(columnSizing)]);

  React.useEffect(() => {
    if (!preferencesKey || !prefsHydratedRef.current) return;
    const storage = preferencesStorageProp ?? (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage) return;
    const payload: Omit<PersistedGridPreferences, "v"> = {};
    if (sortModelProp === undefined) payload.sortModel = sortModel;
    if (filterModelProp === undefined) payload.filterModel = filterModel;
    if (paginationModelProp === undefined) payload.paginationModel = paginationModel;
    if (columnVisibilityProp === undefined) payload.columnVisibilityModel = columnVisibilityModel;
    if (pinnedColumnsProp === undefined) payload.pinnedColumns = pinningResolved;
    if (densityProp === undefined) payload.density = density;
    payload.columnOrder = [...columnOrderResolved];
    payload.columnSizing = pickPersistableColumnSizing(columnSizing);
    if (rowGroupingModelProp === undefined && !treeActive) payload.rowGroupingModel = [...groupingState];
    const t = window.setTimeout(() => {
      writeGridPreferencesToStorage(preferencesKey, payload, storage);
      const readBack = readGridPreferencesFromStorage(preferencesKey, storage);
      if (readBack) onPreferencesChangeRef.current?.(readBack);
    }, preferencesDebounceMs);
    return () => clearTimeout(t);
  }, [
    preferencesKey,
    preferencesDebounceMs,
    preferencesStorageProp,
    JSON.stringify(sortModel),
    JSON.stringify(filterModel),
    paginationModel.page,
    paginationModel.pageSize,
    JSON.stringify(columnVisibilityModel),
    JSON.stringify(pinningResolved),
    sortModelProp,
    filterModelProp,
    paginationModelProp,
    columnVisibilityProp,
    pinnedColumnsProp,
    density,
    densityProp,
    columnOrderResolved.join(","),
    groupingState.join("|"),
    rowGroupingModelProp,
    treeActive,
    JSON.stringify(columnSizing)
  ]);

  React.useEffect(() => {
    if (!onRowsScrollEnd) return;
    const thresholdPx = scrollEndThreshold ?? 200;
    let raf = 0;
    let attempts = 0;
    let detach: (() => void) | undefined;
    const tryAttach = () => {
      const el = getScrollContainer();
      if (!el) {
        if (attempts++ < 120) raf = requestAnimationFrame(tryAttach);
        return;
      }
      let armed = false;
      const onScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = el;
        const dist = scrollHeight - scrollTop - clientHeight;
        if (dist <= thresholdPx) {
          if (!armed) {
            armed = true;
            onRowsScrollEnd();
          }
        } else {
          armed = false;
        }
      };
      el.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      detach = () => el.removeEventListener("scroll", onScroll);
    };
    tryAttach();
    return () => {
      cancelAnimationFrame(raf);
      detach?.();
    };
  }, [getScrollContainer, onRowsScrollEnd, scrollEndThreshold, useRowVirtualization, tableRows.length]);

  const apiClipboardRef = React.useRef(gridApi);
  apiClipboardRef.current = gridApi;
  const pointerInsideGridRef = React.useRef(false);

  React.useEffect(() => {
    if (disableClipboardCopy || !showSelectColumn) return;
    const onKey = (e: KeyboardEvent) => {
      if (!pointerInsideGridRef.current) return;
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "c") return;
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("input, textarea, select, [contenteditable=true]")) return;
      const selectedText = window.getSelection()?.toString() ?? "";
      if (selectedText.trim() !== "") return;
      e.preventDefault();
      void apiClipboardRef.current.copySelectedRowsToClipboard();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSelectColumn, disableClipboardCopy]);

  const onDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = columnOrderResolved.indexOf(String(active.id));
      const newIndex = columnOrderResolved.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(columnOrderResolved, oldIndex, newIndex);
      setColumnOrder(next);
      const field = String(active.id);
      const params: GridColumnOrderChangeParams = {
        column: { field },
        targetIndex: newIndex,
        oldIndex
      };
      onColumnOrderChangeRef.current?.(params);
    },
    [columnOrderResolved]
  );

  const Toolbar = slots?.toolbar;
  const LoadingOverlaySlot = slots?.loadingOverlay;
  const NoRowsOverlaySlot = slots?.noRowsOverlay;
  const FooterSlot = slots?.footer;
  const PaginationSlot = slots?.pagination;
  const FilterPanelSlot = slots?.filterPanel ?? GridFilterPanel;
  /** `className` vai para o contentor; o resto deve ir para o componente da toolbar (não para o `div`). */
  const toolbarSlotProps = slotProps?.toolbar ?? {};
  const { className: toolbarWrapperClass, ...toolbarComponentProps } = toolbarSlotProps;
  const loadingOverlayDivProps = slotProps?.loadingOverlay ?? {};
  const { className: loadingOverlayWrapperClass, ...loadingOverlayForwarded } = loadingOverlayDivProps;
  const noRowsOverlayDivProps = slotProps?.noRowsOverlay ?? {};
  const { className: noRowsOverlayWrapperClass, ...noRowsOverlayForwarded } = noRowsOverlayDivProps;

  const pageSizeSelectOptions = React.useMemo(() => {
    const set = new Set(pageSizeOptions);
    set.add(paginationModel.pageSize);
    return [...set].sort((a, b) => a - b);
  }, [pageSizeOptions, paginationModel.pageSize]);

  const commitFilterModel = React.useCallback(
    (next: GridFilterModel) => {
      resetPaginationToFirstPage();
      if (filterModelPropRef.current === undefined) setFilterInternal(next);
      onFilterModelChangeRef.current?.(next);
    },
    [resetPaginationToFirstPage]
  );

  const lt = (key: keyof GridLocaleText, fallback: string) => localeText?.[key] ?? fallback;

  const [accessibilityAnnouncement, setAccessibilityAnnouncement] = React.useState("");
  const a11yAnnounceInitialSkipRef = React.useRef(true);
  const sortAnnounceSigRef = React.useRef("");
  const filterAnnounceSigRef = React.useRef("");

  React.useEffect(() => {
    if (disableAccessibilityAnnouncements) return;
    const sortSig = JSON.stringify(sortModel);
    const filterSig = JSON.stringify(filterModel);
    if (a11yAnnounceInitialSkipRef.current) {
      a11yAnnounceInitialSkipRef.current = false;
      sortAnnounceSigRef.current = sortSig;
      filterAnnounceSigRef.current = filterSig;
      return;
    }
    const parts: string[] = [];
    if (sortSig !== sortAnnounceSigRef.current) {
      sortAnnounceSigRef.current = sortSig;
      parts.push(announceTextForSortModel(sortModel, columnsPropRef.current, lt));
    }
    if (filterSig !== filterAnnounceSigRef.current) {
      filterAnnounceSigRef.current = filterSig;
      parts.push(announceTextForFilterModel(filterModel, lt));
    }
    if (parts.length === 0) return;
    const text = parts.join(" ");
    const t = window.setTimeout(() => {
      setAccessibilityAnnouncement(text);
    }, 200);
    return () => window.clearTimeout(t);
  }, [
    disableAccessibilityAnnouncements,
    JSON.stringify(sortModel),
    JSON.stringify(filterModel),
    JSON.stringify(localeText ?? null)
  ]);

  const paginationSlotPayload: GridPaginationSlotProps<R> = React.useMemo(() => {
    const selTable = table.getFilteredSelectedRowModel().rows.length;
    const sel = selectedRowCountForFooter(rowSelectionModelProp, rowCount) ?? selTable;
    const st = table.getState().pagination;
    const pageReportText = lt("pageReport", "Página {current} de {total}")
      .replace("{current}", String(st.pageIndex + 1))
      .replace("{total}", String(table.getPageCount() || 1));
    const selectedRowsReportText =
      !hideFooterSelectedRowCount && sel > 0
        ? lt("selectedRowsReport", "{count} selecionada(s) · ").replace("{count}", String(sel))
        : null;
    return {
      api: gridApi,
      paginationModel,
      pageCount: Math.max(1, table.getPageCount()),
      pageSizeOptions: pageSizeSelectOptions,
      canPreviousPage: table.getCanPreviousPage(),
      canNextPage: table.getCanNextPage(),
      selectedRowCount: sel,
      hideSelectionCount: !!hideFooterSelectedRowCount,
      pageReportText,
      selectedRowsReportText,
      rowsPerPageLabel: lt("rowsPerPage", "Linhas por página"),
      goFirst: () => table.setPageIndex(0),
      goPrev: () => table.previousPage(),
      goNext: () => table.nextPage(),
      goLast: () => table.setPageIndex(Math.max(0, table.getPageCount() - 1)),
      setPageSize: (pageSize: number) => {
        if (!Number.isFinite(pageSize) || pageSize <= 0) return;
        const pm: GridPaginationModel = { page: 0, pageSize };
        if (paginationModelPropRef.current === undefined) setPaginationInternal(pm);
        onPaginationModelChangeRef.current?.(pm);
      },
      rowCountTotal: rowCount != null && rowCount >= 0 ? rowCount : null,
      paginationMeta
    };
  }, [
    gridApi,
    paginationModel.page,
    paginationModel.pageSize,
    paginationMeta,
    rowCount,
    rowSelectionModelProp,
    pageSizeSelectOptions,
    hideFooterSelectedRowCount,
    paginationModelProp,
    JSON.stringify(localeText ?? null),
    table,
    table.getState().pagination.pageIndex,
    table.getState().pagination.pageSize,
    table.getPageCount(),
    table.getCanPreviousPage(),
    table.getCanNextPage(),
    rowSelectionKey
  ]);

  const defaultFooterSelectedCount =
    selectedRowCountForFooter(rowSelectionModelProp, rowCount) ??
    table.getFilteredSelectedRowModel().rows.length;

  const buildColumnHeaderParts = (header: Header<R, unknown>) => {
    const id = header.column.id;
    const colDef = columnsProp.find((c) => c.field === id);
    const showMenu =
      !disableColumnMenu &&
      id !== "__select__" &&
      id !== "__detail__" &&
      id !== "__tree__" &&
      colDef?.disableColumnMenu !== true;
    const canPinUi = header.column.getCanPin() && !disableColumnPinning;
    const ha = colDef?.headerAlign ?? colDef?.align;
    const alignHead = alignTextClass(ha);
    const justifyHead = headerJustifyClass(ha);
    const canSortClient = sortingMode === "client" && header.column.getCanSort();
    const canColumnFilterUi =
      !disableColumnFilter &&
      filterMode === "client" &&
      colDef?.filterable !== false &&
      colDef?.type !== "actions" &&
      id !== "__select__" &&
      id !== "__detail__" &&
      id !== "__tree__";
    const fieldStr = String(id);
    const hasColumnFilter = (filterModel.items ?? []).some((i) => i.field === fieldStr);
    const description = colDef?.description?.trim();

    const sortLabel = (
      <span className="flex min-w-0 flex-1 items-center gap-1">
        <span className={cn("min-w-0 flex-1 truncate whitespace-nowrap", alignHead)}>
          {flexRender(header.column.columnDef.header, header.getContext())}
        </span>
        {header.column.getIsSorted() === "asc" && (
          <ArrowUpIcon className="h-3 w-3 shrink-0 text-hiveGrid-headerMuted" />
        )}
        {header.column.getIsSorted() === "desc" && (
          <ArrowDownIcon className="h-3 w-3 shrink-0 text-hiveGrid-headerMuted" />
        )}
      </span>
    );

    const wrapHeaderDescription = (node: React.ReactElement) =>
      description ? (
        <Tooltip>
          <TooltipTrigger asChild>{node}</TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-sm text-pretty">
            {description}
          </TooltipContent>
        </Tooltip>
      ) : (
        node
      );

    const sortControl = canSortClient
      ? wrapHeaderDescription(
          <button
            type="button"
            className={cn(
              "flex min-w-0 w-full max-w-full flex-1 items-center gap-1 overflow-hidden font-normal text-hiveGrid-headerMuted",
              alignHead,
              justifyHead
            )}
            onClick={(e) => {
              onColumnHeaderClick?.({ field: fieldStr, colDef, api: gridApi }, e);
              if (!e.defaultPrevented) {
                header.column.getToggleSortingHandler()?.(e);
              }
            }}
          >
            {sortLabel}
          </button>
        )
      : wrapHeaderDescription(
          <div
            className={cn(
              "flex min-w-0 w-full max-w-full flex-1 items-center gap-1 overflow-hidden font-normal text-hiveGrid-headerMuted",
              alignHead,
              justifyHead
            )}
            onClick={(e) => onColumnHeaderClick?.({ field: fieldStr, colDef, api: gridApi }, e)}
          >
            <span className="min-w-0 flex-1 truncate whitespace-nowrap">
              {flexRender(header.column.columnDef.header, header.getContext())}
            </span>
          </div>
        );

    const menu =
      showMenu &&
      (canColumnFilterUi ||
        canPinUi ||
        (sortingMode === "client" && header.column.getCanSort()) ||
        header.column.getCanHide()) ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "shrink-0 rounded-sm border-0 bg-transparent p-0 text-inherit shadow-none ring-0",
                "opacity-0 transition-[opacity,background-color,color] group-hover/header:opacity-100 data-[state=open]:opacity-100",
                "hover:bg-foreground/10 hover:text-inherit focus-visible:ring-0 focus-visible:ring-offset-0",
                "data-[state=open]:bg-foreground/10 data-[state=open]:text-inherit",
                "[&_svg]:text-current",
                density === "compact" ? "h-[15px] w-[15px] min-h-0 min-w-0" : "h-7 w-7"
              )}
              type="button"
              aria-label={lt("columnMenu", "Menu da coluna")}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <EllipsisVerticalIcon className="h-3 w-3 shrink-0 text-current opacity-90 group-hover/header:opacity-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuLabel className="truncate font-normal text-xs text-hiveGrid-headerMuted">
              {colDef?.headerName ?? fieldStr}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sortingMode === "client" && header.column.getCanSort() ? (
              <>
                <DropdownMenuItem onClick={() => header.column.toggleSorting(false)}>
                  {lt("sortAscending", "Ordenar ascendente")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => header.column.toggleSorting(true)}>
                  {lt("sortDescending", "Ordenar descendente")}
                </DropdownMenuItem>
                {header.column.getIsSorted() ? (
                  <DropdownMenuItem onClick={() => header.column.clearSorting()}>
                    {lt("clearSort", "Limpar ordenação")}
                  </DropdownMenuItem>
                ) : null}
                {canPinUi || header.column.getCanHide() || canColumnFilterUi ? (
                  <DropdownMenuSeparator />
                ) : null}
              </>
            ) : null}
            {canColumnFilterUi ? (
              <>
                <DropdownMenuItem onSelect={() => setColumnFilterField(fieldStr)}>
                  {lt("filterByColumn", "Filtrar…")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    commitFilterModel({
                      ...filterModel,
                      items: [
                        ...(filterModel.items ?? []).filter((i) => i.field !== fieldStr),
                        { field: fieldStr, operator: "isEmpty" }
                      ]
                    })
                  }
                >
                  {lt("filterMenuOnlyEmpty", "Só vazios")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    commitFilterModel({
                      ...filterModel,
                      items: [
                        ...(filterModel.items ?? []).filter((i) => i.field !== fieldStr),
                        { field: fieldStr, operator: "isNotEmpty" }
                      ]
                    })
                  }
                >
                  {lt("filterMenuOnlyNonEmpty", "Só não vazios")}
                </DropdownMenuItem>
                {hasColumnFilter ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      commitFilterModel({
                        ...filterModel,
                        items: (filterModel.items ?? []).filter((i) => i.field !== fieldStr)
                      })
                    }
                  >
                    {lt("columnFilterClearField", "Limpar filtro desta coluna")}
                  </DropdownMenuItem>
                ) : null}
              </>
            ) : null}
            {canColumnFilterUi &&
            (canPinUi || (sortingMode === "client" && header.column.getCanSort()) || header.column.getCanHide()) ? (
              <DropdownMenuSeparator />
            ) : null}
            {canPinUi ? (
              <>
                <DropdownMenuItem onClick={() => header.column.pin("left")}>
                  {lt("pinLeft", "Fixar à esquerda")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => header.column.pin("right")}>
                  {lt("pinRight", "Fixar à direita")}
                </DropdownMenuItem>
                {header.column.getIsPinned() ? (
                  <DropdownMenuItem onClick={() => header.column.pin(false)}>
                    {lt("unpinColumn", "Soltar coluna")}
                  </DropdownMenuItem>
                ) : null}
                {header.column.getCanHide() ? <DropdownMenuSeparator /> : null}
              </>
            ) : null}
            {header.column.getCanHide() ? (
              <DropdownMenuItem onClick={() => header.column.toggleVisibility(false)}>
                {lt("hideColumn", "Ocultar coluna")}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null;

    /**
     * O separador não pode ser só `absolute`: o bloco `flex-1` do título/menu cobre toda a célula e
     * rouba os eventos de ponteiro. Colocá-lo como irmão flex (`shrink-0`) mantém a área clicável.
     */
    const resize =
      !disableColumnResize && header.column.getCanResize() ? (
        <div
          data-hive-column-resize=""
          role="separator"
          aria-orientation="vertical"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scheduleColumnResizeHeaderCooldown();
            header.getResizeHandler()(e);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            scheduleColumnResizeHeaderCooldown();
            header.getResizeHandler()(e);
          }}
          className={cn(
            "pointer-events-auto relative z-[80] box-border flex w-[10px] min-w-[10px] max-w-[10px] shrink-0 touch-none select-none items-center justify-center self-stretch",
            header.column.getIsResizing() && "z-[90]"
          )}
          style={{ touchAction: "none", cursor: "col-resize" }}
        >
          <span
            className={cn(
              "block shrink-0 rounded-full opacity-0 transition-opacity duration-150 group-hover/header-strip:opacity-100",
              header.column.getIsResizing() && "!opacity-100"
            )}
            style={{
              width: "2px",
              height: "16px",
              marginLeft: "3px",
              marginRight: "3px",
              backgroundColor: header.column.getIsResizing()
                ? "hsl(var(--primary))"
                : "hsl(var(--muted-foreground) / 0.65)"
            }}
            aria-hidden
          />
        </div>
      ) : null;

    return {
      justifyHead,
      centerChild: (
        <>
          {sortControl}
          {menu}
        </>
      ),
      resize
    };
  };

  const renderColumnHeaderInner = (header: Header<R, unknown>) => {
    const p = buildColumnHeaderParts(header);
    return (
      <div className="relative flex w-full min-w-0 flex-1 items-stretch overflow-visible">
        <div className={cn("relative z-0 flex min-w-0 min-h-0 flex-1 items-center gap-0.5", p.justifyHead)}>
          {p.centerChild}
        </div>
        {p.resize}
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={400}>
    <GridRootProvider value={gridRootContextValue}>
    <div
      data-density={density}
      className={cn(
        "hive-data-grid w-full space-y-2",
        density === "compact" && "hive-density-compact",
        density === "comfortable" && "hive-density-comfortable",
        className
      )}
      style={{ ...mergeRowPresentationStyle(rowPresentation), ...style }}
      onPointerEnter={() => {
        pointerInsideGridRef.current = true;
      }}
      onPointerLeave={() => {
        pointerInsideGridRef.current = false;
      }}
      onPasteCapture={handleRootPasteCapture}
    >
      {!disableAccessibilityAnnouncements ? (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {accessibilityAnnouncement}
        </div>
      ) : null}
      <div
        className={cn(
          "flex flex-col gap-2 pb-0.5",
          stickyToolbar && "sticky top-0 z-10 bg-background"
        )}
        data-hive-grid-chrome
      >
      {Toolbar != null ? (
        <div className={cn("flex min-h-8 flex-wrap items-center gap-1.5 pb-0.5", toolbarWrapperClass)}>
          {React.isValidElement(Toolbar)
            ? React.cloneElement(
                Toolbar,
                toolbarComponentProps as unknown as Partial<unknown> & React.Attributes
              )
            : React.createElement(
                Toolbar as React.ComponentType<Record<string, unknown>>,
                toolbarComponentProps as Record<string, unknown>
              )}
        </div>
      ) : null}

      {!hideBuiltInFilterAndColumnsRow ? (
        <GridToolbarFilterColumnsDensityRow
          quickFilterRef={quickFilterInputRef}
          quickFilterPlaceholder={lt("filterPlaceholder", "Filtrar…")}
          showColumnsButton={!disableColumnSelector}
          showFilterButton={!disableColumnFilter && filterMode === "client"}
          showDensitySelector={!disableDensitySelector}
          showQuickFilter={!disableColumnFilter && filterMode === "client"}
        />
      ) : null}

      {children != null && children !== false && (
        <div className="min-w-0 [&:empty]:hidden">{children}</div>
      )}
      </div>

      <div className="relative w-full min-w-0 rounded-md">
        {loading ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-hiveGrid-loadingOverlayBg text-sm text-hiveGrid-loadingOverlayFg",
              loadingOverlayWrapperClass
            )}
            {...loadingOverlayForwarded}
          >
            {/* Só o conteúdo do overlay recebe clique; scroll/redimensionar cabeçalho passam à grelha. */}
            <div className="pointer-events-auto">
              {LoadingOverlaySlot ? (
                React.createElement(LoadingOverlaySlot, loadingOverlayDivProps as Record<string, unknown>)
              ) : (
                lt("loadingLabel", "A carregar…")
              )}
            </div>
          </div>
        ) : null}

        <ColumnReorderOptional
          active={!disableColumnReorder && sortableHeaderIds.length > 0}
          onDragEnd={onDragEnd}
        >
          {!useRowVirtualization ? (
            <NonVirtualGridBody
              autoHeight={!!autoHeight}
              autoHeightMaxHeight={autoHeightMaxHeight}
              scrollRef={scrollAreaRootRef}
              onViewportScrollSync={syncGridScrollRefFromDom}
            >
              <Table
                ref={nonVirtualTableDomRef}
                role="grid"
                className={cn(
                  "w-auto max-w-none [&_tbody>tr]:border-hiveGrid-chromeBorder [&_thead>tr]:border-hiveGrid-chromeBorder"
                )}
                style={{
                  tableLayout: "fixed",
                  width:
                    showRowEditActionsEffective
                      ? table.getTotalSize() + 160
                      : table.getTotalSize()
                }}
                aria-busy={loading ? true : undefined}
                aria-multiselectable={ariaMultiSelectable ? true : undefined}
                aria-rowcount={gridAriaCounts.ariaRowCount}
                aria-colcount={gridAriaCounts.ariaColCount}
                aria-label={lt("gridAriaLabel", "Grelha de dados")}
              >
                <TableHeader className="group/header-strip">
                  {table.getHeaderGroups().map((hg, hi) => (
                    <TableRow
                      key={hg.id}
                      role="row"
                      aria-rowindex={hi + 1}
                      style={
                        columnHeaderHeightPx != null
                          ? { height: columnHeaderHeightPx }
                          : undefined
                      }
                    >
                      <HeaderSortableWrap
                        bypass={disableColumnReorder || sortableHeaderIds.length === 0}
                        items={sortableHeaderIds}
                      >
                        {getOrderedLeafHeaders(table).map((header, hci) => {
                          const id = header.column.id;
                          const pinStyle = getPinnedStickyStyle(header.column, table, "header");
                          const canDrag = leafHeaderIsDraggable(header, columnsProp, disableColumnReorder);
                          const colDef = columnsProp.find((c) => c.field === id);
                          const ha = colDef?.headerAlign ?? colDef?.align;
                          const headerExtraClass =
                            colDef != null
                              ? resolveHeaderExtraClassName(colDef, {
                                  field: String(id),
                                  colDef,
                                  api: gridApi
                                })
                              : undefined;
                          if (canDrag) {
                            const parts = buildColumnHeaderParts(header);
                            return (
                              <DraggableHeaderCell
                                key={id}
                                id={String(id)}
                                disabled={false}
                                pinStyle={pinStyle}
                                columnWidth={header.column.getSize()}
                                ariaColIndex={hci + 1}
                                fixedHeaderHeight={columnHeaderHeightPx}
                                reorderAriaLabel={lt("columnReorderAria", "Reordenar coluna")}
                                justifyHeadClassName={parts.justifyHead}
                                centerColumnHeader={parts.centerChild}
                                resizeSlot={parts.resize}
                                className={cn(
                                  hci > 0 && cn("relative", HEADER_COL_DIVIDER_CLASS),
                                  "font-normal text-hiveGrid-headerMuted",
                                  alignTextClass(ha),
                                  headerExtraClass,
                                  headerCellDensityPaddingClass(density, {
                                    tight: isIconLikeTableColumn(String(id), colDef)
                                  })
                                )}
                              />
                            );
                          }
                          const inner = renderColumnHeaderInner(header);
                          return (
                            <TableHead
                              key={id}
                              style={{ width: header.column.getSize(), ...pinStyle }}
                              role="columnheader"
                              aria-colindex={hci + 1}
                              className={cn(
                                "group/header relative overflow-visible min-h-0 font-normal text-hiveGrid-headerMuted",
                                hci > 0 && HEADER_COL_DIVIDER_CLASS,
                                columnHeaderHeightPx != null && "h-full align-middle",
                                alignTextClass(ha),
                                headerExtraClass,
                                headerCellDensityPaddingClass(density, {
                                  tight: isIconLikeTableColumn(String(id), colDef)
                                })
                              )}
                            >
                              {inner}
                            </TableHead>
                          );
                        })}
                      </HeaderSortableWrap>
                      {showRowEditActionsEffective ? (
                        <TableHead
                          role="columnheader"
                          aria-colindex={orderedLeafColumns.length + 1}
                          className={cn(
                            "group/header relative w-[min(160px,14vw)] text-right font-normal text-hiveGrid-headerMuted",
                            columnHeaderHeightPx != null && "h-full align-middle",
                            headerCellDensityPaddingClass(density, { tight: true })
                          )}
                          style={
                            columnHeaderHeightPx != null
                              ? { height: columnHeaderHeightPx }
                              : undefined
                          }
                        >
                          <span className="text-sm font-normal">
                            {lt("rowEditActionsColumnHeader", "Ações")}
                          </span>
                        </TableHead>
                      ) : null}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {tableRows.length === 0 && !loading ? (
                    NoRowsOverlaySlot ? (
                      <TableRow role="row" aria-rowindex={gridAriaCounts.headerRowCount + 1}>
                        <TableCell
                          colSpan={leafColumnCountWithRowEdit}
                          role="gridcell"
                          aria-colindex={1}
                          aria-colspan={gridAriaCounts.ariaColCount}
                          className={cn("p-0 align-middle", noRowsOverlayWrapperClass)}
                          {...noRowsOverlayForwarded}
                        >
                          {React.createElement(
                            NoRowsOverlaySlot,
                            noRowsOverlayDivProps as Record<string, unknown>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow role="row" aria-rowindex={gridAriaCounts.headerRowCount + 1}>
                        <TableCell
                          colSpan={leafColumnCountWithRowEdit}
                          role="gridcell"
                          aria-colindex={1}
                          aria-colspan={gridAriaCounts.ariaColCount}
                          className="h-24 text-center text-hiveGrid-headerMuted"
                        >
                          {lt("noRowsLabel", "Sem resultados.")}
                        </TableCell>
                      </TableRow>
                    )
                  ) : tableRows.length > 0 ? (
                    tableRows.map((row, ri) => {
                      const rowId = getRowId(row.original);
                      const api = apiHolder.current;
                      const detailParams: GridDetailPanelParams<R> | null =
                        api && detailActive && !row.getIsGrouped()
                          ? { id: rowId, row: row.original, api }
                          : null;
                      const panelMinH =
                        detailParams && getDetailPanelHeight
                          ? getDetailPanelHeight(detailParams)
                          : undefined;
                      const rowInEditMode =
                        !row.getIsGrouped() && rowModeEntryIsEdit(rowModesModel[String(rowId)]);
                      return (
                        <React.Fragment key={row.id}>
                          <TableRow
                            role="row"
                            aria-rowindex={gridAriaCounts.headerRowCount + ri + 1}
                            {...rowAriaLabelProps(row)}
                            data-hive-table-row="grid"
                            data-state={row.getIsSelected() && "selected"}
                            data-hive-row-edit={rowInEditMode ? "true" : undefined}
                            style={{ height: rowPx, boxSizing: "border-box" }}
                            className={cn(
                              "hive-data-grid-row transition-colors",
                              rowInEditMode && "hive-data-grid-row--editing",
                              rowSelectionFocusId != null &&
                                String(rowSelectionFocusId) === String(rowId) &&
                                "ring-1 ring-inset ring-primary/35 dark:ring-primary/45",
                              getRowClassNameRef.current?.({
                                id: rowId,
                                row: row.original,
                                indexRelativeToCurrentPage: ri
                              })
                            )}
                            onClick={(e) => {
                              if (isDataCellInteractiveTarget(e.target)) return;
                              if (row.getIsGrouped()) return;
                              applyImplicitRowSelectionFromRowClick(row, e);
                              onRowClick?.({ id: rowId, row: row.original });
                            }}
                            onDoubleClick={(e) => {
                              if (isDataCellInteractiveTarget(e.target)) return;
                              if (row.getIsGrouped()) return;
                              onRowDoubleClick?.({ id: rowId, row: row.original });
                            }}
                          >
                            {[
                              ...row.getLeftVisibleCells(),
                              ...row.getCenterVisibleCells(),
                              ...row.getRightVisibleCells()
                            ].map((cell, cci) => {
                              const gridColDef = (
                                cell.column.columnDef.meta as {
                                  gridColDef?: GridColDef<R> & { align?: GridAlignment };
                                }
                              )?.gridColDef;
                              const pinStyle = getPinnedStickyStyle(cell.column, table, "body");
                              const cellParams: GridCellParams<R> = {
                                id: rowId,
                                field: String(cell.column.id),
                                row: row.original,
                                value: cell.getValue()
                              };
                              const cellClassExtra = resolveCellClassNames(
                                gridColDef,
                                cellParams,
                                getCellClassNameRef.current
                              );
                              const fieldStr = String(cell.column.id);
                              const skipTruncateCol =
                                fieldStr === "__select__" ||
                                fieldStr === "__detail__" ||
                                fieldStr === "__tree__" ||
                                gridColDef?.type === "actions" ||
                                gridColDef?.getActions != null;
                              const showsBodyCellEditor =
                                !row.getIsGrouped() &&
                                bodyCellShowsActiveEditor(
                                  row,
                                  fieldStr,
                                  getRowId,
                                  editModeResolved,
                                  rowModesModel,
                                  editingCell,
                                  gridColDef,
                                  isCellEditableGridRef.current ?? undefined,
                                  !!(processRowUpdate || onRowsChange)
                                );
                              const truncateView =
                                !row.getIsGrouped() &&
                                !skipTruncateCol &&
                                !showsBodyCellEditor;
                              const bodyCellInnerOpts: BodyCellInnerOpts<R> = {
                                groupingActive,
                                density,
                                localeText,
                                editMode: editModeResolved,
                                rowModesModel,
                                editing: editingCell,
                                getRowId,
                                processRowUpdate,
                                onExitEdit,
                                onCancelRowEdit: cancelRowEdit,
                                getApi: () => apiHolder.current,
                                isCellEditableGrid: isCellEditableGridRef.current ?? undefined,
                                onRowEditDraftCommit: applyRowEditDraft,
                                beginAsyncCellCommit,
                                endAsyncCellCommit,
                                allColumnDefs: columnsProp,
                                rowEditCellPropsBagRef,
                                getRowEditDraftSlice,
                                scheduleRowEditDraftSync
                              };
                              return (
                                <TableCell
                                  key={cell.id}
                                  role="gridcell"
                                  aria-colindex={cci + 1}
                                  style={{
                                    width: cell.column.getSize(),
                                    ...pinStyle
                                  }}
                                  className={cn(
                                    fieldStr === "__select__"
                                      ? "text-center"
                                      : alignTextClass(gridColDef?.align),
                                    !row.getIsGrouped() &&
                                      "outline-none focus-visible:ring-2 focus-visible:ring-hiveGrid-cellFocusRing focus-visible:ring-offset-1 focus-visible:ring-offset-hiveGrid-cellFocusRingOffset",
                                    !row.getIsGrouped() &&
                                      bodyCellDensityPaddingClass(density, {
                                        tight: isIconLikeTableColumn(fieldStr, gridColDef)
                                      }),
                                    truncateView && "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
                                    showsBodyCellEditor && "min-h-0 overflow-hidden",
                                    cellClassExtra
                                  )}
                                  {...(!row.getIsGrouped()
                                    ? {
                                        "data-hive-cell": "",
                                        "data-row-id": encodeURIComponent(String(rowId)),
                                        "data-field": encodeURIComponent(String(cell.column.id)),
                                        tabIndex: -1
                                      }
                                    : {})}
                                  onKeyDownCapture={
                                    !row.getIsGrouped() &&
                                    editModeResolved === "row" &&
                                    rowModeEntryIsEdit(rowModesModel[String(rowId)])
                                      ? (e) => {
                                          if (
                                            e.key === "Tab" &&
                                            rowEditTabNavigate(e, row, String(cell.column.id))
                                          ) {
                                            e.stopPropagation();
                                          }
                                        }
                                      : undefined
                                  }
                                  onClick={(e) => {
                                    if (row.getIsGrouped()) return;
                                    if (isDataCellInteractiveTarget(e.target)) return;
                                    onCellClick?.({
                                      id: rowId,
                                      field: String(cell.column.id),
                                      row: row.original,
                                      value: cell.getValue()
                                    });
                                  }}
                                  onDoubleClick={(e) => {
                                    if (row.getIsGrouped()) return;
                                    if (isDataCellInteractiveTarget(e.target)) return;
                                    onCellDoubleClick?.({
                                      id: rowId,
                                      field: String(cell.column.id),
                                      row: row.original,
                                      value: cell.getValue()
                                    });
                                    if (tryStartCellEdit(row, String(cell.column.id), e)) {
                                      e.stopPropagation();
                                    }
                                  }}
                                  onKeyDown={
                                    !row.getIsGrouped()
                                      ? (e) => {
                                          const p = {
                                            id: rowId,
                                            field: String(cell.column.id),
                                            row: row.original,
                                            value: cell.getValue()
                                          };
                                          onCellKeyDown?.(p, e);
                                          if (!e.defaultPrevented) {
                                            navigateCellFromKeys(e, row, String(cell.column.id));
                                          }
                                        }
                                      : undefined
                                  }
                                >
                                  {row.getIsGrouped() ? (
                                    renderBodyCellInner(cell, bodyCellInnerOpts)
                                  ) : (
                                    <div
                                      className={cn(
                                        "flex min-h-0 w-full min-w-0 px-[3px]",
                                        truncateView
                                          ? "flex-row items-center"
                                          : "flex-col justify-center",
                                        truncateView && "min-w-0 max-w-full overflow-hidden",
                                        bodyCellIconCrossAxisClass(fieldStr, gridColDef)
                                      )}
                                      style={bodyCellContentBoxStyle(rowPx, showsBodyCellEditor)}
                                    >
                                      {truncateView ? (
                                        <div className="min-h-0 min-w-0 w-full max-w-full flex-1 truncate leading-normal">
                                          {renderBodyCellInner(cell, bodyCellInnerOpts)}
                                        </div>
                                      ) : (
                                        renderBodyCellInner(cell, bodyCellInnerOpts)
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                              );
                            })}
                            {showRowEditActionsEffective ? (
                              <TableCell
                                role="gridcell"
                                aria-colindex={orderedLeafColumns.length + 1}
                                className={cn("align-middle", bodyCellDensityPaddingClass(density, { tight: true }))}
                                data-hive-row-edit-actions=""
                                onPointerDown={(e) => e.stopPropagation()}
                              >
                                <div
                                  className="flex min-h-0 w-full items-center justify-end"
                                  style={bodyCellContentBoxStyle(
                                    rowPx,
                                    !row.getIsGrouped() &&
                                      rowModeEntryIsEdit(rowModesModel[String(rowId)])
                                  )}
                                >
                                  {!row.getIsGrouped() &&
                                  rowModeEntryIsEdit(rowModesModel[String(rowId)]) ? (
                                    <RowEditActionsComponent
                                      api={apiHolder.current}
                                      id={rowId}
                                      row={row.original}
                                      saveRowEdit={(ev) => {
                                        void completeRowEditSave(rowId, ev);
                                      }}
                                      cancelRowEdit={(ev) => cancelRowEdit(rowId, ev)}
                                      lt={lt}
                                    />
                                  ) : null}
                                </div>
                              </TableCell>
                            ) : null}
                          </TableRow>
                          {detailActive &&
                          row.getIsExpanded() &&
                          detailParams &&
                          getDetailPanelContent ? (
                            <TableRow role="row" className="border-b border-hiveGrid-chromeBorder">
                              <TableCell
                                colSpan={leafColumnCountWithRowEdit}
                                role="gridcell"
                                aria-colindex={1}
                                aria-colspan={gridAriaCounts.ariaColCount}
                                className="bg-hiveGrid-detailBg p-3 align-top"
                                style={
                                  panelMinH != null && panelMinH > 0
                                    ? { minHeight: panelMinH }
                                    : undefined
                                }
                              >
                                {getDetailPanelContent(detailParams)}
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </React.Fragment>
                      );
                    })
                  ) : null}
                </TableBody>
                {aggregationFooterVisible ? (
                  <TableFooter
                    aria-label={lt("aggregationFooterAria", "Linha de agregação")}
                    className="border-t border-hiveGrid-chromeBorder bg-hiveGrid-aggregationRow"
                  >
                    {table.getFooterGroups().map((footerGroup) => (
                      <TableRow
                        key={footerGroup.id}
                        role="row"
                        aria-rowindex={gridAriaCounts.ariaRowCount}
                      >
                        {footerGroup.headers.map((header, hci) => {
                          const pinStyle = getPinnedStickyStyle(header.column, table, "header");
                          const colDef = columnsProp.find((c) => c.field === header.column.id);
                          const ha = colDef?.headerAlign ?? colDef?.align;
                          return (
                            <TableCell
                              key={header.id}
                              role="gridcell"
                              aria-colindex={hci + 1}
                              style={{ width: header.column.getSize(), ...pinStyle }}
                              className={cn("text-hiveGrid-aggregationFg", alignTextClass(ha))}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.footer,
                                    header.getContext()
                                  )}
                            </TableCell>
                          );
                        })}
                        {showRowEditActionsEffective ? (
                          <TableCell
                            role="gridcell"
                            aria-colindex={orderedLeafColumns.length + 1}
                            className="text-hiveGrid-aggregationFg"
                          />
                        ) : null}
                      </TableRow>
                    ))}
                  </TableFooter>
                ) : null}
              </Table>
            </NonVirtualGridBody>
          ) : (
            <div
              ref={scrollParentRef}
              data-hive-grid-scroll
              className="max-h-[min(70vh,560px)] w-full min-w-0 overflow-auto"
              onScroll={() => syncGridScrollRefFromDom()}
              onWheel={() => {
                requestAnimationFrame(() => syncGridScrollRefFromDom());
              }}
              role="grid"
              aria-busy={loading ? true : undefined}
              aria-multiselectable={ariaMultiSelectable ? true : undefined}
              aria-rowcount={gridAriaCounts.ariaRowCount}
              aria-colcount={gridAriaCounts.ariaColCount}
              aria-label={lt("gridAriaLabel", "Grelha de dados")}
            >
              {table.getHeaderGroups().map((hg, hi) => (
                <div
                  key={hg.id}
                  data-hive-header-row=""
                  role="row"
                  aria-rowindex={hi + 1}
                  className={
                    useColumnVirtualizationEffective
                      ? "group/header-strip relative w-full min-w-max border-b border-hiveGrid-chromeBorder bg-hiveGrid-virtualHeaderRow"
                      : "group/header-strip grid w-full min-w-max border-b border-hiveGrid-chromeBorder bg-hiveGrid-virtualHeaderRow"
                  }
                  style={
                    useColumnVirtualizationEffective
                      ? {
                          position: "relative",
                          width: colVirtualizer.getTotalSize(),
                          minHeight: columnHeaderHeightPx ?? 40,
                          height: columnHeaderHeightPx ?? undefined
                        }
                      : {
                          gridTemplateColumns: gridTemplateColumnsRowEdit,
                          ...(columnHeaderHeightPx != null
                            ? { minHeight: columnHeaderHeightPx }
                            : {})
                        }
                  }
                >
                  {useColumnVirtualizationEffective ? (
                    <>
                      {colVirtualizer.getVirtualItems().map((vc) => {
                        const header = leafHeadersOrdered[vc.index];
                        if (!header) return null;
                        const id = header.column.id;
                        const hci = vc.index;
                        const pinStyle = getPinnedStickyStyle(header.column, table, "header");
                        const inner = renderColumnHeaderInner(header);
                        const colDef = columnsProp.find((c) => c.field === id);
                        const ha = colDef?.headerAlign ?? colDef?.align;
                        const headerExtraClassVirt =
                          colDef != null
                            ? resolveHeaderExtraClassName(colDef, {
                                field: String(id),
                                colDef,
                                api: gridApi
                              })
                            : undefined;
                        return (
                          <div
                            key={String(id)}
                            role="columnheader"
                            aria-colindex={hci + 1}
                            style={{
                              position: "absolute",
                              left: vc.start,
                              width: vc.size,
                              top: 0,
                              height: columnHeaderHeightPx ?? "100%",
                              ...pinStyle
                            }}
                            className={cn(
                              "group/header relative flex items-center border-b border-hiveGrid-chromeBorder bg-hiveGrid-headerCell text-sm font-normal text-hiveGrid-headerMuted",
                              hci > 0 && HEADER_COL_DIVIDER_CLASS,
                              columnHeaderHeightPx == null && "min-h-[40px]",
                              alignTextClass(ha),
                              headerExtraClassVirt,
                              headerCellDensityPaddingClass(density, {
                                tight: isIconLikeTableColumn(String(id), colDef)
                              })
                            )}
                          >
                            {inner}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
                  <HeaderSortableWrap
                    bypass={disableColumnReorder || sortableHeaderIds.length === 0}
                    items={sortableHeaderIds}
                  >
                    {getOrderedLeafHeaders(table).map((header, hci) => {
                      const id = header.column.id;
                      const pinStyle = getPinnedStickyStyle(header.column, table, "header");
                      const canDrag = leafHeaderIsDraggable(header, columnsProp, disableColumnReorder);
                      const colDef = columnsProp.find((c) => c.field === id);
                      const ha = colDef?.headerAlign ?? colDef?.align;
                      const headerExtraClassVirt =
                        colDef != null
                          ? resolveHeaderExtraClassName(colDef, {
                              field: String(id),
                              colDef,
                              api: gridApi
                            })
                          : undefined;
                      if (canDrag) {
                        const parts = buildColumnHeaderParts(header);
                        return (
                          <DraggableHeaderCell
                            key={id}
                            id={String(id)}
                            disabled={false}
                            layout="grid"
                            pinStyle={pinStyle}
                            ariaColIndex={hci + 1}
                            fixedHeaderHeight={columnHeaderHeightPx}
                            reorderAriaLabel={lt("columnReorderAria", "Reordenar coluna")}
                            justifyHeadClassName={parts.justifyHead}
                            centerColumnHeader={parts.centerChild}
                            resizeSlot={parts.resize}
                            className={cn(
                              hci > 0 && cn("relative", HEADER_COL_DIVIDER_CLASS),
                              "font-normal",
                              alignTextClass(ha),
                              headerExtraClassVirt,
                              headerCellDensityPaddingClass(density, {
                                tight: isIconLikeTableColumn(String(id), colDef)
                              })
                            )}
                          />
                        );
                      }
                      const inner = renderColumnHeaderInner(header);
                      return (
                        <div
                          key={id}
                          role="columnheader"
                          aria-colindex={hci + 1}
                          style={{
                            ...pinStyle,
                            ...(columnHeaderHeightPx != null
                              ? {
                                  minHeight: columnHeaderHeightPx,
                                  height: columnHeaderHeightPx
                                }
                              : {})
                          }}
                          className={cn(
                            "group/header relative flex items-center border-b border-hiveGrid-chromeBorder bg-hiveGrid-headerCell text-sm font-normal text-hiveGrid-headerMuted",
                            hci > 0 && HEADER_COL_DIVIDER_CLASS,
                            columnHeaderHeightPx == null && "min-h-[40px]",
                            alignTextClass(ha),
                            headerExtraClassVirt,
                            headerCellDensityPaddingClass(density, {
                              tight: isIconLikeTableColumn(String(id), colDef)
                            })
                          )}
                        >
                          {inner}
                        </div>
                      );
                    })}
                  </HeaderSortableWrap>
                  {showRowEditActionsEffective ? (
                    <div
                      role="columnheader"
                      aria-colindex={orderedLeafColumns.length + 1}
                      className={cn(
                        "relative flex items-center justify-end border-b border-hiveGrid-chromeBorder bg-hiveGrid-headerCell px-2 text-sm font-normal text-hiveGrid-headerMuted",
                        columnHeaderHeightPx == null && "min-h-[40px]"
                      )}
                      style={
                        columnHeaderHeightPx != null
                          ? { minHeight: columnHeaderHeightPx, height: columnHeaderHeightPx }
                          : undefined
                      }
                    >
                      {lt("rowEditActionsColumnHeader", "Ações")}
                    </div>
                  ) : null}
                    </>
                  )}
                </div>
              ))}
              {tableRows.length === 0 && !loading ? (
                NoRowsOverlaySlot ? (
                  <div
                    className={cn(
                      "flex min-h-24 items-center justify-center text-sm text-hiveGrid-headerMuted",
                      noRowsOverlayWrapperClass
                    )}
                    {...noRowsOverlayForwarded}
                  >
                    {React.createElement(
                      NoRowsOverlaySlot,
                      noRowsOverlayDivProps as Record<string, unknown>
                    )}
                  </div>
                ) : (
                  <div className="flex h-24 items-center justify-center text-sm text-hiveGrid-headerMuted">
                    {lt("noRowsLabel", "Sem resultados.")}
                  </div>
                )
              ) : tableRows.length > 0 ? (
                <div className="relative w-full" style={{ height: rowVirtualizer.getTotalSize() }}>
                  {rowVirtualizer.getVirtualItems().map((vRow) => {
                    const row = tableRows[vRow.index];
                    if (!row) return null;
                    const rowDataId = getRowId(row.original);
                    const vRowInEdit =
                      !row.getIsGrouped() && rowModeEntryIsEdit(rowModesModel[String(rowDataId)]);
                    return (
                      <div
                        key={row.id}
                        role="row"
                        aria-rowindex={gridAriaCounts.headerRowCount + vRow.index + 1}
                        {...rowAriaLabelProps(row)}
                        className={cn(
                          "hive-data-grid-row transition-colors",
                          useColumnVirtualizationEffective
                            ? "absolute left-0 top-0 w-full border-b border-hiveGrid-chromeBorder bg-hiveGrid-pinRowBg text-hiveGrid-pinRowFg"
                            : "absolute left-0 top-0 grid w-full border-b border-hiveGrid-chromeBorder bg-hiveGrid-pinRowBg text-hiveGrid-pinRowFg",
                          vRowInEdit && "hive-data-grid-row--editing",
                          rowSelectionFocusId != null &&
                            String(rowSelectionFocusId) === String(rowDataId) &&
                            "ring-1 ring-inset ring-primary/35 dark:ring-primary/45",
                          getRowClassNameRef.current?.({
                            id: rowDataId,
                            row: row.original,
                            indexRelativeToCurrentPage: vRow.index
                          })
                        )}
                        data-state={row.getIsSelected() && "selected"}
                        data-hive-row-edit={vRowInEdit ? "true" : undefined}
                        data-index={vRow.index}
                        ref={enableVariableRowHeight ? rowVirtualizer.measureElement : undefined}
                        style={{
                          height: vRow.size,
                          transform: `translateY(${vRow.start}px)`,
                          ...(useColumnVirtualizationEffective
                            ? {
                                width: colVirtualizer.getTotalSize(),
                                position: "relative" as const
                              }
                            : { gridTemplateColumns: gridTemplateColumnsRowEdit })
                        }}
                        onClick={(e) => {
                          if (isDataCellInteractiveTarget(e.target)) return;
                          if (row.getIsGrouped()) return;
                          applyImplicitRowSelectionFromRowClick(row, e);
                          onRowClick?.({ id: getRowId(row.original), row: row.original });
                        }}
                        onDoubleClick={(e) => {
                          if (isDataCellInteractiveTarget(e.target)) return;
                          if (row.getIsGrouped()) return;
                          onRowDoubleClick?.({ id: getRowId(row.original), row: row.original });
                        }}
                      >
                        {(useColumnVirtualizationEffective
                          ? colVirtualizer.getVirtualItems().map((vc) => {
                              const col = orderedLeafColumns[vc.index];
                              if (!col) return null;
                              const cell = row
                                .getVisibleCells()
                                .find((c) => String(c.column.id) === String(col.id));
                              if (!cell) return null;
                              const cci = vc.index;
                              const gridColDef = (
                                cell.column.columnDef.meta as {
                                  gridColDef?: GridColDef<R> & { align?: GridAlignment };
                                }
                              )?.gridColDef;
                              const vRowId = getRowId(row.original);
                              const cellParamsVirt: GridCellParams<R> = {
                                id: vRowId,
                                field: String(cell.column.id),
                                row: row.original,
                                value: cell.getValue()
                              };
                              const cellClassExtraVirt = resolveCellClassNames(
                                gridColDef,
                                cellParamsVirt,
                                getCellClassNameRef.current
                              );
                              const fieldStrV = String(cell.column.id);
                              const skipTruncV =
                                fieldStrV === "__select__" ||
                                fieldStrV === "__detail__" ||
                                fieldStrV === "__tree__" ||
                                gridColDef?.type === "actions" ||
                                gridColDef?.getActions != null;
                              const truncateVirt =
                                !row.getIsGrouped() &&
                                !skipTruncV &&
                                !bodyCellShowsActiveEditor(
                                  row,
                                  fieldStrV,
                                  getRowId,
                                  editModeResolved,
                                  rowModesModel,
                                  editingCell,
                                  gridColDef,
                                  isCellEditableGridRef.current ?? undefined,
                                  !!(processRowUpdate || onRowsChange)
                                );
                              return (
                                <div
                                  key={cell.id}
                                  role="gridcell"
                                  aria-colindex={cci + 1}
                                  style={{
                                    position: "absolute",
                                    left: vc.start,
                                    width: vc.size,
                                    top: 0,
                                    height: "100%"
                                  }}
                                  className={cn(
                                    "flex min-h-0 min-w-0 items-center px-[3px]",
                                    !row.getIsGrouped() &&
                                      bodyCellDensityPaddingClass(density, {
                                        tight: isIconLikeTableColumn(fieldStrV, gridColDef)
                                      }),
                                    fieldStrV === "__select__" || gridColDef?.type === "boolean"
                                      ? fieldStrV === "__select__"
                                        ? "justify-center text-center"
                                        : gridColDef?.align === "right"
                                          ? "justify-end text-right"
                                          : gridColDef?.align === "left"
                                            ? "justify-start text-left"
                                            : "justify-center text-center"
                                      : alignTextClass(gridColDef?.align),
                                    !row.getIsGrouped() &&
                                      "outline-none focus-visible:ring-2 focus-visible:ring-hiveGrid-cellFocusRing focus-visible:ring-offset-1 focus-visible:ring-offset-hiveGrid-cellFocusRingOffset",
                                    truncateVirt && "overflow-hidden text-ellipsis whitespace-nowrap",
                                    cellClassExtraVirt
                                  )}
                                  {...(!row.getIsGrouped()
                                    ? {
                                        "data-hive-cell": "",
                                        "data-row-id": encodeURIComponent(String(getRowId(row.original))),
                                        "data-field": encodeURIComponent(String(cell.column.id)),
                                        tabIndex: -1
                                      }
                                    : {})}
                                  onKeyDownCapture={
                                    !row.getIsGrouped() &&
                                    editModeResolved === "row" &&
                                    rowModeEntryIsEdit(rowModesModel[String(getRowId(row.original))])
                                      ? (e) => {
                                          if (
                                            e.key === "Tab" &&
                                            rowEditTabNavigate(e, row, String(cell.column.id))
                                          ) {
                                            e.stopPropagation();
                                          }
                                        }
                                      : undefined
                                  }
                                  onClick={(e) => {
                                    if (row.getIsGrouped()) return;
                                    if (isDataCellInteractiveTarget(e.target)) return;
                                    onCellClick?.({
                                      id: getRowId(row.original),
                                      field: String(cell.column.id),
                                      row: row.original,
                                      value: cell.getValue()
                                    });
                                  }}
                                  onDoubleClick={(e) => {
                                    if (row.getIsGrouped()) return;
                                    if (isDataCellInteractiveTarget(e.target)) return;
                                    onCellDoubleClick?.({
                                      id: getRowId(row.original),
                                      field: String(cell.column.id),
                                      row: row.original,
                                      value: cell.getValue()
                                    });
                                    if (tryStartCellEdit(row, String(cell.column.id), e)) {
                                      e.stopPropagation();
                                    }
                                  }}
                                  onKeyDown={
                                    !row.getIsGrouped()
                                      ? (e) => {
                                          const p = {
                                            id: getRowId(row.original),
                                            field: String(cell.column.id),
                                            row: row.original,
                                            value: cell.getValue()
                                          };
                                          onCellKeyDown?.(p, e);
                                          if (!e.defaultPrevented) {
                                            navigateCellFromKeys(e, row, String(cell.column.id));
                                          }
                                        }
                                        : undefined
                                  }
                                >
                                  {truncateVirt ? (
                                    <div className="min-h-0 min-w-0 w-full max-w-full flex-1 truncate leading-normal">
                                      {renderBodyCellInner(cell, {
                                        groupingActive,
                                        density,
                                        localeText,
                                        editMode: editModeResolved,
                                        rowModesModel,
                                        editing: editingCell,
                                        getRowId,
                                        processRowUpdate,
                                        onExitEdit,
                                        onCancelRowEdit: cancelRowEdit,
                                        getApi: () => apiHolder.current,
                                        isCellEditableGrid: isCellEditableGridRef.current ?? undefined,
                                        onRowEditDraftCommit: applyRowEditDraft,
                                        beginAsyncCellCommit,
                                        endAsyncCellCommit,
                                        allColumnDefs: columnsProp,
                                        rowEditCellPropsBagRef,
                                        getRowEditDraftSlice,
                                        scheduleRowEditDraftSync
                                      })}
                                    </div>
                                  ) : (
                                    renderBodyCellInner(cell, {
                                      groupingActive,
                                      density,
                                      localeText,
                                      editMode: editModeResolved,
                                      rowModesModel,
                                      editing: editingCell,
                                      getRowId,
                                      processRowUpdate,
                                      onExitEdit,
                                      onCancelRowEdit: cancelRowEdit,
                                      getApi: () => apiHolder.current,
                                      isCellEditableGrid: isCellEditableGridRef.current ?? undefined,
                                      onRowEditDraftCommit: applyRowEditDraft,
                                      beginAsyncCellCommit,
                                      endAsyncCellCommit,
                                      allColumnDefs: columnsProp,
                                      rowEditCellPropsBagRef,
                                      getRowEditDraftSlice,
                                      scheduleRowEditDraftSync
                                    })
                                  )}
                                </div>
                              );
                            })
                          : (
                              <>
                                {[
                                  ...row.getLeftVisibleCells(),
                                  ...row.getCenterVisibleCells(),
                                  ...row.getRightVisibleCells()
                                ].map((cell, cci) => {
                                const gridColDef = (
                                  cell.column.columnDef.meta as {
                                    gridColDef?: GridColDef<R> & { align?: GridAlignment };
                                  }
                                )?.gridColDef;
                                const pinStyle = getPinnedStickyStyle(cell.column, table, "body");
                                const vRowId = getRowId(row.original);
                                const cellParamsVirt: GridCellParams<R> = {
                                  id: vRowId,
                                  field: String(cell.column.id),
                                  row: row.original,
                                  value: cell.getValue()
                                };
                                const cellClassExtraVirt = resolveCellClassNames(
                                  gridColDef,
                                  cellParamsVirt,
                                  getCellClassNameRef.current
                                );
                                const fieldStrG = String(cell.column.id);
                                const skipTruncG =
                                  fieldStrG === "__select__" ||
                                  fieldStrG === "__detail__" ||
                                  fieldStrG === "__tree__" ||
                                  gridColDef?.type === "actions" ||
                                  gridColDef?.getActions != null;
                                const truncateVirtG =
                                  !row.getIsGrouped() &&
                                  !skipTruncG &&
                                  !bodyCellShowsActiveEditor(
                                    row,
                                    fieldStrG,
                                    getRowId,
                                    editModeResolved,
                                    rowModesModel,
                                    editingCell,
                                    gridColDef,
                                    isCellEditableGridRef.current ?? undefined,
                                    !!(processRowUpdate || onRowsChange)
                                  );
                                return (
                                  <div
                                    key={cell.id}
                                    role="gridcell"
                                    aria-colindex={cci + 1}
                                    style={pinStyle}
                                    className={cn(
                                      "flex min-h-0 min-w-0 items-center px-[3px]",
                                      !row.getIsGrouped() &&
                                        bodyCellDensityPaddingClass(density, {
                                          tight: isIconLikeTableColumn(fieldStrG, gridColDef)
                                        }),
                                      fieldStrG === "__select__" || gridColDef?.type === "boolean"
                                        ? fieldStrG === "__select__"
                                          ? "justify-center text-center"
                                          : gridColDef?.align === "right"
                                            ? "justify-end text-right"
                                            : gridColDef?.align === "left"
                                              ? "justify-start text-left"
                                              : "justify-center text-center"
                                        : alignTextClass(gridColDef?.align),
                                      !row.getIsGrouped() &&
                                        "outline-none focus-visible:ring-2 focus-visible:ring-hiveGrid-cellFocusRing focus-visible:ring-offset-1 focus-visible:ring-offset-hiveGrid-cellFocusRingOffset",
                                      truncateVirtG && "overflow-hidden text-ellipsis whitespace-nowrap",
                                      cellClassExtraVirt
                                    )}
                                    {...(!row.getIsGrouped()
                                      ? {
                                          "data-hive-cell": "",
                                          "data-row-id": encodeURIComponent(String(getRowId(row.original))),
                                          "data-field": encodeURIComponent(String(cell.column.id)),
                                          tabIndex: -1
                                        }
                                      : {})}
                                    onKeyDownCapture={
                                      !row.getIsGrouped() &&
                                      editModeResolved === "row" &&
                                      rowModeEntryIsEdit(rowModesModel[String(getRowId(row.original))])
                                        ? (e) => {
                                            if (
                                              e.key === "Tab" &&
                                              rowEditTabNavigate(e, row, String(cell.column.id))
                                            ) {
                                              e.stopPropagation();
                                            }
                                          }
                                        : undefined
                                    }
                                    onClick={(e) => {
                                      if (row.getIsGrouped()) return;
                                      if (isDataCellInteractiveTarget(e.target)) return;
                                      onCellClick?.({
                                        id: getRowId(row.original),
                                        field: String(cell.column.id),
                                        row: row.original,
                                        value: cell.getValue()
                                      });
                                    }}
                                    onDoubleClick={(e) => {
                                      if (row.getIsGrouped()) return;
                                      if (isDataCellInteractiveTarget(e.target)) return;
                                      onCellDoubleClick?.({
                                        id: getRowId(row.original),
                                        field: String(cell.column.id),
                                        row: row.original,
                                        value: cell.getValue()
                                      });
                                      if (tryStartCellEdit(row, String(cell.column.id), e)) {
                                        e.stopPropagation();
                                      }
                                    }}
                                    onKeyDown={
                                      !row.getIsGrouped()
                                        ? (e) => {
                                            const p = {
                                              id: getRowId(row.original),
                                              field: String(cell.column.id),
                                              row: row.original,
                                              value: cell.getValue()
                                            };
                                            onCellKeyDown?.(p, e);
                                            if (!e.defaultPrevented) {
                                              navigateCellFromKeys(e, row, String(cell.column.id));
                                            }
                                          }
                                        : undefined
                                    }
                                  >
                                    {truncateVirtG ? (
                                      <div className="min-h-0 min-w-0 w-full max-w-full flex-1 truncate leading-normal">
                                        {renderBodyCellInner(cell, {
                                          groupingActive,
                                          density,
                                          localeText,
                                          editMode: editModeResolved,
                                          rowModesModel,
                                          editing: editingCell,
                                          getRowId,
                                          processRowUpdate,
                                          onExitEdit,
                                          onCancelRowEdit: cancelRowEdit,
                                          getApi: () => apiHolder.current,
                                          isCellEditableGrid: isCellEditableGridRef.current ?? undefined,
                                          onRowEditDraftCommit: applyRowEditDraft,
                                          beginAsyncCellCommit,
                                          endAsyncCellCommit,
                                          allColumnDefs: columnsProp,
                                          rowEditCellPropsBagRef,
                                          getRowEditDraftSlice,
                                          scheduleRowEditDraftSync
                                        })}
                                      </div>
                                    ) : (
                                      renderBodyCellInner(cell, {
                                        groupingActive,
                                        density,
                                        localeText,
                                        editMode: editModeResolved,
                                        rowModesModel,
                                        editing: editingCell,
                                        getRowId,
                                        processRowUpdate,
                                        onExitEdit,
                                        onCancelRowEdit: cancelRowEdit,
                                        getApi: () => apiHolder.current,
                                        isCellEditableGrid: isCellEditableGridRef.current ?? undefined,
                                        onRowEditDraftCommit: applyRowEditDraft,
                                        beginAsyncCellCommit,
                                        endAsyncCellCommit,
                                        allColumnDefs: columnsProp,
                                        rowEditCellPropsBagRef,
                                        getRowEditDraftSlice,
                                        scheduleRowEditDraftSync
                                      })
                                    )}
                                  </div>
                                );
                              })}
                                {showRowEditActionsEffective ? (
                                  <div
                                    key="__hive-row-edit__"
                                    role="gridcell"
                                    aria-colindex={orderedLeafColumns.length + 1}
                                    className={cn(
                                      "flex min-w-0 items-center justify-end",
                                      bodyCellDensityPaddingClass(density, { tight: true })
                                    )}
                                    data-hive-row-edit-actions=""
                                    onPointerDown={(e) => e.stopPropagation()}
                                  >
                                    {!row.getIsGrouped() &&
                                    rowModeEntryIsEdit(rowModesModel[String(getRowId(row.original))]) ? (
                                      <RowEditActionsComponent
                                        api={apiHolder.current}
                                        id={getRowId(row.original)}
                                        row={row.original}
                                        saveRowEdit={(ev) => {
                                          void completeRowEditSave(getRowId(row.original), ev);
                                        }}
                                        cancelRowEdit={(ev) => cancelRowEdit(getRowId(row.original), ev)}
                                        lt={lt}
                                      />
                                    ) : null}
                                  </div>
                                ) : null}
                              </>
                            ))}
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {useRowVirtualization && aggregationFooterVisible ? (
                <>
                  {table.getFooterGroups().map((footerGroup) => (
                    <div
                      key={footerGroup.id}
                      role="row"
                      aria-rowindex={gridAriaCounts.ariaRowCount}
                      aria-label={lt("aggregationFooterAria", "Linha de agregação")}
                      className={
                        useColumnVirtualizationEffective
                          ? "relative w-full min-w-max border-t border-hiveGrid-chromeBorder bg-hiveGrid-aggregationRow text-sm text-hiveGrid-aggregationFg"
                          : "grid w-full min-w-max border-t border-hiveGrid-chromeBorder bg-hiveGrid-aggregationRow text-sm text-hiveGrid-aggregationFg"
                      }
                      style={
                        useColumnVirtualizationEffective
                          ? {
                              position: "relative",
                              width: colVirtualizer.getTotalSize(),
                              minHeight: 40
                            }
                          : { gridTemplateColumns: gridTemplateColumnsRowEdit }
                      }
                    >
                      {useColumnVirtualizationEffective
                        ? colVirtualizer.getVirtualItems().map((vc) => {
                            const header = leafHeadersOrdered[vc.index];
                            if (!header) return null;
                            const hci = vc.index;
                            const colDef = columnsProp.find((c) => c.field === header.column.id);
                            const ha = colDef?.headerAlign ?? colDef?.align;
                            return (
                              <div
                                key={header.id}
                                role="gridcell"
                                aria-colindex={hci + 1}
                                style={{
                                  position: "absolute",
                                  left: vc.start,
                                  width: vc.size,
                                  top: 0,
                                  height: "100%"
                                }}
                                className={cn(
                                  "flex min-h-10 min-w-0 items-center px-2 py-2",
                                  alignTextClass(ha)
                                )}
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.footer, header.getContext())}
                              </div>
                            );
                          })
                        : (
                            <>
                              {footerGroup.headers.map((header, hci) => {
                                const pinStyle = getPinnedStickyStyle(header.column, table, "header");
                                const colDef = columnsProp.find((c) => c.field === header.column.id);
                                const ha = colDef?.headerAlign ?? colDef?.align;
                                return (
                                  <div
                                    key={header.id}
                                    role="gridcell"
                                    aria-colindex={hci + 1}
                                    style={pinStyle}
                                    className={cn(
                                      "flex min-h-10 min-w-0 items-center px-2 py-2",
                                      alignTextClass(ha)
                                    )}
                                  >
                                    {header.isPlaceholder
                                      ? null
                                      : flexRender(
                                          header.column.columnDef.footer,
                                          header.getContext()
                                        )}
                                  </div>
                                );
                              })}
                              {showRowEditActionsEffective ? (
                                <div
                                  role="gridcell"
                                  aria-colindex={orderedLeafColumns.length + 1}
                                  className="flex min-h-10 min-w-0 items-center px-2 py-2"
                                />
                              ) : null}
                            </>
                          )}
                    </div>
                  ))}
                </>
              ) : null}
            </div>
          )}
        </ColumnReorderOptional>
        {FooterSlot ? (
          <div className="border-t border-hiveGrid-chromeBorder bg-hiveGrid-footerSlot px-2 py-2">
            {React.createElement(FooterSlot, {
              api: gridApi,
              ...(slotProps?.footer ?? {})
            } as unknown as GridFooterSlotProps<R>)}
          </div>
        ) : null}
      </div>

      {pagination &&
        !hideFooter &&
        !hideFooterPagination &&
        (paginationMode === "client" || paginationMode === "server") &&
        (PaginationSlot ? (
          <div className="px-1 py-1">
            {React.createElement(PaginationSlot, {
              ...paginationSlotPayload,
              ...(slotProps?.pagination ?? {})
            } as unknown as GridPaginationSlotProps<R>)}
          </div>
        ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-hiveGrid-headerMuted">
          <div>
            {!hideFooterSelectedRowCount && defaultFooterSelectedCount > 0 && (
              <span>
                {lt("selectedRowsReport", "{count} selecionada(s) · ").replace(
                  "{count}",
                  String(defaultFooterSelectedCount)
                )}
              </span>
            )}
            {lt("pageReport", "Página {current} de {total}")
              .replace("{current}", String(table.getState().pagination.pageIndex + 1))
              .replace("{total}", String(table.getPageCount() || 1))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="hidden whitespace-nowrap sm:inline">
                {lt("rowsPerPage", "Linhas por página")}
              </span>
              <select
                className="h-8 w-[4.5rem] rounded-md border border-hiveGrid-paginationInputBorder bg-hiveGrid-paginationInputBg px-2 text-sm shadow-sm ring-offset-hiveGrid-paginationRingOffset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hiveGrid-paginationRing"
                value={String(paginationModel.pageSize)}
                aria-label={lt("rowsPerPage", "Linhas por página")}
                onChange={(e) => {
                  const pageSize = Number(e.target.value);
                  if (!Number.isFinite(pageSize) || pageSize <= 0) return;
                  hiveTableproObserve("paginationFooter", "native_select_page_size", { pageSize });
                  const pm: GridPaginationModel = { page: 0, pageSize };
                  if (paginationModelPropRef.current === undefined) setPaginationInternal(pm);
                  onPaginationModelChangeRef.current?.(pm);
                }}
              >
                {pageSizeSelectOptions.map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                {"<<"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                {"<"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {">"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(Math.max(0, table.getPageCount() - 1))}
                disabled={!table.getCanNextPage()}
              >
                {">>"}
              </Button>
            </div>
          </div>
        </div>
        ))}
      {!disableColumnFilter && filterMode === "client" ? (
        <FilterPanelSlot
          api={gridApi}
          open={filterPanelOpen}
          onOpenChange={setFilterPanelOpen}
          filterModel={filterModel}
          columns={columnsProp}
          onCommit={commitFilterModel}
          onEditColumnFilter={(field) => {
            setFilterPanelOpen(false);
            setColumnFilterField(field);
          }}
          lt={lt}
          {...(slotProps?.filterPanel ?? {})}
          anchorRef={filterPanelAnchorRef}
        />
      ) : null}
      {!disableColumnSelector ? (
        <GridColumnsPanel<R>
          open={columnsMenuOpen}
          onOpenChange={setColumnsMenuOpen}
          anchorRef={columnsPanelAnchorRef}
          getTable={getTableForApi}
          lt={lt}
        />
      ) : null}
      <ColumnFilterDialog<R>
        open={columnFilterField != null}
        onOpenChange={(open) => {
          if (!open) setColumnFilterField(null);
        }}
        field={columnFilterField ?? ""}
        headerName={
          columnFilterField != null
            ? columnsProp.find((c) => c.field === columnFilterField)?.headerName ?? columnFilterField
            : ""
        }
        colDef={columnsProp.find((c) => c.field === columnFilterField)}
        filterModel={filterModel}
        onCommit={commitFilterModel}
        lt={lt}
      />
    </div>
    </GridRootProvider>
    </TooltipProvider>
  );
}

export const DataGridPro = DataGrid;
export const DataGridPremium = DataGrid;
