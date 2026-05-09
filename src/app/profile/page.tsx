"use client";

//IMPORTS
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api"
import { Review, WatchlistItem } from "@/types";
import { Button } from "@/components/ui/button"
import { logout } from "@/lib/auth"


export default function MoviePage() {
    const router=useRouter();
    const [reviews, setReviews]=useState<Review[]>([]);
    const [watchlist, setWatchlist]=useState<WatchlistItem[]>([]);
    const [userId, setUserId]=useState<number | null>(null);
    const [loading, setLoading]=useState(true);


    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) {
            router.push("/login");
            return;
        }
        //Decode JWT to get user_id
        const payload=JSON.parse(atob(token.split(".")[1]));
        const id=parseInt(payload.sub);
        setUserId(id);
        fetchReviews(id);
        fetchWatchlist();
    }, []);


    async function fetchReviews(id: number) {
        try{
            const resp=await api.get(`/v1/reviews/user/${id}`);
            setReviews(resp.data);
        }catch {
            setReviews([]);
        }finally{
            setLoading(false);
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
            alert("Error deleting review.");
        }
    }


    async function handleRemoveWatchlist(itemId: number) {
        try{
            await api.delete(`/v1/watchlist/${itemId}`);
            setWatchlist(watchlist.filter((w) => w.id !== itemId));
        }catch{
            alert("Error removing from watchlist.");
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

    return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-6 py-4 flex justify-between items-center">
        <button onClick={() => router.push("/")} className="text-sm text-muted-foreground hover:text-foreground">
          ← Home
        </button>
        <h1 className="text-xl font-bold">Cinelog</h1>
        <Button variant="outline" onClick={logout}>Sign out</Button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h2 className="text-2xl font-bold">User #{userId}</h2>
          <p className="text-muted-foreground">{reviews.length} reviews · {watchlist.length} in watchlist</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">My Reviews</h3>
          {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet.</p>}
          {reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-lg border border-border flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium">Movie #{review.tmdb_movie_id}</p>
                <p className="text-sm">⭐ {review.rating}/10</p>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteReview(review.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">My Watchlist</h3>
          {watchlist.length === 0 && <p className="text-muted-foreground">Watchlist is empty.</p>}
          {watchlist.map((item) => (
            <div key={item.id} className="p-4 rounded-lg border border-border flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Movie #{item.tmdb_movie_id}</p>
                <p className="text-xs text-muted-foreground capitalize">{item.status.replace(/_/g, " ")}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleRemoveWatchlist(item.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}