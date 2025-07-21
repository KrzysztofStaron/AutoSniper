import { parsePrice } from "../src/utils/parsers/priceParser";

describe("parsePrice", () => {
  it("should parse price", async () => {
    expect(await parsePrice("100000")).toBe(100000);
  });

  it("should parse price with spaces", async () => {
    expect(await parsePrice("100 000")).toBe(100000);
  });

  it("should parse price when separated by comma", async () => {
    expect(await parsePrice("100, 000")).toBe(100000);
  });

  it("should parse price with decimal point", async () => {
    expect(await parsePrice("1000.20")).toBe(1000.2);
  });

  it("should handle empty or invalid input", async () => {
    expect(await parsePrice("")).toBe(null);
    expect(await parsePrice("   ")).toBe(null);
    expect(await parsePrice("gtrfed")).toBe(null);
  });
});
