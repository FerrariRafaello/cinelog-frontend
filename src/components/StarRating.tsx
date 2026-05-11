"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  readonly?: boolean;
}

export function StarRating({ value, onChange, readonly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const stars = [1, 2, 3, 4, 5];
  const display = hovered || value;

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>, star: number) {
    if (readonly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x < rect.width / 2;
    setHovered(half ? star * 2 - 1 : star * 2);
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>, star: number) {
    if (readonly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x < rect.width / 2;
    onChange(half ? star * 2 - 1 : star * 2);
  }

  if (readonly) {
  return <span className="text-base sm:text-lg font-medium">⭐ {value}/10</span>;
}

return (
  <div className="flex gap-1.5 items-center">
    {stars.map((star) => {
      const full = display >= star * 2;
      const half = !full && display >= star * 2 - 1;

      return (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={(e) => handleClick(e, star)}
          onMouseMove={(e) => handleMouseMove(e, star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className="relative h-8 w-8 focus:outline-none disabled:cursor-default"
        >
          <span className="absolute inset-0 flex items-center justify-center text-3xl leading-none text-muted-foreground">★</span>
          <span
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: full ? "100%" : half ? "50%" : "0%" }}
          >
            <span className="flex h-full w-8 items-center justify-center text-3xl leading-none text-yellow-400">★</span>
          </span>
        </button>
      );
    })}
    <span className="text-base text-muted-foreground ml-1">
      {display > 0 ? `${display}/10` : ""}
    </span>
  </div>
);
}