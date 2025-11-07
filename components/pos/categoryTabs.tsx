import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CategoryTabs({ categories, selected, onSelect }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  const categoryCount = categories.length;
  const scrollEnabled = categoryCount > 4;

  return (
    <div className="relative flex items-center border-b bg-white w-full">
      {/* Left Arrow */}
      {scrollEnabled && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 z-10 h-full px-2 bg-white"
        >
          <ChevronLeft />
        </button>
      )}

      {/* Tabs Wrapper */}
      <div
        ref={scrollRef}
        className={`flex w-full ${
          scrollEnabled ? "overflow-x-auto px-10 scrollbar-none" : ""
        }`}
      >
        <div
          className={`flex w-full ${
            scrollEnabled
              ? "gap-4 whitespace-nowrap"
              : "justify-center items-center"
          }`}
        >
          {categories.map((category) => {
            const tabStyle =
              categoryCount <= 4
                ? { width: `${100 / categoryCount}%` }
                : { minWidth: "120px" }; // adjust minWidth as needed

            return (
              <button
                key={category.id}
                onClick={() => onSelect(category.id)}
                className={`pb-2 text-sm font-medium text-center ${
                  selected === category.id
                    ? "border-b-2 border-black font-semibold"
                    : "text-gray-600"
                }`}
                style={tabStyle}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Arrow */}
      {scrollEnabled && (
        <button
          onClick={scrollRight}
          className="absolute right-0 z-10 h-full px-2 bg-white"
        >
          <ChevronRight />
        </button>
      )}
    </div>
  );
}
