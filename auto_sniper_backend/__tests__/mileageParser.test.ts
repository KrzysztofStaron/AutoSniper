import { parseMileage } from "../src/utils/parsers/mileageParser";

describe("parseMileage", () => {
  it('should parse mileage with "k" suffix', async () => {
    expect(await parseMileage("1 k")).toBe(1000);
    expect(await parseMileage("1k")).toBe(1000);
  });

  it('should parse mileage with "tys" suffix', async () => {
    expect(await parseMileage("4tys")).toBe(4000);
    expect(await parseMileage("4 tys")).toBe(4000);
  });

  it('should parse mileage with "km" suffix', async () => {
    expect(await parseMileage("100000 km")).toBe(100000);
    expect(await parseMileage("100000km")).toBe(100000);
  });

  it("should parse mileage with spaces", async () => {
    expect(await parseMileage("100 000")).toBe(100000);
    expect(await parseMileage("100 000 km")).toBe(100000);
  });

  it("should handle empty or invalid input", async () => {
    expect(await parseMileage("")).toBe(null);
    expect(await parseMileage("   ")).toBe(null);
    expect(await parseMileage("gtrfed")).toBe(null);
  });
});
