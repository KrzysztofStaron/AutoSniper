export function parseDateString(dateString: string): string {
  const months: Record<string, string> = {
    styczeń: "01",
    stycznia: "01",
    luty: "02",
    lutego: "02",
    marzec: "03",
    marca: "03",
    kwiecień: "04",
    kwietnia: "04",
    maj: "05",
    maja: "05",
    czerwiec: "06",
    czerwca: "06",
    lipiec: "07",
    lipca: "07",
    sierpień: "08",
    sierpnia: "08",
    wrzesień: "09",
    września: "09",
    październik: "10",
    października: "10",
    listopad: "11",
    listopada: "11",
    grudzień: "12",
    grudnia: "12",
  };

  const regex = /(\d{1,2})\s+([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)\s+(\d{4})/;
  const match = dateString.match(regex);

  if (match) {
    const day = match[1].padStart(2, "0");
    const month = months[match[2].toLowerCase()];
    const year = match[3];

    if (month) {
      return `${day}.${month}.${year}`;
    }
  }

  throw new Error(`Invalid date format: ${dateString}`);
}
