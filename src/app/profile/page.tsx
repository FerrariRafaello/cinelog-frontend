"use client";

//IMPORTS
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Review, WatchlistItem } from "@/types";
import { Button } from "@/components/ui/button";
import { LogoutDialog } from "@/components/LogoutDialog"
import { toast } from "sonner";


export default function MoviePage() {
    const router=useRouter();
    const [reviews, setReviews]=useState<Review[]>([]);
    const [watchlist, setWatchlist]=useState<WatchlistItem[]>([]);
    const [userId, setUserId]=useState<number | null>(null);
    // const [loading, setLoading]=useState(true);
    const [checked, setChecked]=useState(false);
    const [userName, setUserName]=useState("");
    const [editingReviewId, setEditingReviewId]=useState<number | null>(null);
    const [editRating, setEditRating]=useState("");
    const [editComment, setEditComment]=useState("");
    const [moviePosters, setMoviePosters]=useState<Record<number, string>>({});


    useEffect(() => {
    const timer = setTimeout(() => {
      const token = Cookies.get("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const payload = JSON.parse(atob(token.split(".")[1]));
      const id = parseInt(payload.sub);
      setUserId(id);

      async function fetchUser(user_id: number) {
        try {
          const resp = await api.get(`/v1/users/${user_id}`);
          setUserName(resp.data.name);
        } catch {
          setUserName("");
        } finally {
          setChecked(true);
        }
      }
      fetchUser(id);
      fetchReviews(id);
      fetchWatchlist();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

    async function fetchReviews(id: number) {
      try{
          const resp=await api.get(`/v1/reviews/user/${id}`);
          const data=resp.data;
          setReviews(resp.data);

          const posters: Record<number, string> = {};
          await Promise.all(data.map(async (r: Review) => {
            try {
              const m = await api.get(`/v1/tmdb/movies/${r.tmdb_movie_id}`);
              if (m.data.poster_path) posters[r.tmdb_movie_id] = m.data.poster_path;
            }catch{}
          }));
          setMoviePosters(posters)
      }catch {
          setReviews([]);
      }
    }


    async function fetchWatchlist() {
      try{
          const resp=await api.get("/v1/watchlist");
          setWatchlist(resp.data);
      }catch{
          setWatchlist([]);
      }
    }

    async function handleDeleteReview(reviewId:number) {
      try{
          await api.delete(`/v1/reviews/${reviewId}`);
          setReviews(reviews.filter((r) => r.id !== reviewId));
      }catch {
          toast.error("Error deleting review.");
      }
    }

    async function handleUpdateReview(reviewId:number) {
      try {
        await api.patch(`/v1/reviews/${reviewId}`, {
          rating: parseFloat(editRating),
          comment: editComment || undefined,
        });
        setEditingReviewId(null);
        fetchReviews(userId!);
        toast.success("Review updated!");
      }catch {
        toast.error("Error updating review")
      }
    }

    async function handleRemoveWatchlist(itemId: number) {
      try{
          await api.delete(`/v1/watchlist/${itemId}`);
          setWatchlist(watchlist.filter((w) => w.id !== itemId));
      }catch{
          toast.error("Error removing from watchlist.");
      }
    }

    async function handleUpdateWatchlistStatus(itemId: number, newStatus: string) {
      try {
        await api.patch(`/v1/watchlist/${itemId}`, { status: newStatus });
        setWatchlist(watchlist.map((w) => 
          w.id === itemId ? { ...w, status: newStatus as WatchlistItem["status"] } : w
        ));
        toast.success("Status updated!");
      } catch {
        toast.error("Error updating status.");
      }
    }

    if (!checked) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
      );
    // if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

    return (
        <div className="min-h-screen bg-background">
            <nav className="border-b border-border px-6 py-4 flex justify-between items-center">
                <button onClick={() => router.push("/")} className="text-sm text-muted-foreground hover:text-foreground">
                    ← Home
                </button>
                <h1 className="text-xl font-bold">Cinelog</h1>
                <LogoutDialog />
            </nav>

            {/* Cover + Avatar */}
            <div className="relative">
                <div className="h-40 bg-gradient-to-r from-slate-700 to-slate-900 w-full" />
                <div className="absolute left-8 -bottom-12">
                    <div className="w-24 h-24 rounded-full border-4 border-background bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 pt-16 pb-10 space-y-10">
                <div>
                    <h2 className="text-2xl font-bold">{userName || `User #${userId}`}</h2>
                    <p className="text-muted-foreground text-sm mt-1">{reviews.length} reviews · {watchlist.length} in watchlist</p>
                </div>

                {/* Reviews */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">My Reviews</h3>
                    {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet.</p>}
                    {reviews.map((review) => (
                        <div key={review.id} className="rounded-lg border border-border overflow-hidden">
                            {editingReviewId === review.id ? (
                                <div className="p-4 space-y-2">
                                    <input
                                        type="number" min="0" max="10" step="0.1"
                                        value={editRating}
                                        onChange={(e) => setEditRating(e.target.value)}
                                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                                        placeholder="Rating (0-10)"
                                    />
                                    <textarea
                                        value={editComment}
                                        onChange={(e) => setEditComment(e.target.value)}
                                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-20"
                                        placeholder="Comment (optional)"
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleUpdateReview(review.id)}>Save</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingReviewId(null)}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-4 p-4">
                                    {moviePosters[review.tmdb_movie_id] ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w92${moviePosters[review.tmdb_movie_id]}`}
                                            alt="poster"
                                            className="w-16 rounded flex-shrink-0 cursor-pointer"
                                            onClick={() => router.push(`/movies/${review.tmdb_movie_id}`)}
                                        />
                                    ) : (
                                        <div className="w-16 h-24 bg-muted rounded flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <p className="text-sm font-medium">⭐ {review.rating}/10</p>
                                                {review.comment && (
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                                                        {review.comment}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Button size="sm" variant="outline" onClick={() => {
                                                    setEditingReviewId(review.id);
                                                    setEditRating(String(review.rating));
                                                    setEditComment(review.comment || "");
                                                }}>Edit</Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDeleteReview(review.id)}>Delete</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Watchlist */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">My Watchlist</h3>
                    {watchlist.length === 0 && <p className="text-muted-foreground">Watchlist is empty.</p>}
                    {watchlist.map((item) => (
                        <div key={item.id} className="p-4 rounded-lg border border-border flex justify-between items-center">
                            <p className="text-sm font-medium cursor-pointer hover:underline" onClick={() => router.push(`/movies/${item.tmdb_movie_id}`)}>
                                Movie #{item.tmdb_movie_id}
                            </p>
                            <div className="flex gap-2 items-center">
                                <select
                                    value={item.status}
                                    onChange={(e) => handleUpdateWatchlistStatus(item.id, e.target.value)}
                                    className="px-2 py-1 rounded-md border border-input bg-background text-xs"
                                >
                                    <option value="want_to_watch">Want to watch</option>
                                    <option value="watching">Watching</option>
                                    <option value="watched">Watched</option>
                                    <option value="dropped">Dropped</option>
                                </select>
                                <Button variant="destructive" size="sm" onClick={() => handleRemoveWatchlist(item.id)}>
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}