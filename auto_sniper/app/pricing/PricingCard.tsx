import { SearchX } from "lucide-react";
import React from "react";

const PricingCard = () => {
  return (
    <div className="bg-zinc-900 p-6 sm:p-8 border-t-2 border-blue-500 border-b-0 border-l-0 border-r-0 hover:bg-zinc-800/50 transition-all duration-300 rounded-b-lg">
      <h3>Free</h3>
      <div>
        <h1 className="font-inter text-4xl font-bold">0 zł</h1>
        <h3>Postawowe funkcje</h3>
      </div>
      <div>
        <p>10 ogłoszeń dzinnie</p>
        <p></p>
      </div>
    </div>
  );
};

export default PricingCard;
