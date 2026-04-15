import * as React from "react";
import {
  Bars3BottomLeftIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../../../src/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../../../src/components/ui/tooltip";
import { cn } from "../../../src/lib/utils";
import type { GridDensity } from "./GridRootContext";
import { useGridApiContext, useGridRootContext } from "./GridRootContext";

export type GridToolbarProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Título à esquerda (legado MUI / ProtonWeb). */
  title?: React.ReactNode;
  /** Subtítulo opcional. */
  customSubtitleText?: React.ReactNode;
};

export function GridToolbar({
  className,
  children,
  title,
  customSubtitleText,
  ...props
}: GridToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
      {title != null || customSubtitleText ? (
        <div className="flex min-h-0 min-w-0 flex-col justify-center gap-0.5 pr-2">
          {title != null ? (
            <span className="truncate text-sm font-medium leading-none">{title}</span>
          ) : null}
          {customSubtitleText ? (
            <span className="truncate text-xs leading-none text-muted-foreground">
              {customSubtitleText}
            </span>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function GridToolbarContainer(props: GridToolbarProps) {
  return <GridToolbar {...props} />;
}

export function GridToolbarColumnsButton({
  className,
  title = "Colunas",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { title?: string }) {
  const { api } = useGridApiContext();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn("h-8 w-8 shrink-0", className)}
          data-grid-toolbar-columns
          aria-label={title}
          onClick={(e) => {
            api?.showColumnsPanel?.(e.currentTarget);
            props.onClick?.(e);
          }}
          {...props}
        >
          {props.children ?? <Squares2X2Icon className="h-4 w-4" aria-hidden />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
  );
}

export function GridToolbarFilterButton({
  className,
  title = "Filtros",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { title?: string }) {
  const { api } = useGridApiContext();
  const root = useGridRootContext();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn("h-8 w-8 shrink-0", className)}
          aria-label={title}
          ref={(el) => {
            if (root?.filterPanelAnchorRef) root.filterPanelAnchorRef.current = el;
          }}
          onClick={(e) => {
            const el = e.currentTarget;
            if (root?.filterPanelAnchorRef) root.filterPanelAnchorRef.current = el;
            api?.showFilterPanel?.(el);
            props.onClick?.(e);
          }}
          {...props}
        >
          {props.children ?? <FunnelIcon className="h-4 w-4" aria-hidden />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
  );
}

export function GridToolbarExport({
  className,
  printOptions,
  csvOptions,
  excelOptions,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  printOptions?: { title?: string };
  csvOptions?: { fileName?: string; utf8WithBom?: boolean };
  excelOptions?: { fileName?: string; sheetName?: string };
}) {
  const { api } = useGridApiContext();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={className} {...props}>
          {children ?? "Exportar"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            void api?.exportDataAsCsv?.(csvOptions);
          }}
        >
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            void api?.exportDataAsExcel?.(excelOptions);
          }}
        >
          Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            api?.exportDataAsPrint?.(printOptions);
          }}
        >
          Imprimir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const densityLabels: Record<GridDensity, string> = {
  compact: "Compacto",
  standard: "Padrão",
  comfortable: "Confortável"
};

/** Ícones de “altura de linha” alinhados ao padrão MUI (fino / médio / largo). */
function DensityGlyph({ density }: { density: GridDensity }) {
  const gap = density === "compact" ? "gap-px" : density === "comfortable" ? "gap-1" : "gap-0.5";
  const h = density === "compact" ? "h-0.5" : density === "comfortable" ? "h-1.5" : "h-1";
  return (
    <span className={cn("flex flex-col", gap)} aria-hidden>
      <span className={cn("w-5 rounded-sm bg-current", h)} />
      <span className={cn("w-5 rounded-sm bg-current", h)} />
      <span className={cn("w-5 rounded-sm bg-current", h)} />
    </span>
  );
}

export function GridToolbarDensitySelector({
  className,
  title = "Densidade",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { title?: string }) {
  const ctx = useGridRootContext();
  const d = ctx?.density ?? "standard";
  const setD = ctx?.setDensity;

  return (
    <div className={cn("flex items-center", className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!setD}
            aria-label={title}
            title={title}
          >
            <Bars3BottomLeftIcon className="h-4 w-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {(Object.keys(densityLabels) as GridDensity[]).map((k) => (
            <DropdownMenuItem
              key={k}
              className="flex cursor-pointer items-center gap-3"
              onClick={() => setD?.(k)}
            >
              <DensityGlyph density={k} />
              <span className={d === k ? "font-medium" : undefined}>{densityLabels[k]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export type GridToolbarQuickFilterProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  debounceMs?: number;
  /** `minimal`: estilo sublinhado + ícone (referência MUI «Pesquisar…»). */
  variant?: "default" | "minimal";
};

export const GridToolbarQuickFilter = React.forwardRef<
  HTMLInputElement,
  GridToolbarQuickFilterProps
>(function GridToolbarQuickFilter(
  { className, debounceMs: _debounceMs, variant = "default", placeholder, ...props },
  ref
) {
  const ctx = useGridRootContext();
  const v = ctx?.quickFilterValue ?? "";
  const setV = ctx?.setQuickFilterValue;

  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "flex min-w-[9rem] max-w-sm flex-1 items-center gap-1 border-0 border-b border-muted-foreground/40 px-0 pb-px focus-within:border-primary",
          className
        )}
      >
        <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          ref={ref}
          type="search"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          value={v}
          onChange={(e) => setV?.(e.target.value)}
          placeholder={placeholder ?? "Pesquisar…"}
          {...props}
        />
      </div>
    );
  }

  return (
    <Input
      ref={ref}
      className={cn("min-w-[12rem] max-w-sm flex-1", className)}
      value={v}
      onChange={(e) => setV?.(e.target.value)}
      placeholder={placeholder ?? "Filtrar…"}
      {...props}
    />
  );
});
GridToolbarQuickFilter.displayName = "GridToolbarQuickFilter";

/**
 * Linha padrão da grelha: Colunas / Filtros / pesquisa rápida / Densidade (último botão).
 * Use com `hideBuiltInFilterAndColumnsRow` e `slots.toolbar`, ou confie na barra integrada do `DataGrid`.
 */
export function GridToolbarFilterColumnsDensityRow({
  className,
  quickFilterPlaceholder,
  quickFilterRef,
  showColumnsButton = true,
  showFilterButton = true,
  showDensitySelector = true,
  showQuickFilter = true
}: {
  className?: string;
  quickFilterPlaceholder?: string;
  quickFilterRef?: React.Ref<HTMLInputElement>;
  showColumnsButton?: boolean;
  showFilterButton?: boolean;
  showDensitySelector?: boolean;
  showQuickFilter?: boolean;
}) {
  const hasChrome =
    showColumnsButton || showFilterButton || showDensitySelector || showQuickFilter;
  if (!hasChrome) return null;

  return (
    <div
      className={cn(
        "flex min-h-8 w-full flex-wrap items-center gap-1 pb-0.5 [&_button]:border-border [&_button]:bg-background",
        className
      )}
    >
      {showColumnsButton ? <GridToolbarColumnsButton /> : null}
      {showFilterButton ? <GridToolbarFilterButton /> : null}
      {showDensitySelector ? <GridToolbarDensitySelector /> : null}
      {showQuickFilter ? (
        <GridToolbarQuickFilter
          ref={quickFilterRef}
          variant="minimal"
          placeholder={quickFilterPlaceholder}
        />
      ) : null}
      
    </div>
  );
}
