import type * as React from "react";
import type {
  GridAggregationModel,
  GridApiCommunity,
  GridCellParams,
  GridColDef,
  GridColumnHeaderParams,
  GridColumnOrderChangeParams,
  GridColumnResizeParams,
  GridColumnVisibilityModel,
  GridDensity,
  GridDetailPanelParams,
  GridChartsConfig,
  GridFilterModel,
  GridLocaleText,
  GridPaginationMeta,
  GridPaginationModel,
  GridPivotModel,
  GridPinnedColumns,
  GridRowClassNameParams,
  GridRowGroupingModel,
  GridRowId,
  GridRowEditStopParams,
  GridRowModesModel,
  GridRowParams,
  GridRowSelectionModel,
  GridRowTransaction,
  GridRowUpdate,
  GridSortModel,
  GridStateSnapshot,
  GridValidRowModel
} from "./types";
import type { PersistedGridPreferences } from "./persistGridPreferences";
import type { GridDensityDimensionsProp } from "./gridDensityDefaults";

export type { GridDensity };

/** Slot com props vindas de `slotProps` (ex.: `loadingOverlay`). */
export type GridOverlaySlotComponent = React.ComponentType<Record<string, unknown>>;

/** Props do slot `footer` (o `api` é injetado pela grelha). */
export type GridFooterSlotProps<R extends GridValidRowModel = GridValidRowModel> = {
  api: GridApiCommunity<R>;
};

/**
 * Props do slot `pagination` quando se substitui o rodapé de paginação predefinido.
 * Textos como `pageReportText` já vêm respeitando `localeText`.
 */
export type GridPaginationSlotProps<R extends GridValidRowModel = GridValidRowModel> = {
  api: GridApiCommunity<R>;
  paginationModel: GridPaginationModel;
  pageCount: number;
  pageSizeOptions: number[];
  canPreviousPage: boolean;
  canNextPage: boolean;
  selectedRowCount: number;
  hideSelectionCount: boolean;
  pageReportText: string;
  /** `null` quando não deve mostrar o prefixo de linhas selecionadas. */
  selectedRowsReportText: string | null;
  rowsPerPageLabel: string;
  goFirst: () => void;
  goPrev: () => void;
  goNext: () => void;
  goLast: () => void;
  setPageSize: (size: number) => void;
  /** Total conhecido no servidor (`rowCount` ≥ 0); `null` ou omitido quando só há estimativa / `paginationMeta`. */
  rowCountTotal?: number | null;
  /** Cópia do prop da grelha (rodapé custom pode mostrar «≈ N linhas» ou `hasNextPage`). */
  paginationMeta?: GridPaginationMeta;
};

/** Props do slot `filterPanel` (painel global de `filterModel.items`). */
export type GridFilterPanelSlotProps<R extends GridValidRowModel = GridValidRowModel> = {
  api: GridApiCommunity<R>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterModel: GridFilterModel;
  columns: GridColDef<R>[];
  onCommit: (next: GridFilterModel) => void;
  /**
   * Abre o diálogo de filtro por coluna (menu ⋮). O painel global predefinido já não depende disto para editar linhas.
   */
  onEditColumnFilter: (field: string) => void;
  lt: (key: keyof GridLocaleText, fallback: string) => string;
  /** Âncora visual do popover (último botão «Filtros» / ícone da toolbar). */
  anchorRef?: React.RefObject<HTMLElement | null>;
};

/**
 * Ações da linha em `editMode="row"` (botões gravar/cancelar).
 * Por defeito a grelha usa `GridDefaultRowEditActions`; pode substituir-se por `slots.rowEditActions`.
 */
export type GridRowEditActionsSlotProps<R extends GridValidRowModel = GridValidRowModel> = {
  api: GridApiCommunity<R> | null;
  id: GridRowId;
  row: R;
  /** Sai do modo edição da linha (alterações já consolidadas via `processRowUpdate` por célula). */
  saveRowEdit: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  /** Sai do modo edição sem lógica extra na grelha — o ascendente pode reverter em `onRowEditStop`. */
  cancelRowEdit: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  lt: (key: keyof GridLocaleText, fallback: string) => string;
};

export type GridPivotPanelSlotProps<R extends GridValidRowModel = GridValidRowModel> = {
  api: GridApiCommunity<R>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pivotModel: GridPivotModel;
  onCommitPivotModel: (model: GridPivotModel) => void;
};

export type GridChartsPanelSlotProps<R extends GridValidRowModel = GridValidRowModel> = {
  api: GridApiCommunity<R>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chartsConfig: GridChartsConfig | undefined;
};

export type GridSlots<R extends GridValidRowModel = GridValidRowModel> = {
  toolbar?: React.ComponentType<unknown> | (() => React.ReactNode);
  loadingOverlay?: GridOverlaySlotComponent;
  noRowsOverlay?: GridOverlaySlotComponent;
  footer?: React.ComponentType<GridFooterSlotProps<R>>;
  pagination?: React.ComponentType<GridPaginationSlotProps<R>>;
  filterPanel?: React.ComponentType<GridFilterPanelSlotProps<R>>;
  /** Substituir botões predefinidos de edição por linha (`editMode="row"` + `showRowEditActions`). */
  rowEditActions?: React.ComponentType<GridRowEditActionsSlotProps<R>>;
  /** Painel de pivotagem (DataGrid Premium / paridade MUI). */
  pivotPanel?: React.ComponentType<GridPivotPanelSlotProps<R>>;
  /** Painel de gráficos ligado ao estado da grelha. */
  chartsPanel?: React.ComponentType<GridChartsPanelSlotProps<R>>;
};

export type GridSlotProps<R extends GridValidRowModel = GridValidRowModel> = {
  /** Atributos no contentor à volta do `slots.toolbar`. */
  toolbar?: React.HTMLAttributes<HTMLDivElement>;
  loadingOverlay?: React.HTMLAttributes<HTMLDivElement>;
  noRowsOverlay?: React.HTMLAttributes<HTMLDivElement>;
  footer?: Omit<Partial<GridFooterSlotProps<R>>, "api">;
  pagination?: Omit<Partial<GridPaginationSlotProps<R>>, "api">;
  filterPanel?: Omit<
    Partial<GridFilterPanelSlotProps<R>>,
    "api" | "open" | "onOpenChange" | "filterModel" | "columns" | "onCommit" | "onEditColumnFilter" | "lt"
  >;
  pivotPanel?: Omit<Partial<GridPivotPanelSlotProps<R>>, "api" | "open" | "onOpenChange" | "pivotModel" | "onCommitPivotModel">;
  chartsPanel?: Omit<Partial<GridChartsPanelSlotProps<R>>, "api" | "open" | "onOpenChange">;
};

export type GridFeatureMode = "client" | "server";

/**
 * Tokens de apresentação de linha (hover, seleção, edição) — aplicados como variáveis CSS no contentor `.hive-data-grid`.
 * Sobrescrevem os predefinidos em `hive-data-grid-theme.css` (`--hive-grid-row-*`).
 */
export type DataGridRowPresentation = {
  /** `--hive-grid-row-hover-bg` (ex. `hsl(var(--muted) / 0.35)`). */
  rowHoverBg?: string;
  /** `--hive-grid-row-selected-bg`. */
  rowSelectedBg?: string;
  /** `--hive-grid-row-editing-bg` (linha em `editMode="row"`). */
  rowEditingBg?: string;
  /** `--hive-grid-row-editing-ring` (contorno da linha em edição). */
  rowEditingRing?: string;
};

export interface DataGridProps<R extends GridValidRowModel = GridValidRowModel> {
  /** Linhas (equivalente a `rows` do MUI X) */
  rows: R[];
  /** Definição de colunas (equivalente a `columns`) */
  columns: GridColDef<R>[];

  /** Estado de carregamento */
  loading?: boolean;

  /** Função id estável por linha (por defeito: `row.id` ou índice) */
  getRowId?: (row: R) => GridRowId;

  /** Ref imperativa compatível com `useGridApiRef` */
  apiRef?: React.MutableRefObject<GridApiCommunity<R> | null>;

  /** Ordenação */
  sortModel?: GridSortModel;
  onSortModelChange?: (model: GridSortModel) => void;
  sortingMode?: GridFeatureMode;
  /**
   * Ordem de prioridade das direções ao alternar ordenação (ex.: `["asc","desc"]`).
   * O primeiro valor define se a primeira ordenação é descendente (`sortDescFirst` no TanStack).
   */
  sortingOrder?: Array<"asc" | "desc" | null>;
  /** Desativa ordenação em todas as colunas (sobreposto por `sortable: false` na coluna). */
  disableColumnSort?: boolean;

  /** Filtros */
  filterModel?: GridFilterModel;
  onFilterModelChange?: (model: GridFilterModel) => void;
  filterMode?: GridFeatureMode;
  disableColumnFilter?: boolean;
  /** Alinhamento da pesquisa rápida na linha integrada `GridToolbarFilterColumnsDensityRow` (`start` = após os botões; `end` = `ml-auto`). */
  toolbarQuickFilterAlign?: "start" | "end";
  /** Na linha integrada, mostrar rótulo de texto curto junto aos ícones (Colunas, Filtros, …). */
  toolbarShowButtonLabels?: boolean;
  /** Segunda linha de filtros no cabeçalho (MVP: um filtro activo por campo). */
  headerFiltersEnabled?: boolean;
  onHeaderFiltersEnabledChange?: (enabled: boolean) => void;
  /** Texto rápido (equivalente a quick filter em várias versões MUI) */
  quickFilterValue?: string;
  onQuickFilterValueChange?: (value: string) => void;

  /**
   * Activa capacidades de pivotagem (toolbar + motor). Por defeito `false`.
   * Com `pivotActive` e `pivotModel`, a grelha mostra o dataset pivotado.
   */
  pivoting?: boolean;
  /** Pivotagem (Premium / paridade MUI). */
  pivotModel?: GridPivotModel;
  onPivotModelChange?: (model: GridPivotModel) => void;
  pivotActive?: boolean;
  onPivotActiveChange?: (active: boolean) => void;
  pivotPanelOpen?: boolean;
  onPivotPanelOpenChange?: (open: boolean) => void;

  /**
   * Integração de gráficos: `true` usa configuração mínima; objecto define eixos por defeito.
   * Requer dependência `recharts` no pacote da app (peer) ou no hive.
   */
  chartsIntegration?: boolean | GridChartsConfig;

  /** Paginação */
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  paginationMode?: GridFeatureMode;
  /**
   * Modo servidor: total de linhas (para calcular páginas).
   * Omitir ou usar valor negativo quando o total for desconhecido — usar `paginationMeta`.
   */
  rowCount?: number;
  /**
   * Modo servidor sem `rowCount` exato: `hasNextPage` e/ou `estimatedRowCount` (estilo MUI X).
   */
  paginationMeta?: GridPaginationMeta;
  pageSizeOptions?: number[];
  pagination?: boolean;
  hideFooter?: boolean;
  hideFooterPagination?: boolean;
  hideFooterSelectedRowCount?: boolean;

  /** Seleção */
  checkboxSelection?: boolean;
  /**
   * Seleção única com rádio por linha (sem cabeçalho «selecionar todas»). Não combinar com `checkboxSelection`;
   * se ambos forem verdadeiros, prevalece a coluna de checkboxes.
   */
  radioSelection?: boolean;
  rowSelectionModel?: GridRowSelectionModel;
  onRowSelectionModelChange?: (model: GridRowSelectionModel) => void;
  disableMultipleRowSelection?: boolean;
  /**
   * Se `true`, cliques na linha não alteram a seleção (útil com checkboxes).
   * Sem coluna de seleção: com `onRowSelectionModelChange` definido, a seleção por clique na linha
   * (Ctrl/Shift) só está ativa quando isto é `false` ou omitido.
   */
  disableRowSelectionOnClick?: boolean;
  /**
   * Modo servidor com `rowCount` ≥ 0: o checkbox do cabeçalho da coluna de seleção passa a selecionar ou limpar
   * **todas** as linhas (`{ type: 'exclude', ids: [] }` / `{ type: 'include', ids: [] }`). Requer `onRowSelectionModelChange`.
   */
  checkboxSelectionSelectAllPages?: boolean;
  isRowSelectable?: (params: { id: GridRowId; row: R }) => boolean;

  /** Visibilidade de colunas */
  columnVisibilityModel?: GridColumnVisibilityModel;
  onColumnVisibilityModelChange?: (model: GridColumnVisibilityModel) => void;

  /** Redimensionamento e ordem de colunas (DataGrid Pro) */
  disableColumnResize?: boolean;
  onColumnWidthChange?: (params: GridColumnResizeParams) => void;
  onColumnOrderChange?: (params: GridColumnOrderChangeParams) => void;
  /**
   * Se `true`, desativa arrastar cabeçalhos para reordenar colunas e **não monta** `DndContext`.
   * Predefinição `false`: reordenação por arrasto ativa (sensores só existem enquanto o DnD está montado).
   * Usa `disableColumnReorder` (ou `true`) para desligar em ambientes onde não queres DnD.
   */
  disableColumnReorder?: boolean;

  /** Colunas fixas (pin) esquerda / direita — ids = `field` (ou `__select__`). */
  pinnedColumns?: GridPinnedColumns;
  onPinnedColumnsChange?: (model: GridPinnedColumns) => void;
  /** Desativa pinning (ignora `pinnedColumns`). */
  disableColumnPinning?: boolean;

  /** Virtualização (MUI: `disableVirtualization` true desativa) */
  disableVirtualization?: boolean;

  /**
   * Se true, a grelha expande em altura com todas as linhas da página atual (sem scroll vertical interno;
   * mantém scroll horizontal quando necessário). Desativa a virtualização de linhas (comportamento alinhado ao MUI X).
   */
  autoHeight?: boolean;
  /**
   * Com `autoHeight`: altura máxima em px do contentor (scroll vertical interno além deste teto).
   */
  autoHeightMaxHeight?: number;
  rowHeight?: number;
  columnHeaderHeight?: number;
  /**
   * Distância em px ao fim do scroll vertical para disparar `onRowsScrollEnd` (ex.: lazy load).
   * Se `onRowsScrollEnd` estiver definido e este valor for omitido, usa-se **200** por defeito.
   */
  scrollEndThreshold?: number;
  /** Chamado quando o utilizador aproxima-se do fim do scroll (ver `scrollEndThreshold`). */
  onRowsScrollEnd?: () => void;

  /** Densidade */
  density?: GridDensity;
  /** Chamado quando a densidade muda (toolbar, API `setDensity`, ou estado interno). */
  onDensityChange?: (density: GridDensity) => void;
  /**
   * Sobrescreve dimensões por densidade (`rowFactor`, `baseRowPx`, `defaultHeaderPx`).
   * Valores em falta usam os predefinidos exportados em `gridDensityDefaults.ts`.
   */
  densityDimensions?: GridDensityDimensionsProp | null;

  /**
   * `cell`: edição por célula (duplo clique). `row`: duplo clique abre edição em todas as células editáveis da linha (MUI X).
   */
  editMode?: "cell" | "row";
  /** Controlado: quais linhas estão em modo `edit` vs `view` quando `editMode="row"`. */
  rowModesModel?: GridRowModesModel;
  onRowModesModelChange?: (model: GridRowModesModel) => void;
  /**
   * Quando uma linha entra em modo edição (`editMode="row"`).
   * O segundo argumento existe quando o evento vem da UI (ex.: duplo clique).
   */
  onRowEditStart?: (params: GridRowParams<R>, event?: React.SyntheticEvent) => void;
  /**
   * Quando uma linha sai do modo edição (gravar, cancelar, API, Escape, clique fora).
   * `params.previousRow` é uma cópia rasa da linha ao **início** da edição por linha (reverter cancelamentos).
   * O segundo argumento existe quando o evento vem da UI.
   */
  onRowEditStop?: (params: GridRowEditStopParams<R>, event?: React.SyntheticEvent) => void;
  /**
   * Com `editMode="row"`: mostrar coluna à direita com ações (Gravar/Cancelar).
   * Por defeito `true` em modo linha; definir `false` para usar só API/slots à medida.
   */
  showRowEditActions?: boolean;
  /**
   * Com `editMode="row"`: ao sair da edição por clique fora (`rowFocusOut`), grava cada linha em edição
   * como o botão Gravar (`processRowUpdate` / `onRowsChange`). Escape e Cancelar não são afetados.
   * Predefinição `false`.
   */
  commitRowEditOnBlur?: boolean;
  /**
   * Linha rascunho (ex.: `getRowId === 0`): ao sair da edição sem gravar (blur, Escape, Tab a sair da linha),
   * chama-se `onDismiss` para o ascendente remover a linha dos `rows`. Não corre em `saveButtonClick` nem `cancelButtonClick`.
   */
  dismissDraftRowOnEditExit?: {
    draftRowId: GridRowId;
    onDismiss: (id: GridRowId) => void;
  };

  /** Menu de colunas / seletor */
  disableColumnSelector?: boolean;
  disableColumnMenu?: boolean;
  /**
   * Esconde o seletor de densidade na UI predefinida (paridade MUI `disableDensitySelector`).
   * Predefinição `false`: o `GridToolbarDensitySelector` pode ser usado na toolbar.
   */
  disableDensitySelector?: boolean;
  /**
   * Quando `true`, não renderiza a faixa interna com filtro rápido + botão «Filtros» + «Colunas»
   * (usar `slots.toolbar` com `GridToolbar` + `GridToolbarQuickFilter`).
   */
  hideBuiltInFilterAndColumnsRow?: boolean;
  /**
   * Quando `true`, a faixa superior (toolbar + filtro/colunas/densidade + `children`) fica `position: sticky`
   * no contentor de scroll ascendente (útil em páginas longas). Predefinição `false`.
   */
  stickyToolbar?: boolean;

  /** Classe e estilo no root */
  className?: string;
  style?: React.CSSProperties;
  /** @deprecated v2: ignorado — usar `className` / Tailwind no consumidor. */
  sx?: Record<string, unknown>;

  /** Slots (toolbar, overlays, rodapé, paginação, etc.) */
  slots?: GridSlots<R>;
  /**
   * Props extra dos slots. Overlay: atributos do div envolvente + repassados ao componente.
   * `footer` / `pagination`: mesclados com as props injetadas (exceto `api`).
   */
  slotProps?: GridSlotProps<R>;

  /** Textos da UI (substituições localizadas). */
  localeText?: Partial<GridLocaleText>;

  /** Clique na linha (ignora interação em botões/checkbox dentro da linha). */
  onRowClick?: (params: GridRowParams<R>) => void;
  onRowDoubleClick?: (params: GridRowParams<R>) => void;
  /**
   * Classes CSS por linha (MUI X). `indexRelativeToCurrentPage` é o índice na página atual (0-based).
   */
  getRowClassName?: (params: GridRowClassNameParams<R>) => string;
  /**
   * Classes CSS por célula ao nível da grelha (MUI X); combina-se com `cellClassName` / `getCellClassName` da coluna.
   */
  getCellClassName?: (params: GridCellParams<R>) => string;
  /**
   * Predicado global de editabilidade (MUI X); combina-se com `editable` / `isCellEditable` na coluna.
   */
  isCellEditable?: (params: GridCellParams<R>) => boolean;
  /**
   * Com `editMode="row"`: após `fieldToFocus` da entrada falhar (ex. `isCellEditable` falso para «order»),
   * tentar estes `field` por ordem antes da varredura por colunas folha visíveis. Ex.: `["locked"]` para focar «Travado».
   */
  rowEditInitialFieldCandidates?: string[];
  /**
   * Cores / transparências de linha (hover, seleção, edição) como tokens CSS no contentor da grelha.
   */
  rowPresentation?: DataGridRowPresentation;
  /**
   * Rótulo acessível da linha (`aria-label` no `role="row"`). Alinhado ao MUI X (`getRowAriaLabel`).
   * Útil quando o leitor de ecrã deve identificar a linha além das células individuais.
   */
  getRowAriaLabel?: (params: GridRowParams<R>) => string;
  onCellClick?: (params: GridCellParams<R>) => void;
  onCellDoubleClick?: (params: GridCellParams<R>) => void;
  /** Teclado na célula (linhas de dados; não agrupadas). */
  onCellKeyDown?: (params: GridCellParams<R>, event: React.KeyboardEvent) => void;
  /**
   * Clique na área do título da coluna (não no menu ⋮ nem no separador de redimensionar).
   * `preventDefault` no evento impede a alternância de ordenação quando a coluna é ordenável em modo cliente.
   */
  onColumnHeaderClick?: (params: GridColumnHeaderParams<R>, event: React.MouseEvent) => void;
  /**
   * Notificação quando o estado principal da grelha muda (equivalente lógico a `subscribeEvent('stateChange')`).
   * O snapshot inclui `columnOrder` (ordem atual das colunas, ex. após DnD) e `columnSizing` (larguras persistíveis).
   * Use `useCallback` para evitar reexecuções desnecessárias; internamente é invocado via ref estável.
   */
  onStateChange?: (snapshot: GridStateSnapshot) => void;

  /**
   * Após edição de célula (duplo clique em coluna `editable: true`). O pai deve atualizar `rows` com o valor devolvido.
   * Se a Promise for rejeitada, a célula mantém-se em modo edição.
   */
  processRowUpdate?: (newRow: R, oldRow: R) => Promise<R> | R;

  /**
   * Chamado por `api.updateRows`. Fundir cada entrada em `rows` pela mesma `getRowId` (ex.: `{ ...row, ...omitId(u) }`).
   */
  onRowsChange?: (updates: GridRowUpdate<R>[]) => void;

  /**
   * Chamado por `api.applyTransaction`. Aplicar remoções, fundir `update` por `id` e acrescentar `add` a `rows`.
   */
  onRowTransaction?: (transaction: GridRowTransaction<R>) => void;

  /**
   * Painel de detalhe por linha (master-detail). Se definido, aparece coluna com ícone para expandir.
   * Retornar `null` para não mostrar painel nessa linha (comportamento dinâmico).
   */
  getDetailPanelContent?: (params: GridDetailPanelParams<R>) => React.ReactNode;
  /** Altura mínima do painel em px (por defeito automático). */
  getDetailPanelHeight?: (params: GridDetailPanelParams<R>) => number;
  /** Controlado: ids de linhas com painel aberto. */
  detailPanelExpandedRowIds?: GridRowId[];
  onDetailPanelExpandedRowIdsChange?: (ids: GridRowId[]) => void;
  /** Se false, a linha não pode abrir o painel (quando `getDetailPanelContent` existe). Por defeito: todas. */
  isDetailPanelExpandable?: (params: { id: GridRowId; row: R }) => boolean;

  /**
   * Dados em árvore (linhas planas + caminho por linha, estilo MUI X Pro).
   * Quando `treeData` é true, `getDetailPanelContent` e `rowGroupingModel` são ignorados (o estado `expanded` do TanStack não pode servir vários modos em simultâneo).
   */
  treeData?: boolean;
  /** Caminho do nó até à raiz; o último elemento deve coincidir com `getRowId(row)`. */
  getTreeDataPath?: (row: R) => readonly GridRowId[];
  /** Controlado: ids de linhas com filhos visíveis (ramo expandido). */
  treeExpandedRowIds?: GridRowId[];
  onTreeExpandedRowIdsChange?: (ids: GridRowId[]) => void;

  /**
   * Agrupamento de linhas (estilo MUI Premium). Ignorado quando `treeData` está ativo.
   * Usa `getGroupedRowModel` do TanStack; colunas agrupadas são reordenadas para o início (`groupedColumnMode: reorder`).
   */
  rowGroupingModel?: GridRowGroupingModel;
  onRowGroupingModelChange?: (model: GridRowGroupingModel) => void;
  /** Agregações por campo (só têm efeito visível com linhas de grupo ou com `showAggregationFooter`). */
  aggregationModel?: GridAggregationModel;
  /** Linha de rodapé com totais/agregados (TanStack `footer` + `getFooterGroups`). */
  showAggregationFooter?: boolean;

  /** Estado inicial (subconjunto) */
  initialState?: {
    pagination?: { paginationModel?: GridPaginationModel };
    sorting?: { sortModel?: GridSortModel };
    filter?: { filterModel?: GridFilterModel; headerFiltersEnabled?: boolean };
    detailPanel?: { expandedRowIds?: GridRowId[] };
    treeData?: { expandedRowIds?: GridRowId[] };
    rowGrouping?: { model?: GridRowGroupingModel };
    columns?: {
      columnVisibilityModel?: GridColumnVisibilityModel;
      columnOrder?: string[];
      /** Larguras iniciais (px) por `field`, alinhado ao estado TanStack `columnSizing`. */
      columnSizing?: Record<string, number>;
      pinnedColumns?: GridPinnedColumns;
    };
    /** Quando `density` não é passado como prop controlada. */
    density?: GridDensity;
    /** Quando `editMode` não é passado como prop. */
    editMode?: "cell" | "row";
    /** Quando `rowModesModel` não é controlado pelo pai. */
    rowModesModel?: GridRowModesModel;
    /** Quando `rowHeight` / `columnHeaderHeight` não são props controladas. */
    rowHeight?: number;
    columnHeaderHeight?: number;
  };

  /**
   * Export CSV: nome do ficheiro por defeito e BOM UTF-8 (`false` = ficheiro sem BOM, útil para pipelines Unix).
   */
  csvOptions?: { fileName?: string; utf8WithBom?: boolean };
  /** Export Excel (.xlsx): nome do ficheiro e da folha por defeito. */
  excelOptions?: { fileName?: string; sheetName?: string };

  /**
   * Se true, desativa Ctrl/Cmd+C para copiar linhas selecionadas (TSV) quando o rato está sobre a grelha.
   * Só aplica com `checkboxSelection` (há modelo de seleção). Não interfere se existir texto selecionado na página.
   */
  disableClipboardCopy?: boolean;
  /**
   * Se true, desativa o colar TSV multi-célula a partir da célula focada (com `onRowsChange` / `processRowUpdate`).
   * Por defeito é falso: o texto é repartido por linhas (`\\n`) e colunas (`\\t`) sobre as colunas editáveis visíveis.
   */
  disableClipboardPaste?: boolean;
  /**
   * Chamado após um colar na grelha (fora de inputs), com o texto bruto da área de transferência.
   * Quando o colar multi-célula está ativo, também corre depois das atualizações aplicadas.
   */
  onClipboardPaste?: (params: { text: string }) => void;

  /**
   * Se true, desativa a região `aria-live="polite"` que anuncia mudanças de ordenação e filtros
   * (leitores de ecrã). Por defeito é falso.
   */
  disableAccessibilityAnnouncements?: boolean;

  /** Children (raramente usados no MUI DataGrid) */
  children?: React.ReactNode;

  /**
   * Virtualização horizontal de colunas (muitas colunas / largura total grande).
   * Só tem efeito com virtualização de linhas ativa, **sem** colunas fixas (pin).
   * Reordenar colunas por arrastar fica desativado neste modo.
   */
  columnVirtualization?: boolean;

  /**
   * Altura estimada por linha quando a virtualização está ativa (ex.: linhas com alturas diferentes).
   * Se omitido, usa-se `rowHeight` / densidade.
   * O valor devolvido deve ser a altura à **densidade standard** (como `rowHeight`); a grelha aplica o fator de densidade.
   * Recebe `densityFactor` (ex.: compacto 0,7) para casos em que o cálculo depende da densidade.
   */
  getEstimatedRowHeight?: (params: {
    index: number;
    row: R;
    id: GridRowId;
    densityFactor: number;
  }) => number;

  /**
   * Mede a altura real de cada linha (`measureElement` do virtualizer). Útil quando `getEstimatedRowHeight`
   * é aproximado ou as alturas mudam após render (ex.: quebra de texto).
   * Incompatível com altura fixa uniforme otimizada — pode impactar desempenho.
   */
  enableVariableRowHeight?: boolean;

  /**
   * Chave para gravar/ler **apenas** `filterModel` em `localStorage` quando `filterModel` não é controlado por prop
   * e **não** existe `preferencesKey` (com `preferencesKey`, o filtro faz parte do JSON de preferências).
   */
  filterPersistenceKey?: string;
  /**
   * Chave em `localStorage` (ou `preferencesStorage`) para gravar/ler preferências (`sortModel`, filtros, etc.).
   * Inclui `columnOrder` (sempre que há chave), `columnSizing` (larguras de dados) e `rowGroupingModel` quando o agrupamento não é controlado por prop.
   * Só persiste os restantes campos quando **não controlados** por props.
   */
  preferencesKey?: string;
  /** Storage a usar (por defeito `localStorage` no browser). */
  preferencesStorage?: Storage | null;
  /** Debounce em ms antes de gravar (por defeito 400). */
  preferencesDebounceMs?: number;
  /** Notificação após persistência bem-sucedida. */
  onPreferencesChange?: (prefs: PersistedGridPreferences) => void;
  /**
   * Preferências por defeito quando não há entrada em storage ou quando falta um campo no JSON.
   * Usar com `preferencesKey` (campos do storage sobrepõem os defaults).
   */
  defaultPreferences?: Omit<PersistedGridPreferences, "v">;
}
