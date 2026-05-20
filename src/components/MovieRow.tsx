"use client";

import { useState, useEffect, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { Movie } from "@/types";

export const MovieRow = memo(function MovieRow({
  title,
  movieList,
  nowPlayingIds,
}: {
  title: string;
  movieList: Movie[];
  nowPlayingIds?: Set<number>;
}) {
  const router = useRouter();
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
      const atStart = el.scrollLeft <= 8;
      if (atStart) {
        hasScrolledRef.current = false;
        setCanScrollLeft(false);
      } else {
        setCanScrollLeft(hasScrolledRef.current);
      }
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    }
    el.addEventListener("scroll", check, { passive: true });
    requestAnimationFrame(check);
    return () => {
      el.removeEventListener("scroll", check);
    };
  }, [movieList]);

  if (movieList.length === 0) return null;

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
            <span className="ml-2 text-[3.2rem] font-normal text-zinc-400 group-hover/arrow:text-zinc-300 transition-colors leading-none">
              ‹
            </span>
          </div>
        )}

        <div
          className={`absolute right-0 top-0 bottom-0 z-20 w-14 sm:w-16 flex items-center justify-end cursor-pointer bg-gradient-to-l from-background/90 to-transparent transition-opacity duration-200 group/arrow ${canScrollRight ? "group-hover/row:opacity-100" : ""} opacity-0`}
          onClick={() => scroll("right")}
        >
          <span className="mr-2 text-[3.2rem] font-normal text-zinc-400 group-hover/arrow:text-zinc-300 transition-colors leading-none">
            ›
          </span>
        </div>

        <div ref={scrollRef} className="overflow-x-auto overflow-y-visible overscroll-x-none py-4 sm:py-5 px-2 sm:px-3 scrollbar-hide">
          <div className="flex gap-4 sm:gap-5 w-max pr-4">
            {movieList.map((movie) => (
              <div
                key={movie.id}
                className="group relative w-40 sm:w-48 lg:w-56 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden ring-1 ring-border/40 hover:ring-2 hover:ring-primary/60 hover:-translate-y-1 hover:scale-[1.02] hover:z-10 transition-all duration-200 will-change-transform"
                onClick={() => router.push(`/movies/${movie.id}`)}
              >
                {movie.poster_path ? (
                  <>
                    <img
                      src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full aspect-[2/3] object-cover"
                      loading="lazy"
                    />
                    {nowPlayingIds?.has(movie.id) && (
                      <div className="absolute top-0 left-0 z-10 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                        Em Cartaz
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-3 sm:p-4 pt-12">
                  <p className="text-white text-sm sm:text-base font-bold line-clamp-2 leading-tight">{movie.title}</p>
                  <p className="text-yellow-400 text-sm sm:text-base font-medium mt-1">⭐ {movie.vote_average.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
