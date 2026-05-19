"use client";

import Cookies from "js-cookie";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Movie } from "@/types";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

const GENRE_TO_ID: Record<string, number> = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35,
  Crime: 80, Documentary: 99, Drama: 18, Family: 10751,
  Fantasy: 14, Horror: 27, Mystery: 9648, Romance: 10749,
  "Sci-Fi": 878, Thriller: 53, War: 10752,
};


export default function StreamingPage() {
  const { id } = useParams();
  const router = useRouter();
  useInactivityLogout(() => router.push("/login"));

  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [providerLogo, setProviderLogo] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc" | "none">("none");
  const [genre, setGenre] = useState("");
  const [searching, setSearching] = useState(false);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initial load for provider/genre (when not searching)
  useEffect(() => {
    if (searching) return;
    setLoading(true);
    async function init() {
      try {
        const provResp = await api.get("/v1/tmdb/providers");
        const provider = provResp.data.find((p: any) => String(p.provider_id) === String(id));
        if (provider) {
          setProviderName(provider.provider_name);
          setProviderLogo(provider.logo_path);
        }
      } catch {}
      try {
        const params: any = { page: 1 };
        if (genre) params.with_genres = GENRE_TO_ID[genre];
        const resp = await api.get(`/v1/tmdb/providers/${id}/movies`, { params });
        setMovies(resp.data.results || []);
        setTotalPages(resp.data.total_pages || 1);
        setPage(1);
      } catch {
        setMovies([]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id, genre, searching]);

  // Always reset sort to 'none' when changing provider
  useEffect(() => {
    setSort("none");
  }, [id]);

  // Remove duplicate movies before rendering
  let filtered = Array.from(
    new Map(movies.map((movie) => [movie.id, movie])).values()
  );

  // Só aplica sort se o usuário selecionar explicitamente (não aplica por padrão)
  if (sort && sort !== "none") {
    filtered = [...filtered].sort((a, b) => sort === "desc" ? b.vote_average - a.vote_average : a.vote_average - b.vote_average);
  }

  // Search movies across all provider pages
  useEffect(() => {
    async function searchMovies() {
      // Restore default provider list
      if (search.trim() === "") {
        setSearching(false);

        try {
          setLoading(true);

          const params: any = { page: 1 };

          if (genre) {
            params.with_genres = GENRE_TO_ID[genre];
          }

          const resp = await api.get(`/v1/tmdb/providers/${id}/movies`, {
            params,
          });

          setMovies(resp.data.results || []);
          setTotalPages(resp.data.total_pages || 1);
          setPage(1);
        } catch {
          setMovies([]);
        } finally {
          setLoading(false);
        }

        return;
      }

      setSearching(true);

      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      searchTimeout.current = setTimeout(async () => {
        try {
          const allResults: Movie[] = [];

          // Fetch multiple pages to search everything
          for (let currentPage = 1; currentPage <= 8; currentPage++) {
            const params: any = {
              page: currentPage,
            };

            if (genre) {
              params.with_genres = GENRE_TO_ID[genre];
            }

            const resp = await api.get(
              `/v1/tmdb/providers/${id}/movies`,
              { params }
            );

            const results = resp.data.results || [];

            allResults.push(...results);
          }

          // Local filter after loading pages
          const filteredResults = allResults.filter((movie) =>
            movie.title.toLowerCase().includes(search.toLowerCase())
          );

          // Remove duplicated movies by ID
          const uniqueMovies = Array.from(
            new Map(
              filteredResults.map((movie) => [movie.id, movie])
            ).values()
          );

          setMovies(uniqueMovies);
        } catch (err) {
          console.error(err);
          setMovies([]);
        }
      }, 300);

      return () => {
        if (searchTimeout.current) {
          clearTimeout(searchTimeout.current);
        }
      };
    }

    searchMovies();
  }, [search, genre, id]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const params: any = { page: next };
      if (genre) params.with_genres = GENRE_TO_ID[genre];
      if (search.trim() !== "") params.query = search;
      const resp = await api.get(`/v1/tmdb/providers/${id}/movies`, { params });
      setMovies((prev) => {
        const merged = [...prev, ...(resp.data.results || [])];
        return Array.from(
          new Map(merged.map((movie) => [movie.id, movie])).values()
        );
      });
      setPage(next);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-background">
      <NavBar showBack />
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <NavBar showBack />
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-6">
        <div className="flex items-center gap-4">
          {providerLogo && (
            <img
              src={`https://image.tmdb.org/t/p/w92${providerLogo}`}
              alt={providerName}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-border/40"
              style={{ background: "#fff" }}
            />
          )}
          <h1 className="text-3xl sm:text-4xl font-bold">{providerName}</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="h-11 sm:w-72"
          />
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm sm:w-48"
          >
            <option value="">All Genres</option>
            {Object.keys(GENRE_TO_ID).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "desc" | "asc" | "none")}
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm sm:w-48"
          >
            <option value="none">Default</option>
            <option value="desc">Highest Rated</option>
            <option value="asc">Lowest Rated</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {filtered.map((movie, index) => (
            <div
              key={`${movie.id}-${index}`}
              className="relative cursor-pointer rounded-xl overflow-hidden ring-1 ring-border/40 hover:ring-2 hover:ring-primary/60 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200"
              onClick={() => router.push(`/movies/${movie.id}`)}
            >
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  No image
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-3 pt-10">
                <p className="text-white text-sm font-bold line-clamp-2">{movie.title}</p>
                <p className="text-yellow-400 text-sm mt-1">⭐ {movie.vote_average.toFixed(1)}</p>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-10">No movies found.</p>
        )}

        {!searching && page < totalPages && (
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}