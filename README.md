# @geeklabssh/hive-tablepro

Pacote de **tabelas e UI** para o ProtonWeb, versão **2.x**: **Tailwind CSS**, padrão **shadcn/ui** (componentes com **Radix UI**), **TanStack Table** e **TanStack Virtual**. **Ícones:** [@heroicons/react](https://heroicons.com) (outline/solid). **Sem MUI / Emotion.**

## Consumo no ProtonWeb

### Dependências no app

- `tailwindcss` (peer, ^3.4) — o app já deve usar Tailwind 3.
- `react` / `react-dom` 18.

### Tema (shadcn default / slate)

O ficheiro `styles.css` do pacote define o **tema padrão do shadcn** (`components.json`: `style: default`, `baseColor: slate`, `cssVariables: true`): variáveis HSL para `background`, `foreground`, `primary`, `muted`, `chart-1`…`chart-5`, `sidebar-*`, modo `.dark`, e `font-feature-settings` no `body` como no template oficial.

Para **fontes** (ex. Geist no Next.js), defina `--font-sans` / `--font-mono` no layout da aplicação; o `tailwind.config` do pacote já referencia essas variáveis.

### Tema da DataGrid (ProtonWeb, `#153`)

Além do shadcn, o pacote expõe variáveis **`--hive-grid-*`** em `src/styles/hive-data-grid-theme.css` (importado por `styles.css`). Por defeito apontam para os tokens shadcn (`--border`, `--muted`, …). A raiz da `DataGrid` usa a classe **`hive-data-grid`**; a UI da grelha usa utilitários Tailwind **`hiveGrid`** (ex. `border-hiveGrid-chromeBorder`, `bg-hiveGrid-headerCell`), definidos no `tailwind.config.ts` do pacote.

No **ProtonWeb**, estenda o tema só da grelha sobrescrevendo variáveis depois do import do pacote, por exemplo:

```css
:root {
  --hive-grid-chrome-border: hsl(220 14% 80%);
  --hive-grid-header-cell-bg: hsl(220 14% 94%);
}
```

Inclua **`./node_modules/@geeklabssh/hive-tablepro/core/**/*.{ts,tsx}`** (ou o caminho do fork) no `content` do Tailwind da app para gerar as classes `*-hiveGrid-*`.

### CSS e Tailwind (importante)

1. Importe os tokens do pacote no layout ou entrada global do Next.js:

   ```tsx
   import "@geeklabssh/hive-tablepro/styles.css";
   ```

2. No `tailwind.config` do **ProtonWeb**, inclua o código fonte do pacote no `content` para as classes serem geradas (ajuste o caminho conforme `file:` / monorepo):

   ```js
   content: [
     "./src/**/*.{js,ts,jsx,tsx}",
     "./node_modules/@geeklabssh/hive-tablepro/src/**/*.{js,ts,jsx,tsx}"
   ];
   ```

   Se usar alias `HIVE_TABLEPRO_SOURCE=local` para a pasta do fork, use o caminho relativo a essa pasta em vez de `node_modules/...`.

### Migração desde o fork MUI (mesma API de dados)

Para **não alterar** o código do ProtonWeb além do import do pacote, use a grelha compatível com **MUI X Data Grid**:

```tsx
import {
  DataGrid,
  useGridApiRef
} from "@geeklabssh/hive-tablepro/core/x-data-grid/src";
// ou: import { DataGrid, useGridApiRef } from "@geeklabssh/hive-tablepro";

const columns = [
  { field: "id", headerName: "ID", width: 120 },
  { field: "nome", headerName: "Nome", flex: 1 }
];

export function Exemplo() {
  const apiRef = useGridApiRef();
  return (
    <DataGrid
      rows={[]}
      columns={columns}
      checkboxSelection
      apiRef={apiRef}
      paginationModel={{ page: 0, pageSize: 20 }}
    />
  );
}
```

Para novos ecrãs pode continuar a usar `HiveDataTable` com `ColumnDef` (TanStack) se preferir.

### Exemplo `HiveDataTable` (TanStack direto)

```tsx
import { HiveDataTable } from "@geeklabssh/hive-tablepro";
import type { ColumnDef } from "@tanstack/react-table";

type Row = { id: string; nome: string };

const columns: ColumnDef<Row>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "nome", header: "Nome" }
];

export function Exemplo() {
  return (
    <HiveDataTable
      data={[]}
      columns={columns}
      enableRowSelection
      showExportMenu
    />
  );
}
```

### Exports principais

| Caminho | Conteúdo |
|--------|-----------|
| `@geeklabssh/hive-tablepro` | `DataGrid`, `useGridApiRef`, `GridActionsCellItem`, `GridEditInputCell`, `HiveDataTable`, `HiveDatePicker`, exportações, `cn`, componentes UI |
| `@geeklabssh/hive-tablepro/core/x-data-grid/src` | API compatível com MUI X (`DataGrid`, `GridColDef`, `rows`/`columns`, …) |
| `@geeklabssh/hive-tablepro/core/x-data-grid-premium/src` | Alias MUI Premium: `DataGridPremium`, `GridActionsCellItem` (reexporta o núcleo). Requer pacote ≥ versão que declara este subpath no `exports`; caso contrário importe a partir da raiz `@geeklabssh/hive-tablepro`. |
| `@geeklabssh/hive-tablepro/core/x-data-grid-pro/src` | Alias MUI Pro: `DataGridPro` |
| `@geeklabssh/hive-tablepro/styles.css` | Variáveis CSS e base Tailwind do tema |
| `@geeklabssh/hive-tablepro/table` | Apenas `HiveDataTable` (TanStack `ColumnDef`) |
| `@geeklabssh/hive-tablepro/export` | Apenas exportações |
| `@geeklabssh/hive-tablepro/date-picker` | Apenas date picker |

### Testes

```bash
npm test
```

Testes unitários (**Vitest**) cobrem utilitários centrais da grelha em `core/x-data-grid/src/*.test.ts` (por exemplo `selectionUtils`, `filterFns`, `persistGridPreferences`, `adapter`, `createGridApi`). Use `npm run test:watch` durante desenvolvimento.

Testes **e2e** (Playwright) sob `e2e/` — requerem browsers instalados (`npx playwright install`). Arranque automático do playground via `npm run test:e2e`.

### DataGrid — roadmap e paridade MUI

A lista de funcionalidades, estado por item e notas de implementação está em [`docs/DATA_GRID_BACKLOG.md`](./docs/DATA_GRID_BACKLOG.md).

Props úteis: `preferencesKey` (+ `preferencesStorage`) para gravar sort/filtros/paginação/visibilidade/pin, **`columnOrder`**, **`columnSizing`** (larguras) e (se o agrupamento não for controlado por prop) **`rowGroupingModel`** em `localStorage`; `defaultPreferences` para valores iniciais quando o storage está vazio ou sem um campo; `mergePersistedColumnOrder` / `mergePersistedColumnSizing` / `pickPersistableColumnSizing`; `columnVirtualization` para muitas colunas (sem pinning); `getEstimatedRowHeight` / `enableVariableRowHeight` com virtualização de linhas.

### API imperativa (`apiRef`)

Obtenha a ref com `useGridApiRef()`, passe `apiRef` à `DataGrid` e use métodos alinhados ao MUI X: ordenação/filtros/paginação (`setSortModel`, `getFilterModel`, …), scroll (`scrollToIndexes`, `scrollToRow`), exportação (`exportDataAsCsv`, `exportDataAsExcel`, `exportDataAsPrint`), edição (`startCellEditMode`, `stopCellEditMode`, `getCellMode`, `setEditCellValue`), `subscribeEvent('stateChange' | 'rowSelectionChange' | 'filterChange' | 'sortChange' | 'paginationChange' | 'columnVisibilityChange' | 'pinnedColumnsChange' | 'columnOrderChange' | 'rowGroupingModelChange' | 'columnSizingChange' | 'densityChange' | 'rowModesModelChange', …)`. Detalhes dos tipos: `GridApiCommunity` em `core/x-data-grid/src/types.ts`.

`GridErrorBoundary` envolve a grelha (ou um ramo próximo) para capturar erros de **render** e mostrar um fallback com «Tentar novamente»; opcional `onError` para telemetria e `fallback` customizado.

Há uma região **`aria-live="polite"`** (classe `sr-only`) que anuncia mudanças de **ordenação** e **filtros**; personalize com `localeText.gridAnnounce*` ou desative com **`disableAccessibilityAnnouncements`**.

Utilitário exportado: `isDataCellInteractiveTarget` — útil se replicar lógica de clique em grelhas custom.

### CI

Neste repositório: workflow GitHub Actions `.github/workflows/ci.yml` (typecheck, `check-imports`, Vitest). E2e Playwright não entram na CI por defeito (instalação de browsers); correr localmente com `npm run test:e2e`.

### Validar tema (claro / escuro)

1. Importar `@geeklabssh/hive-tablepro/styles.css` no app.
2. No playground deste repo: `npm run dev` e o botão «Tema escuro» / «Tema claro» (classe `dark` no `documentElement`).
3. Confirmar que grelha, filtros e diálogos usam tokens (`background`, `border`, `muted`, etc.) sem cinzentos hardcoded órfãos.

### Qualidade manual (playground)

Para validar a UI localmente, use `npm run dev` (playground Vite neste repositório). Storybook: `npm run storybook` (história mínima em `stories/DataGrid.stories.tsx`; build estático `npm run build-storybook`).

---

## Inventário no repositório ProtonWeb (antes de migrar ecrãs)

Com o código do ProtonWeb na máquina, na **raiz do ProtonWeb**:

```bash
# listar ficheiros que importam o pacote
rg "@geeklabssh/hive-tablepro" --glob "*.{ts,tsx}" -l
```

Anotar por ecrã: DataGrid / DataGridPro / Premium, `GridColDef`, `useGridApiRef`, date pickers MUI X, `ThemeProvider`, etc., para definir paridade com `HiveDataTable` e `HiveDatePicker`.

---

## Migração da v1 (MUI) para v2

1. Atualizar dependência para `2.x` e remover qualquer uso restante de `@geeklabssh/hive-tablepro/core/...`.
2. Substituir `DataGrid*` por `HiveDataTable` com colunas **TanStack** (`ColumnDef`) em vez de `GridColDef`.
3. Substituir date pickers do fork por `HiveDatePicker` (`react-day-picker` + `date-fns`).
4. Aplicar os passos de **CSS e Tailwind** acima.
5. Regenerar o tarball (`npm run vendor:tablepro`) ou publicar no registry privado e atualizar o lockfile.

---

## Publicar (GitHub Packages) e Docker

O fluxo de registry, `.npmrc` e publicação descrito nas versões anteriores mantém-se; apenas a **versão** e os **imports** mudam. Para imagens Docker sem o código fonte gigante do fork, continue a usar o tarball em `vendor/` ou instalação por registry com token.

---

## CI

Manter `npm run typecheck` e `npm run check-imports` antes de `npm publish`.
