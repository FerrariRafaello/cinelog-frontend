"use client";

//IMPORTS
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Movie } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAuthenticated, logout } from "@/lib/auth";
import { useEffect } from "react";


export default function HomePage() {
  const router=useRouter();
  const [query, setQuery]=useState("");
  const [movies, setMovies]=useState<Movie[]>([]);
  const [loading, setLoading]=useState(false);

  useEffect(() => {
    if ((!isAuthenticated())) {
      router.push("/login");
    }
  }, [router]);

  async function handleSearch(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try{
      const resp=await api.get("/v1/tmdb/search", { params: { q: query } });
      setMovies(resp.data.results);
    }catch {
      setMovies([]);
    }finally{
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
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
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
      </main>
    </div>
  );
}