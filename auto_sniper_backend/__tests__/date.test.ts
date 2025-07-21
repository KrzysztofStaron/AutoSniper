import { parseDateString } from "../src/utils/parsers/yearParser";

describe("parseDateString", () => {
  it("should parse date string", () => {
    expect(parseDateString("1 stycznia 2020")).toBe("01.01.2020");
    expect(parseDateString("22 września 2014")).toBe("22.09.2014");
    expect(parseDateString("10 czerwca 2014")).toBe("10.06.2014");
  });
});
