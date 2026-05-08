import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load home page successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SBLT|Tournament/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should display tournament section", async ({ page }) => {
    await page.goto("/");
    const tournamentSection = page.locator("text=Giải Đấu");
    await expect(tournamentSection).toBeVisible();
  });
});

test.describe("Login Flow", () => {
  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Đăng Nhập");
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test("should show validation error on empty login", async ({ page }) => {
    await page.goto("/auth/login");
    await page.click('button:has-text("Đăng Nhập")');
    const error = page.locator("text=/Email|Mật khẩu/i");
    await expect(error).toBeVisible({ timeout: 2000 });
  });
});

test.describe("Navigation", () => {
  test("should navigate to tournaments page", async ({ page }) => {
    await page.goto("/");
    await page.click("text=/Giải Đấu|Tournaments/i");
    await expect(page).toHaveURL(/.*\/tournaments/);
  });

  test("should navigate to rules page", async ({ page }) => {
    await page.goto("/");
    await page.click("text=/Luật|Rules/i");
    await expect(page).toHaveURL(/.*\/rules/);
  });
});
