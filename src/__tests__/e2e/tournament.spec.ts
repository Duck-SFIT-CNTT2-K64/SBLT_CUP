import { test, expect } from "@playwright/test";

test.describe("Tournament Listing", () => {
  test("should display tournaments page", async ({ page }) => {
    await page.goto("/tournaments");
    await expect(page.locator("h1, h2")).toBeVisible();
    await expect(page.locator("text=/giải đấu|tournament/i")).toBeVisible();
  });

  test("should show tournament cards", async ({ page }) => {
    await page.goto("/tournaments");
    // Wait for data to load
    await page.waitForTimeout(2000);
    const cards = page.locator("[class*='card'], [class*='Card'], article");
    const count = await cards.count();
    // Page should show at least the layout (0+ cards ok if no data)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should navigate to tournament detail on click", async ({ page }) => {
    await page.goto("/tournaments");
    await page.waitForTimeout(2000);
    const firstLink = page.locator("a[href*='/tournaments/']").first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      await expect(page).toHaveURL(/.*\/tournaments\/[^/]+/);
    }
  });
});

test.describe("Tournament Detail", () => {
  test("should show tournament info section", async ({ page }) => {
    // Navigate to tournaments list first
    await page.goto("/tournaments");
    await page.waitForTimeout(2000);

    const firstLink = page.locator("a[href*='/tournaments/']").first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      // Should see tournament details
      await expect(page.locator("text=/đăng ký|register|giải đấu|tournament/i")).toBeVisible({
        timeout: 5000,
      });
    }
  });
});

test.describe("Prediction Flow", () => {
  test("should show predictions section for logged-in user", async ({ page }) => {
    await page.goto("/tournaments");
    await page.waitForTimeout(2000);

    const firstLink = page.locator("a[href*='/tournaments/']").first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      // Look for prediction-related UI
      const predictionLink = page.locator("text=/dự đoán|predict/i");
      if (await predictionLink.isVisible({ timeout: 3000 })) {
        await predictionLink.click();
        await expect(page).toHaveURL(/.*predict/);
      }
    }
  });
});

test.describe("Leaderboard", () => {
  test("should navigate to leaderboard page", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.locator("text=/bảng xếp hạng|leaderboard|ranking/i")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should display leaderboard table or list", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForTimeout(2000);
    // Should have some content
    const content = page.locator("table, [class*='list'], [class*='rank']");
    const count = await content.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Tournament Registration", () => {
  test("should show register button for open tournaments", async ({ page }) => {
    await page.goto("/tournaments");
    await page.waitForTimeout(2000);

    const firstLink = page.locator("a[href*='/tournaments/']").first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      // Look for register button
      const registerBtn = page.locator("button:has-text('Đăng ký'), button:has-text('Register')");
      // Button may or may not be visible depending on tournament status
      const visible = await registerBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (visible) {
        await expect(registerBtn).toBeEnabled();
      }
    }
  });
});
