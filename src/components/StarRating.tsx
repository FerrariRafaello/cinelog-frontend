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
  return <span className="text-sm">⭐ {value}/10</span>;
}

return (
  <div className="flex gap-1 items-center">
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
          className="text-2xl focus:outline-none disabled:cursor-default relative w-7"
        >
          <span className="text-muted-foreground">★</span>
          <span
            className="absolute inset-0 overflow-hidden text-yellow-400"
            style={{ width: full ? "100%" : half ? "50%" : "0%" }}
          >
            ★
          </span>
        </button>
      );
    })}
    <span className="text-sm text-muted-foreground ml-1">
      {display > 0 ? `${display}/10` : ""}
    </span>
  </div>
);
}