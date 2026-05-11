"use client";

//IMPORTS
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api"
import { Movie, Review, WatchlistItem } from "@/types";
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
    const [providers, setProviders]=useState<any[]>([]);
    const [inWatchlist, setInWatchlist]=useState(false);
    const [watchlistItemId, setWatchlistItemId]=useState<number | null>(null);


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
      fetchProviders();
      fetchWatchlistState();
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


    async function fetchProviders() {
      try{
        const resp=await api.get(`/v1/tmdb/movies/${id}/providers`);
        const br=resp.data.results?.BR;
        const list=br?.flatrate || br?.rent || br?.buy || [];
        setProviders(list);
      }catch{
        setProviders([]);
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
        if (inWatchlist) {
            toast.info("Already in watchlist.");
            return;
        }
        try{
            await api.post("/v1/watchlist", {
                tmdb_movie_id: Number(id),
                status:status || "want_to_watch",
            });
            toast.success("Added to watchlist!");
            setInWatchlist(true);
        }catch(error:any){
            const message = String(error?.response?.data?.error?.message || "").toLowerCase();
            if (message.includes("already") && message.includes("watchlist")) {
              setInWatchlist(true);
              toast.info("Already in watchlist.");
              return;
            }
            toast.error("Could not add movie to watchlist.");
        }
    }

    async function fetchWatchlistState() {
      try {
        const resp = await api.get("/v1/watchlist");
        const items: WatchlistItem[] = resp.data || [];
        const currentMovieId = Number(id);
        const existing = items.find((item) => Number(item.tmdb_movie_id) === currentMovieId);
        setInWatchlist(Boolean(existing));
        if (existing) {
          setWatchlistItemId(existing.id);
          setStatus(existing.status);
        } else {
          setWatchlistItemId(null);
        }
      } catch {
        setInWatchlist(false);
        setWatchlistItemId(null);
      }
    }

    async function handleRemoveFromWatchlist() {
      if (!watchlistItemId) {
        toast.error("Could not remove from watchlist.");
        return;
      }

      try {
        await api.delete(`/v1/watchlist/${watchlistItemId}`);
        setInWatchlist(false);
        setWatchlistItemId(null);
        setStatus("want_to_watch");
        toast.success("Removed from watchlist.");
      } catch {
        toast.error("Could not remove from watchlist.");
      }
    }

    async function handleLikeReview(reviewId: number) {
      try {
        const resp = await api.post(`/v1/reviews/${reviewId}/like`);
        const updated = resp.data as Review;
        setReviews((prev) => prev.map((r) => (r.id === reviewId ? updated : r)));
      } catch {
        toast.error("Could not register like.");
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
      <nav className="border-b border-border px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 backdrop-blur-sm px-2 py-2 pr-4 text-sm sm:text-base font-semibold text-foreground shadow-md hover:border-primary/60 hover:bg-card transition-colors"
        >
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">←</span>
          Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Cinelog</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            className="inline-flex items-center rounded-full border border-border/70 bg-card/80 px-4 py-2 text-base font-medium text-foreground hover:border-primary/60 hover:bg-card transition-colors"
            onClick={() => router.push("/")}
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
        </div>
      </nav>

      {/* Hero + Movie Header */}
      <div className={`relative ${movie.poster_path ? "min-h-[64vh] sm:min-h-[72vh] overflow-hidden" : ""}`}>
        {movie.poster_path && (
          <>
            <div
              className="absolute inset-0 scale-110"
              style={{
                backgroundImage: `url(https://image.tmdb.org/t/p/w780${movie.poster_path})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(24px) brightness(0.25)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </>
        )}

        <div className={`relative z-10 max-w-6xl mx-auto px-4 sm:px-8 ${movie.poster_path ? "pt-8 sm:pt-10 pb-16 sm:pb-20" : "py-8 sm:py-10"}`}>
          <section className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-xl p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-5 sm:gap-7">
              {movie.poster_path && (
                <div className="w-56 sm:w-64 lg:w-72 aspect-[4/5] mx-auto lg:mx-0 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-border/40 shadow-lg">
                  <img
                    src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              )}
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{movie.title}</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{movie.overview}</p>
                <p className="text-base sm:text-lg font-semibold">⭐ {movie.vote_average.toFixed(1)} · {movie.release_date?.slice(0, 4)}</p>
                {movie.genres && movie.genres.length > 0 && (
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {movie.genres.map((g) => g.name).join(" · ")}
                  </p>
                )}
                {movie.runtime && (
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}min
                  </p>
                )}
                {credits.crew && (
                  <p className="text-sm sm:text-base">
                    🎬 <span className="font-medium">Director:</span>{" "}
                    {credits.crew.find((c: any) => c.job === "Director")?.name || "Unknown"}
                  </p>
                )}
                {trailer && (
                  <a href={`https://www.youtube.com/watch?v=${trailer}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm sm:text-base font-medium hover:bg-red-700 transition-colors">
                    ▶ Watch Trailer
                  </a>
                )}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-input bg-background text-sm sm:text-base sm:min-w-52"
                  >
                    <option value="want_to_watch">Want to watch</option>
                    <option value="watching">Watching</option>
                    <option value="watched">Watched</option>
                    <option value="dropped">Dropped</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleWatchlist}
                      variant="outline"
                      disabled={inWatchlist}
                      className="h-11 text-sm sm:text-base"
                    >
                      {inWatchlist ? "Already in watchlist" : "Add to Watchlist"}
                    </Button>
                    {inWatchlist && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleRemoveFromWatchlist}
                        className="h-11 w-11 rounded-lg border border-border/70 text-destructive hover:bg-destructive/10"
                        aria-label="Remove from watchlist"
                        title="Remove from watchlist"
                      >
                        X
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <main className="relative z-20 -mt-16 sm:-mt-24 max-w-6xl mx-auto px-4 sm:px-8 pb-10 sm:pb-12 space-y-8 sm:space-y-10">

        {credits.cast.length > 0 && (
          <section className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-6">
            <h3 className="text-2xl font-bold tracking-tight">Cast</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
              {credits.cast.slice(0, 10).map((actor) => (
                <a
                  key={actor.id}
                  href={`https://www.google.com/search?q=${encodeURIComponent(`${actor.name} actor`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-center w-24 sm:w-28 snap-start hover:opacity-90 transition-opacity"
                >
                  {actor.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                      alt={actor.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                      No photo
                    </div>
                  )}
                  <p className="text-sm font-medium mt-1 line-clamp-2">{actor.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{actor.character}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {providers.length > 0 && (
          <section className="space-y-3 rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-6">
            <h3 className="text-2xl font-bold tracking-tight">Where to Watch</h3>
            <div className="flex gap-4 flex-wrap">
              {providers.map((p: any) => (
                <a
                  key={p.provider_id}
                  href={`https://www.themoviedb.org/movie/${movie.id}/watch`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 hover:scale-110 transition-transform"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                    alt={p.provider_name}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg"
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground text-center w-20 line-clamp-2">{p.provider_name}</p>
                </a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Powered by JustWatch</p>
          </section>
        )}

        <section className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-6">
          <h3 className="text-2xl font-bold tracking-tight">Write a Review</h3>
          <form onSubmit={handleReview} className="space-y-3">
            <StarRating
              value={parseFloat(rating) || 0}
              onChange={(val) => setRating(String(val))}
            />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review... (optional)"
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm sm:text-base min-h-24"
            />
            <Button type="submit" className="h-11 text-sm sm:text-base">Submit Review</Button>
          </form>
        </section>

        <section className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-6">
          <h3 className="text-2xl font-bold tracking-tight">Reviews ({reviews.length})</h3>
          {reviews.length === 0 && (
            <p className="text-muted-foreground text-sm sm:text-base">No reviews yet. Be the first!</p>
          )}
          {reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-xl border border-border space-y-2 bg-background/70">
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm sm:text-base font-medium">
                  {review.user_id === currentUserId ? "You" : `User #${review.user_id}`}
                </span>
                <StarRating value={review.rating} onChange={() => {}} readonly />
              </div>
              {review.comment && <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{review.comment}</p>}
              <button
                type="button"
                onClick={() => handleLikeReview(review.id)}
                className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card/70 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:border-primary/60 hover:bg-card transition-colors"
              >
                👍 {review.likes}
              </button>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}