"use client";

import Image from "next/image";

export default function LuxuryLogoCarousel({ height = 100 }: { height?: number }) {
  // Luxury brand logos
  const luxuryBrands = [
    { name: "BMW", logo: "/logos/bmw.png" },
    { name: "OLX", logo: "/logos/logo-olx-nowe.png" },
    { name: "Porsche", logo: "/logos/porsche-logo.avif" },
    { name: "Mercedes", logo: "/logos/mercedes.png" },
  ];

  return (
    <div className="w-full overflow-hidden" style={{ height: `${height}px` }}>
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .carousel-track {
          display: flex;
          animation: scroll 20s linear infinite;
          width: calc(200%);
        }

        .carousel-item {
          flex: 0 0 auto;
          width: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 2rem;
        }
      `}</style>

      <div className="carousel-track">
        {/* First set of logos */}
        {luxuryBrands.map((brand, index) => (
          <div key={`brand-${index}`} className="carousel-item" style={{ height: `${height}px` }}>
            <Image
              src={brand.logo || "/placeholder.svg"}
              alt={`${brand.name} logo`}
              width={160}
              height={80}
              className="object-contain max-h-full"
            />
          </div>
        ))}

        {/* Duplicate set for seamless looping */}
        {luxuryBrands.map((brand, index) => (
          <div key={`brand-dup-${index}`} className="carousel-item" style={{ height: `${height}px` }}>
            <Image
              src={brand.logo || "/placeholder.svg"}
              alt={`${brand.name} logo`}
              width={160}
              height={80}
              className="object-contain max-h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
