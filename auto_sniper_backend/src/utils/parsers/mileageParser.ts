export async function parseMileage(dirtyMileage: string): Promise<number | null> {
  if (!dirtyMileage || typeof dirtyMileage !== "string") {
    return null;
  }

  // Clean and normalize the input
  dirtyMileage = dirtyMileage.toLowerCase().trim();
  if (!dirtyMileage) {
    return null;
  }

  // Remove all spaces
  dirtyMileage = dirtyMileage.replace(/\s+/g, "");

  // Handle 'k' suffix (thousands)
  if (dirtyMileage.endsWith("k")) {
    const number = parseFloat(dirtyMileage.replace("k", ""));
    return isNaN(number) ? null : Math.round(number * 1000);
  }

  // Handle 'tys' suffix (thousands in Polish)
  if (dirtyMileage.endsWith("tys")) {
    const number = parseFloat(dirtyMileage.replace("tys", ""));
    return isNaN(number) ? null : Math.round(number * 1000);
  }

  // Remove 'km' suffix if present
  dirtyMileage = dirtyMileage.replace("km", "");

  // Remove all non-numeric characters except decimal point
  dirtyMileage = dirtyMileage.replace(/[^\d.]/g, "");

  const number = parseInt(dirtyMileage);
  return isNaN(number) ? null : number;
}
