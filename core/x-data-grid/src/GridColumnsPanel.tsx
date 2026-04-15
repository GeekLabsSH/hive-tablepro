import * as React from "react";
import { createPortal } from "react-dom";
import type { Column, Table as TanstackTable } from "@tanstack/react-table";
import { Button } from "../../../src/components/ui/button";
import { Checkbox } from "../../../src/components/ui/checkbox";
import { Input } from "../../../src/components/ui/input";
import { cn } from "../../../src/lib/utils";
import type { GridColDef, GridLocaleText, GridValidRowModel } from "./types";

function useColumnsPanelPosition(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null> | undefined
): { top: number; left: number; width: number } | null {
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  React.useLayoutEffect(() => {
    if (!open || typeof window === "undefined") {
      setPos(null);
      return;
    }
    const update = () => {
      const el = anchorRef?.current;
      const w = 320;
      if (el) {
        const r = el.getBoundingClientRect();
        setPos({
          top: r.bottom + 4,
          left: Math.min(r.left, window.innerWidth - w - 8),
          width: w
        });
      } else {
        setPos({
          top: 72,
          left: (window.innerWidth - w) / 2,
          width: w
        });
      }
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  return pos;
}

const INTERNAL_COL_IDS = new Set(["__select__", "__detail__", "__tree__"]);

function columnLabel<R extends GridValidRowModel>(col: Column<R, unknown>): string {
  const def = col.columnDef.meta as { gridColDef?: GridColDef<R> } | undefined;
  const name = def?.gridColDef?.headerName;
  return (typeof name === "string" && name.trim() !== "" ? name : String(col.id)) as string;
}

export type GridColumnsPanelProps<R extends GridValidRowModel = GridValidRowModel> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  getTable: () => TanstackTable<R>;
  lt: (key: keyof GridLocaleText, fallback: string) => string;
};

/**
 * Painel de visibilidade de colunas (popover fixo), alinhado ao seletor MUI X (pesquisa + toggles + ocultar/mostrar todos).
 */
export function GridColumnsPanel<R extends GridValidRowModel>(props: GridColumnsPanelProps<R>) {
  const { open, onOpenChange, anchorRef, getTable, lt } = props;
  const [q, setQ] = React.useState("");
  const pos = useColumnsPanelPosition(open, anchorRef);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (panelRef.current && t instanceof Node && !panelRef.current.contains(t)) {
        const a = anchorRef?.current;
        if (a && t instanceof Node && a.contains(t)) return;
        onOpenChange(false);
      }
    };
    const id = window.setTimeout(() => window.addEventListener("pointerdown", onPointerDown, true), 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open, onOpenChange, anchorRef]);

  const table = open ? getTable() : null;
  const toggleable = React.useMemo(() => {
    if (!table) return [];
    const needle = q.trim().toLowerCase();
    return table
      .getAllLeafColumns()
      .filter((c) => !INTERNAL_COL_IDS.has(String(c.id)))
      .filter((c) => c.getCanHide())
      .filter((c) => {
        if (!needle) return true;
        return columnLabel(c).toLowerCase().includes(needle);
      });
  }, [table, q]);

  const hideAll = () => {
    if (!table) return;
    for (const c of table.getAllLeafColumns()) {
      if (c.getCanHide()) c.toggleVisibility(false);
    }
  };

  const showAll = () => {
    if (!table) return;
    for (const c of table.getAllLeafColumns()) {
      if (c.getCanHide()) c.toggleVisibility(true);
    }
  };

  if (!open || pos == null || typeof document === "undefined") return null;

  const body = (
    <div
        ref={panelRef}
        role="region"
        aria-label={lt("columnsMenu", "Colunas")}
        className={cn(
          "fixed z-[90] flex max-h-[min(85vh,520px)] flex-col rounded-md border border-border bg-popover text-popover-foreground shadow-lg outline-none"
        )}
        style={{
          top: pos.top,
          left: pos.left,
          width: pos.width
        }}
      >
        <div className="border-b px-4 py-3">
          <label className="text-xs font-medium text-primary">
            {lt("columnsPanelColumnTitleLabel", "Título da coluna")}
          </label>
          <Input
            className="mt-1.5 h-9 rounded-none border-0 border-b-2 border-primary bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder={lt("columnsPanelSearchPlaceholder", "Título")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={lt("columnsPanelSearchPlaceholder", "Título")}
          />
        </div>

        <ul className="min-h-0 flex-1 list-none overflow-y-auto py-1">
          {toggleable.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">
              {lt("columnsPanelNoMatches", "Nenhuma coluna corresponde à pesquisa.")}
            </li>
          ) : (
            toggleable.map((col) => {
              const label = columnLabel(col);
              const visible = col.getIsVisible();
              return (
                <li
                  key={String(col.id)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40"
                >
                  <Checkbox
                    checked={visible}
                    onCheckedChange={(v) => col.toggleVisibility(v === true)}
                    className="h-5 w-5 shrink-0 rounded-sm"
                    aria-label={label}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
          <Button type="button" variant="link" className="h-auto p-0 text-xs font-semibold uppercase" onClick={hideAll}>
            {lt("columnsPanelHideAll", "Ocultar todos")}
          </Button>
          <Button type="button" variant="link" className="h-auto p-0 text-xs font-semibold uppercase" onClick={showAll}>
            {lt("columnsPanelShowAll", "Mostrar todos")}
          </Button>
        </div>
      </div>
  );

  return createPortal(body, document.body);
}
