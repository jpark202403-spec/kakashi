"use client";

export interface BrandList {
  image: string;
  lightimg?: string;
  name: string;
}

interface BrandSliderProps {
  brandList: BrandList[];
}

export default function BrandSlider({ brandList }: BrandSliderProps) {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 pt-6 pb-20">
      {/* Divider with text */}
      <div className="relative flex items-center justify-center mb-10">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200/80" />
        </div>
        <div className="relative px-4 bg-white text-xs text-neutral-500 font-normal">
          Loved by 1000+ big and small brands around the worlds
        </div>
      </div>

      {/* Brand Logos Row */}
      <div className="flex flex-wrap items-center justify-center md:justify-between gap-8 md:gap-12 opacity-85 grayscale hover:grayscale-0 transition-all duration-300">
        {brandList.map((brand, idx) => (
          <div key={idx} className="flex items-center justify-center h-10">
            <img
              src={brand.image}
              alt={brand.name}
              className="h-8 max-w-[130px] object-contain transition-opacity hover:opacity-100"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent && !parent.querySelector(".fallback-brand")) {
                  const span = document.createElement("span");
                  span.className =
                    "fallback-brand text-lg font-bold tracking-tight text-neutral-800 flex items-center gap-1.5";
                  span.innerHTML = `<span class="w-3 h-3 rounded-full bg-blue-500"></span> ${brand.name}`;
                  parent.appendChild(span);
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
