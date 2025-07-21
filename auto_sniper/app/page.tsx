"use client";

import { Button } from "@/components/ui/button";
import {
  Car,
  ChevronRight,
  Search,
  ChartNetwork,
  SearchX,
  ChevronDown,
  Zap,
  Shield,
  Clock,
  Target,
  Mail,
  Database,
  CheckCircle,
  Globe,
} from "lucide-react";
import Link from "next/link";
import LuxuryLogoCarousel from "./LuxuryLogoCarousel";
import { useState, useEffect } from "react";

const translations = {
  en: {
    badge: "Intelligent car search across all of Poland",
    headline1: "FIND YOUR",
    headline2: "DREAM CAR",
    subtitle1: "Enter brand, model and location - we'll search all automotive portals simultaneously.",
    subtitle2: "Get a complete analysis of the best offers via email",
    step1Title: "1. Describe what you want",
    step1Desc: "Simple description: appearance, features and everything else",
    step2Title: "2. We analyze offers",
    step2Desc: "AI checks all portals and evaluates every offer",
    step3Title: "3. You get an email",
    step3Desc: "Ready list of best offers with ratings and recommendations",
    startSearching: "Start searching",
    howItWorksTitle: "How does AutoSniper work?",
    howItWorksSubtitle: "Simple 3-step process - from search to complete analysis of the best offers",
    enterParamsTitle: "Enter search parameters",
    enterParamsDesc:
      "Choose brand, model, production year, your location and maximum price. You can also add a detailed description of what you're looking for.",
    enterParamsExample: "Example: BMW 320d, 2018-2022, Warsaw, max 120,000 PLN, white elegant car with 6l engine",
    searchPortalsTitle: "We search all portals",
    searchPortalsDesc:
      "Our bots search dozens of automotive portals: OtoMoto, OLX, Gratka, Samochody.pl and many others. We collect all matching offers.",
    searchPortalsExample: "Simultaneously: Major Polish automotive portals",
    aiAnalysisTitle: "AI analyzes and rates offers",
    aiAnalysisDesc:
      "Artificial intelligence analyzes each offer considering price, mileage, location, description and compliance with government databases.",
    aiAnalysisExample: "Price-to-value ratio, credibility, vehicle history",
    receiveAnalysisTitle: "You receive a complete analysis",
    receiveAnalysisDesc: "You get a link to the report via email.",
    receiveAnalysisExample: "Top offers, ratings, warnings, links to ads",
    rating: "Rating",
    analysisCompleted: "Analysis completed",
    foundOffers: "Found 127 offers • Best 15 in report • Sent via email",
    whyAutoSniperTitle: "Why AutoSniper?",
    whyAutoSniperSubtitle: "We've revolutionized the way to search for cars in Poland",
    feature1Title: "Everything in one place",
    feature1Desc:
      "Forget about searching ads on dozens of different sites. We search all automotive portals for you simultaneously.",
    feature2Title: "Intelligent AI analysis",
    feature2Desc:
      "Advanced algorithms analyze each offer considering price, condition, location and seller credibility.",
    feature3Title: "Report via email",
    feature3Desc:
      "You receive a ready report with the best offers, sorted by AI rating, along with links and recommendations.",
    feature4Title: "Time saving",
    feature4Desc:
      "What normally takes hours of browsing portals, we do in minutes. Gain time for more important things.",
    feature5Title: "Precise matching",
    feature5Desc:
      "Our filters and AI help find exactly what you're looking for - without unnecessary offers that don't meet your criteria.",
    feature6Title: "History verification",
    feature6Desc:
      "We check vehicle history in government databases and assess offer credibility, so you can buy with confidence.",
    readyTitle: "Ready to find your dream car?",
    readySubtitle: "Try AutoSniper now - just a few clicks to receive analysis of the best offers via email",
    tryFree: "Try now for free",
    benefits: "✓ No registration • ✓ Results via email • ✓ Completely free",
    socialProof: "We search all major automotive portals in Poland",
    copyright: "© 2024 AutoSniper. All rights reserved.",
  },
  pl: {
    badge: "Inteligentne wyszukiwanie samochodów z całej Polski",
    headline1: "ZNAJDŹ SWÓJ",
    headline2: "WYMARZONY AUTO",
    subtitle1: "Wpisz markę, model i lokalizację - my przeszukamy wszystkie portale motoryzacyjne jednocześnie.",
    subtitle2: "Otrzymasz gotową analizę najlepszych ofert na email",
    step1Title: "1. Wpisz co szukasz",
    step1Desc: "Zwykły opis: wyglądu, wyposażenia i wszystkiego innego",
    step2Title: "2. Analizujemy oferty",
    step2Desc: "AI sprawdza wszystkie portale i ocenia każdą ofertę",
    step3Title: "3. Dostajesz email",
    step3Desc: "Gotowa lista najlepszych ofert z oceną i rekomendacjami",
    startSearching: "Rozpocznij wyszukiwanie",
    howItWorksTitle: "Jak działa AutoSniper?",
    howItWorksSubtitle: "Prosty proces w 3 krokach - od wyszukiwania do gotowej analizy najlepszych ofert",
    enterParamsTitle: "Wprowadź wymagania wyszukiwania",
    enterParamsDesc:
      "Nasze boty przeszukują dziesiątki portali motoryzacyjnych: OtoMoto, OLX, Gratka, Samochody.pl i wiele innych. Zbieramy wszystkie pasujące oferty.",
    enterParamsExample:
      "Przykład: BMW 320d, 2018-2022, Warszawa, max 120,000 zł, czerwony sportowy samochód z silnikiem 6l",
    searchPortalsTitle: "Przeszukujemy wszystkie portale",
    searchPortalsDesc:
      "Nasze boty przeszukują dziesiątki portali motoryzacyjnych: OtoMoto, OLX, Gratka, Samochody.pl i wiele innych. Zbieramy wszystkie pasujące oferty.",
    searchPortalsExample: "Jednocześnie: Główne polskie portale motoryzacyjne",
    aiAnalysisTitle: "AI analizuje i ocenia oferty",
    aiAnalysisDesc:
      "Sztuczna inteligencja analizuje każdą ofertę pod kątem ceny, przebiegu, lokalizacji, opisu i zgodności z bazami danych rządowych.",
    aiAnalysisExample: "Stosunek ceny do wartości, wiarygodność, historia pojazdu",
    receiveAnalysisTitle: "Otrzymujesz gotową analizę",
    receiveAnalysisDesc: "Na email dostaniesz link do raportu.",
    receiveAnalysisExample: "Top oferty, oceny, ostrzeżenia, linki do ogłoszeń",
    rating: "Ocena",
    analysisCompleted: "Analiza zakończona",
    foundOffers: "Znaleziono 127 ofert • Najlepsze 15 w raporcie • Wysłano na email",
    whyAutoSniperTitle: "Dlaczego AutoSniper?",
    whyAutoSniperSubtitle: "Zrewolucjonizowaliśmy sposób szukania samochodów w Polsce",
    feature1Title: "Wszystko w jednym miejscu",
    feature1Desc:
      "Zapomnij o szukaniu ogłoszeń na dziesiątkach różnych stron. Przeszukujemy za Ciebie wszystkie portale motoryzacyjne jednocześnie.",
    feature2Title: "Inteligentna analiza AI",
    feature2Desc:
      "Zaawansowane algorytmy analizują każdą ofertę pod kątem ceny, stanu, lokalizacji, wyposażenia, historii pojazdu i wiarygodności sprzedawcy",
    feature3Title: "Raport na email",
    feature3Desc:
      "Otrzymujesz gotowy raport z najlepszymi ofertami, posortowanymi według oceny AI, wraz z linkami i rekomendacjami.",
    feature4Title: "Oszczędność czasu",
    feature4Desc:
      "To co normalnie zajmuje godziny przeglądania portali, my robimy automatycznie i dużo dokładniej. Zyskaj czas na ważniejsze rzeczy.",
    feature5Title: "Precyzyjne dopasowanie",
    feature5Desc:
      "Nasze filtry i AI pomagają znaleźć dokładnie to, czego szukasz - bez zbędnych ofert, które nie spełniają Twoich kryteriów.",
    feature6Title: "Weryfikacja historii",
    feature6Desc:
      "Sprawdzamy historię pojazdu w bazach rządowych i oceniamy wiarygodność oferty, żebyś mógł kupować z pewnością.",
    readyTitle: "Gotowy na znalezienie wymarzonego auta?",
    readySubtitle:
      "Wypróbuj AutoSniper już teraz - wystarczy kilka kliknięć, aby otrzymać analizę najlepszych ofert na email",
    tryFree: "Wypróbuj teraz za darmo",
    benefits: "✓ Bez rejestracji • ✓ Wyniki na email • ✓ Całkowicie za darmo",
    socialProof: "Przeszukujemy wszystkie najważniejsze portale motoryzacyjne w Polsce",
    copyright: "© 2025 AutoSniper. Wszystkie prawa zastrzeżone.",
  },
};

export default function Home() {
  const [language, setLanguage] = useState<"en" | "pl">("pl");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang");
    if (lang === "en") {
      setLanguage("en");
    } else {
      setLanguage("pl"); // Default to Polish if no valid parameter is found
    }
  }, []);

  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg border border-gray-200">
          <Globe className="h-4 w-4 text-gray-600" />
          <Button
            variant={language === "en" ? "default" : "ghost"}
            size="sm"
            onClick={() => setLanguage("en")}
            className="h-8 px-3 text-xs rounded-full"
          >
            EN
          </Button>
          <Button
            variant={language === "pl" ? "default" : "ghost"}
            size="sm"
            onClick={() => setLanguage("pl")}
            className="h-8 px-3 text-xs rounded-full"
          >
            PL
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex flex-col">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(99,102,241,0.1),transparent_50%)]"></div>

        <div className="relative container mx-auto px-4 py-8 sm:py-12 lg:py-16 flex-1 flex flex-col justify-center">
          <div className="max-w-6xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t.badge}</span>
              <span className="sm:hidden">AI {language === "pl" ? "wyszukiwanie aut" : "car search"}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                {t.headline1}
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t.headline2}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-4">
              {t.subtitle1}
              <br className="hidden md:block" />
              <span className="font-semibold text-gray-800">{t.subtitle2}</span>
            </p>

            {/* CTA Button - Moved up and made more prominent */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 sm:mb-12">
              <Link href="/search">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 sm:px-12 lg:px-16 py-3 sm:py-4 lg:py-6 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 w-full sm:w-auto">
                  <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  {t.startSearching}
                </Button>
              </Link>
            </div>

            {/* How it works - Quick Steps - Made more compact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-5xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg sm:rounded-xl w-fit mx-auto mb-2 sm:mb-4">
                  <Search className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 mb-1 sm:mb-2">
                  {t.step1Title}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm">{t.step1Desc}</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                <div className="bg-indigo-100 p-2 sm:p-3 rounded-lg sm:rounded-xl w-fit mx-auto mb-2 sm:mb-4">
                  <ChartNetwork className="h-4 w-4 sm:h-6 sm:w-6 text-indigo-600" />
                </div>
                <div className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 mb-1 sm:mb-2">
                  {t.step2Title}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm">{t.step2Desc}</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                <div className="bg-purple-100 p-2 sm:p-3 rounded-lg sm:rounded-xl w-fit mx-auto mb-2 sm:mb-4">
                  <Mail className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <div className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 mb-1 sm:mb-2">
                  {t.step3Title}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm">{t.step3Desc}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Detail Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.howItWorksTitle.split(" ").slice(0, -1).join(" ")} <span className="text-blue-600">AutoSniper</span>
              {language === "en" ? " work?" : "?"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.howItWorksSubtitle}</p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Process Steps */}
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-600 text-white rounded-full p-3 flex-shrink-0">
                    <Search className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t.enterParamsTitle}</h3>
                    <p className="text-gray-600 mb-3">{t.enterParamsDesc}</p>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700">
                      <strong>{language === "en" ? "Example" : "Przykład"}:</strong> {t.enterParamsExample}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-purple-600 text-white rounded-full p-3 flex-shrink-0">
                    <ChartNetwork className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t.aiAnalysisTitle}</h3>
                    <p className="text-gray-600 mb-3">{t.aiAnalysisDesc}</p>
                    <div className="bg-purple-50 p-3 rounded-lg text-sm text-gray-700">
                      <strong>{language === "en" ? "We evaluate" : "Oceniamy"}:</strong> {t.aiAnalysisExample}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-green-600 text-white rounded-full p-3 flex-shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t.receiveAnalysisTitle}</h3>
                    <p className="text-gray-600 mb-3">{t.receiveAnalysisDesc}</p>
                    <div className="bg-green-50 p-3 rounded-lg text-sm text-gray-700">
                      <strong>{language === "en" ? "In email" : "W emailu"}:</strong> {t.receiveAnalysisExample}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Visual */}
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-xl p-8 relative z-10">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <span className="font-medium">BMW 320d 2020</span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {t.rating}: 9.2/10
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Audi A4 2019</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {t.rating}: 8.7/10
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Mercedes C220 2018</span>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        {t.rating}: 7.9/10
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-sm">{t.analysisCompleted}</span>
                    </div>
                    <p className="text-sm text-gray-600">{t.foundOffers}</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-2xl transform rotate-6"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.whyAutoSniperTitle.split(" ").slice(0, -1).join(" ")} <span className="text-blue-600">AutoSniper</span>
              ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t.whyAutoSniperSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Feature 1 */}
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-blue-100">
              <div className="bg-blue-600 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <SearchX className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{t.feature1Title}</h3>
              <p className="text-gray-700 leading-relaxed">{t.feature1Desc}</p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-indigo-100">
              <div className="bg-indigo-600 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <ChartNetwork className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{t.feature2Title}</h3>
              <p className="text-gray-700 leading-relaxed">{t.feature2Desc}</p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100/50 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-purple-100">
              <div className="bg-purple-600 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{t.feature3Title}</h3>
              <p className="text-gray-700 leading-relaxed">{t.feature3Desc}</p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-gradient-to-br from-green-50 to-green-100/50 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-green-100">
              <div className="bg-green-600 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{t.feature4Title}</h3>
              <p className="text-gray-700 leading-relaxed">{t.feature4Desc}</p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-gradient-to-br from-orange-50 to-orange-100/50 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-orange-100">
              <div className="bg-orange-600 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{t.feature5Title}</h3>
              <p className="text-gray-700 leading-relaxed">{t.feature5Desc}</p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-gradient-to-br from-pink-50 to-pink-100/50 p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-pink-100">
              <div className="bg-pink-600 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{t.feature6Title}</h3>
              <p className="text-gray-700 leading-relaxed">{t.feature6Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Try It Out Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{t.readyTitle}</h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">{t.readySubtitle}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/search">
                <Button className="bg-white text-blue-600 hover:bg-gray-50 px-10 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  <Search className="mr-2 h-5 w-5" />
                  {t.tryFree}
                </Button>
              </Link>
              <div className="text-blue-100 text-sm">{t.benefits}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-gray-500 font-medium mb-8">{t.socialProof}</p>
          </div>
          <div className="max-w-6xl mx-auto relative opacity-40">
            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white pointer-events-none z-10"></div>
            <LuxuryLogoCarousel height={80} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">AutoSniper</span>
            </div>
            <div className="text-gray-400 text-sm">{t.copyright}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
