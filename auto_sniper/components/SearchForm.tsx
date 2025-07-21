"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePopup } from "@/components/ui/popup";
import { Search, MapPin, Car, Calendar, Tag, Heart, DollarSign, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { SearchPlatform, LocationData } from "@/lib/types";
import { useLanguage } from "@/lib/language-context";
import { splitPrompt } from "@/app/actions/splitPrompt";
import { submitSearch } from "@/app/actions/submitSearch";

export default function SearchForm() {
  const { t } = useLanguage();
  const { showPopup, PopupComponent } = usePopup();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [dreamCarDescription, setDreamCarDescription] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [platform, setPlatform] = useState<SearchPlatform>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDismissed, setLocationDismissed] = useState(false);

  const carBrands = [
    "Acura",
    "Alfa Romeo",
    "Aston Martin",
    "Audi",
    "Bentley",
    "BMW",
    "Bugatti",
    "Buick",
    "BYD",
    "Cadillac",
    "Chery",
    "Chevrolet",
    "Chrysler",
    "Citroën",
    "Cupra",
    "Dacia",
    "Daewoo",
    "Daihatsu",
    "Dodge",
    "DS",
    "Ferrari",
    "Fiat",
    "Ford",
    "Genesis",
    "GMC",
    "Great Wall",
    "Honda",
    "Hummer",
    "Hyundai",
    "Infiniti",
    "Isuzu",
    "Iveco",
    "Jaguar",
    "Jeep",
    "Kia",
    "Koenigsegg",
    "Lada",
    "Lamborghini",
    "Lancia",
    "Land Rover",
    "Lexus",
    "Lincoln",
    "Lotus",
    "Lucid",
    "Maserati",
    "Maybach",
    "Mazda",
    "McLaren",
    "Mercedes-Benz",
    "MG",
    "MINI",
    "Mitsubishi",
    "Morgan",
    "Nissan",
    "Opel",
    "Pagani",
    "Peugeot",
    "Polestar",
    "Porsche",
    "Ram",
    "Renault",
    "Rivian",
    "Rolls-Royce",
    "Saab",
    "SEAT",
    "Skoda",
    "Smart",
    "Subaru",
    "Suzuki",
    "Tesla",
    "Toyota",
    "Volkswagen",
    "Volvo",
    "Żuk",
  ];

  // Get user's location
  const getUserLocation = async () => {
    setLocationLoading(true);
    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            setLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
            setLocationLoading(false);
          },
          error => {
            console.error("Error getting location:", error);
            // Default to Warsaw coordinates
            setLocation({ lat: 52.2297, lon: 21.0122 });
            setLocationLoading(false);
          }
        );
      } else {
        // Default to Warsaw coordinates
        setLocation({ lat: 52.2297, lon: 21.0122 });
        setLocationLoading(false);
      }
    } catch (error) {
      console.error("Location error:", error);
      setLocation({ lat: 52.2297, lon: 21.0122 });
      setLocationLoading(false);
    }
  };

  // Skip location and use default
  const skipLocation = () => {
    setLocationDismissed(true);
    setLocation({ lat: 52.2297, lon: 21.0122 });
    setLocationLoading(false);
  };

  useEffect(() => {
    if (!locationDismissed) {
      getUserLocation();
    }
  }, [locationDismissed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand || !model || !year || !location || !userEmail) {
      showPopup({
        type: "warning",
        title: t.popupMissingFields,
        message: t.popupMissingFieldsMessage,
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      showPopup({
        type: "error",
        title: t.popupInvalidEmail,
        message: t.popupInvalidEmailMessage,
      });
      return;
    }

    setIsLoading(true);

    const splitPromptValues = await splitPrompt(dreamCarDescription);
    console.log(splitPromptValues);

    const { look, description, history } = splitPromptValues;

    try {
      // Create query object for the new API
      const query = {
        brand: brand.trim(),
        model: model.trim(),
        year: parseInt(year),
        maxPrice: maxPrice ? parseInt(maxPrice.replace(/\D/g, "")) : undefined,
        location,
        description_forlooks: look,
        description_fordescription: description,
        description_forgovdata: history,
      };

      const requestData = {
        query,
        platform,
        userEmail: userEmail.trim(),
      };

      const result = await submitSearch(requestData);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Show success message with database path
      showPopup({
        type: "success",
        title: t.popupSearchSuccess,
        message: t.popupSearchSuccessMessage.replace("{email}", userEmail),
        details: `https://auto-sniper-mocha.vercel.app/results/${result.data?.searchId}`,
        confirmText: t.popupGotIt,
      });

      // Reset form
      setBrand("");
      setModel("");
      setYear("");
      setMaxPrice("");
      setDreamCarDescription("");
      setUserEmail("");
      setPlatform("all");
    } catch (error) {
      console.error("Search error:", error);

      // Check if it's a mixed content error
      if (error instanceof TypeError && error.message.includes("Mixed Content")) {
        showPopup({
          type: "error",
          title: "Connection Error",
          message: "Unable to connect to the server due to security restrictions. Please contact support.",
          confirmText: t.popupTryAgain,
        });
      } else {
        showPopup({
          type: "error",
          title: t.popupSearchFailed,
          message: t.popupSearchFailedMessage,
          confirmText: t.popupTryAgain,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const platforms: { value: SearchPlatform; label: string }[] = [
    { value: "all", label: t.allPlatforms },
    { value: "otomoto", label: "OtoMoto" },
    { value: "olx", label: "OLX" },
    { value: "samochody", label: "Samochody.pl" },
    { value: "autoplac", label: "AutoPlac" },
    { value: "gratka", label: "Gratka" },
  ];

  const formatPrice = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPrice(e.target.value);
    setMaxPrice(formatted);
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Search className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900">{t.searchTitle}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Brand */}
              <div>
                <label htmlFor="brand" className="block text-sm font-medium mb-2 text-gray-700">
                  <Tag className="h-4 w-4 inline mr-2" />
                  {t.brand} <span className="text-blue-600">{t.required}</span>
                </label>
                <Input
                  id="brand"
                  type="text"
                  placeholder={t.brandPlaceholder}
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  required
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                  list="brand-suggestions"
                />
                <datalist id="brand-suggestions">
                  {carBrands.map(carBrand => (
                    <option key={carBrand} value={carBrand} />
                  ))}
                </datalist>
              </div>

              {/* Model */}
              <div>
                <label htmlFor="model" className="block text-sm font-medium mb-2 text-gray-700">
                  <Car className="h-4 w-4 inline mr-2" />
                  {t.model} <span className="text-blue-600">{t.required}</span>
                </label>
                <Input
                  id="model"
                  type="text"
                  placeholder={t.modelPlaceholder}
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  required
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Year */}
              <div>
                <label htmlFor="year" className="block text-sm font-medium mb-2 text-gray-700">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  {t.year} <span className="text-blue-600">{t.required}</span>
                </label>
                <select
                  id="year"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-md bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">{t.selectYear}</option>
                  {years.map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Max Price */}
            <div>
              <label htmlFor="maxPrice" className="block text-sm font-medium mb-2 text-gray-700">
                <DollarSign className="h-4 w-4 inline mr-2" />
                Max Price (PLN) <span className="text-gray-500">{t.optional}</span>
              </label>
              <Input
                id="maxPrice"
                type="text"
                placeholder="e.g. 100 000"
                value={maxPrice}
                onChange={handlePriceChange}
                className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Dream Car Description */}
            <div>
              <label htmlFor="dreamCar" className="block text-sm font-medium mb-2 text-gray-700">
                <Heart className="h-4 w-4 inline mr-2" />
                {t.dreamCar} <span className="text-gray-500">{t.optional}</span>
              </label>
              <textarea
                id="dreamCar"
                placeholder={t.dreamCarPlaceholder}
                value={dreamCarDescription}
                onChange={e => setDreamCarDescription(e.target.value)}
                rows={3}
                spellCheck="false"
                className="w-full px-3 py-2 rounded-md bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
              />
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                {t.platform} <span className="text-gray-500">{t.optional}</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {platforms.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlatform(p.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      platform === p.value
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Status */}
            <div className="flex items-center justify-between gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {locationLoading
                  ? t.gettingLocation
                  : location
                  ? `${t.locationLabel}: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
                  : t.locationError}
              </div>
              {locationLoading && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={skipLocation}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50 text-xs"
                >
                  {t.skipLocation}
                </Button>
              )}
            </div>

            {/* User Email */}
            <div>
              <label htmlFor="userEmail" className="block text-sm font-medium mb-2 text-gray-700">
                <Mail className="h-4 w-4 inline mr-2" />
                {t.userEmail} <span className="text-blue-600">{t.required}</span>
              </label>
              <Input
                id="userEmail"
                type="email"
                placeholder={t.userEmailPlaceholder}
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                required
                className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !location}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {t.searching}
                </div>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  {t.searchButton}
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
      <PopupComponent />
    </>
  );
}
