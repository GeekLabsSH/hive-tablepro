import { expect, test, type Page } from "@playwright/test";

/** Storybook 8: `title` + `export name` → id em kebab-case. */
const STORY_DEFAULT = "iframe.html?id=datagrid-basic--default&viewMode=story";
/** Sem DnD: asserções de cabeçalho/menu são mais estáveis no E2E (evita `th`/`columnheader` com nomes compostos). */
const STORY_NO_DND = "iframe.html?id=datagrid-basic--column-reorder-disabled&viewMode=story";
const STORY_SMOKE = "iframe.html?id=datagrid-basic--playwright-smoke&viewMode=story";
/** Storybook 8: `PlaywrightG5…` gera id com hífens em `G5` → `g-5`. */
const STORY_G5_PASTE =
  "iframe.html?id=datagrid-basic--playwright-g-5-clipboard-paste&viewMode=story";
const STORY_G5_ROW_STOP =
  "iframe.html?id=datagrid-basic--playwright-g-5-row-edit-stop-reason&viewMode=story";
const STORY_G6_VIRTUAL_SCROLL =
  "iframe.html?id=datagrid-basic--playwright-g-6-virtual-scroll-smoke&viewMode=story";
const STORY_PARITY_QUICK_FILTER =
  "iframe.html?id=datagrid-basic--playwright-parity-quick-filter&viewMode=story";
const STORY_PARITY_ACTIONS =
  "iframe.html?id=datagrid-basic--playwright-parity-actions-column&viewMode=story";

/** Raiz da `<DataGrid />` (inclui grelha + rodapé de paginação). */
function dataGridRoot(page: Page) {
  return page.locator("div.w-full.space-y-2").filter({ has: page.locator('[role="grid"]') });
}

test.describe("DataGrid no Storybook (Chrome)", () => {
  test("Default: reordenação de colunas ativa (controlo de arrasto)", async ({ page }) => {
    await page.goto(STORY_DEFAULT);
    await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Reordenar coluna" })).toHaveCount(3);
  });

  test("ColumnReorderDisabled: ocultar coluna, checkbox linha, linhas por página (clique real)", async ({ page }) => {
    await page.goto(STORY_NO_DND);
    await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 30_000 });

    await expect(page.getByRole("columnheader", { name: "Nome" })).toBeVisible();

    await page.getByRole("button", { name: "Menu da coluna" }).nth(1).click();
    await page.getByRole("menuitem", { name: "Ocultar coluna" }).click();

    await expect(page.getByRole("columnheader", { name: "Nome" })).toHaveCount(0);

    const rowCheckbox = dataGridRoot(page).getByRole("checkbox", { name: "Selecionar linha" }).first();
    await rowCheckbox.click();
    await expect(rowCheckbox).toBeChecked();

    const rowsSelect = dataGridRoot(page).getByLabel("Linhas por página");
    await rowsSelect.selectOption("10");
    await expect(rowsSelect).toHaveValue("10");

    await expect(page.getByText(/Página 1 de 1/)).toBeVisible();
  });

  test("PlaywrightSmoke: botão página seguinte (clique real)", async ({ page }) => {
    await page.goto(STORY_SMOKE);
    await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 30_000 });

    await expect(page.getByText(/Página 1 de 3/)).toBeVisible();

    const nextBtn = dataGridRoot(page).locator("div.flex.gap-1").getByRole("button", { name: ">", exact: true });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    await expect(page.getByText(/Página 2 de 3/)).toBeVisible({ timeout: 15_000 });
  });

  test("G5.1: colar TSV na célula focada (clipboard multi-célula)", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(STORY_G5_PASTE);
    await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 30_000 });

    const nameCell = page.locator('[data-hive-cell][data-field="name"]').first();
    await nameCell.click();
    await page.evaluate(async (text) => {
      await navigator.clipboard.writeText(text);
    }, "ZetaCol\t999");

    await page.keyboard.press("Control+KeyV");

    await expect(page.getByRole("grid").getByText("ZetaCol", { exact: true })).toBeVisible({
      timeout: 10_000
    });
    await expect(page.getByRole("grid").getByText("999", { exact: true })).toBeVisible();
  });

  test("G5.2: onRowEditStop expõe reason (cancelar e gravar)", async ({ page }) => {
    await page.goto(STORY_G5_ROW_STOP);
    await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 30_000 });

    await page.locator('[data-hive-cell][data-field="name"]').first().dblclick();
    const cancelar = dataGridRoot(page).getByRole("button", { name: "Cancelar", exact: true });
    await expect(cancelar).toBeVisible({ timeout: 10_000 });
    await cancelar.click();
    await expect(page.getByTestId("g5-last-stop-reason")).toHaveText("cancelButtonClick", {
      timeout: 10_000
    });
    await expect(page.getByTestId("g5-previous-row-name")).toHaveText("Alpha", { timeout: 10_000 });

    await page.locator('[data-hive-cell][data-field="name"]').nth(1).dblclick();
    const gravar = dataGridRoot(page).getByRole("button", { name: "Gravar", exact: true });
    await expect(gravar).toBeVisible({ timeout: 10_000 });
    await gravar.click();
    await expect(page.getByTestId("g5-last-stop-reason")).toHaveText("saveButtonClick", {
      timeout: 10_000
    });
    await expect(page.getByTestId("g5-previous-row-name")).toHaveText("Beta", { timeout: 10_000 });
  });

  test("G5.4: Tab na última célula editável sai com tabKeyDown", async ({ page }) => {
    await page.goto(STORY_G5_ROW_STOP);
    await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 30_000 });

    await page.locator('[data-hive-cell][data-field="name"]').first().dblclick();
    await expect(
      dataGridRoot(page).getByRole("button", { name: "Gravar", exact: true })
    ).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    await expect(page.getByTestId("g5-last-stop-reason")).toHaveText("tabKeyDown", {
      timeout: 10_000
    });
    await expect(page.getByTestId("g5-previous-row-name")).toHaveText("Alpha", { timeout: 10_000 });
  });

  test("G5.6 / #150: scroll virtualizado — última linha + métrica de tempo (CI)", async ({
    page
  }, testInfo) => {
    await page.goto(STORY_G6_VIRTUAL_SCROLL);
    const grid = page.getByRole("grid");
    await expect(grid).toBeVisible({ timeout: 30_000 });

    await expect(grid.getByText("Row 1", { exact: true })).toBeVisible();

    const elapsedMs = await grid.evaluate(async () => {
      const root = document.querySelector('[role="grid"]') as HTMLElement | null;
      if (!root) return -1;
      const t0 = performance.now();
      root.scrollTop = root.scrollHeight;
      const deadline = t0 + 20_000;
      while (performance.now() < deadline) {
        if (root.innerText.includes("Row 500")) {
          return Math.round(performance.now() - t0);
        }
        await new Promise<void>((r) => {
          requestAnimationFrame(() => r());
        });
      }
      return -1;
    });

    expect(elapsedMs, "a linha Row 500 deve ficar disponível após scroll").toBeGreaterThan(0);
    testInfo.annotations.push({
      type: "perf",
      description: `virtual-scroll-to-row-500-ms: ${elapsedMs}`
    });
    expect(
      elapsedMs,
      "limiar evita regressões graves de scroll virtual em CI (ajustar se runners forem muito lentos)"
    ).toBeLessThan(20_000);
  });

  test("Paridade: filtro rápido restringe linhas (Gamma apenas)", async ({ page }) => {
    await page.goto(STORY_PARITY_QUICK_FILTER);
    const grid = page.getByRole("grid");
    await expect(grid).toBeVisible({ timeout: 30_000 });

    await page.getByPlaceholder("Filtrar…").fill("Gamma");
    await expect(grid.getByText("Gamma", { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(grid.getByText("Alpha", { exact: true })).toHaveCount(0);
    await expect(grid.getByText("Beta", { exact: true })).toHaveCount(0);
  });

  test("Paridade: coluna actions com botão Editar visível", async ({ page }) => {
    await page.goto(STORY_PARITY_ACTIONS);
    await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Editar", exact: true })).toBeVisible({
      timeout: 15_000
    });
  });
});
