"use client";

//IMPORTS
import Cookies from "js-cookie";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { api } from "@/lib/api";
import { Review, WatchlistItem } from "@/types";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/NavBar";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAvatarBg, getCoverGradient } from "@/lib/profile-options";
import { toast } from "sonner";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";


function ProfileContent() {
    const router=useRouter();
  useInactivityLogout(() => router.push("/login"));
  const searchParams = useSearchParams();
    const [reviews, setReviews]=useState<Review[]>([]);
    const [watchlist, setWatchlist]=useState<WatchlistItem[]>([]);
  const [viewerUserId, setViewerUserId]=useState<number | null>(null);
  const [profileUserId, setProfileUserId]=useState<number | null>(null);
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
    const [deleteOpen, setDeleteOpen]=useState(false);
    const [deletingProfile, setDeletingProfile]=useState(false);
    const reviewsScrollRef = useRef<HTMLDivElement>(null);
    const watchlistScrollRef = useRef<HTMLDivElement>(null);
    const [reviewsCanScrollLeft, setReviewsCanScrollLeft] = useState(false);
    const [reviewsCanScrollRight, setReviewsCanScrollRight] = useState(false);
    const [watchlistCanScrollLeft, setWatchlistCanScrollLeft] = useState(false);
    const [watchlistCanScrollRight, setWatchlistCanScrollRight] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);
    const [followersOpen, setFollowersOpen] = useState(false);
    const [followingOpen, setFollowingOpen] = useState(false);
    const [followersList, setFollowersList] = useState<{ id: number; name: string; avatar_id?: string }[]>([]);
    const [followingList, setFollowingList] = useState<{ id: number; name: string; avatar_id?: string }[]>([]);


    useEffect(() => {
    const timer = setTimeout(() => {
      const token = Cookies.get("token");
      if (!token) {
        router.push("/login");
        return;
      }
      let id: number;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        id = parseInt(payload.sub);
      } catch {
        router.push("/login");
        return;
      }
      setViewerUserId(id);

      const queryUserId = Number(searchParams.get("user"));
      const targetUserId = Number.isFinite(queryUserId) && queryUserId > 0 ? queryUserId : id;
      setProfileUserId(targetUserId);

      async function fetchUser(user_id: number) {
        try {
          const resp = await api.get(`/v1/users/${user_id}`);
          setUserName(resp.data.name);
          setAvatarId(resp.data.avatar_id);
          setCoverId(resp.data.cover_id);
          setBio(resp.data.bio || "");
          setPronouns(resp.data.pronouns || "");
          setFavoriteGenres(resp.data.favorite_genres || "");
          setIsFollowing(resp.data.is_following ?? false);
          setFollowersCount(resp.data.followers_count ?? 0);
          setFollowingCount(resp.data.following_count ?? 0);
        } catch {
          setUserName("");
        } finally {
          setChecked(true);
        }
      }
      fetchUser(targetUserId);
      fetchReviews(targetUserId);
      if (targetUserId === id) {
        fetchWatchlist();
      } else {
        setWatchlist([]);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [router, searchParams]);

    useEffect(() => {
      const el = reviewsScrollRef.current;
      if (!el) return;
      function check() {
        if (!el) return;
        setReviewsCanScrollLeft(el.scrollLeft > 1);
        setReviewsCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
      }
      const ro = new ResizeObserver(() => requestAnimationFrame(check));
      ro.observe(el);
      el.addEventListener("scroll", check);
      return () => { ro.disconnect(); el.removeEventListener("scroll", check); };
    }, [reviews, movieInfo]);

    useEffect(() => {
      const el = watchlistScrollRef.current;
      if (!el) return;
      function check() {
        if (!el) return;
        setWatchlistCanScrollLeft(el.scrollLeft > 1);
        setWatchlistCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
      }
      const ro = new ResizeObserver(() => requestAnimationFrame(check));
      ro.observe(el);
      el.addEventListener("scroll", check);
      return () => { ro.disconnect(); el.removeEventListener("scroll", check); };
    }, [watchlist, movieInfo]);

    const isOwnProfile = viewerUserId !== null && profileUserId === viewerUserId;


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
          toast.error("Erro ao excluir crítica.");
      }
    }


    async function handleUpdateReview(reviewId:number) {
      try {
        await api.patch(`/v1/reviews/${reviewId}`, {
          rating: parseFloat(editRating),
          comment: editComment || undefined,
        });
        setEditingReviewId(null);
        if (profileUserId) {
          fetchReviews(profileUserId);
        }
        toast.success("Crítica atualizada!");
      }catch {
        toast.error("Erro ao atualizar crítica.")
      }
    }


    async function handleRemoveWatchlist(itemId: number) {
      try{
          await api.delete(`/v1/watchlist/${itemId}`);
          setWatchlist(watchlist.filter((w) => w.id !== itemId));
      }catch{
          toast.error("Erro ao remover da lista.");
      }
    }


    async function handleUpdateWatchlistStatus(itemId: number, newStatus: string) {
      try {
        await api.patch(`/v1/watchlist/${itemId}`, { status: newStatus });
        setWatchlist(watchlist.map((w) => 
          w.id === itemId ? { ...w, status: newStatus as WatchlistItem["status"] } : w
        ));
        toast.success("Status atualizado!");
      } catch {
        toast.error("Erro ao atualizar status.");
      }
    }

    async function handleDeleteProfile() {
      if (!viewerUserId) {
        toast.error("Não foi possível excluir o perfil.");
        return;
      }

      setDeletingProfile(true);
      try {
        await api.delete(`/v1/users/${viewerUserId}`);
        Cookies.remove("token");
        setDeleteOpen(false);
        router.push("/login");
      } catch {
        toast.error("Não foi possível excluir o perfil.");
      } finally {
        setDeletingProfile(false);
      }
    }


    async function handleFollow() {
      if (!profileUserId) return;
      setFollowLoading(true);
      try {
        if (isFollowing) {
          const resp = await api.delete(`/v1/users/${profileUserId}/follow`);
          setIsFollowing(resp.data.is_following);
          setFollowersCount(resp.data.followers_count);
        } else {
          const resp = await api.post(`/v1/users/${profileUserId}/follow`);
          setIsFollowing(resp.data.is_following);
          setFollowersCount(resp.data.followers_count);
        }
      } catch {
        toast.error("Não foi possível atualizar o follow.");
      } finally {
        setFollowLoading(false);
      }
    }

    async function fetchFollowers() {
      if (!profileUserId) return;
      try {
        const resp = await api.get(`/v1/users/${profileUserId}/followers`);
        const list = Array.isArray(resp.data) ? resp.data : (resp.data?.data ?? []);
        setFollowersList(list);
      } catch {
        setFollowersList([]);
      }
    }

    async function fetchFollowing() {
      if (!profileUserId) return;
      try {
        const resp = await api.get(`/v1/users/${profileUserId}/following`);
        const list = Array.isArray(resp.data) ? resp.data : (resp.data?.data ?? []);
        setFollowingList(list);
      } catch {
        setFollowingList([]);
      }
    }

    if (!checked) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
      );


    return (
    <div className="min-h-screen bg-background">
      <NavBar showBack showLogout />

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
              <h2 className="text-2xl sm:text-4xl font-bold">{userName || `User #${profileUserId}`}</h2>
              {pronouns && <p className="text-muted-foreground text-base mt-1">{pronouns}</p>}
            </div>
            {isOwnProfile && viewerUserId !== null ? (
              <div className="flex items-center gap-2">
                <EditProfileDialog
                  userId={viewerUserId}
                  currentName={userName}
                  currentBio={bio}
                  currentPronouns={pronouns}
                  currentGenres={favoriteGenres}
                  currentAvatarId={avatarId}
                  currentCoverId={coverId}
                  onSave={handleEditSave}
                />
                <Button
                  type="button"
                  variant="destructive"
                  className="h-10"
                  onClick={() => setDeleteOpen(true)}
                >
                  Excluir Perfil
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant={isFollowing ? "outline" : "default"}
                className="h-10 px-6 font-semibold"
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? "..." : isFollowing ? "Seguindo ✓" : "Seguir"}
              </Button>
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
          <div className="flex items-center gap-6 pt-2 flex-wrap">
            <div>
              <p className="text-3xl font-bold">{reviews.length}</p>
              <p className="text-sm text-muted-foreground uppercase tracking-widest mt-0.5">Críticas</p>
            </div>
            {isOwnProfile && (
              <>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="text-3xl font-bold">{watchlist.length}</p>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest mt-0.5">Lista</p>
                </div>
              </>
            )}
            <div className="w-px h-10 bg-border" />
            <button
              type="button"
              className="text-left hover:opacity-70 transition-opacity"
              onClick={() => { setFollowersOpen(true); fetchFollowers(); }}
            >
              <p className="text-3xl font-bold">{followersCount}</p>
              <p className="text-sm text-muted-foreground uppercase tracking-widest mt-0.5">Seguidores</p>
            </button>
            <div className="w-px h-10 bg-border" />
            <button
              type="button"
              className="text-left hover:opacity-70 transition-opacity"
              onClick={() => { setFollowingOpen(true); fetchFollowing(); }}
            >
              <p className="text-3xl font-bold">{followingCount}</p>
              <p className="text-sm text-muted-foreground uppercase tracking-widest mt-0.5">Seguindo</p>
            </button>
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold">{isOwnProfile ? "Minhas Críticas" : "Críticas"}</h3>
            <span className="text-sm text-muted-foreground">{reviews.length} críticas</span>
          </div>
          {reviews.length === 0 && <p className="text-muted-foreground text-base">Sem críticas ainda.</p>}
          <div className="relative group/reviews">
            <div
              className={`absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-start cursor-pointer bg-gradient-to-r from-background/90 to-transparent transition-opacity ${reviewsCanScrollLeft ? 'group-hover/reviews:opacity-100' : ''} opacity-0`}
              onClick={() => reviewsScrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
            >
              <span className="ml-2 text-[2rem] text-zinc-400 hover:text-zinc-300 leading-none">‹</span>
            </div>
            <div
              className={`absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-end cursor-pointer bg-gradient-to-l from-background/90 to-transparent transition-opacity ${reviewsCanScrollRight ? 'group-hover/reviews:opacity-100' : ''} opacity-0`}
              onClick={() => reviewsScrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
            >
              <span className="mr-2 text-[2rem] text-zinc-400 hover:text-zinc-300 leading-none">›</span>
            </div>
            <div ref={reviewsScrollRef} className="overflow-x-auto overflow-y-visible py-2 snap-x snap-mandatory scrollbar-hide">
              <div className="flex gap-4 w-max">
                {reviews.map((review) => (
                  <div key={review.id} className="flex-shrink-0 w-44 sm:w-52 snap-start rounded-xl overflow-hidden border border-border/50 bg-card">
                    {editingReviewId === review.id ? (
                      <div className="p-3 space-y-2">
                        <input
                          type="number" min="0" max="10" step="0.1"
                          value={editRating}
                          onChange={(e) => setEditRating(e.target.value)}
                          className="w-full px-2 py-1 rounded-md border border-input bg-background text-sm"
                          placeholder="Nota (0-10)"
                        />
                        <textarea
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="w-full px-2 py-1 rounded-md border border-input bg-background text-sm min-h-16"
                          placeholder="Comentário (opcional)"
                          autoComplete="off"
                        />
                        <div className="flex gap-1">
                          <Button size="sm" className="h-8 flex-1" onClick={() => handleUpdateReview(review.id)}>Salvar</Button>
                          <Button size="sm" variant="ghost" className="h-8 flex-1" onClick={() => setEditingReviewId(null)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="relative cursor-pointer" onClick={() => router.push(`/reviews?movie=${review.tmdb_movie_id}&user=${profileUserId}`)}>
                          {movieInfo[review.tmdb_movie_id]?.poster ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w342${movieInfo[review.tmdb_movie_id].poster}`}
                              alt={movieInfo[review.tmdb_movie_id]?.title}
                              className="w-full aspect-[2/3] object-cover"
                            />
                          ) : (
                            <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center text-muted-foreground text-sm">Sem imagem</div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent px-3 pb-3 pt-10">
                            <p className="text-white text-base font-bold line-clamp-2 leading-tight">{movieInfo[review.tmdb_movie_id]?.title || `Movie #${review.tmdb_movie_id}`}</p>
                            <p className="text-yellow-400 text-base font-semibold mt-1">⭐ {review.rating}/10</p>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground px-3 py-2 overflow-hidden break-words">
                            {review.comment.slice(0, 60)}{review.comment.length > 60 ? "..." : ""}
                          </p>
                        )}
                        {isOwnProfile && (
                          <div className="flex gap-2 px-3 pb-3">
                            <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => {
                              setEditingReviewId(review.id);
                              setEditRating(String(review.rating));
                              setEditComment(review.comment || "");
                            }}>Editar</Button>
                            <Button size="sm" variant="destructive" className="text-xs h-7 flex-1" onClick={() => handleDeleteReview(review.id)}>Excluir</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Watchlist */}
        {isOwnProfile && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">Minha Lista</h3>
              <span className="text-sm text-muted-foreground">{watchlist.length} filmes</span>
            </div>
            {watchlist.length === 0 && <p className="text-muted-foreground text-base">Lista vazia.</p>}
            <div className="relative group/watchlist">
              <div
                className={`absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-start cursor-pointer bg-gradient-to-r from-background/90 to-transparent transition-opacity ${watchlistCanScrollLeft ? 'group-hover/watchlist:opacity-100' : ''} opacity-0`}
                onClick={() => watchlistScrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
              >
                <span className="ml-2 text-[2rem] text-zinc-400 hover:text-zinc-300 leading-none">‹</span>
              </div>
              <div
                className={`absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-end cursor-pointer bg-gradient-to-l from-background/90 to-transparent transition-opacity ${watchlistCanScrollRight ? 'group-hover/watchlist:opacity-100' : ''} opacity-0`}
                onClick={() => watchlistScrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
              >
                <span className="mr-2 text-[2rem] text-zinc-400 hover:text-zinc-300 leading-none">›</span>
              </div>
              <div ref={watchlistScrollRef} className="overflow-x-auto overflow-y-visible py-2 snap-x snap-mandatory scrollbar-hide">
                <div className="flex gap-4 w-max">
                  {watchlist.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-44 sm:w-52 snap-start rounded-xl border border-border/50 overflow-hidden bg-card">
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
                        >Sem imagem</div>
                      )}
                      <div className="p-3 space-y-2">
                        <p className="text-base font-semibold line-clamp-1">{movieInfo[item.tmdb_movie_id]?.title || `Movie #${item.tmdb_movie_id}`}</p>
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateWatchlistStatus(item.id, e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-sm"
                        >
                          <option value="want_to_watch">Quero assistir</option>
                          <option value="watching">Assistindo</option>
                          <option value="watched">Assistido</option>
                          <option value="dropped">Abandonado</option>
                        </select>
                        <Button variant="destructive" size="sm" className="w-full text-sm h-8" onClick={() => handleRemoveWatchlist(item.id)}>
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Perfil</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir seu perfil?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deletingProfile}>
              Não
            </Button>
            <Button variant="destructive" onClick={handleDeleteProfile} disabled={deletingProfile}>
              {deletingProfile ? "Excluindo..." : "Sim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Followers dialog */}
      <Dialog open={followersOpen} onOpenChange={setFollowersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seguidores</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="space-y-1 max-h-80 overflow-y-auto -mx-2">
            {followersList.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Nenhum seguidor ainda.</p>
            ) : (
              followersList.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { setFollowersOpen(false); router.push(`/profile?user=${u.id}`); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className={`w-9 h-9 rounded-full ${getAvatarBg(u.avatar_id ?? null)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm">{u.name}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following dialog */}
      <Dialog open={followingOpen} onOpenChange={setFollowingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seguindo</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="space-y-1 max-h-80 overflow-y-auto -mx-2">
            {followingList.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Não está seguindo ninguém ainda.</p>
            ) : (
              followingList.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { setFollowingOpen(false); router.push(`/profile?user=${u.id}`); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className={`w-9 h-9 rounded-full ${getAvatarBg(u.avatar_id ?? null)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm">{u.name}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  );
}