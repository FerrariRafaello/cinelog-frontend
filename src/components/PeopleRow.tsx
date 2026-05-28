"use client";

import { useState, useEffect, useRef, memo } from "react";

export type TrendingPerson = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  trending_direction: string;
};

const DEPT_PT: Record<string, string> = {
  Acting: "Ator/Atriz",
  Directing: "Diretor/a",
  Writing: "Roteirista",
  Production: "Produtor/a",
  Sound: "Som",
  "Visual Effects": "VFX",
  Camera: "Câmera",
  Editing: "Edição",
  Lighting: "Iluminação",
  Costume: "Figurino",
};

const AVATAR_COLORS = [
  "bg-rose-700", "bg-violet-700", "bg-blue-700", "bg-emerald-700",
  "bg-amber-700", "bg-cyan-700", "bg-pink-700", "bg-indigo-700",
];

function TrendingBadge({ direction }: { direction: string }) {
  if (direction === "up")
    return (
      <span className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white text-lg font-bold shadow-md">
        ↑
      </span>
    );
  if (direction === "down")
    return (
      <span className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white text-lg font-bold shadow-md">
        ↓
      </span>
    );
  if (direction === "new")
    return (
      <span className="absolute top-1 right-1 rounded-full bg-yellow-500 text-black text-[11px] font-bold px-2 py-1 shadow-md leading-none">
        NOVO
      </span>
    );
  return null;
}

export const PeopleRow = memo(function PeopleRow({
  title,
  people,
}: {
  title: string;
  people: TrendingPerson[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function check() {
      if (!el) return;
      const scrolled = el.scrollLeft > 8;
      if (scrolled) hasScrolledRef.current = true;
      if (el.scrollLeft <= 8) {
        hasScrolledRef.current = false;
        setCanScrollLeft(false);
      } else {
        setCanScrollLeft(hasScrolledRef.current);
      }
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    }
    el.addEventListener("scroll", check, { passive: true });
    requestAnimationFrame(check);
    return () => el.removeEventListener("scroll", check);
  }, [people]);

  if (people.length === 0) return null;

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    const step = Math.max(scrollRef.current.clientWidth * 0.85, 280);
    scrollRef.current.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
    if (dir === "right") {
      hasScrolledRef.current = true;
      setCanScrollLeft(true);
    }
  }

  return (
    <div className="space-y-1 overflow-visible mx-0 sm:mx-0 lg:mx-0 px-4 sm:px-8 lg:px-12">
      <div className="flex items-center justify-between pr-2">
        <h2 className="pl-2 pt-9 text-xl sm:text-2xl font-bold tracking-tight text-foreground/90">{title}</h2>
      </div>
      <div className="relative group/row">
        {canScrollLeft && (
          <div
            className="absolute left-0 top-0 bottom-0 z-20 w-14 sm:w-16 flex items-center justify-start cursor-pointer bg-gradient-to-r from-background/90 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 group/arrow"
            onClick={() => scroll("left")}
          >
            <span className="ml-2 text-[3.2rem] font-normal text-zinc-400 group-hover/arrow:text-zinc-300 transition-colors leading-none">‹</span>
          </div>
        )}
        <div
          className={`absolute right-0 top-0 bottom-0 z-20 w-14 sm:w-16 flex items-center justify-end cursor-pointer bg-gradient-to-l from-background/90 to-transparent transition-opacity duration-200 group/arrow ${canScrollRight ? "group-hover/row:opacity-100" : ""} opacity-0`}
          onClick={() => scroll("right")}
        >
          <span className="mr-2 text-[3.2rem] font-normal text-zinc-400 group-hover/arrow:text-zinc-300 transition-colors leading-none">›</span>
        </div>
        <div ref={scrollRef} className="overflow-x-auto overflow-y-visible overscroll-x-none py-4 sm:py-5 px-2 sm:px-3 scrollbar-hide">
          <div className="flex gap-6 sm:gap-8 w-max pr-4">
            {people.map((person, i) => {
              const dept = DEPT_PT[person.known_for_department] ?? person.known_for_department;
              const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(person.name)}`;
              return (
                <a
                  key={person.id}
                  href={searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 w-36 sm:w-40 cursor-pointer group/person"
                >
                  <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0">
                    {person.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                        alt={person.name}
                        className="w-full h-full rounded-full object-cover ring-2 ring-border/40 group-hover/person:ring-primary/60 transition-all duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`w-full h-full rounded-full ${avatarColor} flex items-center justify-center text-white text-4xl sm:text-5xl font-bold ring-2 ring-border/40 group-hover/person:ring-primary/60 transition-all duration-200`}>
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <TrendingBadge direction={person.trending_direction} />
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="text-xs sm:text-sm font-semibold line-clamp-2 leading-tight group-hover/person:text-primary transition-colors">{person.name}</p>
                    <p className="text-[11px] text-muted-foreground">{dept}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
