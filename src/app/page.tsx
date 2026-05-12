"use client";

//IMPORTS
import Cookies from "js-cookie";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Movie } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoutDialog } from "@/components/LogoutDialog";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";


function HomeContent() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [genreQuery, setGenreQuery] = useState("Action");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [forYou, setForYou] = useState<Movie[]>([]);
  const [forYouTitle, setForYouTitle] = useState("Popular Right Now");
  const [classics, setClassics] = useState<Movie[]>([]);
  const [featured, setFeatured] = useState<Movie[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [featuredTrailer, setFeaturedTrailer] = useState<string | null>(null);
  const searchParams = useSearchParams();

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

  useEffect(() => {
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
        setTrending(resp.data.results.slice(0, 30));
      } catch {
        setTrending([]);
      }
    }

    async function fetchNowPlaying() {
      try {
        const resp = await api.get("/v1/tmdb/now-playing");
        setNowPlaying(resp.data.results.slice(0, 30));
      } catch {
        setNowPlaying([]);
      }
    }

    async function fetchTopRated() {
      try {
        const resp = await api.get("/v1/tmdb/top-rated");
        setTopRated(resp.data.results.slice(0, 30));
      } catch {
        setTopRated([]);
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
        setForYou(resp.data.results.slice(0, 30));
      } catch {
        setForYou([]);
      }
    }

    async function fetchClassics() {
      try {
        const resp = await api.get("/v1/tmdb/classics");
        setClassics(resp.data.results.slice(0, 30));
      } catch {
        setClassics([]);
      }
    }

    fetchTrending();
    fetchNowPlaying();
    fetchTopRated();
    fetchForYou();
    fetchClassics();
  }, [router]);

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
      unique.sort((a: any, b: any) => {
        const aDate = a.release_date ? new Date(a.release_date).getTime() : 0;
        const bDate = b.release_date ? new Date(b.release_date).getTime() : 0;
        return bDate - aDate;
      });

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
    if (featured.length < 2) return;
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featured.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featured]);

  useEffect(() => {
    async function fetchFeaturedTrailer() {
      if (!featuredMovie) {
        setFeaturedTrailer(null);
        return;
      }
      try {
        const resp = await api.get(`/v1/tmdb/movies/${featuredMovie.id}/videos`);
        const yt = resp.data.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
        setFeaturedTrailer(yt ? yt.key : null);
      } catch {
        setFeaturedTrailer(null);
      }
    }
    fetchFeaturedTrailer();
  }, [featuredMovie?.id]);

  if (!checked || redirecting) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );

  async function handleSearch(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
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
    await fetchMoviesByGenre(genreQuery, true);
  }

  // Componente reutilizável para as filas de filmes
  function MovieRow({ title, movieList }: { title: string; movieList: Movie[] }) {
    if (movieList.length === 0) return null;
    return (
      <div className="space-y-4 overflow-visible">
        <h2 className="text-xl sm:text-2xl font-semibold uppercase tracking-[0.14em] text-foreground/90 px-6 sm:px-12">{title}</h2>
        <div className="overflow-x-auto overflow-y-visible py-4 sm:py-5 px-6 sm:px-12 snap-x snap-mandatory">
          <div className="flex gap-4 sm:gap-5 w-max pl-2 pr-2">
            {movieList.map((movie) => (
              <div
                key={movie.id}
                className="group relative origin-bottom w-40 sm:w-48 lg:w-56 flex-shrink-0 snap-start cursor-pointer rounded-xl overflow-hidden ring-1 ring-border/40 hover:-translate-y-1 hover:scale-[1.02] hover:z-10 hover:ring-primary/50 transition-all duration-200"
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center">
        <h1 className="flex flex-col items-start gap-1 text-2xl font-bold tracking-tight sm:flex-row sm:items-baseline sm:gap-6">
          CritCine
          <span className="text-[1.05rem] font-medium underline underline-offset-4">
            Plataforma criada para portifólio, sem fins lucrativos.
          </span>
        </h1>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="inline-flex items-center rounded-full border border-border/70 bg-card/80 px-4 py-2 text-base font-medium text-foreground hover:border-primary/60 hover:bg-card transition-colors"
            onClick={handleGoHome}
          >
            Home
          </Button>
          <Button
            variant="ghost"
            className="inline-flex items-center rounded-full border border-border/70 bg-card/80 px-4 py-2 text-base font-medium text-foreground hover:border-primary/60 hover:bg-card transition-colors"
            onClick={() => router.push("/profile")}
          >
            Profile
          </Button>
          <LogoutDialog />
        </div>
      </nav>

      <main className="py-8 sm:py-10 space-y-10 sm:space-y-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-3 items-stretch">
            <div className="flex-1 h-14 rounded-xl border border-border bg-card/70 p-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a movie..."
                className="h-full text-base sm:text-lg border-border/70 bg-background"
              />
            </div>
            <Button type="submit" disabled={loading} className="h-14 px-6 sm:px-7 text-base sm:text-lg">
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
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
          </div>
        </div>

        {movies.length > 0 && (
          <div className="space-y-4 px-6 sm:px-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Search Results</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-5 pt-2">
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
              <section className="px-6 sm:px-12">
                <div className="relative overflow-hidden rounded-2xl border border-border/60 min-h-[22rem] sm:min-h-[28rem]">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(https://image.tmdb.org/t/p/w780${featuredMovie.poster_path})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "blur(8px) brightness(0.42)",
                      transform: "scale(1.08)",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/40 to-black/60" />

                  {featured.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goToPrevFeatured}
                        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full border border-white/25 bg-black/35 text-white hover:bg-black/55 transition-colors"
                        aria-label="Previous featured movie"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={goToNextFeatured}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full border border-white/25 bg-black/35 text-white hover:bg-black/55 transition-colors"
                        aria-label="Next featured movie"
                      >
                        →
                      </button>
                    </>
                  )}

                  <div className="relative z-10 p-5 sm:p-8 lg:p-10 h-full flex flex-col lg:flex-row items-start lg:items-end gap-5 sm:gap-8">
                    <div className="w-36 sm:w-44 lg:w-52 aspect-[2/3] flex-shrink-0 self-center lg:self-end overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/15 bg-black/20">
                      <img
                        src={`https://image.tmdb.org/t/p/w342${featuredMovie.poster_path}`}
                        alt={featuredMovie.title}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    <div className="max-w-2xl space-y-3 sm:space-y-4">
                      <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-primary/90">Em cartaz</p>
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white">{featuredMovie.title}</h2>
                      <p className="text-sm sm:text-base text-white/80 line-clamp-4 leading-relaxed">{featuredMovie.overview}</p>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {featuredTrailer && (
                          <a
                            href={`https://www.youtube.com/watch?v=${featuredTrailer}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2.5 text-sm sm:text-base font-semibold text-white hover:bg-red-700 transition-colors"
                          >
                            Watch Trailer
                          </a>
                        )}
                        <Button
                          variant="secondary"
                          className="h-10 sm:h-11 text-sm sm:text-base"
                          onClick={() => router.push(`/movies/${featuredMovie.id}`)}
                        >
                          View Details
                        </Button>
                      </div>

                      {featured.length > 1 && (
                        <div className="flex items-center gap-2 pt-1">
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
                  </div>
                </div>
              </section>
            )}

            <MovieRow title="Trending This Week" movieList={trending} />
            <MovieRow title="Now Playing" movieList={nowPlaying} />
            <MovieRow title={forYouTitle} movieList={forYou} />
            <MovieRow title="Worth Watching Again" movieList={topRated} />
            <MovieRow title="Classics" movieList={classics} />
          </>
        )}

        <section className="relative mt-16 px-6 sm:px-12 py-12">
          <div className="pointer-events-none absolute inset-x-0 top-0 -bottom-12 blur-sm [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)] bg-[radial-gradient(circle_at_20%_20%,oklch(0.72_0.14_42_/_0.22),transparent_55%),radial-gradient(circle_at_80%_70%,oklch(0.64_0.11_220_/_0.18),transparent_55%)]" />
          <div className="relative max-w-4xl mx-auto rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-[0_10px_45px_-15px_rgba(0,0,0,0.8)] p-6 sm:p-8 text-center space-y-5">
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