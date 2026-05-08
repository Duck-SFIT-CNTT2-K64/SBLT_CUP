import { formatCurrency, formatDate, formatDateTime, getPlacementLabel, getPlacementColor, cn } from "@/lib/utils";

describe("formatCurrency", () => {
  test("formats Vietnamese currency correctly", () => {
    expect(formatCurrency(1000000)).toContain("1.000.000");
  });

  test("formats zero correctly", () => {
    expect(formatCurrency(0)).toContain("0");
  });

  test("formats large amounts", () => {
    expect(formatCurrency(100000000)).toContain("100.000.000");
  });
});

describe("formatDate", () => {
  test("formats date in Vietnamese locale", () => {
    const result = formatDate(new Date(2026, 0, 15)); // Jan 15, 2026
    expect(result).toContain("15");
    expect(result).toContain("01");
    expect(result).toContain("2026");
  });

  test("handles string date input", () => {
    const result = formatDate("2026-03-20");
    expect(result).toContain("20");
    expect(result).toContain("03");
    expect(result).toContain("2026");
  });
});

describe("formatDateTime", () => {
  test("includes time components", () => {
    const result = formatDateTime(new Date(2026, 0, 15, 14, 30));
    expect(result).toContain("15");
    expect(result).toContain("01");
    expect(result).toContain("2026");
  });
});

describe("getPlacementLabel", () => {
  test("returns correct labels for top placements", () => {
    expect(getPlacementLabel(1)).toBe("Quán quân");
    expect(getPlacementLabel(2)).toBe("Á quân");
    expect(getPlacementLabel(3)).toBe("Hạng 3");
    expect(getPlacementLabel(4)).toBe("Hạng 4");
  });

  test("returns generic label for lower placements", () => {
    expect(getPlacementLabel(5)).toBe("Hạng 5");
    expect(getPlacementLabel(8)).toBe("Hạng 8");
  });
});

describe("getPlacementColor", () => {
  test("returns correct colors for placements", () => {
    expect(getPlacementColor(1)).toBe("text-yellow-500");
    expect(getPlacementColor(2)).toBe("text-gray-400");
    expect(getPlacementColor(3)).toBe("text-amber-600");
    expect(getPlacementColor(4)).toBe("text-blue-400");
    expect(getPlacementColor(5)).toBe("text-gray-500");
  });
});

describe("cn", () => {
  test("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  test("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
    expect(result).not.toContain("hidden");
  });
});
