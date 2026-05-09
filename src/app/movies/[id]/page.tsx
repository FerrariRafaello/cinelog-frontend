"use client";

//IMPORTS
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api"
import { Movie, Review } from "@/types";
import { Button } from "@/components/ui/button"


export default function MoviePage() {
    const { id }=useParams();
    const router=useRouter();
    const [movie, setMovie]=useState<Movie | null>(null);
    const [reviews, setReviews]=useState<Review[]>([]);
    const [rating, setRating]=useState("");
    const [comment, setComment]=useState("");
    const [status, setStatus]=useState("");
    const [loading, setLoading]=useState(true);


    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) {
            router.push("/login");
            return;
        }
        fetchMovie();
        fetchReviews();
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
            alert("Error submitting review. You may have already reviewed this movie.");
        }
    }


    async function handleWatchlist() {
        try{
            await api.post("/v1/watchlist", {
                tmdb_movie_id: Number(id),
                status:status || "want_to_watch",
            });
            alert("Added to watchlist!");
        }catch{
            alert("Already in your watchlist.")
        }
    }

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

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Write a Review</h3>
          <form onSubmit={handleReview} className="space-y-3">
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="Rating (0-10)"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              required
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
              <div className="flex justify-between">
                <span className="text-sm font-medium">User #{review.user_id}</span>
                <span className="text-sm">⭐ {review.rating}/10</span>
              </div>
              {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}