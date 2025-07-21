import type React from "react";
import "@/app/globals.css";
import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import { LanguageProvider } from "@/lib/language-context";
import { Analytics } from "@vercel/analytics/next";
// Czcionka Oswald dla nagłówków - podobna do Porsche Next dla nagłówków
const oswald = Oswald({
  subsets: ["latin", "latin-ext"],
  variable: "--font-oswald",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Czcionka Inter dla tekstu - czysta, nowoczesna czcionka sans-serif
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoSniper - Wyszukiwarka luksusowych samochodów",
  description: "Znajdź swoje wymarzone luksusowe auto bez przeglądania setek ogłoszeń",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <LanguageProvider>
        <body className={`${oswald.variable} ${inter.variable}`}>
          {children}
          <Analytics />
        </body>
      </LanguageProvider>
    </html>
  );
}
