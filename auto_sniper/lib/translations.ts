export type Language = "pl" | "en";

export type Translations = {
  hiddenListingsTitle: string;
  // Search Page
  pageTitle: string;
  pageSubtitle: string;
  statsPortals: string;
  statsMonitoring: string;
  statsRealtime: string;

  // Search Form
  searchTitle: string;
  brand: string;
  model: string;
  year: string;
  platform: string;
  dreamCar: string;
  userEmail: string;
  optional: string;
  required: string;

  // Placeholders
  brandPlaceholder: string;
  modelPlaceholder: string;
  selectYear: string;
  dreamCarPlaceholder: string;
  userEmailPlaceholder: string;

  // Platforms
  allPlatforms: string;

  // Location
  gettingLocation: string;
  locationLabel: string;
  locationError: string;

  // Buttons and Actions
  searchButton: string;
  searching: string;

  // Validation and Errors
  fillAllFields: string;
  searchError: string;

  // Search Results
  searchResultsTitle: string;
  searchedCar: string;
  portal: string;
  foundOffers: string;
  lastSearch: string;
  availableOffers: string;
  searchErrorTitle: string;
  searchErrorMessage: string;
  noResultsTitle: string;
  noResultsMessage: string;
  noResultsHint: string;
  carYear: string;
  price: string;
  seeOffer: string;
  km: string;

  // Fitness and Details
  featured: string;
  fitnessScoreBreakdown: string;
  fitnessPrice: string;
  fitnessMileage: string;
  fitnessDistance: string;
  fitnessYear: string;
  fitnessLooks: string;
  fitnessDetails: string;
  fitnessGovData: string;
  fitnessHistory: string;
  totalScore: string;
  viewListing: string;

  // Location Permission
  skipLocation: string;
  skipLocationLong: string;

  // Popup Messages
  popupClose: string;
  popupOk: string;
  popupGotIt: string;
  popupTryAgain: string;

  // Popup Titles
  popupMissingFields: string;
  popupInvalidEmail: string;
  popupSearchSuccess: string;
  popupSearchFailed: string;

  // Popup Messages
  popupMissingFieldsMessage: string;
  popupInvalidEmailMessage: string;
  popupSearchSuccessMessage: string;
  popupSearchFailedMessage: string;
};

export const translations: Record<Language, Translations> = {
  pl: {
    hiddenListingsTitle: "Może Cię zainteresować",
    // Search Page
    pageTitle: "Odkryj swój wymarzony samochód!",
    pageSubtitle: "Przeszukuj każdy portal motoryzacyjny jednym kliknięciem",
    statsPortals: "Portali motoryzacyjnych",
    statsMonitoring: "Monitorowanie ofert",
    statsRealtime: "Aktualizacja na żywo",

    // Search Form
    searchTitle: "Wyszukaj samochód",
    brand: "Marka",
    model: "Model",
    year: "Rok od",
    platform: "Portal",
    dreamCar: "Szczegóły wymarzonego auta",
    userEmail: "Email użytkownika",
    optional: "(opcjonalne)",
    required: "*",

    // Placeholders
    brandPlaceholder: "np. BMW, Mercedes, Audi",
    modelPlaceholder: "np. A4, C-Class, 3 Series",
    selectYear: "Wybierz rok",
    dreamCarPlaceholder:
      "Opisz swoją wizję - np. sportowy samochód z 6-litrowym silnikiem, który przyciąga spojrzenia!",
    userEmailPlaceholder: "np. john.doe@example.com",

    // Platforms
    allPlatforms: "Wszystkie portale",

    // Location
    gettingLocation: "Pobieranie lokalizacji...",
    locationLabel: "Lokalizacja",
    locationError: "Nie udało się pobrać lokalizacji",

    // Buttons and Actions
    searchButton: "Rozpocznij poszukiwania!",
    searching: "Szukam...",

    // Validation and Errors
    fillAllFields: "Proszę wypełnić wszystkie wymagane pola",
    searchError: "Wystąpił błąd podczas wyszukiwania. Spróbuj ponownie.",

    // Search Results
    searchResultsTitle: "Wyniki wyszukiwania",
    searchedCar: "Twój wybór",
    portal: "Źródło",
    foundOffers: "Dostępne oferty",
    lastSearch: "Ostatnia aktualizacja",
    availableOffers: "Ekscytujące możliwości",
    searchErrorTitle: "Błąd wyszukiwania",
    searchErrorMessage: "Nie udało się wykonać wyszukiwania. Spróbuj ponownie.",
    noResultsTitle: "Brak wyników",
    noResultsMessage: "Nie znaleziono żadnych ofert dla podanych kryteriów wyszukiwania.",
    noResultsHint: "Spróbuj zmienić kryteria wyszukiwania lub wybierz inny portal.",
    carYear: "Rok",
    price: "Cena",
    seeOffer: "Sprawdź szczegóły",
    km: " km",

    // Fitness and Details
    featured: "Wyróżnione",
    fitnessScoreBreakdown: "Analiza Fitness Score",
    fitnessPrice: "Cena",
    fitnessMileage: "Przebieg",
    fitnessDistance: "Odległość",
    fitnessYear: "Rok",
    fitnessLooks: "Wygląd",
    fitnessDetails: "Szczegóły",
    fitnessGovData: "Dane gov",
    fitnessHistory: "Historia",
    totalScore: "Wynik całkowity",
    viewListing: "Zobacz ogłoszenie",

    // Location Permission
    skipLocation: "X",
    skipLocationLong: "Użyj domyślnej lokalizacji (Warszawa)",

    // Popup Messages
    popupClose: "Zamknij",
    popupOk: "OK",
    popupGotIt: "Rozumiem!",
    popupTryAgain: "Spróbuj ponownie",

    // Popup Titles
    popupMissingFields: "Brakujące pola",
    popupInvalidEmail: "Nieprawidłowy email",
    popupSearchSuccess: "Wyszukiwanie rozpoczęte! 🎉",
    popupSearchFailed: "Błąd wyszukiwania",

    // Popup Messages
    popupMissingFieldsMessage:
      "Proszę wypełnić wszystkie wymagane pola, w tym adres email, aby kontynuować wyszukiwanie.",
    popupInvalidEmailMessage: "Proszę podać prawidłowy adres email, aby otrzymać wyniki wyszukiwania.",
    popupSearchSuccessMessage:
      "Twoje wyszukiwanie samochodu zostało dodane do kolejki i jest obecnie przetwarzane. Otrzymasz email na adres {email} gdy wyszukiwanie zostanie zakończone.",
    popupSearchFailedMessage:
      "Nie mogliśmy rozpocząć wyszukiwania w tym momencie. Sprawdź połączenie internetowe i spróbuj ponownie.",
  },
  en: {
    hiddenListingsTitle: "Maybe You'll Like",
    // Search Page
    pageTitle: "Discover Your Dream Car!",
    pageSubtitle: "Explore Every Automotive Portal in One Click",
    statsPortals: "Automotive portals",
    statsMonitoring: "Offer monitoring",
    statsRealtime: "Real-time updates",

    // Search Form
    searchTitle: "Search for car",
    brand: "Brand",
    model: "Model",
    year: "Year From",
    platform: "Platform",
    dreamCar: "Dream Car Details",
    userEmail: "User Email",
    optional: "(optional)",
    required: "*",

    // Placeholders
    brandPlaceholder: "e.g. BMW, Mercedes, Audi",
    modelPlaceholder: "e.g. A4, C-Class, 3 Series",
    selectYear: "Select year",
    dreamCarPlaceholder: "Tell us your vision—e.g., a head-turning 6-liter sportscar that impresses everyone!",
    userEmailPlaceholder: "e.g. john.doe@example.com",

    // Platforms
    allPlatforms: "All platforms",

    // Location
    gettingLocation: "Getting location...",
    locationLabel: "Location",
    locationError: "Failed to get location",

    // Buttons and Actions
    searchButton: "Unleash Your Search!",
    searching: "Searching...",

    // Validation and Errors
    fillAllFields: "Please fill in all required fields",
    searchError: "An error occurred during search. Please try again.",

    // Search Results
    searchResultsTitle: "Search Results",
    searchedCar: "Your Match",
    portal: "Source",
    foundOffers: "Available Deals",
    lastSearch: "Last Updated",
    availableOffers: "Exciting Options",
    searchErrorTitle: "Search Error",
    searchErrorMessage: "Failed to perform search. Please try again.",
    noResultsTitle: "No Results",
    noResultsMessage: "No offers found for the specified search criteria.",
    noResultsHint: "Try changing search criteria or select a different platform.",
    carYear: "Year",
    price: "Price",
    seeOffer: "View Details",
    km: " km",

    // Fitness and Details
    featured: "Featured",
    fitnessScoreBreakdown: "Fitness Score Breakdown",
    fitnessPrice: "Price",
    fitnessMileage: "Mileage",
    fitnessDistance: "Distance",
    fitnessYear: "Year",
    fitnessLooks: "Looks",
    fitnessDetails: "Details",
    fitnessGovData: "Gov Data",
    fitnessHistory: "History",
    totalScore: "Total Score",
    viewListing: "View Listing",

    // Location Permission
    skipLocation: "X",
    skipLocationLong: "Use default location (Warsaw)",

    // Popup Messages
    popupClose: "Close",
    popupOk: "OK",
    popupGotIt: "Got it!",
    popupTryAgain: "Try Again",

    // Popup Titles
    popupMissingFields: "Missing Required Fields",
    popupInvalidEmail: "Invalid Email Address",
    popupSearchSuccess: "Search Started Successfully! 🎉",
    popupSearchFailed: "Search Failed",

    // Popup Messages
    popupMissingFieldsMessage:
      "Please fill in all required fields including your email address to continue with the search.",
    popupInvalidEmailMessage: "Please enter a valid email address to receive your search results.",
    popupSearchSuccessMessage:
      "Your car search has been queued and is now being processed. You will receive an email at {email} when the search is complete.",
    popupSearchFailedMessage:
      "We couldn't start your search at the moment. Please check your connection and try again.",
  },
};

export function getTranslations(language: Language): Translations {
  return translations[language];
}
