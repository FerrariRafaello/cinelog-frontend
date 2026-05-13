"use client";

import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/StarRating";

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
  const [reviews, setReviews] = useState<ReviewFull[]>([]);
  const [movieInfos, setMovieInfos] = useState<Record<number, MovieInfo>>({});
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [searchMovie, setSearchMovie] = useState("");
  const [sort, setSort] = useState("newest");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setChecked(true);
  }, []);

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

  if (!checked) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-2 py-2 pr-4 text-sm font-semibold text-foreground hover:border-primary/60 hover:bg-card transition-colors"
        >
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">←</span>
          Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <div className="flex gap-3">
          <Button variant="ghost" className="rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium" onClick={() => router.push("/")}>Home</Button>
          <Button variant="ghost" className="rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium" onClick={() => router.push("/profile")}>Profile</Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-3">
            <Input
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="Search by username..."
              className="flex-1"
            />
            <Input
              value={searchMovie}
              onChange={(e) => setSearchMovie(e.target.value)}
              placeholder="Search by movie..."
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </div>
          <div className="flex gap-2">
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
        </form>

        {loading && <p className="text-muted-foreground text-sm">Loading reviews...</p>}

        {!loading && reviews.length === 0 && (
          <p className="text-muted-foreground text-sm">No reviews found.</p>
        )}

        <div className="space-y-4">
          {reviews.map((review) => {
            const movie = movieInfos[review.tmdb_movie_id];
            return (
              <div key={review.id} className="flex gap-4 p-4 rounded-2xl border border-border/60 bg-card/70">
                <div
                  className="flex-shrink-0 w-16 sm:w-20 cursor-pointer"
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
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => router.push(`/movies/${review.tmdb_movie_id}`)}
                        className="text-sm font-semibold hover:underline line-clamp-1"
                      >
                        {movie?.title || `Movie #${review.tmdb_movie_id}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/profile?user=${review.user_id}`)}
                        className="text-xs text-muted-foreground hover:underline block"
                      >
                        {review.user_name}
                      </button>
                    </div>
                    <StarRating value={review.rating} onChange={() => {}} readonly />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{review.comment}</p>
                  )}
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
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default ReviewsContent;