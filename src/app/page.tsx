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
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = Cookies.get("token");
      if (!token) {
        router.push("/login");
      } else {
        setChecked(true);

        async function fetchTrending() {
          try {
            const resp = await api.get("/v1/tmdb/trending");
            setTrending(resp.data.results);
          } catch {
            setTrending([]);
          }
        }

        async function fetchNowPlaying() {
          try {
            const resp = await api.get("/v1/tmdb/now-playing");
            setNowPlaying(resp.data.results);
          } catch {
            setNowPlaying([]);
          }
        }
        fetchTrending();
        fetchNowPlaying();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      api.get("/v1/tmdb/search", { params: { q } }).then((resp) => {
        setMovies(resp.data.results);
      });
    }
  }, [searchParams]);

  if (!checked) return (
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
      setMovies(resp.data.results);
    } catch {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Cinelog</h1>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.push("/profile")}>
            Profile
          </Button>
          <LogoutDialog />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a movie..."
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {movies.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search Results</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="cursor-pointer rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/movies/${movie.id}`)}
                >
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-sm font-medium line-clamp-2">{movie.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⭐ {movie.vote_average.toFixed(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {movies.length === 0 && (
          <>
            {trending.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">🔥 Trending This Week</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {trending.slice(0, 8).map((movie) => (
                    <div
                      key={movie.id}
                      className="cursor-pointer rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/movies/${movie.id}`)}
                    >
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                          alt={movie.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center text-muted-foreground text-sm">
                          No image
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-sm font-medium line-clamp-2">{movie.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ⭐ {movie.vote_average.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {nowPlaying.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">🎬 Now Playing</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {nowPlaying.slice(0, 8).map((movie) => (
                    <div
                      key={movie.id}
                      className="cursor-pointer rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/movies/${movie.id}`)}
                    >
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                          alt={movie.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center text-muted-foreground text-sm">
                          No image
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-sm font-medium line-clamp-2">{movie.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ⭐ {movie.vote_average.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
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