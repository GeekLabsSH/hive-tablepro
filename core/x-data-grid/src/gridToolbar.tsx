import * as React from "react";
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  Bars3BottomLeftIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  QueueListIcon,
  Squares2X2Icon,
  TableCellsIcon
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

function hasToolbarTitle(title?: React.ReactNode, customSubtitleText?: React.ReactNode) {
  const hasTitle =
    title != null &&
    title !== "" &&
    !(typeof title === "string" && title.trim() === "");
  return hasTitle || Boolean(customSubtitleText);
}

export function GridToolbar({
  className,
  children,
  title,
  customSubtitleText,
  ...props
}: GridToolbarProps) {
  const showTitleBlock = hasToolbarTitle(title, customSubtitleText);
  return (
    <div
      className={cn("flex w-full min-w-0 flex-wrap items-center gap-2", className)}
      {...(props as any)}
    >
      {showTitleBlock ? (
        <div className="flex min-h-0 min-w-0 flex-col justify-center gap-0.5 pr-2">
          {title != null && title !== "" ? (
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
  return <GridToolbar {...(props as any)} />;
}

export function GridToolbarColumnsButton({
  className,
  title = "Colunas",
  showLabel,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { title?: string; showLabel?: boolean }) {
  const { api } = useGridApiContext();
  const icon = children ?? <Squares2X2Icon className="h-4 w-4 shrink-0" aria-hidden />;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={showLabel ? "sm" : "icon"}
          className={cn(showLabel ? "h-8 min-w-0 shrink-0 gap-1.5 px-2" : "h-8 w-8 shrink-0", className)}
          data-grid-toolbar-columns
          aria-label={title}
          onClick={(e) => {
            api?.showColumnsPanel?.(e.currentTarget);
            props.onClick?.(e);
          }}
          {...(props as any)}
        >
          {showLabel ? (
            <>
              {icon}
              <span className="max-w-[6.5rem] truncate text-xs font-medium">{title}</span>
            </>
          ) : (
            icon
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
  );
}

export function GridToolbarFilterButton({
  className,
  title = "Filtros",
  showLabel,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { title?: string; showLabel?: boolean }) {
  const { api } = useGridApiContext();
  const root = useGridRootContext();
  const n = root?.activeFilterCount ?? 0;
  const icon = children ?? <FunnelIcon className="h-4 w-4 shrink-0" aria-hidden />;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative inline-flex shrink-0">
          <Button
            type="button"
            variant="outline"
            size={showLabel ? "sm" : "icon"}
            className={cn(showLabel ? "h-8 min-w-0 shrink-0 gap-1.5 px-2" : "h-8 w-8 shrink-0", className)}
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
            {...(props as any)}
          >
            {showLabel ? (
              <>
                {icon}
                <span className="max-w-[6.5rem] truncate text-xs font-medium">{title}</span>
              </>
            ) : (
              icon
            )}
          </Button>
          {n > 0 ? (
            <span
              className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
              aria-hidden
            >
              {n > 99 ? "99+" : n}
            </span>
          ) : null}
        </span>
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
  title = "Exportar",
  showLabel,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  printOptions?: { title?: string };
  csvOptions?: { fileName?: string; utf8WithBom?: boolean };
  excelOptions?: { fileName?: string; sheetName?: string };
  /** Rótulo acessível + tooltip quando não há `children`. */
  title?: string;
  showLabel?: boolean;
}) {
  const { api } = useGridApiContext();
  const icon = children ?? <ArrowDownTrayIcon className="h-4 w-4 shrink-0" aria-hidden />;
  const hasCustomChildren = children != null && children !== false;
  const size = hasCustomChildren ? "sm" : showLabel ? "sm" : "icon";
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size={size}
              className={cn(
                hasCustomChildren ? "" : showLabel ? "h-8 min-w-0 shrink-0 gap-1.5 px-2" : "h-8 w-8 shrink-0",
                className
              )}
              aria-label={title}
              {...(props as any)}
            >
              {hasCustomChildren ? (
                icon
              ) : showLabel ? (
                <>
                  {icon}
                  <span className="max-w-[6.5rem] truncate text-xs font-medium">{title}</span>
                </>
              ) : (
                icon
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{title}</TooltipContent>
      </Tooltip>
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

export function GridToolbarHeaderFiltersButton({
  className,
  title = "Filtros no cabeçalho",
  showLabel,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { title?: string; showLabel?: boolean }) {
  const root = useGridRootContext();
  const on = root?.headerFiltersEnabled ?? false;
  const icon = children ?? <QueueListIcon className="h-4 w-4 shrink-0" aria-hidden />;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={on ? "secondary" : "outline"}
          size={showLabel ? "sm" : "icon"}
          className={cn(showLabel ? "h-8 min-w-0 shrink-0 gap-1.5 px-2" : "h-8 w-8 shrink-0", className)}
          aria-label={title}
          aria-pressed={on}
          onClick={(e) => {
            root?.setHeaderFiltersEnabled?.(!on);
            props.onClick?.(e);
          }}
          {...(props as any)}
        >
          {showLabel ? (
            <>
              {icon}
              <span className="max-w-[6.5rem] truncate text-xs font-medium">{title}</span>
            </>
          ) : (
            icon
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
  );
}

export function GridToolbarPivotPanelButton({
  className,
  title = "Configurar pivot",
  showLabel,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { title?: string; showLabel?: boolean }) {
  const root = useGridRootContext();
  if (!root?.pivotFeatureEnabled || root.openPivotPanel == null) return null;
  const icon = children ?? <AdjustmentsHorizontalIcon className="h-4 w-4 shrink-0" aria-hidden />;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={showLabel ? "sm" : "icon"}
          className={cn(showLabel ? "h-8 min-w-0 shrink-0 gap-1.5 px-2" : "h-8 w-8 shrink-0", className)}
          aria-label={title}
          onClick={(e) => {
            root.openPivotPanel?.();
            props.onClick?.(e);
          }}
          {...(props as any)}
        >
          {showLabel ? (
            <>
              {icon}
              <span className="max-w-[6.5rem] truncate text-xs font-medium">{title}</span>
            </>
          ) : (
            icon
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
  );
}

export function GridToolbarPivotToggleButton({
  className,
  title = "Pivot",
  showLabel,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { title?: string; showLabel?: boolean }) {
  const root = useGridRootContext();
  if (!root?.pivotFeatureEnabled) return null;
  const on = root.pivotActive ?? false;
  const icon = children ?? <TableCellsIcon className="h-4 w-4 shrink-0" aria-hidden />;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={on ? "secondary" : "outline"}
          size={showLabel ? "sm" : "icon"}
          className={cn(showLabel ? "h-8 min-w-0 shrink-0 gap-1.5 px-2" : "h-8 w-8 shrink-0", className)}
          aria-label={title}
          aria-pressed={on}
          onClick={(e) => {
            root.setPivotActive?.(!on);
            props.onClick?.(e);
          }}
          {...(props as any)}
        >
          {showLabel ? (
            <>
              {icon}
              <span className="max-w-[6.5rem] truncate text-xs font-medium">{title}</span>
            </>
          ) : (
            icon
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
  );
}

export function GridToolbarChartsButton({
  className,
  title = "Gráficos",
  showLabel,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { title?: string; showLabel?: boolean }) {
  const root = useGridRootContext();
  if (!root?.chartsIntegrationEnabled) return null;
  const icon = children ?? <ChartBarIcon className="h-4 w-4 shrink-0" aria-hidden />;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={showLabel ? "sm" : "icon"}
          className={cn(showLabel ? "h-8 min-w-0 shrink-0 gap-1.5 px-2" : "h-8 w-8 shrink-0", className)}
          aria-label={title}
          onClick={(e) => {
            root.openChartsPanel?.();
            props.onClick?.(e);
          }}
          {...(props as any)}
        >
          {showLabel ? (
            <>
              {icon}
              <span className="max-w-[6.5rem] truncate text-xs font-medium">{title}</span>
            </>
          ) : (
            icon
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
  );
}

export function GridToolbarClearFiltersButton({
  className,
  title = "Limpar filtros",
  showLabel,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { title?: string; showLabel?: boolean }) {
  const root = useGridRootContext();
  const disabled = (root?.activeFilterCount ?? 0) === 0;
  const icon = children ?? <ArrowPathIcon className="h-4 w-4 shrink-0" aria-hidden />;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={showLabel ? "sm" : "icon"}
          className={cn(showLabel ? "h-8 min-w-0 shrink-0 gap-1.5 px-2" : "h-8 w-8 shrink-0", className)}
          aria-label={title}
          disabled={disabled}
          onClick={(e) => {
            if (!disabled) root?.clearAllFilters?.();
            props.onClick?.(e);
          }}
          {...(props as any)}
        >
          {showLabel ? (
            <>
              {icon}
              <span className="max-w-[6.5rem] truncate text-xs font-medium">{title}</span>
            </>
          ) : (
            icon
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
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
  showLabel,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { title?: string; showLabel?: boolean }) {
  const ctx = useGridRootContext();
  const d = ctx?.density ?? "standard";
  const setD = ctx?.setDensity;

  return (
    <div className={cn("flex items-center", className)} {...(props as any)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={showLabel ? "sm" : "icon"}
            className={cn(showLabel ? "h-8 min-w-0 shrink-0 gap-1.5 px-2" : "h-8 w-8 shrink-0")}
            disabled={!setD}
            aria-label={title}
            title={title}
          >
            <Bars3BottomLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
            {showLabel ? <span className="max-w-[6.5rem] truncate text-xs font-medium">{title}</span> : null}
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
          {...(props as any)}
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
      {...(props as any)}
    />
  );
});
GridToolbarQuickFilter.displayName = "GridToolbarQuickFilter";

/**
 * Linha padrão da grelha: Colunas / Filtros / … / Densidade e, por defeito, pesquisa rápida a seguir (à esquerda).
 * Use com `hideBuiltInFilterAndColumnsRow` e `slots.toolbar`, ou confie na barra integrada do `DataGrid`.
 */
export function GridToolbarFilterColumnsDensityRow({
  className,
  quickFilterPlaceholder,
  quickFilterRef,
  showColumnsButton = true,
  showFilterButton = true,
  showDensitySelector = true,
  showQuickFilter = true,
  showHeaderFiltersToggle = true,
  showClearFiltersButton = true,
  showChartsButton = true,
  showPivotPanelButton = true,
  /** `start` = após os botões, sem empurrar para a direita; `end` = `ml-auto` na pesquisa. */
  toolbarQuickFilterAlign = "start",
  showButtonLabels = false
}: {
  className?: string;
  quickFilterPlaceholder?: string;
  quickFilterRef?: React.Ref<HTMLInputElement>;
  showColumnsButton?: boolean;
  showFilterButton?: boolean;
  showDensitySelector?: boolean;
  showQuickFilter?: boolean;
  showHeaderFiltersToggle?: boolean;
  showClearFiltersButton?: boolean;
  showChartsButton?: boolean;
  showPivotPanelButton?: boolean;
  toolbarQuickFilterAlign?: "start" | "end";
  showButtonLabels?: boolean;
}) {
  const hasChrome =
    showColumnsButton ||
    showFilterButton ||
    showDensitySelector ||
    showQuickFilter ||
    showHeaderFiltersToggle ||
    showClearFiltersButton ||
    showChartsButton ||
    showPivotPanelButton;
  if (!hasChrome) return null;

  const quick = showQuickFilter ? (
    <GridToolbarQuickFilter
      ref={quickFilterRef}
      variant="minimal"
      className={cn("shrink-0", toolbarQuickFilterAlign === "end" && "ml-auto")}
      placeholder={quickFilterPlaceholder}
    />
  ) : null;

  return (
    <div
      className={cn(
        "flex min-h-8 w-full min-w-0 flex-wrap items-center gap-1 px-0 pb-0 pt-0 [&_button]:border-border [&_button]:bg-background",
        className
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        {showColumnsButton ? <GridToolbarColumnsButton showLabel={showButtonLabels} /> : null}
        {showFilterButton ? <GridToolbarFilterButton showLabel={showButtonLabels} /> : null}
        {showHeaderFiltersToggle ? <GridToolbarHeaderFiltersButton showLabel={showButtonLabels} /> : null}
        {showClearFiltersButton ? <GridToolbarClearFiltersButton showLabel={showButtonLabels} /> : null}
        {showChartsButton ? <GridToolbarChartsButton showLabel={showButtonLabels} /> : null}
        {showPivotPanelButton ? <GridToolbarPivotPanelButton showLabel={showButtonLabels} /> : null}
        <GridToolbarPivotToggleButton showLabel={showButtonLabels} />
        {showDensitySelector ? <GridToolbarDensitySelector showLabel={showButtonLabels} /> : null}
      </div>
      {quick}
    </div>
  );
}
