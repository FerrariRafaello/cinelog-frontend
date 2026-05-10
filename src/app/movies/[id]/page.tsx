"use client";

//IMPORTS
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api"
import { Movie, Review } from "@/types";
import { Button } from "@/components/ui/button"
import { toast } from "sonner";
import { StarRating } from "@/components/StarRating";


export default function MoviePage() {
    const { id }=useParams();
    const router=useRouter();
    const [movie, setMovie]=useState<Movie | null>(null);
    const [reviews, setReviews]=useState<Review[]>([]);
    const [rating, setRating]=useState("");
    const [comment, setComment]=useState("");
    const [status, setStatus]=useState("");
    const [loading, setLoading]=useState(true);
    const [checked, setChecked]=useState(false);
    const [currentUserId, setCurrentUserId]=useState<number | null>(null);
    const [credits, setCredits]=useState<{cast:any[], crew:any[]}>({cast: [], crew: []});
    const [trailer, setTrailer]=useState<string | null>(null);


    useEffect(() => {
    const timer = setTimeout(() => {
      const token = Cookies.get("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(parseInt(payload.sub));
      fetchMovie();
      fetchReviews();
      fetchCredits();
      fetchVideos();
      setChecked(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [id]);

    async function fetchMovie() {
        try{
            const resp=await api.get(`/v1/tmdb/movies/${id}`);
            setMovie(resp.data);
        }catch{
            router.push("/");
        }finally{
            setLoading(false);
        }
    }

    async function fetchReviews() {
        try{
            const resp=await api.get(`/v1/reviews/movie/${id}`);
            setReviews(resp.data);
        }catch{
            setReviews([]);
        }
    }

    async function handleReview(e: React.SyntheticEvent) {
        e.preventDefault();
        try{
            await api.post("/v1/reviews", {
                tmdb_movie_id: Number(id),
                rating: parseFloat(rating),
                comment: comment || undefined,
            });
            setRating("");
            setComment("");
            fetchReviews();
        }catch{
            toast.error("Error submitting review. You may have already reviewed this movie.");
        }
    }

    async function handleWatchlist() {
        try{
            await api.post("/v1/watchlist", {
                tmdb_movie_id: Number(id),
                status:status || "want_to_watch",
            });
            toast.error("Added to watchlist!");
        }catch{
            toast.error("Already in your watchlist.")
        }
    }

    async function fetchCredits() {
      try{
        const resp=await api.get(`/v1/tmdb/movies/${id}/credits`);
        setCredits(resp.data);
      }catch{
        setCredits({cast: [], crew: []});
      }
    }

    async function fetchVideos() {
      try{
        const resp=await api.get(`/v1/tmdb/movies/${id}/videos`);
        const yt=resp.data.results?.find(
          (v:any) => v.type === "Trailer" && v.site === "YouTube"
        );
        setTrailer(yt ? yt.key : null);
      }catch{
        setTrailer(null);
      }
    }

    if (!checked) return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!movie) return null;


    return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-6 py-4 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </button>
        <h1 className="text-xl font-bold">Cinelog</h1>
        <Button variant="ghost" onClick={() => router.push("/profile")}>Profile</Button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="flex gap-6">
          {movie.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
              alt={movie.title}
              className="w-48 rounded-lg flex-shrink-0"
            />
          )}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold">{movie.title}</h2>
            <p className="text-muted-foreground">{movie.overview}</p>
            <p className="text-sm">⭐ {movie.vote_average.toFixed(1)} · {movie.release_date?.slice(0, 4)}</p>
            {movie.genres && movie.genres.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {movie.genres.map((g) => g.name).join(" · ")}
              </p>
            )}
            {movie.runtime && (
              <p className="text-sm text-muted-foreground">
                {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}min
              </p>
            )}
            {credits.crew && (
              <p className="text-sm">
                🎬 <span className="font-medium">Director:</span>{" "}
                {credits.crew.find((c: any) => c.job === "Director")?.name || "Unknown"}
              </p>
            )}
            {trailer && (
              <a href={`https://www.youtube.com/watch?v=${trailer}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
                ▶ Watch Trailer
              </a>
            )}
            <div className="flex gap-2 pt-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="want_to_watch">Want to watch</option>
                <option value="watching">Watching</option>
                <option value="watched">Watched</option>
                <option value="dropped">Dropped</option>
              </select>
              <Button onClick={handleWatchlist} variant="outline">Add to Watchlist</Button>
            </div>
          </div>
        </div>

        {credits.cast.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Cast</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {credits.cast.slice(0, 10).map((actor) => (
                <div key={actor.id} className="flex-shrink-0 text-center w-20">
                  {actor.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                      alt={actor.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                      No photo
                    </div>
                  )}
                  <p className="text-xs font-medium mt-1 line-clamp-2">{actor.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Write a Review</h3>
          <form onSubmit={handleReview} className="space-y-3">
            <StarRating
              value={parseFloat(rating) || 0}
              onChange={(val) => setRating(String(val))}
            />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review... (optional)"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-24"
            />
            <Button type="submit">Submit Review</Button>
          </form>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Reviews ({reviews.length})</h3>
          {reviews.length === 0 && (
            <p className="text-muted-foreground">No reviews yet. Be the first!</p>
          )}
          {reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-lg border border-border space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {review.user_id === currentUserId ? "You" : `User #${review.user_id}`}
                </span>
                <StarRating value={review.rating} onChange={() => {}} readonly />
              </div>
              {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}