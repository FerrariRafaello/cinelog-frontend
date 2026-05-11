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
        <button
          onClick={() => router.push("/")}
          className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 backdrop-blur-sm px-2 py-2 pr-4 text-sm sm:text-base font-semibold text-foreground shadow-md hover:border-primary/60 hover:bg-card transition-colors"
        >
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">←</span>
          Home
        </button>
        <h1 className="text-xl font-bold">Cinelog</h1>
        <LogoutDialog />
      </nav>

      {/* Cover + Avatar */}
      <div className="relative">
        <div className={`h-56 sm:h-72 ${getCoverGradient(coverId)} w-full`} />
        <div className="absolute left-6 sm:left-12 -bottom-16 sm:-bottom-20">
          <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-background ${getAvatarBg(avatarId)} flex items-center justify-center text-5xl sm:text-6xl font-bold text-white shadow-xl`}>
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-24 sm:pt-28 pb-12 space-y-10">

        {/* Header info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-4xl font-bold">{userName || `User #${userId}`}</h2>
              {pronouns && <p className="text-muted-foreground text-base mt-1">{pronouns}</p>}
            </div>
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

          {bio && <p className="text-base text-muted-foreground max-w-xl leading-relaxed">{bio}</p>}

          {favoriteGenres && (
            <div className="flex flex-wrap gap-2">
              {favoriteGenres.split(",").map((g) => g.trim()).filter(Boolean).map((genre) => (
                <span key={genre} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-8 pt-2">
            <div>
              <p className="text-3xl font-bold">{reviews.length}</p>
              <p className="text-sm text-muted-foreground uppercase tracking-widest mt-0.5">Reviews</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="text-3xl font-bold">{watchlist.length}</p>
              <p className="text-sm text-muted-foreground uppercase tracking-widest mt-0.5">Watchlist</p>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold">My Reviews</h3>
          </div>
          {reviews.length === 0 && <p className="text-muted-foreground text-base">No reviews yet.</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {reviews.slice(0, 10).map((review) => (
              <div key={review.id} className="rounded-xl overflow-hidden border border-border/50 group relative bg-card">
                {editingReviewId === review.id ? (
                  <div className="p-3 space-y-2">
                    <input
                      type="number" min="0" max="10" step="0.1"
                      value={editRating}
                      onChange={(e) => setEditRating(e.target.value)}
                      className="w-full px-2 py-1 rounded-md border border-input bg-background text-sm"
                      placeholder="Rating (0-10)"
                    />
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="w-full px-2 py-1 rounded-md border border-input bg-background text-sm min-h-16"
                      placeholder="Comment (optional)"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-8 flex-1" onClick={() => handleUpdateReview(review.id)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-8 flex-1" onClick={() => setEditingReviewId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="relative cursor-pointer" onClick={() => router.push(`/movies/${review.tmdb_movie_id}`)}>
                      {movieInfo[review.tmdb_movie_id]?.poster ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w342${movieInfo[review.tmdb_movie_id].poster}`}
                          alt={movieInfo[review.tmdb_movie_id]?.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center text-muted-foreground text-sm">
                          No image
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent px-3 pb-3 pt-10">
                        <p className="text-white text-sm font-bold line-clamp-2 leading-tight">{movieInfo[review.tmdb_movie_id]?.title || `Movie #${review.tmdb_movie_id}`}</p>
                        <p className="text-yellow-400 text-sm font-semibold mt-1">⭐ {review.rating}/10</p>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground px-3 py-2 line-clamp-2">{review.comment}</p>
                    )}
                    <div className="flex gap-2 px-3 pb-3">
                      <Button size="sm" variant="outline" className="text-sm h-8 flex-1" onClick={() => {
                        setEditingReviewId(review.id);
                        setEditRating(String(review.rating));
                        setEditComment(review.comment || "");
                      }}>Edit</Button>
                      <Button size="sm" variant="destructive" className="text-sm h-8 flex-1" onClick={() => handleDeleteReview(review.id)}>Delete</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Watchlist */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold">My Watchlist</h3>
          </div>
          {watchlist.length === 0 && <p className="text-muted-foreground text-base">Watchlist is empty.</p>}
          <div className="overflow-x-auto pb-3">
            <div className="flex gap-4 w-max">
              {watchlist.slice(0, 20).map((item) => (
                <div key={item.id} className="flex-shrink-0 w-40 sm:w-48 rounded-xl border border-border/50 overflow-hidden bg-card">
                  {movieInfo[item.tmdb_movie_id]?.poster ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${movieInfo[item.tmdb_movie_id].poster}`}
                      alt={movieInfo[item.tmdb_movie_id]?.title}
                      className="w-full aspect-[2/3] object-cover cursor-pointer"
                      onClick={() => router.push(`/movies/${item.tmdb_movie_id}`)}
                    />
                  ) : (
                    <div
                      className="w-full aspect-[2/3] bg-muted flex items-center justify-center text-muted-foreground text-sm cursor-pointer"
                      onClick={() => router.push(`/movies/${item.tmdb_movie_id}`)}
                    >
                      No image
                    </div>
                  )}
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-semibold line-clamp-1">{movieInfo[item.tmdb_movie_id]?.title || `Movie #${item.tmdb_movie_id}`}</p>
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateWatchlistStatus(item.id, e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-sm"
                    >
                      <option value="want_to_watch">Want to watch</option>
                      <option value="watching">Watching</option>
                      <option value="watched">Watched</option>
                      <option value="dropped">Dropped</option>
                    </select>
                    <Button variant="destructive" size="sm" className="w-full text-sm h-8" onClick={() => handleRemoveWatchlist(item.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}