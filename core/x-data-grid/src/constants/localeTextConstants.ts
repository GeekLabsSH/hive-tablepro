import { GridLocaleText } from '../models/api/gridLocaleTextApi';

const locale = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;

function validationLocale(en: string, es: string, pt: string) {
  if (locale != undefined && (locale === 'en' || locale === 'es')) {
    if (locale === 'en') {
      return en;
    } else if (locale === 'es') {
      return es;
    }
  }
  return pt;
}

export const GRID_DEFAULT_LOCALE_TEXT: GridLocaleText = {
  // Root
  noRowsLabel: validationLocale('No rows', 'Sin filas', 'Nenhuma linha'),
  noResultsOverlayLabel: validationLocale('No results found.', 'Resultados no encontrados', 'Nenhum resultado encontrado.'),

  // Density selector toolbar button text
  toolbarDensity: validationLocale('Density', 'Densidad', 'Densidade'),
  toolbarDensityLabel: validationLocale('Density', 'Densidad', 'Densidade'),
  toolbarDensityCompact: validationLocale('Compact', 'Compacto', 'Compacto'),
  toolbarDensityStandard: validationLocale('Standard', 'Estándar', 'Padrão'),
  toolbarDensityComfortable: validationLocale('Comfortable', 'Cómodo', 'Confortável'),

  // Columns selector text
  toolbarColumns: validationLocale('Columns', 'Columnas', 'Colunas'),
  toolbarColumnsLabel: validationLocale('Select columns', 'Seleccionar columnas', 'Selecionar colunas'),

  // Filters toolbar button text
  toolbarFilters: validationLocale('Filters', 'Filtros', 'Filtros'),
  toolbarFiltersLabel: validationLocale('Show filters', 'Mostrar filtros', 'Mostrar filtros'),
  toolbarFiltersTooltipHide: validationLocale('Hide Filters', 'Ocultar filtros', 'Ocultar filtros'),
  toolbarFiltersTooltipShow: validationLocale('Show Filters', 'Mostrar filtros', 'Mostrar filtros'),
  toolbarFiltersTooltipActive: (count) =>
    count !== 1
      ? validationLocale(`${count} active filters`, `${count} filtros ativos`, `${count} filtros activos`)
      : validationLocale(`${count} active filter`, `${count} filtro ativo`, `${count} filtro activo`),

  // Quick filter toolbar field
  toolbarQuickFilterPlaceholder: validationLocale('Search...', 'Buscar...', 'Pesquisar...'),
  toolbarQuickFilterLabel: validationLocale('Search', 'Buscar', 'Pesquisar'),
  toolbarQuickFilterDeleteIconLabel: validationLocale('Clear', 'Limpiar', 'Limpar'),

  // Export selector toolbar button text
  toolbarExport: validationLocale('Export', 'Exportar', 'Exportar'),
  toolbarExportLabel: validationLocale('Export', 'Exportar', 'Exportar'),
  toolbarExportCSV: validationLocale('Download as CSV', 'Descargar como CSV', 'Baixar como CSV'),
  toolbarExportPrint: validationLocale('Print', 'Imprimir', 'Imprimir'),
  toolbarExportExcel: validationLocale('Download as Excel', 'Descargar como Excel', 'Baixar como Excel'),

  // Filter panel text
  filterPanelAddFilter: validationLocale('Add filter', 'Agregar filtro', 'Adicionar filtro'),
  filterPanelDeleteIconLabel: validationLocale('Delete', 'Eliminar', 'Excluir'),
  filterPanelLogicOperator: validationLocale('Logic operator', 'Operador lógico', 'Operador lógico'),
  filterPanelOperator: validationLocale('Operator', 'Operador', 'Operador'),
  filterPanelOperatorAnd: validationLocale('And', 'Y', 'E'),
  filterPanelOperatorOr: validationLocale('Or', 'O', 'Ou'),
  filterPanelColumns: validationLocale('Columns', 'Columnas', 'Colunas'),
  filterPanelInputLabel: validationLocale('Value', 'Valor', 'Valor'),
  filterPanelInputPlaceholder: validationLocale('Filter value', 'Valor del filtro', 'Valor do filtro'),

  // Filter operator text
  filterOperatorContains: validationLocale('Contains', 'Contiene', 'Contém'),
  filterOperatorEquals: validationLocale('Equals', 'Es igual a', 'Igual a'),
  filterOperatorStartsWith: validationLocale('Starts with', 'Comienza con', 'Começa com'),
  filterOperatorEndsWith: validationLocale('Ends with', 'Termina con', 'Termina com'),
  filterOperatorIs: validationLocale('Is', 'Es', 'É'),
  filterOperatorNot: validationLocale('Not', 'No es', 'Não é'),
  filterOperatorOnOrAfter: validationLocale('On or after', 'En o después de', 'Em ou após'),
  filterOperatorBefore: validationLocale('Before', 'Antes de', 'Antes de'),
  filterOperatorIsEmpty: validationLocale('Is empty', 'Está vacío', 'Está vazio'),
  filterOperatorIsNotEmpty: validationLocale('Is not empty', 'No está vacío', 'Não está vazio'),
  filterValueAny: validationLocale('Any', 'Cualquier', 'Qualquer'),
  filterValueTrue: validationLocale('True', 'Verdadero', 'Verdadeiro'),
  filterValueFalse: validationLocale('False', 'Falso', 'Falso'),
  filterOperatorAfter: validationLocale('After', 'Después', 'Depois'),
  filterOperatorOnOrBefore: validationLocale('On or before', 'En o antes', 'Em ou antes'),
  filterOperatorIsAnyOf: validationLocale('Is any of', 'Es cualquiera de', 'É qualquer um de'),

  // Columns panel text
  columnsPanelTextFieldLabel: validationLocale('Column title', 'Título de columna', 'Título da coluna'),
  columnsPanelTextFieldPlaceholder: validationLocale('Title', 'Título', 'Título'),
  columnsPanelDragIconLabel: validationLocale('Drag to reorder', 'Arrastra para reordenar', 'Arraste para reordenar'),
  columnsPanelShowAllButton: validationLocale('Show All', 'Mostrar todo', 'Mostrar todos'),
  columnsPanelHideAllButton: validationLocale('Hide All', 'Ocultar todo', 'Ocultar todos'),

  columnMenuLabel: validationLocale('Menu', 'Menú', 'Menu'),
  columnMenuShowColumns: validationLocale('Show columns', 'Mostrar columnas', 'Mostrar colunas'),
  columnMenuManageColumns: validationLocale('Manage columns', 'Administrar columnas', 'Gerenciar colunas'),
  columnMenuFilter: validationLocale('Filter', 'Filtrar', 'Filtrar'),
  columnMenuHideColumn: validationLocale('Hide column', 'Ocultar columna', 'Ocultar coluna'),
  columnMenuUnsort: validationLocale('Unsort', 'Deshacer ordenación', 'Desfazer ordenação'),
  columnMenuSortAsc: validationLocale('Sort by ASC', 'Ordenar de menor a mayor', 'Ordenar do menor para o maior'),
  columnMenuSortDesc: validationLocale('Sort by DESC', 'Ordenar de mayor a menor', 'Ordenar do maior para o menor'),

  columnHeaderFiltersTooltipActive: (count) => count !== 1
    ? validationLocale(`${count} active filters`, `${count} filtros ativos`, `${count} filtros activos`)
    : validationLocale(`${count} active filter`, `${count} filtro ativo`, `${count} filtro activo`),
  columnHeaderFiltersLabel: validationLocale('Show filters', 'Mostrar filtros', 'Mostrar filtros'),
  columnHeaderSortIconLabel: validationLocale('Sort', 'Ordenar', 'Ordenar'),

  footerRowSelected: (count) => count !== 1
    ? validationLocale(`${count.toLocaleString()} rows selected`, `${count.toLocaleString()} filas seleccionadas`, `${count.toLocaleString()} linhas selecionadas`)
    : validationLocale(`${count.toLocaleString()} row selected`, `${count.toLocaleString()} fila seleccionada`, `${count.toLocaleString()} linha selecionada`),

  footerTotalRows: validationLocale('Total Rows:', 'Total de filas:', 'Total de linhas:'),
  footerTotalVisibleRows: (visibleCount, totalCount) =>
    validationLocale(`${visibleCount.toLocaleString()} of ${totalCount.toLocaleString()}`, `${visibleCount.toLocaleString()} de ${totalCount.toLocaleString()}`, `${visibleCount.toLocaleString()} de ${totalCount.toLocaleString()}`),

  checkboxSelectionHeaderName: validationLocale('Checkbox selection', 'Selección de casilla', 'Seleção de caixa de seleção'),
  checkboxSelectionSelectAllRows: validationLocale('Select all rows', 'Seleccionar todas las filas', 'Selecionar todas as linhas'),
  checkboxSelectionUnselectAllRows: validationLocale('Unselect all rows', 'Deseleccionar todas las filas', 'Desmarcar todas as linhas'),
  checkboxSelectionSelectRow: validationLocale('Select row', 'Seleccionar fila', 'Selecionar linha'),
  checkboxSelectionUnselectRow: validationLocale('Unselect row', 'Deseleccionar fila', 'Desmarcar linha'),

  // Boolean cell text
  booleanCellTrueLabel: validationLocale('yes', 'sí', 'sim'),
  booleanCellFalseLabel: validationLocale('no', 'no', 'não'),

  // Actions cell more text
  actionsCellMore: validationLocale('more', 'más', 'mais'),

  // Column pinning text
  pinToLeft: validationLocale('Pin to left', 'Anclar a la izquierda', 'Fixar à esquerda'),
  pinToRight: validationLocale('Pin to right', 'Anclar a la derecha', 'Fixar à direita'),
  unpin: validationLocale('Unpin', 'Desanclar', 'Desfixar'),

  // Tree Data
  treeDataGroupingHeaderName: validationLocale('Group', 'Agrupar', 'Agrupar'),
  treeDataExpand: validationLocale('See children', 'Ver hijos', 'Ver filhos'),
  treeDataCollapse: validationLocale('Hide children', 'Ocultar hijos', 'Ocultar filhos'),

  // Grouping columns
  groupingColumnHeaderName: validationLocale('Group', 'Agrupar', 'Agrupar'),
  groupColumn: (name) => validationLocale(`Group by ${name}`, `Agrupar por ${name}`, `Agrupar por ${name}`),
  unGroupColumn: (name) => validationLocale(`Stop grouping by ${name}`, `Detener agrupación por ${name}`, `Parar de agrupar por ${name}`),

  // Master/detail
  detailPanelToggle: validationLocale('Detail panel toggle', 'Alternar panel de detalles', 'Alternar painel de detalhes'),
  expandDetailPanel: validationLocale('Expand', 'Expandir', 'Expandir'),
  collapseDetailPanel: validationLocale('Collapse', 'Colapsar', 'Recolher'),

  // Used core components translation keys
  MuiTablePagination: {},

  // Row reordering text
  rowReorderingHeaderName: validationLocale('Drag to reorder', 'Arrastra para reordenar', 'Arraste para reordenar'),

  // Aggregation
  aggregationMenuItemHeader: validationLocale('Aggregation', 'Agregación', 'Agregação'),
  aggregationFunctionLabelSum: validationLocale('sum', 'suma', 'soma'),
  aggregationFunctionLabelAvg: validationLocale('avg', 'promedio', 'média'),
  aggregationFunctionLabelMin: validationLocale('min', 'mín', 'mín'),
  aggregationFunctionLabelMax: validationLocale('max', 'máx', 'máx'),
  aggregationFunctionLabelSize: validationLocale('size', 'tamaño', 'tamanho')
};

export function getGridLocaleText(): GridLocaleText {
  return GRID_DEFAULT_LOCALE_TEXT;
}

