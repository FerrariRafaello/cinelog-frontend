"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Movie } from "@/types";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { GENRE_TO_ID } from "@/lib/genres";

// Strip accents, collapse whitespace, lowercase — tolerant search across all locales
function normalizeStr(s: string) {
  return s
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}


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

  // Reset sort when switching providers so the user always starts at the default order
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
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (search.trim() === "") {
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        // Fetch 8 pages in parallel instead of serially — cuts search time by ~8x
        const pageNums = Array.from({ length: 8 }, (_, i) => i + 1);
        const responses = await Promise.all(
          pageNums.map((pg) => {
            const params: any = { page: pg };
            if (genre) params.with_genres = GENRE_TO_ID[genre];
            return api.get(`/v1/tmdb/providers/${id}/movies`, { params });
          })
        );
        const allResults: Movie[] = responses.flatMap((r) => r.data.results || []);
        const q = normalizeStr(search);
        const uniqueMovies = Array.from(
          new Map(
            allResults
              .filter((m) => normalizeStr(m.title).includes(q))
              .map((m) => [m.id, m])
          ).values()
        );
        setMovies(uniqueMovies);
      } catch {
        setMovies([]);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
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
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
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
            placeholder="Buscar por título..."
            className="h-11 sm:w-72"
          />
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm sm:w-48"
          >
            <option value="">Todos os Gêneros</option>
            {Object.keys(GENRE_TO_ID).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "desc" | "asc" | "none")}
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm sm:w-48"
          >
            <option value="none">Padrão</option>
            <option value="desc">Mais Bem Avaliados</option>
            <option value="asc">Menos Avaliados</option>
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
                  Sem imagem
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
          <p className="text-center text-muted-foreground py-10">Nenhum filme encontrado.</p>
        )}

        {!searching && page < totalPages && (
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              {loadingMore ? "Carregando..." : "Carregar mais"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}