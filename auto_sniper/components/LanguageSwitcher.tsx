"use client";

import { useLanguage } from "@/lib/language-context";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "pl" ? "en" : "pl");
  };

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      size="sm"
      className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
    >
      <Globe className="h-4 w-4 mr-2" />
      {language === "pl" ? "EN" : "PL"}
    </Button>
  );
}
