import { expect, test } from "@playwright/test";

test("playground carrega e mostra conteúdo", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
});
