export async function parsePrice(dirtyPrice: string): Promise<number | null> {
  if (!dirtyPrice || !dirtyPrice.trim()) return null;

  // Remove any currency symbols and extra spaces
  let cleanPrice = dirtyPrice.replace(/[^\d,. ]/g, "").trim();

  if (!cleanPrice) return null;

  // Handle comma followed by space as thousands separator: "100, 000" -> "100000"
  if (cleanPrice.includes(", ")) {
    cleanPrice = cleanPrice.replace(/, /g, "");
  }
  // Handle comma as thousands separator without space: "100,000" -> "100000"
  else if (cleanPrice.includes(",") && !cleanPrice.includes(".")) {
    const parts = cleanPrice.split(",");
    if (parts.length === 2 && parts[1].length === 3) {
      // Thousands separator: "100,000" -> "100000"
      cleanPrice = cleanPrice.replace(",", "");
    } else if (parts.length === 2 && parts[1].length <= 2) {
      // Decimal separator: "100,50" -> "100.50"
      cleanPrice = cleanPrice.replace(",", ".");
    }
  }
  // Handle comma and dot together: "1,234.56" -> "1234.56"
  else if (cleanPrice.includes(",") && cleanPrice.includes(".")) {
    cleanPrice = cleanPrice.replace(/,/g, "");
  }

  // Remove any remaining spaces
  cleanPrice = cleanPrice.replace(/\s/g, "");

  // Convert to number
  const price = parseFloat(cleanPrice);

  return isNaN(price) ? null : price;
}
