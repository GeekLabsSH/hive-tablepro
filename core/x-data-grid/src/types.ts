import type * as React from "react";

/** Densidade visual da grelha (MUI X). */
export type GridDensity = "compact" | "standard" | "comfortable";

/** IDs de linha compatíveis com MUI X */
export type GridRowId = string | number;

/** Modelo de linha — `Record<string, any>` alinha ao MUI X e evita `params.row.campo` falhar por união com `object`. */
export type GridValidRowModel = Record<string, any>;

/** Alias MUI X (`GridRowModel`). */
export type GridRowModel = GridValidRowModel;

/** Alias MUI X — tipo da linha de dados. */
export type GridRow<R extends GridValidRowModel = GridValidRowModel> = R;

/** Modo de edição de linha (MUI X). */
export const GridRowModes = {
  Edit: "edit",
  View: "view"
} as const;
export type GridRowMode = (typeof GridRowModes)[keyof typeof GridRowModes];

/**
 * Entrada no mapa de modos: literal (uso interno) ou objeto `{ mode }` com `ignoreModifications` opcional
 * (compat. ProtonWeb / MUI clássico).
 */
export type GridRowModeEntry =
  | GridRowMode
  | {
      mode: GridRowMode;
      ignoreModifications?: boolean;
      /** Coluna a focar ao entrar em edição por linha (ex.: duplo clique). */
      fieldToFocus?: string;
    };

/** Por id de linha: modo de edição (MUI X). */
export type GridRowModesModel = Partial<Record<GridRowId, GridRowModeEntry>>;

/** Resolve o modo efetivo a partir de uma entrada do modelo. */
export function resolveRowModeFromEntry(entry: GridRowModeEntry | undefined | null): GridRowMode | undefined {
  if (entry == null) return undefined;
  if (typeof entry === "string") return entry;
  return entry.mode;
}

/** Equivalente MUI X: `true` quando a entrada corresponde a edição por linha. */
export function rowModeEntryIsEdit(entry: GridRowModeEntry | undefined | null): boolean {
  return resolveRowModeFromEntry(entry) === GridRowModes.Edit;
}

/** Nó de árvore (tree data / Premium). */
export interface GridTreeNode {
  id: GridRowId;
  depth: number;
  parentId?: GridRowId | null;
  childrenExpanded?: boolean;
  groupingKey?: string | null;
}

export type GridAlignment = "left" | "right" | "center";

/** Funções de agregação alinhadas ao TanStack Table (`mean` = média). */
export type GridBuiltInAggregation =
  | "sum"
  | "mean"
  | "min"
  | "max"
  | "count"
  | "median"
  | "uniqueCount"
  | "extent";

/** Por campo (`GridColDef.field`): agregação em linhas de grupo e opcionalmente no rodapé. */
export type GridAggregationModel = Partial<Record<string, GridBuiltInAggregation | string>>;

/** Campos por ordem de agrupamento (equivalente a `rowGroupingModel` MUI). */
export type GridRowGroupingModel = string[];

export type GridSortDirection = "asc" | "desc" | null;

export interface GridSortItem {
  field: string;
  sort?: GridSortDirection;
}

export type GridSortModel = GridSortItem[];

export type GridLogicOperator = "And" | "Or";

export type GridFilterOperator =
  | "contains"
  | "equals"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty"
  | ">"
  | ">="
  | "<"
  | "<="
  | "="
  | "!="
  | "is"
  | "not"
  | "after"
  | "onOrAfter"
  | "before"
  | "onOrBefore"
  /** Lista separada por `;` no valor (string) ou `unknown[]` serializado. */
  | "inList"
  /** `singleSelect` / enum: o valor da célula tem de coincidir com **todos** os valores seleccionados. */
  | "selectAll"
  /** `singleSelect` / enum: o valor da célula coincide com **qualquer** valor seleccionado. */
  | "selectAny";

export interface GridFilterItem {
  id?: string | number;
  field: string;
  operator: GridFilterOperator;
  value?: unknown;
  /**
   * Identificador de grupo para combinar condições (E/OU dentro do grupo + entre grupos).
   * Se **nenhum** item tiver `groupId` definido, usa-se só `logicOperator` na lista plana (compatível).
   */
  groupId?: number | string;
  /**
   * Lógica **entre** itens consecutivos do mesmo `groupId` (por ordem em `items`).
   * O primeiro item do grupo ignora este campo.
   */
  groupItemLogic?: GridLogicOperator;
  /**
   * Ordem manual relativa a outros itens (menor = primeiro). Usado na avaliação e no painel.
   * Se omitido, mantém-se a ordem do array `items` entre itens sem valor definido.
   */
  filterOrder?: number;
  /**
   * Lista **sem** `groupId` em nenhum item: combina esta linha com a anterior (`And` / `Or`).
   * Se omitido, usa-se `GridFilterModel.logicOperator` para esse segmento (retrocompatível).
   */
  joinWithPrevious?: GridLogicOperator;
}

export interface GridFilterModel {
  items: GridFilterItem[];
  logicOperator?: GridLogicOperator;
  /** Lógica entre **grupos** distintos (quando há `groupId` em pelo menos um item). */
  groupLogicOperator?: GridLogicOperator;
  quickFilterValues?: string[];
  quickFilterLogicOperator?: GridLogicOperator;
}

/**
 * Agregações de valores no pivot e nos gráficos.
 * `stdDev` = desvio padrão amostral (divisor n−1; 0 quando n≤1).
 */
export type GridPivotAggFunc =
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "median"
  | "stdDev"
  | "count"
  | "countDistinct";

/**
 * Granularidade derivada para colunas `date` / `dateTime` no pivot e no eixo X dos gráficos.
 * `week` = semana a começar na segunda-feira (local). `semester` = S1 (jan–jun) / S2 (jul–dez).
 */
export type GridPivotDateGranularity = "year" | "quarter" | "semester" | "month" | "week" | "day";

export interface GridPivotRowDef {
  field: string;
  hidden?: boolean;
  /** Só aplicável quando a coluna de dados é `date` ou `dateTime`. */
  dateGranularity?: GridPivotDateGranularity;
}

export interface GridPivotColumnDef {
  field: string;
  hidden?: boolean;
  sort?: "asc" | "desc";
  dateGranularity?: GridPivotDateGranularity;
}

export interface GridPivotValueDef {
  field: string;
  aggFunc: GridPivotAggFunc;
  hidden?: boolean;
}

/** Modelo de pivotagem (objectos por eixo; retrocompatível via `normalizePivotModel`). */
export interface GridPivotModel {
  rows: GridPivotRowDef[];
  columns: GridPivotColumnDef[];
  values: GridPivotValueDef[];
}

export type GridChartsDatasetKind = "bar" | "line" | "area";

/** Métrica no eixo Y (várias séries suportadas). */
export interface GridChartsValueSeries {
  field: string;
  aggFunc?: GridPivotAggFunc;
}

/** Modo de filtro temporal sobre uma coluna `date` / `dateTime` antes de agregar o gráfico. */
export type GridChartsDateFilterMode = "off" | "exact" | "range";

export interface GridChartsDateFilter {
  field: string;
  mode: GridChartsDateFilterMode;
  /** Dia inclusivo `YYYY-MM-DD` quando `mode === "exact"`. */
  exactDate?: string;
  /** Inclusivo, `YYYY-MM-DD`, quando `mode === "range"`. */
  rangeStart?: string;
  rangeEnd?: string;
}

/** Configuração leve do painel de gráficos (integração estilo MUI + renderer shadcn/recharts). */
export interface GridChartsConfig {
  /** Tipo de gráfico por defeito no painel. */
  defaultKind?: GridChartsDatasetKind;
  /** Campo categórico do eixo X. */
  categoryField?: string;
  /**
   * Quando `categoryField` é `date` ou `dateTime`, agrupa o eixo X (paridade com pivotagem).
   * Sem valor, usa-se rótulo bruto da célula.
   */
  categoryDateGranularity?: GridPivotDateGranularity;
  /** Campo numérico do eixo Y (série única; ignorado se `valueSeries` tiver entradas). */
  valueField?: string;
  /** Agregação da série única. */
  valueAggFunc?: GridPivotAggFunc;
  /** Várias métricas no eixo Y (cada uma com campo e agregação). */
  valueSeries?: GridChartsValueSeries[];
  /** Filtra linhas por intervalo ou dia antes de construir o dataset do gráfico. */
  dateFilter?: GridChartsDateFilter;
}

export interface GridPaginationModel {
  page: number;
  pageSize: number;
}

/**
 * Metadados de paginação em modo servidor (alinhado ao MUI X), quando o total exato de linhas não está em `rowCount`.
 */
export interface GridPaginationMeta {
  /** Se `true`, existe página seguinte (permite «próxima» mesmo sem total conhecido). */
  hasNextPage?: boolean;
  /**
   * Estimativa do total de linhas; usada com `Math.ceil(estimatedRowCount / pageSize)` para `pageCount`,
   * combinada com `hasNextPage` para não bloquear páginas além da estimativa.
   */
  estimatedRowCount?: number;
}

export interface GridColumnVisibilityModel {
  [field: string]: boolean;
}

/** Colunas fixas à esquerda / direita (API alinhada ao MUI X Pro). */
export interface GridPinnedColumns {
  left?: string[];
  right?: string[];
}

export interface GridRowSelectionModel {
  /** `include` (por defeito): `ids` = linhas selecionadas. `exclude`: `ids` = linhas **não** selecionadas; lista vazia = todas selecionadas (útil em servidor com `rowCount`). */
  type?: "include" | "exclude";
  ids: Set<GridRowId> | GridRowId[];
}

export interface GridColumnOrderChangeParams {
  column: { field: string };
  targetIndex: number;
  oldIndex: number;
}

export interface GridColumnResizeParams {
  colDef: { field: string };
  width: number;
}

export interface GridValueGetterParams<
  R extends GridValidRowModel = GridValidRowModel,
  V = unknown
> {
  field: string;
  row: R;
  /** Valor bruto; `any` mantém compatibilidade com legado (`new Date(value)`, etc.). */
  value: any;
}

export interface GridValueFormatterParams<
  R extends GridValidRowModel = GridValidRowModel,
  V = unknown
> {
  id: GridRowId;
  field: string;
  row: R;
  value: any;
}

export interface GridRenderCellParams<
  R extends GridValidRowModel = GridValidRowModel,
  V = unknown
> {
  id: GridRowId;
  field: string;
  row: R;
  value: V;
  formattedValue?: unknown;
  api: GridApiCommunity<R>;
  colDef: GridColDef<R>;
  hasFocus: boolean;
  tabIndex: 0 | -1;
}

/**
 * Props por célula em edição (MUI X `GridEditCellProps` / estado interno da grelha).
 */
export interface GridEditCellProps<V = unknown> {
  /** Valor em edição; `any` evita quebrar validadores legados que esperam `string`, etc. */
  value?: any;
  error?: boolean;
  helperText?: string;
  isValidating?: boolean;
  isProcessingProps?: boolean;
  [prop: string]: unknown;
}

/**
 * Parâmetros de `GridColDef.preProcessEditCellProps` (MUI X Data Grid).
 * Em `editMode="row"`, `otherFieldsProps` expõe os outros campos editáveis da mesma linha
 * (objetos mutáveis, como no ProtonWeb `costs.tsx`).
 */
export interface GridPreProcessEditCellProps<
  R extends GridValidRowModel = GridValidRowModel,
  V = unknown
> {
  id: GridRowId;
  row: R;
  props: GridEditCellProps<V>;
  hasChanged?: boolean;
  /** Só em edição por linha: props dos outros campos (mesmas referências entre renders da linha). */
  otherFieldsProps?: Record<string, GridEditCellProps<unknown>>;
}

/** Modo edição de célula (MUI X: `renderEditCell`). */
export interface GridRenderEditCellParams<
  R extends GridValidRowModel = GridValidRowModel,
  V = unknown
> extends GridRenderCellParams<R, V> {
  /** Persistir valor; chama `processRowUpdate` no pai e sai do modo edição se resolver. */
  commit: (value: V) => void;
  /** Sair sem gravar. */
  cancel: () => void;
  /** Fundido a partir de `preProcessEditCellProps` (ex.: `error`, `helperText`). */
  processedEditProps?: GridEditCellProps<V>;
}

export interface GridRenderHeaderParams<R extends GridValidRowModel = GridValidRowModel> {
  field: string;
  colDef: GridColDef<R>;
  api: GridApiCommunity<R>;
}

/** Parâmetros de clique / estilo em célula (subconjunto estável). */
export interface GridCellParams<R extends GridValidRowModel = GridValidRowModel, V = unknown> {
  id: GridRowId;
  field: string;
  row: R;
  value: V;
}

/** Opções dinâmicas em `singleSelect` (MUI X: `valueOptions` como função). */
export interface GridValueOptionsParams<R extends GridValidRowModel = GridValidRowModel> {
  id: GridRowId;
  field: string;
  row: R;
}

export type GridValueOptionsList = Array<string | number | { value: string | number; label: string }>;

/** Definição de coluna alinhada à API pública do MUI X Data Grid */
export interface GridColDef<R extends GridValidRowModel = GridValidRowModel, V = unknown> {
  field: string;
  headerName?: string;
  description?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  /**
   * Sem `width`, a largura inicial em px deriva de `flex * 100` (limitada por min/max).
   * Com `width`, esse valor é a base; o resize da grelha continua em px (TanStack).
   */
  flex?: number;
  align?: GridAlignment;
  headerAlign?: GridAlignment;
  sortable?: boolean;
  filterable?: boolean;
  /**
   * Se `true`, o `field` desta coluna é omitido de `filterModel.items` ao exportar o filtro para partilha
   * (`stripFilterModelForExport`). Use para dados sensíveis (ex.: custos confidenciais).
   */
  excludeFromFilterExport?: boolean;
  hide?: boolean;
  /**
   * Se `false`, a coluna não pode ser ocultada pelo painel «Colunas» (nem por «Ocultar todos»).
   * Colunas `type: "actions"` / `getActions` são sempre não ocultáveis.
   */
  hideable?: boolean;
  resizable?: boolean;
  disableColumnMenu?: boolean;
  disableReorder?: boolean;
  editable?: boolean;
  /**
   * Se definido, a célula só é editável quando devolver `true` (além de `editable: true`).
   * Equivalente ao predicado dinâmico do MUI X Data Grid.
   */
  isCellEditable?: (params: GridCellParams<R, V>) => boolean;
  type?: "string" | "number" | "boolean" | "date" | "dateTime" | "singleSelect" | "actions" | string;
  valueGetter?: (params: GridValueGetterParams<R, V>) => V;
  valueFormatter?: (params: GridValueFormatterParams<R, V>) => string;
  renderCell?: (params: GridRenderCellParams<R, V>) => React.ReactNode;
  /**
   * Coluna `type: "actions"` (MUI X): lista de nós (típico `GridActionsCellItem`).
   * Se `renderCell` existir, tem precedência sobre `getActions`.
   */
  getActions?: (params: GridGetActionsParams<R, V>) => React.ReactNode[];
  /** UI de edição; requer `editable: true` e `processRowUpdate` na grelha. */
  renderEditCell?: (params: GridRenderEditCellParams<R, V>) => React.ReactNode;
  /**
   * Pré-processamento síncrono das props de edição (MUI X). O retorno funde-se no estado de edição
   * da célula (`error`, `helperText`, etc.). Promises não são suportadas (ainda).
   */
  preProcessEditCellProps?: (
    params: GridPreProcessEditCellProps<R, V>
  ) => GridEditCellProps<V> | void | Promise<GridEditCellProps<V>>;
  renderHeader?: (params: GridRenderHeaderParams<R>) => React.ReactNode;
  /**
   * Colunas filhas: cabeçalho multi-linha (TanStack / paridade MUI pivot com várias dimensões em colunas).
   */
  children?: GridColDef<R, V>[];
  /** Segunda linha do cabeçalho (ex.: tipo de agregação na última linha do pivot). */
  pivotHeaderSecondary?: string;
  valueOptions?: GridValueOptionsList | ((params: GridValueOptionsParams<R>) => GridValueOptionsList);
  /**
   * `singleSelect`: editor com campo de pesquisa (filtra `valueOptions` no cliente).
   * Com `loadEditValueOptions`, os resultados vêm do servidor (ex.: primeiros 10 matches).
   */
  async?: boolean;
  loadEditValueOptions?: (
    input: string,
    params: { id: GridRowId; row: R; field: string }
  ) => Promise<GridValueOptionsList>;
  /**
   * Metadados legados (ProtonWeb / MUI) — preservados no tipo para não partir colunas existentes;
   * o motor da grelha pode ignorá-los; use `loadEditValueOptions` para busca assíncrona no hive-tablepro.
   */
  registerAPI?: unknown;
  crud?: string;
  /** Em `async` + pesquisa SelectOption: enriquecer rótulos com redes parceiras (legado ProtonWeb). */
  showPartnerNetworks?: boolean;
  typeGet?: unknown;
  /** Vários `LINKPERSON` para pedido assíncrono de opções (legado ProtonWeb). */
  multiTypeGet?: unknown[];
  maxResult?: number;
  /** Limite de dias no editor de data (legado ProtonWeb / agendamento). */
  maxDate?: number;
  useFixedListToAsync?: boolean;
  /** Classes Tailwind/CSS na célula (string ou função com `GridCellParams`). */
  cellClassName?: string | ((params: GridCellParams<R, V>) => string);
  /** Igual ao padrão MUI: classes adicionais por célula (combinado com `cellClassName`). */
  getCellClassName?: (params: GridCellParams<R, V>) => string;
  /** Classes no cabeçalho da coluna (string ou função com `GridRenderHeaderParams`). */
  headerClassName?: string | ((params: GridRenderHeaderParams<R>) => string);
  /** Se false, a coluna não pode ser fixada (pin). Por defeito: true. */
  pinnable?: boolean;
  /** Se false, a coluna não entra no agrupamento de linhas. Por defeito: true. */
  groupable?: boolean;
  /**
   * Quick filter (MUI X): devolve uma função por valor de filtro, ou `null` para excluir a coluna do quick filter.
   * Sem isto, usa-se o comportamento por defeito (substring case-insensitive no valor da célula).
   */
  getApplyQuickFilterFn?: (
    filterValue: string,
    colDef: GridColDef<R, V>,
    api: GridApiCommunity<R> | null
  ) => ((cellValue: unknown) => boolean) | null;
  /** Comparador de ordenação (MUI X); `v1`/`v2` em `any` para alinhar ao legado ProtonWeb. */
  sortComparator?: (
    v1: any,
    v2: any,
    cellParams1?: GridCellParams<R, V>,
    cellParams2?: GridCellParams<R, V>
  ) => number;
}

/** Parâmetros de `getActions` (MUI X; superset de `GridRowParams` + `field` / `colDef`). */
export interface GridGetActionsParams<
  R extends GridValidRowModel = GridValidRowModel,
  V = unknown
> {
  id: GridRowId;
  row: R;
  field: string;
  api: GridApiCommunity<R>;
  colDef: GridColDef<R, V>;
  indexRelativeToCurrentPage?: number;
}

export interface GridCsvExportOptions {
  fileName?: string;
  /**
   * BOM UTF-8 no ficheiro. Por defeito: `csvOptions.utf8WithBom` da grelha, ou `true`.
   * `false` evita `\uFEFF` (útil para importação em ferramentas que não esperam BOM).
   */
  utf8WithBom?: boolean;
}

export interface GridExcelExportOptions {
  fileName?: string;
  sheetName?: string;
}

/** Opções para `api.exportDataAsPrint` (mesmas linhas visíveis que CSV: filtradas, sem linhas de grupo). */
export interface GridPrintExportOptions {
  /** Título na página e na janela de impressão. Por defeito: nome base do CSV (`csvOptions.fileName`) sem `.csv`, ou `export`. */
  title?: string;
}

/** Posição de scroll no contentor principal da grelha (viewport). */
export interface GridScrollPosition {
  top?: number;
  left?: number;
}

/** Índices na ordem de renderização atual (`getRowModel().flatRows` / colunas folha). */
export interface GridScrollToIndexesOptions {
  rowIndex: number;
  colIndex?: number;
}

/** Retorno imperativo do estado principal (útil com `subscribeEvent('stateChange')`). */
export interface GridStateSnapshot {
  sortModel: GridSortModel;
  filterModel: GridFilterModel;
  paginationModel: GridPaginationModel;
  /** Presente em modo servidor quando se usa `paginationMeta` sem total fixo em `rowCount`. */
  paginationMeta?: GridPaginationMeta;
  columnVisibilityModel: GridColumnVisibilityModel;
  pinnedColumns: GridPinnedColumns;
  /** Ordem de exibição das colunas de dados (`field` / id de folha). */
  columnOrder: string[];
  /** Larguras (px) por coluna de dados (sem colunas meta). */
  columnSizing: Record<string, number>;
  selectedRowIds: GridRowId[];
  rowGroupingModel: GridRowGroupingModel;
  density: GridDensity;
  /** Modo de edição: célula ou linha inteira (espelha `editMode` resolvido na grelha). */
  editMode: "cell" | "row";
  /** Modo de edição por linha (`editMode="row"`). */
  rowModesModel: GridRowModesModel;
}

/**
 * Eventos de subscrição imperativa (extensível).
 * - `stateChange`: qualquer alteração relevante no snapshot.
 * - `rowSelectionChange` / `filterChange` / `sortChange`: apenas quando esse aspeto muda.
 * - `paginationChange` / `columnVisibilityChange` / `pinnedColumnsChange`: paginação, visibilidade e pin.
 * - `columnOrderChange` / `rowGroupingModelChange`: ordem de colunas e modelo de agrupamento.
 * - `columnSizingChange`: larguras de coluna (redimensionar).
 * - `densityChange` / `rowModesModelChange`: densidade e edição por linha.
 */
export type GridSubscriptionEvent =
  | "stateChange"
  | "rowSelectionChange"
  | "filterChange"
  | "sortChange"
  | "paginationChange"
  | "columnVisibilityChange"
  | "pinnedColumnsChange"
  | "columnOrderChange"
  | "rowGroupingModelChange"
  | "columnSizingChange"
  | "densityChange"
  | "rowModesModelChange";

/** Parâmetros de clique no cabeçalho de coluna (subconjunto alinhado ao MUI X). */
export interface GridColumnHeaderParams<R extends GridValidRowModel = GridValidRowModel> {
  field: string;
  colDef: GridColDef<R> | undefined;
  api: GridApiCommunity<R>;
}

/** Parâmetros de clique em linha (alinhado ao MUI X). */
export interface GridRowParams<R extends GridValidRowModel = GridValidRowModel> {
  id: GridRowId;
  row: R;
  /** Compat. MUI X (paginação cliente / `getRowClassName`). */
  indexRelativeToCurrentPage?: number;
  /** Compat. MUI X (`getActions`, handlers). */
  api?: GridApiCommunity<R>;
}

/** Parâmetros de `getRowClassName` (MUI X: `indexRelativeToCurrentPage` na página atual). */
export interface GridRowClassNameParams<R extends GridValidRowModel = GridValidRowModel>
  extends GridRowParams<R> {
  indexRelativeToCurrentPage: number;
}

/**
 * Razões de fim de edição por linha — alinhado ao MUI X `GridRowEditStopReasons`, mais extensões
 * Hive para botões de ação da grelha (`saveButtonClick` / `cancelButtonClick`).
 */
export const GridRowEditStopReasons = {
  rowFocusOut: "rowFocusOut",
  escapeKeyDown: "escapeKeyDown",
  enterKeyDown: "enterKeyDown",
  tabKeyDown: "tabKeyDown",
  shiftTabKeyDown: "shiftTabKeyDown",
  saveButtonClick: "saveButtonClick",
  cancelButtonClick: "cancelButtonClick"
} as const;

export type GridRowEditStopReason =
  (typeof GridRowEditStopReasons)[keyof typeof GridRowEditStopReasons];

/** Parâmetros de `onRowEditStop` (MUI `GridRowEditStopParams`). */
export interface GridRowEditStopParams<R extends GridValidRowModel = GridValidRowModel>
  extends GridRowParams<R> {
  /** Campo da célula onde a ação ocorreu, quando aplicável. */
  field?: string;
  /** Origem do fim de edição. */
  reason?: GridRowEditStopReason;
  /**
   * Cópia rasa da linha no momento em que a edição por linha **começou** (`rowModesModel[id] → Edit`).
   * Permite reverter em `cancelButtonClick` / `escapeKeyDown` / etc. sem manter espelho no ascendente.
   * Objeto aninhados partilham referência com o modelo original — para imutabilidade profunda, clonar no pai.
   */
  previousRow?: R;
}

/**
 * Atualização parcial de uma linha (MUI `updateRows`): `id` corresponde a `getRowId(row)`;
 * os restantes campos fundem-se na linha existente no estado do pai.
 */
export type GridRowUpdate<R extends GridValidRowModel = GridValidRowModel> = Partial<R> & {
  id: GridRowId;
};

/**
 * Transação em lote (MUI Pro `applyTransaction`). O ascendente aplica `remove` → `update` → `add` em `rows`
 * (ou a ordem que preferir); `getRowId` deve ser consistente em todas as linhas novas.
 */
export type GridRowTransaction<R extends GridValidRowModel = GridValidRowModel> = {
  add?: R[];
  update?: GridRowUpdate<R>[];
  remove?: GridRowId[];
};

/** Conteúdo do painel de detalhe (master-detail / Pro). */
export interface GridDetailPanelParams<R extends GridValidRowModel = GridValidRowModel> {
  id: GridRowId;
  row: R;
  api: GridApiCommunity<R>;
}

/** Chaves de texto substituíveis na UI da grelha (`localeText`). */
export interface GridLocaleText {
  filterPlaceholder?: string;
  columnsMenu?: string;
  columnsMenuVisibility?: string;
  loadingLabel?: string;
  noRowsLabel?: string;
  rowsPerPage?: string;
  /** Ex.: "Página {current} de {total}" */
  pageReport?: string;
  selectedRowsReport?: string;
  sortAscending?: string;
  sortDescending?: string;
  clearSort?: string;
  hideColumn?: string;
  columnMenu?: string;
  pinLeft?: string;
  pinRight?: string;
  unpinColumn?: string;
  detailPanelColumn?: string;
  expandDetail?: string;
  collapseDetail?: string;
  treeDataColumn?: string;
  expandTree?: string;
  collapseTree?: string;
  expandGroup?: string;
  collapseGroup?: string;
  /** Menu da coluna — activa a linha «Filtros no cabeçalho» e foca o filtro desta coluna. */
  filterByColumn?: string;
  columnFilterDialogTitle?: string;
  columnFilterOperatorLabel?: string;
  columnFilterValueLabel?: string;
  columnFilterApply?: string;
  columnFilterClearField?: string;
  filterEmpty?: string;
  filterNotEmpty?: string;
  filterOpContains?: string;
  filterOpEquals?: string;
  filterOpNotEquals?: string;
  filterOpStartsWith?: string;
  filterOpEndsWith?: string;
  filterMenuOnlyEmpty?: string;
  filterMenuOnlyNonEmpty?: string;
  filterBooleanTrue?: string;
  filterBooleanFalse?: string;
  filterOpIs?: string;
  filterOpNot?: string;
  filterOpAfter?: string;
  filterOpBefore?: string;
  filterOpOnOrAfter?: string;
  filterOpOnOrBefore?: string;
  filterOpInList?: string;
  filterOpSelectAny?: string;
  filterOpSelectAll?: string;
  /** Painel global de filtros (lista de `filterModel.items`). */
  filterPanelTitle?: string;
  filterPanelLogicLabel?: string;
  filterPanelLogicAnd?: string;
  filterPanelLogicOr?: string;
  filterPanelClearAll?: string;
  filterPanelEmpty?: string;
  filterPanelEdit?: string;
  filterPanelRemove?: string;
  filterPanelOpenButton?: string;
  filterPanelClose?: string;
  /** Tooltip do botão «guardar modelo de filtro» no rodapé do painel (ícone disquete). */
  filterTemplateSaveTooltip?: string;
  filterPanelAddFilter?: string;
  filterPanelAddFilterButton?: string;
  /** Campo de pesquisa para `singleSelect` assíncrono no painel de filtros. */
  filterPanelAsyncSelectSearch?: string;
  /** Placeholder quando ainda não há opções carregadas (select assíncrono). */
  filterPanelAsyncSelectEmpty?: string;
  /** Texto quando a pesquisa assíncrona ainda não foi disparada (campo vazio após debounce). */
  filterPanelAsyncSelectIdleHint?: string;
  /** Enquanto `loadEditValueOptions` está a resolver no painel de filtros. */
  filterPanelAsyncSelectLoading?: string;
  /** Secção de valores já escolhidos no multiselect assíncrono do painel / cabeçalho. */
  filterPanelAsyncMultiPicked?: string;
  /** Opção inicial «Selecionar…» no valor de filtro `singleSelect` (= / !=). */
  filterPanelValuePick?: string;
  filterPanelChooseColumn?: string;
  filterPanelGroupId?: string;
  /** Título do bloco de itens sem `groupId` quando há outros grupos definidos. */
  filterPanelUngroupedBlock?: string;
  /** Bloco fixo dos filtros criados na linha de cabeçalho (`groupId` reservado). */
  filterPanelHeaderFiltersGroup?: string;
  /** Dica no campo Grupo do bloco «Sem grupo»: atribuir número cria / associa ao grupo. */
  filterPanelUngroupedAssignHint?: string;
  /** Cabeçalho do bloco: como combinar todas as condições deste grupo (E/OU). */
  filterPanelGroupCombineLabel?: string;
  filterPanelGroupItemLogic?: string;
  filterPanelGroupBetweenLabel?: string;
  /** Ligação desta linha às anteriores **do mesmo grupo** (E/OU). */
  filterPanelLineJoinLabel?: string;
  /** Campo numérico de sequência (ordem global no modelo). */
  filterPanelOrder?: string;
  /** Rótulos curtos para selects compactos (ex.: «E» / «OU»). */
  filterPanelLogicShortAnd?: string;
  filterPanelLogicShortOr?: string;
  /** Painel de visibilidade de colunas (toolbar / MUI). */
  columnsPanelColumnTitleLabel?: string;
  columnsPanelSearchPlaceholder?: string;
  columnsPanelHideAll?: string;
  columnsPanelShowAll?: string;
  columnsPanelNoMatches?: string;
  /** Rótulo acessível da grelha (`role="grid"`). */
  gridAriaLabel?: string;
  /** Edição: combobox de `singleSelect` / boolean nativo. */
  editCellOpenSelect?: string;
  /** Rodapé de agregação (`showAggregationFooter`). */
  aggregationFooterAria?: string;
  /** Cabeçalho: arrastar para reordenar coluna (virtualização de colunas desativa DnD). */
  columnReorderAria?: string;
  /** Coluna de ações no modo edição por linha (`editMode="row"`). */
  rowEditActionsColumnHeader?: string;
  rowEditActionsSave?: string;
  rowEditActionsCancel?: string;
  /** Cabeçalho da coluna de seleção: selecionar todas as linhas da página (ou modelo servidor). */
  checkboxSelectionSelectAll?: string;
  /** Célula da coluna de seleção / rádio: selecionar esta linha. */
  checkboxSelectionSelectRow?: string;
  /** Título visível ao lado do checkbox «selecionar todas» (ex. tradução de «Selecionar»). */
  checkboxSelectionColumnTitle?: string;
  /** `aria-live`: ordenação removida (sem critérios). */
  gridAnnounceSortCleared?: string;
  /** `aria-live`: inclui `{detail}` (lista de colunas + direção). */
  gridAnnounceSortChanged?: string;
  gridAnnounceSortDirectionAsc?: string;
  gridAnnounceSortDirectionDesc?: string;
  /** `aria-live`: nenhum filtro ativo. */
  gridAnnounceFilterCleared?: string;
  /** `aria-live`: inclui `{count}` (regras + filtro rápido). */
  gridAnnounceFilterActive?: string;
  /** Toolbar: aplicar filtros de coluna à pesquisa no servidor. */
  toolbarApplyColumnFilters?: string;
  /** Tooltip quando o modelo de filtro de colunas ainda não foi aplicado à última pesquisa. */
  toolbarApplyColumnFiltersPendingTooltip?: string;
}

/** Payload ao confirmar pesquisa com `serverDrivenColumnFilters`. */
export type GridServerColumnFiltersSearchPayload<
  R extends GridValidRowModel = GridValidRowModel
> = {
  filterModel: GridFilterModel;
  sortModel: GridSortModel;
  paginationModel: GridPaginationModel;
};

/** Subconjunto imperativo da GridApi usado em produção */
export interface GridApiCommunity<R extends GridValidRowModel = GridValidRowModel> {
  getRow: (id: GridRowId) => R | undefined;
  getRowId: (row: R) => GridRowId;
  getAllColumns: () => GridColDef<R>[];
  getVisibleColumns: () => GridColDef<R>[];
  getColumn: (field: string) => GridColDef<R> | undefined;
  setColumnVisibility: (model: GridColumnVisibilityModel) => void;
  setSortModel: (model: GridSortModel) => void;
  setFilterModel: (model: GridFilterModel) => void;
  setPaginationModel: (model: GridPaginationModel) => void;
  setRowSelectionModel: (model: GridRowSelectionModel) => void;
  /** Modelo de seleção atual (equivalente MUI `getSelectedRows` / leitura do `rowSelectionModel`). */
  getRowSelectionModel: () => GridRowSelectionModel;
  exportDataAsCsv: (options?: GridCsvExportOptions) => void;
  exportDataAsExcel: (options?: GridExcelExportOptions) => Promise<void>;
  /** Imprime as linhas filtradas (sem grupos) numa janela nova; dispara `window.print()`. */
  exportDataAsPrint: (options?: GridPrintExportOptions) => void;
  /** Copia linhas selecionadas (filtradas) como TSV para a área de transferência. Sem seleção, não altera o clipboard. */
  copySelectedRowsToClipboard: () => Promise<void>;
  /** Estado atual (leitura) */
  getSortModel: () => GridSortModel;
  getFilterModel: () => GridFilterModel;
  /**
   * Com `serverDrivenColumnFilters`: `true` se `filterModel.items` difere do último conjunto aplicado
   * à pesquisa (botão «Aplicar» em destaque).
   */
  getColumnFiltersSearchPending: () => boolean;
  /** Confirma filtros de coluna e dispara `onServerColumnFiltersSearch` (e repõe página 0 se interno). */
  applyColumnFiltersSearch: () => void;
  getPaginationModel: () => GridPaginationModel;
  getColumnVisibilityModel: () => GridColumnVisibilityModel;
  setPinnedColumns: (model: GridPinnedColumns) => void;
  getPinnedColumns: () => GridPinnedColumns;
  /** Ids de linhas com painel de detalhe aberto. */
  setDetailPanelExpandedRowIds: (ids: GridRowId[]) => void;
  getDetailPanelExpandedRowIds: () => GridRowId[];
  /** Ids de linhas com ramos expandidos em modo `treeData`. */
  setTreeExpandedRowIds: (ids: GridRowId[]) => void;
  getTreeExpandedRowIds: () => GridRowId[];
  setRowGroupingModel: (model: GridRowGroupingModel) => void;
  getRowGroupingModel: () => GridRowGroupingModel;
  /** Snapshot do estado (sort, filtros, paginação, visibilidade, pin, ordem, larguras, seleção, agrupamento). */
  getStateSnapshot: () => GridStateSnapshot;
  /**
   * Subscrição a eventos. O handler recebe sempre um `GridStateSnapshot` atual.
   * - `stateChange`: qualquer alteração relevante (comportamento geral).
   * - `rowSelectionChange` / `filterChange` / `sortChange`: disparam só quando esse aspeto muda.
   * - `paginationChange` / `columnVisibilityChange` / `pinnedColumnsChange`: paginação, colunas visíveis, pin.
   * - `columnOrderChange` / `rowGroupingModelChange`: ordem de colunas e agrupamento.
   * - `columnSizingChange`: redimensionamento de colunas.
   * - `densityChange` / `rowModesModelChange`: densidade e edição por linha.
   */
  subscribeEvent: (
    event: GridSubscriptionEvent,
    handler: (snapshot: GridStateSnapshot) => void
  ) => () => void;
  scroll: (position: GridScrollPosition) => void;
  scrollToIndexes: (options: GridScrollToIndexesOptions) => void;
  scrollToRow: (id: GridRowId, colIndex?: number) => void;
  /**
   * Foca a célula (tabIndex); `id` é o da linha de dados (`getRowId`).
   * `horizontalScrollSnapshots`: valores de `scrollLeft` capturados antes do foco — repostos após
   * `focus({ preventScroll })` (e num `rAF`) para evitar salto quando há vários scrollports horizontais.
   */
  setCellFocus: (params: {
    id: GridRowId;
    field: string;
    horizontalScrollSnapshots?: ReadonlyArray<{ el: HTMLElement; left: number }>;
  }) => void;
  /**
   * Entra em modo edição na célula (como duplo clique). Requer `editable`, `processRowUpdate` e editor suportado.
   * @returns `false` se a linha não existir, for grupo, ou a coluna não for editável.
   */
  startCellEditMode: (params: { id: GridRowId; field: string }) => boolean;
  /** Sai do modo edição sem gravar (equivalente a Escape). */
  stopCellEditMode: () => void;
  /** Modo da célula (MUI: `getCellMode`). */
  getCellMode: (params: { id: GridRowId; field: string }) => "edit" | "view";
  /**
   * Atualiza o valor em edição (`onRowsChange` / `updateRows`). Sem `onRowsChange`, não faz efeito.
   * Não valida — use `processRowUpdate` no fluxo de saída de edição.
   */
  setEditCellValue: (params: { id: GridRowId; field: string; value: unknown }) => boolean;
  /**
   * Abre o painel global de filtros (lista de filtros por coluna) e fecha o diálogo de filtro por coluna, se estiver aberto.
   * @param anchor elemento âncora para posicionar o popover (ex.: botão «Filtros»).
   */
  showFilterPanel: (anchor?: HTMLElement | null) => void;
  /** Fecha o painel global de filtros e o diálogo de filtro por coluna. */
  hideFilterPanel: () => void;
  /** Abre o painel de visibilidade de colunas (âncora opcional, ex. botão da toolbar). */
  showColumnsPanel: (anchor?: HTMLElement | null) => void;
  /** Fecha o menu de colunas. */
  hideColumnsPanel: () => void;
  /**
   * Pedido ao ascendente para fundir alterações nas linhas (`onRowsChange`). Sem callback, não faz efeito.
   */
  updateRows: (updates: GridRowUpdate<R>[]) => void;
  /**
   * Pedido ao ascendente para aplicar add/update/remove (`onRowTransaction`). Sem callback, não faz efeito.
   */
  applyTransaction: (transaction: GridRowTransaction<R>) => void;
  /**
   * Modo de edição por linha (MUI X). `setRowModesModel` funde com o modelo atual quando usas atualizador em função.
   */
  setRowModesModel: (
    model: GridRowModesModel | ((prev: GridRowModesModel) => GridRowModesModel)
  ) => void;
  getRowModesModel: () => GridRowModesModel;
  /**
   * Grava a linha em edição (`processRowUpdate` / `onRowsChange`) e sai do modo `Edit`.
   * Sem linha em edição ou sem pipeline de gravação, não faz efeito.
   */
  commitRowEditSave: (rowId: GridRowId) => Promise<void>;
  setDensity: (density: GridDensity) => void;
  getDensity: () => GridDensity;
}
