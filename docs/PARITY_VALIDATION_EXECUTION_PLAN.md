# Plano de execucao — validacao de paridade funcional

Objetivo: transformar "paridade percebida" em "paridade comprovada" por evidencias de teste, com foco no comportamento esperado pelo ProtonWeb.

## Criterio de pronto (Definition of Done)

- Contrato: sem regressao em `npm run typecheck` e `npm run check-imports`.
- Comportamento: cenarios criticos validados em Vitest + E2E (quando aplicavel).
- Evidencia: cada item marcado com teste dedicado (nome do teste e ficheiro).
- Gate: `npm run backlog:execute` verde no fim da fase.

## Estado atual (resumo)

- P0–P3 executados: API `createGridApi` com cobertura alargada (`createGridApi.test.ts`, `createGridApi.exports.test.ts`), `setCellFocus` em `DataGrid.interaction.test.tsx`, E2E Storybook em `e2e/storybook/datagrid.spec.ts` (incl. stories `PlaywrightParityQuickFilter`, `PlaywrightParityActionsColumn`).
- Backlog de matriz API atualizado em `docs/HIVE_TABLEPRO_FILE_AND_API_BACKLOG.md` e `docs/LEGACY_REPO_FILE_PARITY_BACKLOG.md`.
- Gate recomendado: `$env:RUN_E2E=1; npm run backlog:execute` apos alteracoes.
- Fora de ambito continua: `preProcessEditCellProps` assincrono (Promise); paridade ficheiro-a-ficheiro com todo o legado permanece rastreio via matriz gerada.

## Fase P0 — Risco alto (comecar aqui)

1. API imperativa de edicao e foco:
   - `startCellEditMode`, `stopCellEditMode`, `getCellMode`, `setEditCellValue`, `setCellFocus`.
2. API de navegacao:
   - `scroll`, `scrollToIndexes`, `scrollToRow`.
3. API de estado de linha:
   - `applyTransaction`, `updateRows` (cobrir add/update/remove).
4. Edicao ProtonWeb critica:
   - garantir rejeicao de `processRowUpdate` mantendo linha em edicao.
   - validar `fieldToFocus` e navegacao Tab em `editMode="row"`.

**Estado: concluido** — `createGridApi.test.ts` + `rowEditProtonPattern.test.tsx` + `DataGrid.interaction.test.tsx` (`setCellFocus`).

Aceite P0:
- testes dedicados para todos os itens acima;
- sem flakes em 3 execucoes consecutivas de `npm run test`.

## Fase P1 — Comportamento funcional core

1. Export:
   - `exportDataAsCsv`, `exportDataAsExcel`, `exportDataAsPrint`;
   - cobertura de colunas visiveis, nomes de ficheiro e defaults.
2. Filtros e paineis:
   - `showFilterPanel` / `hideFilterPanel`.
3. Estruturas avancadas:
   - `setPinnedColumns` / `getPinnedColumns`;
   - `setDetailPanelExpandedRowIds` / `get*`;
   - `setTreeExpandedRowIds` / `get*`;
   - `setRowGroupingModel` / `getRowGroupingModel`;
   - `getDensity` / `setDensity`.

**Estado: concluido** — export em `createGridApi.exports.test.ts`; restantes metodos em `createGridApi.test.ts`.

Aceite P1:
- cobertura dedicada em Vitest para cada metodo;
- evidencia de nao regressao em `DataGrid.interaction.test.tsx`.

## Fase P2 — Paridade E2E com cenarios reais

1. Criar cenarios Storybook que espelhem padroes do ProtonWeb:
   - edicao por linha com validacao;
   - acoes em coluna `type: "actions"`;
   - selecao + clipboard + export;
   - filtros e ordenacao combinados.
2. Cobrir em Playwright (`e2e/storybook/datagrid.spec.ts`).

**Estado: concluido** — stories e testes Playwright; correcao de assercao de checkbox (`toBeChecked`) em `datagrid.spec.ts`.

Aceite P2:
- `RUN_E2E=1 npm run backlog:execute` verde;
- sem diferencas comportamentais nos fluxos validados.

## Fase P3 — Fecho de backlog e rastreabilidade

1. Atualizar backlog de paridade:
   - `docs/HIVE_TABLEPRO_FILE_AND_API_BACKLOG.md`;
   - `docs/LEGACY_REPO_FILE_PARITY_BACKLOG.md`.
2. Marcar cada metodo/prop como `OK` apenas com teste associado.
3. Regenerar matriz com `npm run backlog:legacy-matrix`.

**Estado: concluido** — documentos de backlog e matriz API sincronizados; regenerar artefactos com `npm run backlog:legacy-matrix` no pipeline.

Aceite P3:
- backlog com estado coerente e rastreavel;
- pipeline completo verde apos regeneracao.

## Comandos de trabalho

- Validacao rapida: `npm run test`
- Validacao de gates: `npm run typecheck && npm run check-imports`
- Pipeline completo: `npm run backlog:execute`
- Completo com E2E:
  - PowerShell: `$env:RUN_E2E=1; npm run backlog:execute`

## Observacoes

- Nao existe garantia absoluta de 100% sem validacao por cenario.
- Este plano eleva a garantia para um nivel auditable e repetivel.
