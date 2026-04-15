# Backlog — DataGrid unificada (paridade MUI X + TanStack + Tailwind/shadcn)

Objetivo: uma única `DataGrid` (aliases `DataGridPro` / `DataGridPremium`) com API e comportamentos alinhados ao **MUI X Data Grid**, sem dependências MUI, UI só com **Tailwind + shadcn/Radix**, lógica com **TanStack Table** (+ Virtual onde aplicável).

**Legenda**

| Estado | Significado |
|--------|-------------|
| ✅ | Implementado e utilizado na UI |
| 🔶 | Parcial (tipo/prop existe, UI incompleta, ou subconjunto da API MUI) |
| ⬜ | Por fazer |

**Auditoria scroll horizontal (edição por linha):** ver [DATA_GRID_HORIZONTAL_SCROLL_AUDIT.md](./DATA_GRID_HORIZONTAL_SCROLL_AUDIT.md) (cadeia DOM, matriz de código, CSS vs métrica, decisão de desenho).

---

## Entregas em blocos maiores (macro)

Para **marcos de produto**, **releases** e **PRs com âmbito largo**, usa-se um **macro-bloco**: agrupa vários blocos de 10 itens (ou um eixo funcional completo) numa única entrega revista.

| Macro | Blocos micro | Intervalo IDs | Tema (resumo) | Estado |
|-------|----------------|---------------|---------------|--------|
| **G1** | 1–4 | #1–40 | Núcleo, ordenação, filtros, paginação, seleção, colunas (visibilidade a pin) | ✅ |
| **G2** | 5–8 | #41–80 | Virtualização, scroll, densidade, células, Pro (detalhe/árvore/agrupamento), clipboard/Excel, toolbar, export | ✅ |
| **G3** | 9–12 | #81–120 | API imperativa expandida, eventos de grelha, a11y, `initialState`/persistência, testes base, Storybook/e2e | ✅ |
| **G4** | 13–17 | #121–163 | Virtualização de colunas, variáveis de altura, prefs automáticas, API edição/subscrições, e2e, tema, i18n; Bloco 16 (#144–153) **10 ✅** | ✅ |
| **G5** | — | *G5.1–G5.6* | Paste multi-célula; `onRowEditStop` rico (reason, `previousRow`, Tab); e2e Storybook; smoke scroll virtual + métrica ms (**#150** / G6.7) | ✅ |
| **G6** | — | *G6.1+* | **Bloco 16** (#144–153) **fechado**; prefs, sizing, boundary, **`aria-live`**, métricas scroll CI, tokens **ProtonWeb** (`--hive-grid-*`) | ✅ |

**Macro G1–G6 (estado)**

- **Bloco 16** e **G6** considerados **concluídos** na documentação atual: #150 (e2e Playwright + anotação `perf` + limiar ms) e #153 (`hive-data-grid-theme.css`, classes `hiveGrid.*` na `DataGrid`).
- Evoluções futuras (novas features MUI, UX, ou macros **G7+**) voltam a usar este documento com novos IDs ou uma secção «Pós-G6».

### Âmbito inicial G5 (tranche 1 — entregue)

| ID | Incremento | Foco | Ligação |
|----|------------|------|---------|
| **G5.1** | Paste multi-célula | Dispersar TSV do clipboard nas células a partir da célula focada (paridade com fluxos MUI / refinamento **#72**) | Clipboard |
| **G5.2** | `onRowEditStop` rico | `GridRowEditStopParams` + `GridRowEditStopReasons` (incl. `saveButtonClick` / `cancelButtonClick`) | Edição por linha |
| **G5.3** | Qualidade / perf | Smoke e2e Storybook: paste + `onRowEditStop` reason; `data-hive-row-edit-actions` vs `rowFocusOut` | **#101** / **#102** |

**Última entrega — Macro G5 tranche 1 (G5.1–G5.3):** `clipboardPaste.ts` + paste na `DataGrid`; tipos `GridRowEditStop*`; e2e `datagrid-basic--playwright-g-5-*`; exclusão de pointer capture nas ações de linha.

**Última entrega — G5.4:** `rowEditTabNavigate` + `onKeyDownCapture` nas células (tabela e virtual); e2e `G5.4: Tab na última célula editável sai com tabKeyDown`.

**Última entrega — G5.5:** `GridRowEditStopParams.previousRow` + `rowEditStartSnapshotRef` / `shallowRowSnapshotForEdit`; Storybook + e2e com `g5-previous-row-name`.

**Última entrega — G5.6:** story `PlaywrightG6VirtualScrollSmoke` (500 linhas) + e2e até `Row 500`; **G6.7 / #150** acrescenta medição **ms** no browser + anotação `perf` e limiar em CI.

### G5.4+ (tranches opcionais)

| ID | Incremento | Foco |
|----|------------|------|
| **G5.4** | Teclado em edição por linha | ✅ Tab na última célula editável / Shift+Tab na primeira → `onRowEditStop` com `tabKeyDown` / `shiftTabKeyDown`; `onKeyDownCapture` na célula; e2e Storybook **G5.4** |
| **G5.5** | Revert explícito | ✅ `previousRow` em `GridRowEditStopParams` (cópia rasa ao entrar em edição por linha); e2e `g5-previous-row-name` |
| **G5.6** | Perf / hardening | ✅ Smoke e2e + **#150** (ms até «Row 500» visível, anotação `perf`, limiar 20s CI) |

*Tranche G5.4+ concluída; métricas de scroll integradas em **G6.7**.*

### G6 — tranches (pós-G5)

| ID | Incremento | Foco |
|----|------------|------|
| **G6.1** | `subscribeEvent` granular | ✅ `paginationChange`, `columnVisibilityChange`, `pinnedColumnsChange` (+ snapshot em `DataGrid`); Vitest em `DataGrid.interaction.test.tsx` |
| **G6.2** | Agrupamento + ordem de colunas | ✅ `rowGroupingModelChange`, `columnOrderChange`; `columnOrder` em `GridStateSnapshot`; dependências `stateChange` incluem ordem de colunas; Vitest `rowGroupingModelChange` |
| **G6.3** | Preferências + ProtonWeb | ✅ `PersistedGridPreferences.columnOrder` / `rowGroupingModel`; hidratação após `baseOrder`; escrita no debounce; `mergePersistedColumnOrder` exportado; Vitest |
| **G6.4** | Larguras de coluna | ✅ `columnSizing` no snapshot + prefs; `columnSizingChange`; `pickPersistableColumnSizing` / `mergePersistedColumnSizing`; `initialState.columns.columnSizing` |
| **G6.5** | Resiliência (#152) | ✅ `GridErrorBoundary` + Vitest + README + exports |
| **G6.6** | Live regions (#151) | ✅ `aria-live` + `gridAnnouncements.ts` + `localeText` + `disableAccessibilityAnnouncements` |
| **G6.7** | Métricas scroll virtual (#150) | ✅ e2e Playwright mede ms + `testInfo.annotations` tipo `perf` |
| **G6.8** | Tokens ProtonWeb (#153) | ✅ `src/styles/hive-data-grid-theme.css` (`--hive-grid-*`) + Tailwind `hiveGrid.*` + classe `hive-data-grid` na raiz |

**Última entrega — G6.1:** tipos `GridSubscriptionEvent` + efeitos em `DataGrid.tsx`; testes `subscribeEvent` após `mockClear`; README (lista de eventos).

**Última entrega — G6.2:** `columnOrder` no snapshot; subscrições `columnOrderChange` / `rowGroupingModelChange`; correção: `onStateChange`/`stateChange` após drag de colunas.

**Última entrega — G6.3:** `persistGridPreferences.ts` + `DataGrid` (ler/gravar); README; export em `src/index` / `core` index.

**Última entrega — G6.4:** larguras em `PersistedGridPreferences` + `GridStateSnapshot`; efeito `columnSizingChange`; `stateChange` com `columnSizing`.

**Última entrega — G6.5:** `GridErrorBoundary.tsx` + `GridErrorBoundary.test.tsx`; `core`/`src` index; README.

**Última entrega — G6.6:** `gridAnnouncements.ts` + testes; `DataGrid` (`sr-only` + efeito); `GridLocaleText`; `dataGridProps`; e2e Vitest `aria-live`.

**Última entrega — G6.7:** `e2e/storybook/datagrid.spec.ts` (scroll virtual + ms); história `PlaywrightG6VirtualScrollSmoke`.

**Última entrega — G6.8:** `hive-data-grid-theme.css` + `@import` em `globals.css`; `tailwind.config` (`hiveGrid`); superfícies da `DataGrid` / `gridToolbar` com tokens; README.

**Bloco 16 — inventário (#144–153)** — *reconciliação com macro G6; resumo: **10 ✅**.*

| # | Tema | Estado | Notas |
|---|------|--------|-------|
| 144 | `subscribeEvent` granular (paginação, visibilidade, pin, …) | ✅ | G6.1 |
| 145 | `subscribeEvent` ordem / agrupamento / **sizing** | ✅ | G6.2, G6.4 |
| 146 | `GridStateSnapshot` (`columnOrder`, **`columnSizing`**) | ✅ | G6.2, G6.4 |
| 147 | `onStateChange` / `stateChange` (DnD colunas + **resize**) | ✅ | G6.2, G6.4 |
| 148 | Prefs `preferencesKey`: `columnOrder` + `rowGroupingModel` | ✅ | G6.3 |
| 149 | Prefs: **`columnSizing`** (gravar/reidratar) | ✅ | G6.4 |
| 150 | Métricas de tempo de scroll virtual em CI | ✅ | G6.7 — e2e mede ms + anotação `perf` (limiar 20s) |
| 151 | Live regions / anúncios SR (filtro, ordenação) | ✅ | G6.6 — `aria-live` + `localeText.gridAnnounce*` |
| 152 | Boundary de erro / resiliência na montagem da grelha | ✅ | `GridErrorBoundary` (G6.5) |
| 153 | Tokens / tema **ProtonWeb** dedicados (além de shadcn) | ✅ | G6.8 — `--hive-grid-*`, `bg-hiveGrid-*` / `border-hiveGrid-*`, `hive-data-grid` |

**Como usar**

- **Macro (G1–G6):** alinhar com equipa/stakeholders (“fechamos G2 nesta release”), reduzir overhead de coordenação, PRs com diff maior mas coerente.
- **Micro (blocos de 10):** manter rastreio fino no mesmo documento, PRs pequenos quando convém (hotfix, contribuições externas).
- **Regra prática:** uma **release minor** pode corresponder a **um macro** fechado; patches podem ser **meio micro-bloco** ou itens avulsos.

**Extensões recentes (paridade MUI, fora da numeração fixa #):** edição por linha (`editMode`, `rowModesModel`, `onRowEditStart`/`Stop`), `setDensity`/`getDensity`, coluna de ações `rowEditActions`, eventos `densityChange`/`rowModesModelChange` — tratadas como evolução contínua do **G2/G4** (API + estado).

---

## Entrega por blocos (10 pontos)

Cada bloco agrupa **dez itens** consecutivos do backlog (`#1–10`, `#11–20`, …) para planear revisões e PRs **com granularidade fina**. O **próximo alvo** após fechar um bloco é o seguinte intervalo; dentro do bloco podem priorizar-se primeiro os ⬜ e depois refinar 🔶. Os macro-blocos G1–G4 cobrem estes blocos; **G5**/**G6** são pós-paridade (ver tabela macro).

| Bloco | Itens | Resumo (✅ / 🔶 / ⬜) |
|-------|--------|----------------------|
| **1** | #1–10 | 10 ✅ |
| **2** | #11–20 | 10 ✅ |
| **3** | #21–30 | 10 ✅ |
| **4** | #31–40 | 10 ✅ |
| **5** | #41–50 | 10 ✅ |
| **6** | #51–60 | 10 ✅ |
| **7** | #61–70 | 10 ✅ |
| **8** | #71–80 | 10 ✅ |
| **9** | #81–90 | 10 ✅ |
| **10** | #91–100 | 10 ✅ |
| **11** | #101–103 | 3 ✅ *(bloco curto)* |
| **12** | #104–113 | 10 ✅ *(ver plano pós-103)* |
| **13** | #114–123 | 10 ✅ |
| **14** | #124–133 | 10 ✅ |
| **15** | #134–143 | 10 ✅ |
| **16** | #144–153 | 10 ✅ *(inventário G6)* |
| **17** | #154–163 | 10 ✅ *(fechamento i18n/UX, defaults, CI)* |

**Última entrega — Bloco 16 (fecho v2.3.0):** #150 métricas scroll virtual no e2e Playwright; #153 tokens `--hive-grid-*` + Tailwind `hiveGrid` + classe `hive-data-grid`; ver G6.7 / G6.8.

**Última entrega — Bloco 17 (v2.2.1):** operadores de filtro no resumo do painel com `localeText` (`GridFilterPanel`); `defaultPreferences` com `preferencesKey`; util partilhado `isDataCellInteractiveTarget` exportado; README (API imperativa, CI, validação de tema); workflow `.github/workflows/ci.yml`; teste Vitest do util; CHANGELOG 2.2.1.

**Última entrega — Paridade backlog 🔶 → ✅ (v2.2.2):** `apiRef`/`GridApiCommunity` documentado como completo; `#9` `useHiveDataTableCore` + locale + `onRowClick` + `isDataCellInteractiveTarget`; `#59` confirmado; `#77` chaves ARIA de seleção + `localeText`; `#102` Storybook; README atualizado.

**Última entrega — Blocos 12–16 (plano pós-103):** virtualização de colunas (`columnVirtualization` + pin desativado); alturas de linha (`getEstimatedRowHeight`, `enableVariableRowHeight`); persistência automática (`preferencesKey` + debounce); API `getCellMode` / `setEditCellValue`; `subscribeEvent` para `rowSelectionChange` / `filterChange` / `sortChange`; Playwright `npm run test:e2e`; `localeText.columnReorderAria`; README/CHANGELOG; tema shadcn (tokens semânticos na grelha); backlog atualizado.

**Anterior — Bloco 11:** `#101` Vitest + `npm test` + testes em `selectionUtils`, `filterFns`, `persistGridPreferences`, `adapter`; `#102` e2e/Storybook — Playwright smoke + Storybook (`stories/`); `#103` README com secções Testes, roadmap (`DATA_GRID_BACKLOG.md`) e qualidade manual.

**Anterior — Bloco 10:** `#91` cliques em célula ignoram controlos (`isDataCellInteractiveTarget`); `#96` `aria-busy` + `aria-multiselectable` no `role="grid"`; `#99` `initialState.density` / `rowHeight` / `columnHeaderHeight`; `#100` helpers `readGridPreferencesFromStorage` / `writeGridPreferencesToStorage` (+ tipos) para `localStorage`.

**Anterior — Bloco 9:** `#83` `getRowSelectionModel`; `#88` filtros.

**Anterior — Bloco 8:** `#71`–`#79` agregação, clipboard, slots, CSV.

**Anterior — Bloco 7:** `#62`–`#65` filtros, edição, API.

**Anterior — Bloco 6:** `#54`–`#59` scroll-end, `rowHeight`, `autoHeight` / teto.

**Anterior — Bloco 5:** `#47`–`#51` dimensões, menu, scroll unificado.

**Anterior — Bloco 4:** `#37`–`#39` seleção (`include`/`exclude`, servidor, rádio).

**Anterior — Bloco 3:** `#30`–`#31` paginação + virtualização + `paginationMeta`.

**Anterior — Bloco 2:** `#16`–`#22` filtros / painel / menu coluna.

**Anterior — Bloco 1:** `#8` `children`; `#9` util export TanStack (`@/export`).

---

## P0 — Base e contrato

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 1 | `rows` + `columns` (`GridColDef`) | ✅ | |
| 2 | `getRowId` | ✅ | |
| 3 | `apiRef` + `useGridApiRef` | ✅ | `GridApiCommunity` em `createGridApi` + `types.ts` (incl. `getCellMode` / `setEditCellValue`, export, scroll, subscrições) |
| 4 | `createGridApi` centralizado em `core/x-data-grid/src/api/` | ✅ | |
| 5 | `loading` overlay | ✅ | |
| 6 | `className` / `style` no root | ✅ | |
| 7 | `sx` (mapear para className/style ou ignorar documentado) | ✅ | `@deprecated` em `dataGridProps`; ignorado na UI |
| 8 | `children` | ✅ | Renderizados no root entre o seletor de colunas e a grelha com `border` |
| 9 | Unificar caminho único de implementação `DataGrid` ↔ `HiveDataTable` (hooks partilhados) | ✅ | `isDataCellInteractiveTarget` + `useHiveDataTableCore` + `HiveDataTableLocale`; `onRowClick` com a mesma regra de alvo interativo |

---

## Ordenação

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 10 | `sortModel` / `onSortModelChange` | ✅ | |
| 11 | `sortingMode` client/server | ✅ | |
| 12 | `sortingOrder` (restringir direções) | ✅ | `sortDescFirst` quando o 1.º valor é `desc` |
| 13 | Multi-sort (Shift+clique) | ✅ | `isMultiSortEvent` + `maxMultiSortColCount` |
| 14 | `disableColumnSort` / `sortable` por coluna | ✅ | Prop global + `sortable` na coluna |

---

## Filtragem

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 15 | Quick filter (`quickFilterValue`, `onQuickFilterValueChange`) | ✅ | |
| 16 | `filterModel` / `onFilterModelChange` + operadores em `filterFns` | ✅ | Cliente: `items` + `logicOperator`; diálogo por tipo; `singleSelect` sem `valueOptions` → operadores de texto; comparação de datas com `YYYY-MM-DD` normalizada |
| 17 | `filterMode` client/server | ✅ | |
| 18 | `disableColumnFilter` | ✅ | |
| 19 | `quickFilterValues` / `quickFilterLogicOperator` no modelo | ✅ | Avaliação + sincronização ao editar o input |
| 20 | `logicOperator` And/Or entre itens | ✅ | `filterFns` + filtro global combinado |
| 21 | Painel de filtros (`GridFilterPanel` / slots) | ✅ | Lista, And/Or, editar/remover/limpar; resumo legível (boolean, etiquetas `valueOptions`, datas localizadas); `key` estável com `item.id` |
| 22 | Filtro por coluna na UI (menu/header) | ✅ | Menu ⋮ + `ColumnFilterDialog`; `type: "actions"` não mostra filtro (alinhado #62) |
| 23 | `getApplyQuickFilterFn` / bypass | ✅ | Por coluna em `GridColDef`; `null` exclui a coluna do quick filter |

---

## Paginação

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 24 | `paginationModel` / `onPaginationModelChange` | ✅ | |
| 25 | `paginationMode` client/server | ✅ | |
| 26 | `rowCount` (server) | ✅ | Total ≥ 0; omitir ou negativo com `paginationMeta` |
| 27 | `pageSizeOptions` + seletor no rodapé | ✅ | shadcn `Select`; inclui `pageSize` atual se fora da lista |
| 28 | `pagination` / `hideFooter*` | ✅ | |
| 29 | `hideFooterPagination` | ✅ | |
| 30 | Paginação com virtualização (coerência) | ✅ | Mudança de página/tamanho repõe scroll; virtual + viewport Radix |
| 31 | `paginationMeta` / estimativas server | ✅ | `hasNextPage` / `estimatedRowCount`; `pageCount` = max(estimativa, página atual + hasNext) |

---

## Seleção de linhas

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 32 | `checkboxSelection` | ✅ | |
| 33 | `rowSelectionModel` / `onRowSelectionModelChange` | ✅ | |
| 34 | `disableMultipleRowSelection` | ✅ | |
| 35 | `disableRowSelectionOnClick` | ✅ | |
| 36 | `isRowSelectable` | ✅ | |
| 37 | Modelo `include` / `exclude` (seleção inversa) | ✅ | `rowSelectionModel.type`; fundido entre páginas em `include`; `exclude` mantém exclusões fora da página atual |
| 38 | Seleção “todas as linhas” em server mode | ✅ | `checkboxSelectionSelectAllPages` + `onRowSelectionModelChange` + `rowCount` ≥ 0; modelo `exclude` vazio |
| 39 | `radioSelection` / single sem checkbox | ✅ | Prop `radioSelection`; não combinar com `checkboxSelection` (prevalece checkbox) |

---

## Colunas — visibilidade, tamanho, ordem

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 40 | `columnVisibilityModel` / `onColumnVisibilityModelChange` | ✅ | |
| 41 | Seletor “Colunas” (dropdown) | ✅ | |
| 42 | `disableColumnSelector` | ✅ | |
| 43 | Redimensionamento + `onColumnWidthChange` | ✅ | `onEnd` |
| 44 | `disableColumnResize` | ✅ | |
| 45 | Reordenação drag (`onColumnOrderChange`, dnd-kit) | ✅ | |
| 46 | `disableReorder` por coluna | ✅ | |
| 47 | `flex` / `minWidth` / `maxWidth` estáveis | ✅ | `width` ou `flex*100` com clamp min/max; fallback de track virtual alinhado ao `minWidth` da coluna |
| 48 | `align` / `headerAlign` nas células | ✅ | Classes Tailwind em células e cabeçalhos |
| 49 | Menu de coluna (sort, filter, hide, pin…) | ✅ | Cabeçalho com nome da coluna; sort, pin, ocultar, filtro (cliente); `disableColumnMenu` |
| 50 | **Column pinning** (left/right) | ✅ | `pinnedColumns` / `onPinnedColumnsChange`; menu ⋮; API `setPinnedColumns` |
| 51 | Colunas fixas + scroll horizontal unificado | ✅ | Um único eixo de scroll no viewport (`ScrollArea` / virtual / `autoHeight`); `min-w-0` no border e contentores; sticky coerente; virtualização continua a desligar com pin / detalhe / árvore |

---

## Virtualização e scroll

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 52 | `disableVirtualization` | ✅ | `false` = virtual linhas; `autoHeight` força modo sem virtual |
| 53 | Virtualização de **colunas** (larguras enormes) | ✅ | Prop `columnVirtualization` (com virtualização de linhas e sem pin) |
| 54 | `scrollEndThreshold` + `onRowsScrollEnd` | ✅ | Contentor de scroll (virtual, `autoHeight`, viewport `ScrollArea`); threshold omisso = **200**; “arm” até scroll subir |
| 55 | `columnHeaderHeight` | ✅ | Cabeçalho tabela + virtual; `scrollToIndexes` e PageUp/PageDown usam bloco de cabeçalho (40px por linha se não definido) |
| 56 | `rowHeight` fixo + alinhar estimativa virtual | ✅ | `rowPx` na tabela + `estimateSize`; `measure()` ao alterar altura; API `scrollToIndexes` com cabeçalho |

---

## Densidade e layout

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 57 | `density` compact/standard/comfortable | ✅ | |
| 58 | `autoHeight` | ✅ | Contentor `overflow-auto`; altura às linhas da página; desativa virtualização |
| 59 | Altura máxima / variável por conteúdo | ✅ | `autoHeightMaxHeight`; virtual: `getEstimatedRowHeight` + `enableVariableRowHeight` (`measureElement`) |

---

## Renderização de células / colunas

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 60 | `valueGetter` / `valueFormatter` | ✅ | |
| 61 | `renderCell` / `renderHeader` | ✅ | |
| 62 | `type` string/number/boolean/date/singleSelect/actions | ✅ | Diálogo por tipo; número com `step="any"`; `actions` sem filtro no menu |
| 63 | `valueOptions` (singleSelect) | ✅ | Célula + edição com shadcn `Select`; `localeText.editCellOpenSelect`; boolean nativo na edição |
| 64 | `description` / tooltips | ✅ | `description` na `GridColDef` → tooltip Radix no título do cabeçalho (hover) |
| 65 | `renderEditCell` / edição | ✅ | `renderEditCell`; nativos string/number/boolean/singleSelect; `api.startCellEditMode` / `stopCellEditMode` |
| 66 | `cellClassName` / `headerClassName` | ✅ | String ou função (`GridCellParams` / `GridRenderHeaderParams`) |
| 67 | `getCellClassName` dinâmico | ✅ | Combinado com `cellClassName` via `cn` |

---

## Detalhe, árvore, agrupamento (Pro/Premium)

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 68 | **Detail panel** / master-detail | ✅ | `getDetailPanelContent` / `getDetailPanelHeight`; coluna `__detail__`; API `setDetailPanelExpandedRowIds`; virtualização desliga com expansão |
| 69 | **Tree data** + `getTreeDataPath` / expansão | ✅ | `treeData` + `getTreeDataPath` (plano→`getSubRows`); coluna `__tree__`; `treeExpandedRowIds` / API `setTreeExpandedRowIds`; incompatível com painel de detalhe no mesmo estado |
| 70 | **Row grouping** | ✅ | `rowGroupingModel` / `onRowGroupingModelChange`; `getGroupedRowModel`; incompatível com `treeData`; API `setRowGroupingModel` |
| 71 | **Aggregation** / footers | ✅ | `aggregationModel`; rodapé com `valueFormatter` (valor agregado; `id` sintético `__aggregation_footer__`); ARIA no `<tfoot>` / linha virtual |
| 72 | **Clipboard** paste/copy | ✅ | Ctrl/Cmd+C → TSV; `onClipboardPaste` na raiz (fora de inputs); `copySelectedRowsToClipboard` |
| 73 | **Excel export** (além CSV) | ✅ | `api.exportDataAsExcel()` + `excelOptions`; mesmas linhas que CSV (filtradas, sem grupos) |

---

## Toolbar, slots e personalização

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 74 | `slots.toolbar` | ✅ | Básico |
| 75 | `slotProps` | ✅ | Overlays; `toolbar` (contentor); `footer` / `pagination` / `filterPanel` (merge de props) |
| 76 | Slots: `footer`, `loadingOverlay`, `noRowsOverlay`, `pagination`, `filterPanel`, etc. | ✅ | Substituição de componentes; `filterPanel` recebe `slotProps.filterPanel` |
| 77 | `localeText` aplicado aos textos internos | ✅ | UI via `lt` / `localeText`; ARIA de seleção (`checkboxSelectionSelectAll` / `checkboxSelectionSelectRow`); cabeçalho DnD com `columnReorderAria` |

---

## Export e API de ficheiros

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 78 | `exportDataAsCsv` via `apiRef` | ✅ | |
| 79 | `csvOptions` (fileName, utf8 BOM) | ✅ | `csvOptions.utf8WithBom` + `GridCsvExportOptions.utf8WithBom`; `exportRowsToCsv(..., utf8WithBom)` |
| 80 | Export Excel via API ou botão | ✅ | `exportDataAsExcel` na `GridApiCommunity` |
| 81 | `exportDataAsPrint` | ✅ | `api.exportDataAsPrint`; HTML + `window.print()`; mesmas linhas que CSV |

---

## GridApi imperativa (expansão)

Métodos comuns no MUI — marcar ⬜ até existirem na nossa `GridApiCommunity` (ou tipo unificado `GridApi`):

| # | Método / área | Estado | Notas |
|---|----------------|--------|-------|
| 82 | `getRow`, `getRowId`, colunas get/set | ✅ | |
| 83 | Sort / filter / pagination / visibility / selection get+set | ✅ | `getSortModel`, `getFilterModel`, `getPaginationModel`, `getColumnVisibilityModel`, **`getRowSelectionModel`**; setters já existentes |
| 84 | `scrollToIndexes` / `scroll` / `scrollToRow` | ✅ | Scroll heurístico (altura de linha uniforme); com pin horizontal o eixo vertical pode continuar no viewport Radix |
| 85 | `setCellFocus` (MUI: `setFocus`) / navegação por teclado | ✅ | `setCellFocus`; `startCellEditMode` / `stopCellEditMode`; `getCellMode` / `setEditCellValue` |
| 86 | `updateRows` / `applyTransaction` | ✅ | `api.updateRows` + `onRowsChange`; `api.applyTransaction` + `onRowTransaction` (add/update/remove no pai) |
| 87 | `subscribeEvent` / eventos | ✅ | Inclui `columnSizingChange`; snapshot com `columnOrder` + `columnSizing` |
| 88 | `showFilterPanel` / `hideFilterPanel` | ✅ | Abre/fecha painel global; `hideFilterPanel` também fecha o diálogo de filtro por coluna |
| 89 | `exportDataAsCsv` params completos | ✅ | `fileName` + `utf8WithBom` (alinhado a `csvOptions`) |

---

## Eventos (callbacks de grelha)

| # | Item | Estado |
|---|------|--------|
| 90 | `onRowClick` / `onRowDoubleClick` | ✅ | Ignora cliques em controlos interativos |
| 91 | `onCellClick` / `onCellDoubleClick` / `onCellKeyDown` | ✅ | Clique/double ignoram botões/links/inputs na célula; `onCellKeyDown` antes da navegação; `preventDefault` bloqueia setas/Home/End |
| 92 | `onColumnHeaderClick` | ✅ | Área do título (não menu ⋮ nem resize); `preventDefault` bloqueia toggle de sort em modo cliente |
| 93 | `onStateChange` | ✅ | Recebe `GridStateSnapshot` (igual a `subscribeEvent('stateChange')`); usar `useCallback` no handler |
| 94 | `processRowUpdate` / validação | ✅ | `Promise` rejeitada mantém edição; validação no ascendente |

---

## Acessibilidade e teclado

| # | Item | Estado |
|---|------|--------|
| 95 | Navegação por teclado estilo grelha | ✅ | Setas; Home/End; Ctrl/Cmd+Home/End; Tab como ←/→ entre células; PageUp/PageDown; virtual: `scrollToIndexes` + foco |
| 96 | ARIA roles (grid, row, columnheader) consistentes | ✅ | `role="grid"`; `aria-rowcount` / `aria-colcount`; `aria-busy` (loading); `aria-multiselectable` (checkbox multi); `gridAriaLabel`; `aria-live` sort/filtro (G6.6) |
| 97 | `aria-label` / `getRowAriaLabel` | ✅ | `aria-label` na grelha (`localeText.gridAriaLabel`); `getRowAriaLabel` → `aria-label` em cada linha de dados |

---

## `initialState` e persistência

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 98 | `initialState.pagination` / `sorting` / `filter` / `columns` | ✅ | Subconjunto |
| 99 | `initialState` pinning / density / dimensions | ✅ | `pinnedColumns` + `density` + `rowHeight` + `columnHeaderHeight` quando props não controladas |
| 100 | Persistência (localStorage) helper | ✅ | `columnOrder`, `rowGroupingModel`, `columnSizing`; `mergePersistedColumnOrder` / `mergePersistedColumnSizing` |

---

## Qualidade e tooling

| # | Item | Estado |
|---|------|--------|
| 101 | Testes unitários (adapter, filterFns, api) | ✅ | Vitest; `npm test`; ficheiros `*.test.ts` em `core/x-data-grid/src` |
| 102 | Testes e2e ou Storybook | ✅ | Playwright `npm run test:e2e` (smoke); Storybook 8 (`npm run storybook`, `stories/DataGrid.stories.tsx`, `build-storybook`) |
| 103 | Documentação README por feature | ✅ | Secções Testes, link ao backlog, exports (tabela existente) |

---

## Ordem sugerida de execução (uma a uma)

1. ~~**#27** — `pageSizeOptions` com seletor no rodapé~~
2. ~~**#12** — `sortingOrder` (+ **#13** multi-sort, **#14** `disableColumnSort`)~~
3. ~~**#49** — Menu de coluna mínimo~~ (com **#48** align, **#19–20** filtros, **#77** locale, **#90–91** cliques, **#7** `sx` doc)
4. ~~**#50–51** — Column pinning~~
5. ~~**#68** — Detail panel~~
6. ~~**#69** — Tree data~~
7. ~~**#70–71** — Grouping + aggregation~~
8. ~~**#73** — Excel na DataGrid~~
9. ~~**#72** — Clipboard (base)~~ — refinar paste em células / paridade MUI
10. ~~**#84–88** — API (scroll, foco, eventos, etc.)~~ — incl. **#86** `updateRows` / `applyTransaction`
11. ~~**#81** — `exportDataAsPrint`~~
12. ~~**#97** — `getRowAriaLabel` / `aria-label` nas linhas~~
13. ~~**#55** — `columnHeaderHeight` (UI + scroll + teclado PageUp/Down em modo virtual)~~
14. ~~**#23** — `getApplyQuickFilterFn` / bypass por coluna no quick filter~~
15. ~~**Bloco 1 (#1–10)** — `#8` `children`; `#9` util partilhado export TanStack (`inferExportColumnsFromTanstackColumnDefs`)~~
16. ~~**Bloco 2 (#11–20)** — `#16` filtros cliente + `filterFns`; `#21`/`#22` painel e menu de coluna~~
17. ~~**Bloco 3 (#21–30)** — `#30` virtualização+paginação; `#31` `paginationMeta`~~
18. ~~**Bloco 4 (#31–40)** — seleção `#37`–`#39` (`include`/`exclude`, select-all servidor, `radioSelection`)~~
19. ~~**Bloco 5 (#41–50)** — `#47` dimensões de coluna; `#49` menu; `#51` scroll unificado (também alinha bloco 6 item 51)~~
20. ~~**Bloco 6 (#51–60)** — `#54` scroll-end; `#56` `rowHeight`; `#58`/`#59` `autoHeightMaxHeight`; `#53` virtualização de colunas~~
21. ~~**Bloco 7 (#61–70)** — tipos/filtro `#62`; `valueOptions`/edição `#63`; API edição `#65`~~
22. ~~**Bloco 8 (#71–80)** — agregação, clipboard, slots, CSV BOM, locale rodapé~~
23. ~~**Bloco 9 (#81–90)** — API `getRowSelectionModel`; alinhamento `#88`~~
24. ~~**Bloco 10 (#91–100)** — célula/ARIA/`initialState`/persistência helpers~~
25. ~~**Bloco 11 (#101–103)** — Vitest, README, doc e2e/playground~~
26. ~~**Blocos 12–16 (#104–153)** — plano pós-103: colunas virtuais, persistência, API, e2e, tema~~
27. ~~**Bloco 17 (#154–163)** — locale painel filtros, `defaultPreferences`, util DOM, README, CI~~

*(Ajustar prioridades conforme uso real no ProtonWeb.)*

---

## Mapeamento vs [GeekLabsSH/hive-tablepro (main)](https://github.com/GeekLabsSH/hive-tablepro/tree/main)

O `main` desse repositório é o **pacote 1.x** vendido como fork **MUI Material + MUI X** (`@geeklabssh/hive-tablepro@1.0.0`, Emotion, `core/x-data-grid` em TypeScript no estilo MUI). O **hive-tablepro-src** (pacote 2.x) é uma **reimplementação** (Tailwind, TanStack); não há ficheiros espelhados linha a linha, mas estes pontos do fork são a referência de comportamento:

| Tema | Onde está no fork (main) | Comportamento esperado | Hive DataGrid 2.x |
|------|---------------------------|------------------------|-------------------|
| **Densidade** | `core/x-data-grid/src/hooks/features/density/useGridDensity.tsx` — `COMPACT_DENSITY_FACTOR = 0.7`, `COMFORTABLE_DENSITY_FACTOR = 1.3`, `standard = 1`; estado `{ value, factor }` | Altura/padding escalam com o fator (e `rowHeight` base, se existir) | `GRID_DENSITY_ROW_FACTOR` + `GRID_DENSITY_BASE_ROW_PX` em `DataGrid.tsx` |
| **Fim de edição (célula)** | `useGridCellEditing.ts` — `cellFocusOut`, teclas Tab/Enter/Escape; **sem** listener global de `click` no documento | Sair ao perder foco da célula / teclas; `processRowUpdate` async só chama `finishCellEditMode` **depois** do `Promise` resolver; em erro repõe modo edição | Listener de `click` no `document` + exclusões (`data-hive-grid-chrome`, scroll vazio, Radix); durante `processRowUpdate` assíncrono incrementa-se um contador para **não** sair por clique; controlos dentro de `[data-hive-grid-scroll]` tratam-se como zona de edição mesmo sem `data-hive-edit-root` |
| **Async `processRowUpdate`** | `updateStateToStopCellEditMode` — `Promise.resolve(processRowUpdate(...)).then(...)` | Mantém edição até sucesso; falha repõe edit | `commit` em `renderBodyCellInner` + `beginAsyncCellCommit` / `endAsyncCellCommit` |

*Nota:* consumo do pacote 1.x no ProtonWeb (tarball / registry) está descrito no README do [hive-tablepro](https://github.com/GeekLabsSH/hive-tablepro); o fluxo `HIVE_TABLEPRO_SOURCE=local` aplica-se ao monorepo **protonerp**, não a este repo 2.x isoladamente.

---

## Como atualizar este ficheiro

Ao concluir um item: alterar ⬜ → 🔶 ou ✅ e, se aplicável, mover ou riscar na lista “Ordem sugerida”. Ao fechar um **bloco de 10 pontos**, atualizar a tabela **Entrega por blocos** (resumo ✅/🔶/⬜) e a linha **Última entrega — Bloco N**. Ao fechar um **macro-bloco (G1–G6)** na prática (release ou marco), atualizar a coluna **Estado** da tabela **Entregas em blocos maiores** e, se fizer sentido, acrescentar uma linha **Última entrega — Macro Gn** (ex.: G2) com notas de versão (CHANGELOG/README).
