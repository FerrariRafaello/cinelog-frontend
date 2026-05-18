"use client";

import Cookies from "js-cookie";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/StarRating";
import { NavBar } from "@/components/NavBar";

interface ReviewFull {
  id: number;
  user_id: number;
  tmdb_movie_id: number;
  rating: number;
  comment?: string;
  likes: number;
  liked_by_me: boolean;
  created_at: string;
  user_name: string;
}

interface MovieInfo {
  id: number;
  title: string;
  poster_path?: string;
}

function ReviewsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reviews, setReviews] = useState<ReviewFull[]>([]);
  const [movieInfos, setMovieInfos] = useState<Record<number, MovieInfo>>({});
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [searchMovie, setSearchMovie] = useState("");
  const [sort, setSort] = useState("newest");
  const [checked, setChecked] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const userFromUrl = searchParams.get("user");
    if (userFromUrl) {
      // busca o nome do usuário para mostrar no input
      api.get(`/v1/users/${userFromUrl}`)
        .then((resp) => setSearchUser(resp.data.name || userFromUrl))
        .catch(() => setSearchUser(userFromUrl));
    }
    setChecked(true);
  }, [router, searchParams]);

  useEffect(() => {
    if (!checked) return;
    fetchReviews();
  }, [checked, sort, searchUser]);

  async function fetchReviews() {
    setLoading(true);
    try {
      const params: any = { sort, limit: 50 };
      if (searchUser.trim()) params.search_user = searchUser.trim();

      if (searchMovie.trim()) {
        const movieResp = await api.get("/v1/tmdb/search", { params: { q: searchMovie.trim() } });
        const firstMovie = movieResp.data.results?.[0];
        if (firstMovie) params.search_movie = firstMovie.id;
      }

      const resp = await api.get("/v1/reviews/feed", { params });
      const data: ReviewFull[] = resp.data || [];
      setReviews(data);
      fetchMovieInfos(data.map((r) => r.tmdb_movie_id));
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMovieInfos(ids: number[]) {
    const unique = Array.from(new Set(ids)).filter((id) => !movieInfos[id]);
    if (unique.length === 0) return;
    const entries = await Promise.all(
      unique.map(async (id) => {
        try {
          const resp = await api.get(`/v1/tmdb/movies/${id}`);
          return [id, { id, title: resp.data.title, poster_path: resp.data.poster_path }] as const;
        } catch {
          return [id, { id, title: `Movie #${id}`, poster_path: undefined }] as const;
        }
      })
    );
    setMovieInfos((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  }

  async function handleLike(reviewId: number) {
    try {
      const resp = await api.post(`/v1/reviews/${reviewId}/like`);
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, likes: resp.data.likes, liked_by_me: true } : r)));
    } catch {
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, liked_by_me: true } : r)));
    }
  }

  function handleSearch(e: React.SyntheticEvent) {
    e.preventDefault();
    fetchReviews();
  }

  function toggleExpand(id: number) {
    setExpandedReviews((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (!checked) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <NavBar showBack />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 border-b border-border/40">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full">
            <div className="flex gap-2 flex-shrink-0">
              {["newest", "oldest", "popular"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${sort === s ? "bg-primary text-primary-foreground border-primary" : "border-border/70 bg-card/80 text-foreground hover:border-primary/60"}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-3 w-full max-w-2xl justify-center items-center">
              <Input value={searchUser} onChange={(e) => setSearchUser(e.target.value)} placeholder="Search by username..." className="h-14 text-base" />
              <Input value={searchMovie} onChange={(e) => setSearchMovie(e.target.value)} placeholder="Search by movie..." className="h-14 text-base" />
              <Button type="submit" className="h-14 px-7 text-base">Search</Button>
            </div>
          </form>
        </div>

        {loading && <p className="text-muted-foreground text-sm">Loading reviews...</p>}

        {!loading && reviews.length === 0 && (
          <p className="text-muted-foreground text-sm">No reviews found.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto items-start">
          {reviews.filter((r) => r.comment && r.comment.trim().length > 0).map((review) => {
            const movie = movieInfos[review.tmdb_movie_id];
            return (
              <div key={review.id} className="flex gap-4 p-4 rounded-2xl border border-border/40 bg-card/70 shadow-md hover:shadow-lg hover:border-border/80 transition-all duration-200">
                <div
                  className="flex-shrink-0 w-20 sm:w-28 cursor-pointer"
                  onClick={() => router.push(`/movies/${review.tmdb_movie_id}`)}
                >
                  {movie?.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full aspect-[2/3] object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">?</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button type="button" onClick={() => router.push(`/movies/${review.tmdb_movie_id}`)} className="text-base font-bold text-white hover:underline line-clamp-1">
                      {movie?.title || `Movie #${review.tmdb_movie_id}`}
                    </button>
                    <span className="flex-shrink-0 bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">
                      ⭐ {review.rating}/10
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                      {review.user_name.charAt(0).toUpperCase()}
                    </div>
                    <button type="button" onClick={() => router.push(`/profile?user=${review.user_id}`)} className="text-base font-bold text-primary hover:underline">
                      {review.user_name}
                    </button>
                  </div>
                  {review.comment && (
                    <div>
                      <p className={`text-base text-white/80 leading-relaxed break-words ${expandedReviews.has(review.id) ? "" : "line-clamp-4"}`}>
                        {review.comment}
                      </p>
                      {review.comment.length > 120 && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(review.id)}
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          {expandedReviews.has(review.id) ? "Ver menos ↑" : "Ver mais ↓"}
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLike(review.id)}
                      disabled={review.liked_by_me}
                      className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card/70 px-2.5 py-1.5 text-xs font-medium hover:border-primary/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      👍 {review.likes}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function ReviewsPage() {
  return (
    <Suspense>
      <ReviewsContent />
    </Suspense>
  );
}

export default ReviewsPage;