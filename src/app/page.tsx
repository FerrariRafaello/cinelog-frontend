"use client";

//IMPORTS
import Cookies from "js-cookie";
import { useState, useRef, Suspense, memo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Movie } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavBar } from "@/components/NavBar";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

// Componente memoizado das filas de filmes
const MovieRow = memo(function MovieRow({ title, movieList, scrollRef, router, nowPlayingIds }: { title: string; movieList: Movie[]; scrollRef: React.RefObject<HTMLDivElement | null>; router: ReturnType<typeof useRouter>; nowPlayingIds?: Set<number> }) {
  if (movieList.length === 0) return null;
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasScrolledRight, setHasScrolledRight] = useState(false);
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
          className={`absolute right-0 top-0 bottom-0 z-20 w-14 sm:w-16 flex items-center justify-end cursor-pointer bg-gradient-to-l from-background/90 to-transparent transition-opacity duration-200 group/arrow ${canScrollRight ? 'group-hover/row:opacity-100' : ''} opacity-0`}
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

function HomeContent() {
  const router = useRouter();
  // Top 10 scroll states
  const [providers, setProviders] = useState<any[]>([]);
  const top10Ref = useRef<HTMLDivElement>(null);
  const [top10CanScrollLeft, setTop10CanScrollLeft] = useState(false);
  const [top10CanScrollRight, setTop10CanScrollRight] = useState(false);
  const top10HasScrolledRef = useRef(false);
  const [top10, setTop10] = useState<Movie[]>([]);
  useEffect(() => {
    if (top10.length === 0) return;

    let ro: ResizeObserver | null = null;
    let attached = false;

    function check() {
      const el = top10Ref.current;
      if (!el) return;
      const atStart = el.scrollLeft <= 8;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
      setTop10CanScrollLeft(!atStart);
      setTop10CanScrollRight(!atEnd);
    }

    function attach() {
      const el = top10Ref.current;
      if (!el || attached) return;
      attached = true;

      ro = new ResizeObserver(() => requestAnimationFrame(check));
      ro.observe(el);
      el.addEventListener("scroll", check, { passive: true });
      requestAnimationFrame(check);
    }

    const t1 = setTimeout(attach, 100);
    const t2 = setTimeout(attach, 600);
    const t3 = setTimeout(attach, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      ro?.disconnect();
      const el = top10Ref.current;
      if (el) el.removeEventListener("scroll", check);
    };
  }, [top10]);
  useInactivityLogout(() => router.push("/login"));
  const [query, setQuery] = useState("");
  const [genreQuery, setGenreQuery] = useState("Action");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  // ...existing code...
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [animation, setAnimation] = useState<Movie[]>([]);
  const [forYou, setForYou] = useState<Movie[]>([]);
  const [forYouTitle, setForYouTitle] = useState("Popular Right Now");
  const [classics, setClassics] = useState<Movie[]>([]);
  const [featured, setFeatured] = useState<Movie[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [featuredTrailer, setFeaturedTrailer] = useState<string | null>(null);
  const [featuredCredits, setFeaturedCredits] = useState<any[]>([]);
  const [featuredPaused, setFeaturedPaused] = useState(false);
  const [genreSort, setGenreSort] = useState<"desc" | "asc">("desc");
  const [showGenreResults, setShowGenreResults] = useState(false);
  const nowPlayingIds = new Set(
    nowPlaying
      .filter((m) => {
        const year = m.release_date ? new Date(m.release_date).getFullYear() : 0;
        return year >= 2025;
      })
      .map((m) => m.id)
  );
  const searchParams = useSearchParams();
  const trendingRef = useRef<HTMLDivElement>(null);
  const nowPlayingRef = useRef<HTMLDivElement>(null);
  const forYouRef = useRef<HTMLDivElement>(null);
  const topRatedRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<HTMLDivElement>(null);
  const classicsRef = useRef<HTMLDivElement>(null);
  const heroCastRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);
  const featuredLengthRef = useRef(0);

  const featuredMovie = featured[featuredIndex] || null;

  const GENRE_TO_ID: Record<string, number> = {
    Action: 28,
    Adventure: 12,
    Animation: 16,
    Comedy: 35,
    Crime: 80,
    Documentary: 99,
    Drama: 18,
    Family: 10751,
    Fantasy: 14,
    Horror: 27,
    Mystery: 9648,
    Romance: 10749,
    "Sci-Fi": 878,
    Thriller: 53,
    War: 10752,
  };

  const goToNextFeatured = () => {
    if (featured.length < 2) return;
    setFeaturedIndex((prev) => (prev + 1) % featured.length);
  };
  const goToPrevFeatured = () => {
    if (featured.length < 2) return;
    setFeaturedIndex((prev) => (prev - 1 + featured.length) % featured.length);
  };

  function normalizeMovieResults(items: any[]): Movie[] {
    return items
      .map((m) => ({
        ...m,
        title: m.title || m.name || m.original_title || m.original_name || "Untitled",
        overview: m.overview || "",
        vote_average: typeof m.vote_average === "number" ? m.vote_average : 0,
      }))
      .filter((m) => m.id);
  }

  function truncateText(text: string, maxLength: number): string {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()}...`;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const forceTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    forceTop();
    const rafId = window.requestAnimationFrame(forceTop);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const token = Cookies.get("token");
    if (!token) {
      setRedirecting(true);
      router.push("/login");
      return;
    }
    setChecked(true);

    async function fetchTrending() {
      try {
        const resp = await api.get("/v1/tmdb/trending");
        setTrending(resp.data.results.slice(0, 40));
      } catch {
        setTrending([]);
      }
    }

    async function fetchNowPlaying() {
      try {
        const resp = await api.get("/v1/tmdb/now-playing");
        setNowPlaying(resp.data.results.slice(0, 40));
      } catch {
        setNowPlaying([]);
      }
    }

    async function fetchTop10() {
      try {
        const resp = await api.get("/v1/tmdb/top10-today");
        setTop10(resp.data.results.slice(0, 10));
      } catch {
        setTop10([]);
      }
    }

    async function fetchTopRated() {
      try {
        const resp = await api.get("/v1/tmdb/top-rated");
        setTopRated(resp.data.results.slice(0, 40));
      } catch {
        setTopRated([]);
      }
    }

    async function fetchAnimation() {
      try {
        const resp = await api.get("/v1/tmdb/animation");
        setAnimation(resp.data.results.slice(0, 40));
      } catch {
        setAnimation([]);
      }
    }

    async function fetchForYou() {
      try {
        const meResp = await api.get("/v1/users/me");
        const favoriteGenres: string = meResp.data.favorite_genres || "";

        let genreIds = "";
        if (favoriteGenres.trim()) {
          // favoriteGenres pode ser "Action,Drama" ou IDs separados por vírgula
          genreIds = favoriteGenres
            .split(",")
            .map((g: string) => {
              const trimmed = g.trim();
              return GENRE_TO_ID[trimmed] ?? trimmed;
            })
            .filter(Boolean)
            .join(",");
        }

        if (!genreIds) {
          // fallback: Action + Drama + Thriller
          genreIds = "28,18,53";
          setForYouTitle("Popular Right Now");
        } else {
          setForYouTitle("For You");
        }

        const resp = await api.get("/v1/tmdb/for-you", { params: { genres: genreIds } });
        setForYou(resp.data.results.slice(0, 40));
      } catch {
        setForYou([]);
      }
    }

    async function fetchClassics() {
      try {
        const resp = await api.get("/v1/tmdb/classics");
        setClassics(resp.data.results.slice(0, 40));
      } catch {
        setClassics([]);
      }
    }

    async function fetchProviders() {
      try {
        const resp = await api.get("/v1/tmdb/providers");
        setProviders(resp.data);
      } catch {
        setProviders([]);
      }
    }

    Promise.allSettled([
      fetchTrending(),
      fetchNowPlaying(),
      fetchTop10(),
      fetchTopRated(),
      fetchAnimation(),
      fetchForYou(),
      fetchClassics(),
      fetchProviders(),
    ]).finally(() => {
      setInitialLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    const genre = searchParams.get("genre");

    if (genre) {
      setGenreQuery(genre);
      fetchMoviesByGenre(genre, false);
      return;
    }

    if (q) {
      setQuery(q);
      api.get("/v1/tmdb/search", { params: { q } }).then((resp) => {
        setMovies(normalizeMovieResults(resp.data.results || []));
      });
      return;
    }

    setQuery("");
    setMovies([]);
  }, [searchParams]);

  function handleGoHome() {
    setQuery("");
    setMovies([]);
    setShowGenreResults(false);
    router.replace("/");
  }

  async function fetchMoviesByGenre(genreName: string, updateUrl = true) {
    const normalized = genreName.trim();
    if (!normalized) return;

    const genreId = GENRE_TO_ID[normalized];
    if (!genreId) return;

    const cacheKey = `genre-search:${normalized.toLowerCase()}`;

    if (!updateUrl && typeof window !== "undefined") {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setMovies(normalizeMovieResults(parsed));
          setQuery("");
          return;
        } catch {
          // Ignore broken cache.
        }
      }
    }

    setLoading(true);

    if (updateUrl) {
      router.push(`/?genre=${encodeURIComponent(normalized)}`);
    }

    try {
      const pages = [1, 2, 3, 4, 5, 6];
      const responses = await Promise.all(
        pages.map((page) =>
          api.get("/v1/tmdb/discover", {
            params: {
              with_genres: genreId,
              sort_by: "release_date.desc",
              page,
            },
          })
        )
      );

      let moviesByGenre: Movie[] = responses.flatMap((r) => r.data.results || []);

      if (moviesByGenre.length === 0) {
        try {
          const responses = await Promise.all(
            [1, 2, 3].map((page) =>
              api.get("/v1/tmdb/search", {
                params: { q: normalized, page },
              })
            )
          );
          moviesByGenre = responses.flatMap((r) => r.data.results || []);
        } catch {
          // Keep empty result.
        }
      }

      const unique = Array.from(new Map(moviesByGenre.map((m) => [m.id, m])).values());
      unique.sort((a: any, b: any) =>
        genreSort === "desc"
          ? b.vote_average - a.vote_average
          : a.vote_average - b.vote_average
      );

      const normalizedMovies = normalizeMovieResults(unique).slice(0, 120);
      setMovies(normalizedMovies);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(cacheKey, JSON.stringify(normalizedMovies));
      }

      setQuery("");
    } catch {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (nowPlaying.length === 0) return;
    const shuffled = [...nowPlaying]
      .filter((m) => m.poster_path && m.overview)
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
    setFeatured(shuffled.length > 0 ? shuffled : nowPlaying.slice(0, 6));
    setFeaturedIndex(0);
  }, [nowPlaying]);

  useEffect(() => {
    featuredLengthRef.current = featured.length;
    if (featured.length < 2) return;
    if (featuredPaused) return;
    
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredLengthRef.current);
    }, 6000);
    return () => clearInterval(timer);
  }, [featured, featuredPaused]);

  useEffect(() => {
    async function fetchFeaturedData() {
      if (!featuredMovie) {
        setFeaturedTrailer(null);
        setFeaturedCredits([]);
        return;
      }
      try {
        const [videoResp, creditsResp] = await Promise.all([
          api.get(`/v1/tmdb/movies/${featuredMovie.id}/videos`),
          api.get(`/v1/tmdb/movies/${featuredMovie.id}/credits`),
        ]);
        const yt = videoResp.data.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
        setFeaturedTrailer(yt ? yt.key : null);
        setFeaturedCredits(creditsResp.data.cast?.slice(0, 4) || []);
      } catch {
        setFeaturedTrailer(null);
        setFeaturedCredits([]);
      }
    }
    fetchFeaturedData();
  }, [featuredMovie?.id]);

  if (!checked || redirecting || initialLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );

  async function handleSearch(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setShowGenreResults(false);
    router.push(`/?q=${encodeURIComponent(query)}`);
    try {
      const resp = await api.get("/v1/tmdb/search", { params: { q: query } });
      setMovies(normalizeMovieResults(resp.data.results || []));
    } catch {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenreSearch() {
    setShowGenreResults(true);
    await fetchMoviesByGenre(genreQuery, true);
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar showLogout />

      <main className="py-4 sm:py-8 space-y-8 sm:space-y-14 md:space-y-16">
        <div className="max-w-5xl w-full mx-auto px-2 sm:px-4 md:px-8 space-y-2 sm:space-y-3">
          <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-stretch w-full">
            <div className="order- lg:order- flex flex-col sm:flex-row gap-3 items-stretch lg:w-auto">
              <div className="h-12 sm:h-14 rounded-xl border border-border bg-card/70 p-1 sm:w-72">
                <select
                  value={genreQuery}
                  onChange={(e) => setGenreQuery(e.target.value)}
                  className="h-full w-full rounded-lg border border-border/70 bg-background px-3 text-sm sm:text-base"
                >
                  <option>Action</option>
                  <option>Adventure</option>
                  <option>Animation</option>
                  <option>Comedy</option>
                  <option>Crime</option>
                  <option>Documentary</option>
                  <option>Drama</option>
                  <option>Family</option>
                  <option>Fantasy</option>
                  <option>Horror</option>
                  <option>Mystery</option>
                  <option>Romance</option>
                  <option>Sci-Fi</option>
                  <option>Thriller</option>
                  <option>War</option>
                </select>
              </div>
              <div className="h-12 sm:h-14 rounded-xl border border-border bg-card/70 p-1 sm:w-auto">
                <Button
                  type="button"
                  onClick={handleGenreSearch}
                  disabled={loading}
                  className="h-full w-full sm:w-auto px-4 sm:px-5 text-sm"
                >
                  Search by Genre
                </Button>
              </div>
              {showGenreResults && movies.length > 0 && (
                <div className="h-12 sm:h-14 rounded-xl border border-border bg-card/70 p-1">
                  <select
                    value={genreSort}
                    onChange={(e) => {
                      setGenreSort(e.target.value as "desc" | "asc");
                      const sorted = [...movies].sort((a, b) =>
                        e.target.value === "desc"
                          ? b.vote_average - a.vote_average
                          : a.vote_average - b.vote_average
                      );
                      setMovies(sorted);
                    }}
                    className="h-full w-full rounded-lg border border-border/70 bg-background px-3 text-sm sm:text-base"
                  >
                    <option value="desc">Highest Rated</option>
                    <option value="asc">Lowest Rated</option>
                  </select>
                </div>
              )}
            </div>
            <form onSubmit={handleSearch} className="order-1 lg:order-2 flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch flex-1 w-full">
              <div className="flex-1 h-14 rounded-xl border border-border bg-card/70 p-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for a movie..."
                  className="h-full text-base sm:text-lg border-border/70 bg-background"
                />
              </div>
              <div className="h-12 sm:h-14 rounded-xl border border-border bg-card/70 p-1 sm:w-auto flex items-center">
                <Button type="submit" disabled={loading} className="h-full w-full sm:w-auto px-4 sm:px-5 text-sm">
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {movies.length > 0 && (
          <div className="space-y-2 sm:space-y-4 mx-2 sm:mx-4 md:mx-8 lg:mx-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Search Results</h2>
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4 md:gap-5 pt-2">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="group relative origin-bottom cursor-pointer rounded-xl overflow-hidden ring-1 ring-border/40 hover:-translate-y-1 hover:scale-[1.02] hover:z-10 hover:ring-primary/50 transition-all duration-200"
                  onClick={() => router.push(`/movies/${movie.id}`)}
                >
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
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
        )}

        {movies.length === 0 && (
          <>
            {featuredMovie && (
              <section className="relative -mt-4 sm:-mt-8 lg:-mt-12">
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-16 z-10 bg-gradient-to-b from-background to-transparent" />

                <div className="relative overflow-hidden rounded-2xl border border-border/60 group/featured" onMouseEnter={() => setFeaturedPaused(true)} onMouseLeave={() => setFeaturedPaused(false)}>
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(https://image.tmdb.org/t/p/w780${featuredMovie.poster_path})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "blur(8px) brightness(0.58)",
                      transform: "scale(1.08)",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/62 via-black/34 to-black/52" />

                  {featured.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goToPrevFeatured}
                        className="hidden sm:flex absolute left-0 top-0 bottom-0 z-20 w-16 sm:w-20 items-center justify-start bg-gradient-to-r from-black/65 to-transparent opacity-0 group-hover/featured:opacity-100 transition-opacity duration-200"
                        aria-label="Previous featured movie"
                      >
                        <span className="ml-3 text-[2.8rem] font-normal text-zinc-400 hover:text-zinc-300 transition-colors leading-none">‹</span>
                      </button>
                      <button
                        type="button"
                        onClick={goToNextFeatured}
                        className="hidden sm:flex absolute right-0 top-0 bottom-0 z-20 w-16 sm:w-20 items-center justify-end bg-gradient-to-l from-black/65 to-transparent opacity-0 group-hover/featured:opacity-100 transition-opacity duration-200"
                        aria-label="Next featured movie"
                      >
                        <span className="mr-3 text-[2.8rem] font-normal text-zinc-400 hover:text-zinc-300 transition-colors leading-none">›</span>
                      </button>
                    </>
                  )}

                  <div className="relative z-10 w-full px-2 py-4 sm:px-6 sm:py-8 md:px-10 md:py-10 lg:px-14 lg:py-12 pb-8 sm:pb-16 flex flex-col lg:flex-row items-center lg:items-center justify-center gap-4 sm:gap-8 lg:gap-14 xl:gap-16 text-center lg:text-left xl:gap-16 lg:text-left lg:py-12">
                    {/* Poster fixo, mas muda junto com o filme em destaque */}
                    <div className="w-32 xs:w-40 sm:w-56 md:w-64 lg:w-80 xl:w-[22rem] 2xl:w-[26rem] aspect-[2/3] flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15 bg-black/20 mx-auto lg:mx-0 carousel-poster">
                      {featuredMovie && (
                        <img
                          src={`https://image.tmdb.org/t/p/w342${featuredMovie.poster_path}`}
                          alt={featuredMovie.title}
                          className="w-full h-full object-cover object-center"
                        />
                      )}
                    </div>

                    <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl flex flex-col items-center lg:items-start justify-center">
                      <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-primary/90">Em cartaz</p>
                      <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-white text-balance">{featuredMovie.title}</h2>
                      <p className="mt-3 text-base sm:text-lg lg:text-xl text-white/85 leading-relaxed max-w-xl xl:max-w-2xl text-pretty">{truncateText(featuredMovie.overview, 140)}</p>

                      <div className="mt-5 sm:mt-6 lg:mt-7 space-y-3">
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
                          {featuredTrailer && (
                            <a
                              href={`https://www.youtube.com/watch?v=${featuredTrailer}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm sm:text-base font-semibold text-white hover:bg-red-700 transition-colors"
                            >
                              Watch Trailer
                            </a>
                          )}
                          <Button
                            variant="secondary"
                            className="min-h-11 px-4 sm:px-5 lg:h-12 text-sm sm:text-base lg:text-lg"
                            onClick={() => router.push(`/movies/${featuredMovie.id}`)}
                          >
                            View Details
                          </Button>
                        </div>

                        {featuredCredits.length > 0 && (
                          <div className="mt-5 flex flex-wrap gap-6 justify-center lg:justify-start">
                            {featuredCredits.slice(0, 4).map((actor) => (
                              <a
                                key={actor.id}
                                href={`https://www.google.com/search?q=${encodeURIComponent(`${actor.name} actor`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity"
                              >
                                {actor.profile_path ? (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                                    alt={actor.name}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-2 ring-white/20"
                                  />
                                ) : (
                                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-xl font-bold">
                                    {actor.name.charAt(0)}
                                  </div>
                                )}
                                <span className="text-[11px] sm:text-xs text-white/70 text-center line-clamp-2 leading-tight w-20 sm:w-24">{actor.name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                    {/* dots dentro do carrossel */}
                    {featured.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-2">
                        {featured.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFeaturedIndex(idx)}
                            className={`h-1.5 rounded-full transition-all ${idx === featuredIndex ? "w-8 bg-primary" : "w-3 bg-white/30 hover:bg-white/50"}`}
                            aria-label={`Go to featured slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-25 bg-gradient-to-t from-background to-transparent rounded-b-2xl" />
              </section>
            )}

            <div className="relative z-20 -mt-12 sm:-mt-20 lg:-mt-32">
              <MovieRow title="Trending This Week" movieList={trending} scrollRef={trendingRef} router={router} nowPlayingIds={nowPlayingIds} />
              <MovieRow title="Now Playing" movieList={nowPlaying} scrollRef={nowPlayingRef} router={router} nowPlayingIds={nowPlayingIds} />

              {top10.length > 0 && (
                <div className="space-y-1 overflow-visible px-2 sm:px-4 md:px-8 lg:px-12">
                  <div className="pl-1 sm:pl-2 pt-6 sm:pt-9 flex flex-col">
                    <p className="text-xs uppercase tracking-[0.2em] text-foreground/50 font-semibold">Top 10</p>
                    <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
                      <span className="text-6xl sm:text-7xl font-black tracking-tight text-foreground">TOP</span>
                      <span className="text-6xl sm:text-7xl font-black tracking-tight text-primary">10</span>
                      <span className="text-base sm:text-lg font-semibold text-foreground/60 ml-2">Today in Brazil</span>
                    </div>
                  </div>
                  <div className="relative group/top10 min-w-0">
                    {top10CanScrollLeft && (
                      <div
                        className="absolute left-0 top-0 bottom-0 z-20 w-14 sm:w-16 flex items-center justify-start cursor-pointer bg-gradient-to-r from-background/90 to-transparent opacity-0 group-hover/top10:opacity-100 transition-opacity duration-200"
                        onClick={() => {
                          const step = Math.max((top10Ref.current?.clientWidth ?? 400) * 0.85, 400);
                          top10Ref.current?.scrollBy({ left: -step, behavior: "smooth" });
                        }}
                      >
                        <span className="ml-2 text-[3.2rem] font-normal text-zinc-400 hover:text-zinc-300 leading-none">‹</span>
                      </div>
                    )}

                    {top10CanScrollRight && (
                      <div
                        className="absolute right-0 top-0 bottom-0 z-20 w-14 sm:w-16 flex items-center justify-end cursor-pointer bg-gradient-to-l from-background/90 to-transparent opacity-0 group-hover/top10:opacity-100 transition-opacity duration-200"
                        onClick={() => {
                          const step = Math.max((top10Ref.current?.clientWidth ?? 400) * 0.85, 400);
                          top10Ref.current?.scrollBy({ left: step, behavior: "smooth" });
                        }}
                      >
                        <span className="mr-2 text-[3.2rem] font-normal text-zinc-400 hover:text-zinc-300 leading-none">›</span>
                      </div>
                    )}
                    <div ref={top10Ref} className="overflow-x-auto overflow-y-hidden py-2 sm:py-4 scrollbar-hide min-w-0">
                      <div className="flex w-max pr-2 sm:pr-6 gap-1 sm:gap-2">
                        {top10.map((movie, idx) => (
                          <div
                            key={movie.id}
                            className="relative flex items-end cursor-default flex-shrink-0"
                            style={{ marginLeft: idx === 0 ? "2rem" : "0" }}
                          >
                            <span
                              className="relative z-0 font-black select-none pointer-events-none flex-shrink-0"
                              style={{
                                fontSize: "clamp(5rem, 9vw, 9rem)",
                                color: "transparent",
                                WebkitTextStroke: "3px rgba(255,255,255,0.55)",
                                lineHeight: 1,
                                width: idx >= 9 ? "8rem" : "6rem",
                                textAlign: "right",
                                paddingRight: "0.75rem",
                                WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                                maskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                              }}
                            >
                              {idx + 1}
                            </span>
                            <div
                              className="relative z-10 w-56 sm:w-64 lg:w-72 flex-shrink-0 rounded-xl overflow-hidden ring-1 ring-border/40 hover:ring-2 hover:ring-primary/60 transition-all duration-200 cursor-pointer pointer-events-auto"
                              onClick={() => router.push(`/movies/${movie.id}`)}
                            >
                              {movie.poster_path ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                                  alt={movie.title}
                                  className="w-full aspect-[2/3] object-cover"
                                />
                              ) : (
                                <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center text-muted-foreground">No image</div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-3 pt-10">
                                <p className="text-white text-sm font-bold line-clamp-2 leading-tight">{movie.title}</p>
                                <p className="text-yellow-400 text-sm font-medium mt-1">⭐ {movie.vote_average.toFixed(1)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <MovieRow title={forYouTitle} movieList={forYou} scrollRef={forYouRef} router={router} nowPlayingIds={nowPlayingIds} />

              {providers.length > 0 && (
                <div className="space-y-1 overflow-visible px-2 sm:px-4 md:px-8 lg:px-12">
                  <h2 className="pl-2 pt-9 text-xl sm:text-2xl font-bold tracking-tight text-foreground/90">
                    Streaming
                  </h2>
                  <div className="flex flex-wrap gap-2 sm:gap-4 md:gap-6 py-2 sm:py-4 pl-1 sm:pl-2">
                    {providers.map((p: any) => (
                      <button
                        key={p.provider_id}
                        type="button"
                        onClick={() => router.push(`/streaming/${p.provider_id}`)}
                        className="flex flex-col items-center gap-2 hover:scale-110 transition-transform"
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w300${p.logo_path}`}
                          alt={p.provider_name}
                          className="w-20 h-20 xs:w-28 xs:h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover ring-0 hover:ring-2 hover:ring-primary/60 transition-all shadow-lg"
                          loading="lazy"
                          style={{ background: '#fff' }}
                        />
                        <span className="text-base sm:text-lg font-semibold text-white text-center w-28 line-clamp-2">
                          {p.provider_name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <MovieRow title="Worth Watching Again" movieList={topRated} scrollRef={topRatedRef} router={router} nowPlayingIds={nowPlayingIds} />
              <MovieRow title="Animation" movieList={animation} scrollRef={animationRef} router={router} nowPlayingIds={nowPlayingIds} />
              <MovieRow title="Classics" movieList={classics} scrollRef={classicsRef} router={router} nowPlayingIds={nowPlayingIds} />
            </div>
          </>
        )}

        <section className="relative mt-8 sm:mt-16 px-2 sm:px-6 md:px-12 py-8 sm:py-16 md:py-18">
          <div className="pointer-events-none absolute inset-x-0 top-0 -bottom-12 blur-sm [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)] bg-[radial-gradient(circle_at_20%_20%,oklch(0.72_0.14_42_/_0.22),transparent_55%),radial-gradient(circle_at_80%_70%,oklch(0.64_0.11_220_/_0.18),transparent_55%)]" />
          <div className="relative max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-[0_10px_45px_-15px_rgba(0,0,0,0.8)] p-4 sm:p-7 md:p-10 text-center space-y-4 sm:space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Sobre o CritCine</h2>
            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
              CritCine é um projeto pessoal de portfólio, criado por{" "}
              <strong className="text-primary">Rafaello Ferrari</strong>, sem fins lucrativos.
              O objetivo é praticar desenvolvimento full-stack e oferecer um
              espaço gratuito para reviews e descoberta de filmes.
            </p>
            <p className="text-sm sm:text-base text-foreground/75">
              Não hospedamos conteúdo. Todos os dados de filmes vêm da API
              pública do{" "}
              <a
                href="https://www.themoviedb.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                TMDB
              </a>
              .
            </p>
            <div className="pt-1 flex items-center justify-center gap-2 text-sm sm:text-base text-foreground/75">
              <span>Desenvolvido por um único programador.</span>
              <a
                href="https://www.linkedin.com/in/rafaello-ferrari-0ba87a349/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 leading-none text-primary hover:underline"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 fill-current translate-y-[0.5px]"
                >
                  <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5 2.5 2.5 0 0 0 4.98 3.5ZM3 9h4v12H3V9Zm7 0h3.83v1.7h.05c.53-1 1.82-2.05 3.74-2.05 4 0 4.73 2.63 4.73 6.05V21h-4v-5.57c0-1.33-.03-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94V21h-4V9Z" />
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}