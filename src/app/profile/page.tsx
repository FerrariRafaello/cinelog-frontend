"use client";

//IMPORTS
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Review, WatchlistItem } from "@/types";
import { Button } from "@/components/ui/button";
import { LogoutDialog } from "@/components/LogoutDialog"
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { getAvatarBg, getCoverGradient } from "@/lib/profile-options";
import { toast } from "sonner";


export default function MoviePage() {
    const router=useRouter();
    const [reviews, setReviews]=useState<Review[]>([]);
    const [watchlist, setWatchlist]=useState<WatchlistItem[]>([]);
    const [userId, setUserId]=useState<number | null>(null);
    const [checked, setChecked]=useState(false);
    const [userName, setUserName]=useState("");
    const [editingReviewId, setEditingReviewId]=useState<number | null>(null);
    const [editRating, setEditRating]=useState("");
    const [editComment, setEditComment]=useState("");
    const [movieInfo, setMovieInfo]=useState<Record<number, {title: string, poster: string}>>({});
    const [avatarId, setAvatarId]=useState<string | null>(null);
    const [coverId, setCoverId]=useState<string | null>(null);
    const [bio, setBio]=useState("");
    const [pronouns, setPronouns]=useState("");
    const [favoriteGenres, setFavoriteGenres]=useState("");


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
          setAvatarId(resp.data.avatar_id);
          setCoverId(resp.data.cover_id);
          setBio(resp.data.bio || "");
          setPronouns(resp.data.pronouns || "");
          setFavoriteGenres(resp.data.favorite_genres || "");
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


    async function handleUpdateProfile(data: {avatar_id?: string, cover_id?: string, bio?: string}) {
        try {
            await api.patch(`/v1/users/${userId}`, data);
            if (data.avatar_id) setAvatarId(data.avatar_id);
            if (data.cover_id) setCoverId(data.cover_id);
            if (data.bio !== undefined) setBio(data.bio);
            toast.success("Profile updated!");
        } catch {
            toast.error("Error updating profile.");
        }
    }

    function handleEditSave(data: {name?: string; bio?: string; pronouns?: string; favorite_genres?: string; avatar_id?: string; cover_id?: string;}) {
        if (data.name) setUserName(data.name);
        if (data.bio !== undefined) setBio(data.bio);
        if (data.pronouns !== undefined) setPronouns(data.pronouns);
        if (data.favorite_genres !== undefined) setFavoriteGenres(data.favorite_genres);
        if (data.avatar_id) setAvatarId(data.avatar_id);
        if (data.cover_id) setCoverId(data.cover_id);
    }


    async function fetchMovieInfo(ids: number[]) {
        const unique = [...new Set(ids)];
        const info: Record<number, {title: string, poster: string}> = {};
        await Promise.all(unique.map(async (mid) => {
            try {
                const m = await api.get(`/v1/tmdb/movies/${mid}`);
                info[mid] = {
                    title: m.data.title || `Movie #${mid}`,
                    poster: m.data.poster_path || "",
                };
            } catch {}
        }));
        setMovieInfo((prev) => ({ ...prev, ...info }));
    }


    async function fetchReviews(id: number) {
      try{
          const resp=await api.get(`/v1/reviews/user/${id}`);
          setReviews(resp.data);
          fetchMovieInfo(resp.data.map((r: Review) => r.tmdb_movie_id));
      }catch {
          setReviews([]);
      }
    }


    async function fetchWatchlist() {
      try{
          const resp=await api.get("/v1/watchlist");
          setWatchlist(resp.data);
          fetchMovieInfo(resp.data.map((w: WatchlistItem) => w.tmdb_movie_id));
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
        <div className={`h-48 ${getCoverGradient(coverId)} w-full`} />
        <div className="absolute left-4 sm:left-8 -bottom-14">
          <div className={`w-28 h-28 rounded-full border-4 border-background ${getAvatarBg(avatarId)} flex items-center justify-center text-4xl font-bold text-white`}>
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-10 space-y-10">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{userName || `User #${userId}`}</h2>
            {userId !== null && (
              <EditProfileDialog
                userId={userId}
                currentName={userName}
                currentBio={bio}
                currentPronouns={pronouns}
                currentGenres={favoriteGenres}
                currentAvatarId={avatarId}
                currentCoverId={coverId}
                onSave={handleEditSave}
              />
            )}
          </div>
          {pronouns && <p className="text-muted-foreground text-sx mt-0.5">{pronouns}</p>}
          <p className="text-muted-foreground text-base mt-0.5">{reviews.length} reviews · {watchlist.length} in watchlist</p>

          {/* Bio */}
          {bio && <p className="text-base text-muted-foreground mt-0.5 max-w-md">{bio}</p>}

          {/* Favorite Genres */}
          {favoriteGenres && (
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {favoriteGenres.split(",").map((g) => g.trim()).filter(Boolean).map((genre) => (
                <span key={genre} className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reviews em grade */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">My Reviews</h3>
            {reviews.length > 10 && (
              <button className="text-sm text-primary hover:underline">See all reviews</button>
            )}
          </div>
          {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet.</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {reviews.slice(0, 10).map((review) => (
              <div key={review.id} className="rounded-lg border border-border overflow-hidden group relative">
                {editingReviewId === review.id ? (
                  <div className="p-3 space-y-2">
                    <input
                      type="number" min="0" max="10" step="0.1"
                      value={editRating}
                      onChange={(e) => setEditRating(e.target.value)}
                      className="w-full px-2 py-1 rounded-md border border-input bg-background text-xs"
                      placeholder="Rating (0-10)"
                    />
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="w-full px-2 py-1 rounded-md border border-input bg-background text-xs min-h-16"
                      placeholder="Comment (optional)"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="text-xs h-7" onClick={() => handleUpdateReview(review.id)}>Save</Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setEditingReviewId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="relative cursor-pointer" onClick={() => router.push(`/movies/${review.tmdb_movie_id}`)}>
                      {movieInfo[review.tmdb_movie_id]?.poster ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${movieInfo[review.tmdb_movie_id].poster}`}
                          alt={movieInfo[review.tmdb_movie_id]?.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          No image
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                        <p className="text-white text-xs font-medium line-clamp-1">{movieInfo[review.tmdb_movie_id]?.title || `Movie #${review.tmdb_movie_id}`}</p>
                        <p className="text-white text-xs">⭐ {review.rating}/10</p>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-muted-foreground p-2 line-clamp-2">{review.comment}</p>
                    )}
                    <div className="flex gap-1 p-2">
                      <Button size="sm" variant="outline" className="text-xs h-6 flex-1" onClick={() => {
                        setEditingReviewId(review.id);
                        setEditRating(String(review.rating));
                        setEditComment(review.comment || "");
                      }}>Edit</Button>
                      <Button size="sm" variant="destructive" className="text-xs h-6 flex-1" onClick={() => handleDeleteReview(review.id)}>Delete</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Watchlist horizontal */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">My Watchlist</h3>
            {watchlist.length > 15 && (
              <button className="text-sm text-primary hover:underline">See watchlist</button>
            )}
          </div>
          {watchlist.length === 0 && <p className="text-muted-foreground">Watchlist is empty.</p>}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {watchlist.slice(0, 15).map((item) => (
              <div key={item.id} className="flex-shrink-0 w-32 rounded-lg border border-border overflow-hidden">
                {movieInfo[item.tmdb_movie_id]?.poster ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${movieInfo[item.tmdb_movie_id].poster}`}
                    alt={movieInfo[item.tmdb_movie_id]?.title}
                    className="w-full aspect-[2/3] object-cover cursor-pointer"
                    onClick={() => router.push(`/movies/${item.tmdb_movie_id}`)}
                  />
                ) : (
                  <div
                    className="w-full aspect-[2/3] bg-muted flex items-center justify-center text-muted-foreground text-xs cursor-pointer"
                    onClick={() => router.push(`/movies/${item.tmdb_movie_id}`)}
                  >
                    No image
                  </div>
                )}
                <div className="p-2 space-y-1">
                  <p className="text-xs font-medium line-clamp-1">{movieInfo[item.tmdb_movie_id]?.title || `Movie #${item.tmdb_movie_id}`}</p>
                  <select
                    value={item.status}
                    onChange={(e) => handleUpdateWatchlistStatus(item.id, e.target.value)}
                    className="w-full px-1 py-1 rounded border border-input bg-background text-xs"
                  >
                    <option value="want_to_watch">Want to watch</option>
                    <option value="watching">Watching</option>
                    <option value="watched">Watched</option>
                    <option value="dropped">Dropped</option>
                  </select>
                  <Button variant="destructive" size="sm" className="w-full text-xs h-6" onClick={() => handleRemoveWatchlist(item.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}