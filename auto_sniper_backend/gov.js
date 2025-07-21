async function fetchVehicleData() {
  try {
    const response = await fetch("https://moj.gov.pl/nforms/api/HistoriaPojazdu/1.0.17/data/vehicle-data", {
      credentials: "include",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0",
        Accept: "application/json",
        "Accept-Language": "pl,en-US;q=0.7,en;q=0.3",
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": "9f7c62c3064d57f09c3b8910a3d8d0a8595e362876f09935c570edec31054ab8_2025-05-11T14:18:49.357",
        NF_WID: "HistoriaPojazdu:1746965929125",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        Priority: "u=0",
      },
      body: JSON.stringify({
        registrationNumber: "WN7849L",
        VINNumber: "JT152ZEB200026379",
        firstRegistrationDate: "2001-10-25",
      }),
      method: "POST",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const responseText = await response.text();
    console.log("Raw response:", responseText);

    // Only try to parse if we have content
    if (responseText && responseText.trim()) {
      try {
        const data = JSON.parse(responseText);
        console.log("Parsed data:", data);
        return data;
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        console.error("Response text was:", responseText);
        throw new Error("Invalid JSON response");
      }
    } else {
      console.error("Empty response received");
      throw new Error("Empty response from server");
    }
  } catch (error) {
    console.error("Error fetching vehicle data:", error);
    throw error; // Re-throw to handle it in the calling code
  }
}

fetchVehicleData().catch(error => {
  console.error("Failed to fetch vehicle data:", error);
});
