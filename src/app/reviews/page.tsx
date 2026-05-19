"use client";

import Cookies from "js-cookie";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const MEDALS = ["🥇", "🥈", "🥉", "🏅", "🏅"];

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
  const [limit, setLimit] = useState(20);
  const [trending, setTrending] = useState<ReviewFull[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [feedMode, setFeedMode] = useState<"global" | "following">("global");
  const mostLikedRef = useRef<HTMLDivElement | null>(null);
  const [mostLikedCanScrollLeft, setMostLikedCanScrollLeft] = useState(false);
  const [mostLikedCanScrollRight, setMostLikedCanScrollRight] = useState(false);

  const isFiltering = searchUser.trim() !== "" || searchMovie.trim() !== "";
  const showTrending = !isFiltering && feedMode === "global";

  // Top reviewers derived from trending — aggregated by total likes
  const topReviewers = (() => {
    const map = new Map<number, { userId: number; name: string; totalLikes: number }>();
    for (const r of trending) {
      const ex = map.get(r.user_id);
      if (!ex) {
        map.set(r.user_id, { userId: r.user_id, name: r.user_name, totalLikes: r.likes });
      } else {
        ex.totalLikes += r.likes;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalLikes - a.totalLikes).slice(0, 5);
  })();

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const userFromUrl = searchParams.get("user");
    if (userFromUrl) {
      api.get(`/v1/users/${userFromUrl}`)
        .then((resp) => setSearchUser(resp.data.name || userFromUrl))
        .catch(() => setSearchUser(userFromUrl));
    }
    if (searchParams.get("mode") === "following") {
      setFeedMode("following");
    }
    setChecked(true);
  }, [router, searchParams]);

  useEffect(() => {
    if (!checked) return;
    fetchReviews();
  }, [checked, sort, searchUser, limit, feedMode]);

  useEffect(() => {
    if (!checked) return;
    fetchTrending();
  }, [checked]);

  useEffect(() => {
    const el = mostLikedRef.current;
    if (!el) return;
    function check() {
      if (!el) return;
      setMostLikedCanScrollLeft(el.scrollLeft > 8);
      setMostLikedCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    }
    el.addEventListener("scroll", check, { passive: true });
    requestAnimationFrame(check);
    return () => el.removeEventListener("scroll", check);
  }, [trending]);

  async function fetchTrending() {
    setLoadingTrending(true);
    try {
      const resp = await api.get("/v1/reviews/feed", { params: { sort: "popular", limit: 20 } });
      const data: ReviewFull[] = resp.data || [];
      setTrending(data);
      fetchMovieInfos(data.map((r) => r.tmdb_movie_id));
    } catch {
      setTrending([]);
    } finally {
      setLoadingTrending(false);
    }
  }

  async function fetchReviews() {
    setLoading(true);
    try {
      const params: any = { sort, limit };
      if (feedMode === "following") params.following_only = true;
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
    const current = [...reviews, ...trending].find((r) => r.id === reviewId);
    if (!current) return;
    const wasLiked = current.liked_by_me;
    try {
      if (wasLiked) {
        const resp = await api.delete(`/v1/reviews/${reviewId}/like`);
        const update = (r: ReviewFull) =>
          r.id === reviewId ? { ...r, likes: resp.data.likes ?? Math.max(0, r.likes - 1), liked_by_me: false } : r;
        setReviews((prev) => prev.map(update));
        setTrending((prev) => prev.map(update));
      } else {
        const resp = await api.post(`/v1/reviews/${reviewId}/like`);
        const update = (r: ReviewFull) =>
          r.id === reviewId ? { ...r, likes: resp.data.likes, liked_by_me: true } : r;
        setReviews((prev) => prev.map(update));
        setTrending((prev) => prev.map(update));
      }
    } catch {
      const update = (r: ReviewFull) =>
        r.id === reviewId ? { ...r, liked_by_me: !wasLiked, likes: wasLiked ? Math.max(0, r.likes - 1) : r.likes + 1 } : r;
      setReviews((prev) => prev.map(update));
      setTrending((prev) => prev.map(update));
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

  const spotlightReview = [...trending]
    .filter((r) => r.comment && r.comment.trim().length > 0)
    .sort((a, b) => b.likes - a.likes)[0];
  const spotlightMovie = spotlightReview ? movieInfos[spotlightReview.tmdb_movie_id] : null;
  const trendingWithComment = trending.filter((r) => r.comment && r.comment.trim().length > 0);

  return (
    <div className="min-h-screen bg-background">
      <NavBar showBack />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">

        {/* Trending Reviews Section — skeleton while loading */}
        {loadingTrending && showTrending && (
          <div className="space-y-6 border-b border-border/30 pb-8 mb-6 animate-pulse">
            <div className="h-7 w-52 bg-muted rounded-lg" />
            <div className="h-44 w-full bg-muted rounded-2xl" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 w-32 bg-muted rounded-xl" />)}
            </div>
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4].map((i) => <div key={i} className="flex-shrink-0 w-44 h-52 bg-muted rounded-2xl" />)}
            </div>
          </div>
        )}

        {/* Trending Reviews Section — content */}
        {!loadingTrending && trending.length > 0 && showTrending && (
          <section className="space-y-7 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-sm p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <h2 className="text-2xl font-bold tracking-tight">Trending Reviews</h2>
            </div>

            {/* Spotlight — #1 most liked review with a comment */}
            {spotlightReview && (
              <div className="relative rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 via-card/70 to-card/80 overflow-hidden shadow-lg">
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-500/40 rounded-full px-3 py-1.5 text-yellow-400 text-sm font-bold">
                    👑 Review Destaque
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-5 p-5 pt-14 sm:pt-5">
                  {spotlightMovie?.poster_path && (
                    <div className="flex-shrink-0 sm:pt-9">
                      <img
                        src={`https://image.tmdb.org/t/p/w154${spotlightMovie.poster_path}`}
                        alt={spotlightMovie.title}
                        className="w-24 sm:w-32 rounded-xl shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => router.push(`/movies/${spotlightReview.tmdb_movie_id}`)}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-3 sm:pt-9">
                    <button
                      type="button"
                      onClick={() => router.push(`/movies/${spotlightReview.tmdb_movie_id}`)}
                      className="text-xl font-bold hover:underline line-clamp-1 text-left"
                    >
                      {spotlightMovie?.title || `Movie #${spotlightReview.tmdb_movie_id}`}
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                        {spotlightReview.user_name.charAt(0).toUpperCase()}
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/profile?user=${spotlightReview.user_id}`)}
                        className="text-base font-bold text-primary hover:underline"
                      >
                        {spotlightReview.user_name}
                      </button>
                      <span className="bg-yellow-500/20 text-yellow-400 text-sm font-bold px-2.5 py-0.5 rounded-full border border-yellow-500/30">
                        ⭐ {spotlightReview.rating}/10
                      </span>
                    </div>
                    {spotlightReview.comment && (
                      <p className="text-base text-white/80 leading-relaxed line-clamp-3">
                        {spotlightReview.comment}
                      </p>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleLike(spotlightReview.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${spotlightReview.liked_by_me ? "border-primary text-primary bg-primary/10" : "border-border/70 bg-card/80 hover:border-primary/60"}`}
                      >
                        👍 {spotlightReview.likes} likes
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {new Date(spotlightReview.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Reviewers Leaderboard */}
            {topReviewers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top Reviewers</h3>
                <div className="flex flex-wrap gap-2">
                  {topReviewers.map((reviewer, idx) => (
                    <button
                      key={reviewer.userId}
                      type="button"
                      onClick={() => setSearchUser(reviewer.name)}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/50 bg-card/80 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      <span className="text-lg">{MEDALS[idx]}</span>
                      <span className="text-base font-bold">{reviewer.name}</span>
                      <span className="text-sm text-muted-foreground">👍 {reviewer.totalLikes}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Most Liked Reviews Carousel */}
            {trendingWithComment.length > 1 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Most Liked</h3>
                <div className="relative group/mostliked">
                  {/* Seta esquerda */}
                  <div
                    className={`absolute left-0 top-0 bottom-3 z-10 w-12 flex items-center justify-start cursor-pointer bg-gradient-to-r from-background/95 to-transparent transition-opacity duration-200 opacity-0 ${mostLikedCanScrollLeft ? "group-hover/mostliked:opacity-100" : "pointer-events-none"}`}
                    onClick={() => {
                      const el = mostLikedRef.current;
                      if (el) el.scrollBy({ left: -Math.max(el.clientWidth * 0.8, 240), behavior: "smooth" });
                    }}
                  >
                    <span className="ml-1 text-[2.6rem] font-normal text-zinc-200 leading-none select-none">‹</span>
                  </div>

                  {/* Seta direita */}
                  <div
                    className={`absolute right-0 top-0 bottom-3 z-10 w-12 flex items-center justify-end cursor-pointer bg-gradient-to-l from-background/95 to-transparent transition-opacity duration-200 opacity-0 ${mostLikedCanScrollRight ? "group-hover/mostliked:opacity-100" : "pointer-events-none"}`}
                    onClick={() => {
                      const el = mostLikedRef.current;
                      if (el) el.scrollBy({ left: Math.max(el.clientWidth * 0.8, 240), behavior: "smooth" });
                    }}
                  >
                    <span className="mr-1 text-[2.6rem] font-normal text-zinc-200 leading-none select-none">›</span>
                  </div>

                  {/* Container com scroll */}
                  <div ref={mostLikedRef} className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                    {trendingWithComment.slice(0, 10).map((review) => {
                      const movie = movieInfos[review.tmdb_movie_id];
                      return (
                        <div
                          key={review.id}
                          className="flex-shrink-0 w-52 rounded-2xl border border-border/40 bg-card/70 overflow-hidden hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                          onClick={() => router.push(`/movies/${review.tmdb_movie_id}`)}
                        >
                          {movie?.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                              alt={movie.title}
                              className="w-full h-32 object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-32 bg-muted flex items-center justify-center text-muted-foreground text-sm">No image</div>
                          )}
                          <div className="p-3 space-y-1.5">
                            <p className="font-bold text-base text-white line-clamp-1">{movie?.title || `#${review.tmdb_movie_id}`}</p>
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); router.push(`/profile?user=${review.user_id}`); }}
                                className="text-sm text-primary hover:underline truncate max-w-[70%]"
                              >
                                {review.user_name}
                              </button>
                              <span className="text-sm text-yellow-400 font-bold flex-shrink-0">⭐ {review.rating}</span>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">{review.comment}</p>
                            )}
                            <div className="flex items-center justify-end pt-1">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleLike(review.id); }}
                                className={`inline-flex items-center gap-1 text-xs border px-2 py-0.5 rounded-md transition-colors ${review.liked_by_me ? "border-primary text-primary bg-primary/10" : "border-border/50 hover:border-primary/60"}`}
                              >
                                👍 {review.likes}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Filter Bar — sticky after trending section */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 border-b border-border/40">
          {/* Feed mode tabs */}
          <div className="flex justify-center mb-3">
            <div className="flex gap-1 border border-border/50 rounded-full p-1 bg-card/80">
              {(["global", "following"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFeedMode(mode)}
                  className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${feedMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {mode === "global" ? "Global" : "Following"}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={handleSearch} className="flex flex-col gap-3 items-center justify-center w-full">
            <div className="flex gap-2 flex-shrink-0 flex-wrap justify-center">
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
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-2xl">
              <Input value={searchUser} onChange={(e) => setSearchUser(e.target.value)} placeholder="Search by username..." className="h-11 sm:h-14 text-sm sm:text-base" />
              <Input value={searchMovie} onChange={(e) => setSearchMovie(e.target.value)} placeholder="Search by movie..." className="h-11 sm:h-14 text-sm sm:text-base" />
              <Button type="submit" className="h-11 sm:h-14 px-5 sm:px-7 text-sm sm:text-base w-full sm:w-auto">Search</Button>
            </div>
          </form>
          {isFiltering && (
            <div className="flex justify-center mt-1.5">
              <button
                type="button"
                onClick={() => { setSearchUser(""); setSearchMovie(""); }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                ✕ Limpar filtros
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="mt-6 space-y-4 animate-pulse">
            {feedMode === "following" ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="h-4 w-32 bg-muted rounded-lg" />
                  </div>
                  <div className="flex gap-3">
                    {[1, 2, 3].map((j) => <div key={j} className="flex-shrink-0 w-40 h-48 bg-muted rounded-xl" />)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Loading reviews...</p>
            )}
          </div>
        )}

        {/* Following mode — agrupado por usuário */}
        {!loading && feedMode === "following" && (() => {
          const grouped: { userId: number; userName: string; userReviews: ReviewFull[] }[] = [];
          const seen = new Map<number, number>();
          for (const r of reviews) {
            const idx = seen.get(r.user_id);
            if (idx === undefined) {
              seen.set(r.user_id, grouped.length);
              grouped.push({ userId: r.user_id, userName: r.user_name, userReviews: [r] });
            } else {
              grouped[idx].userReviews.push(r);
            }
          }
          if (grouped.length === 0) return (
            <div className="text-center py-20 space-y-3 mt-6">
              <p className="text-5xl">👥</p>
              <p className="text-lg font-semibold">Nenhuma review por aqui</p>
              <p className="text-muted-foreground text-sm">Siga mais usuários para ver as reviews deles aqui.</p>
              <button type="button" onClick={() => setFeedMode("global")} className="text-sm text-primary hover:underline">
                Explorar reviews globais →
              </button>
            </div>
          );
          return (
            <div className="space-y-5 mt-6">
              {grouped.map(({ userId, userName, userReviews }) => (
                <div key={userId} className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-sm p-5 space-y-4">
                  {/* User header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-base flex-shrink-0">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => router.push(`/profile?user=${userId}`)}
                          className="font-bold text-base hover:underline text-left block leading-tight"
                        >
                          {userName}
                        </button>
                        <span className="text-xs text-muted-foreground">
                          {userReviews.length} review{userReviews.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/profile?user=${userId}`)}
                      className="text-sm text-primary hover:underline font-medium flex-shrink-0"
                    >
                      Ver perfil →
                    </button>
                  </div>

                  {/* Reviews — scroll horizontal */}
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {userReviews.map((review) => {
                      const movie = movieInfos[review.tmdb_movie_id];
                      return (
                        <div
                          key={review.id}
                          className="flex-shrink-0 w-44 rounded-xl border border-border/40 bg-card/60 overflow-hidden hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                          onClick={() => router.push(`/movies/${review.tmdb_movie_id}`)}
                        >
                          {movie?.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                              alt={movie.title}
                              className="w-full h-28 object-cover"
                            />
                          ) : (
                            <div className="w-full h-28 bg-muted flex items-center justify-center text-muted-foreground text-xs">No image</div>
                          )}
                          <div className="p-3 space-y-1.5">
                            <p className="font-semibold text-sm line-clamp-1">{movie?.title || `Movie #${review.tmdb_movie_id}`}</p>
                            <span className="inline-block bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">
                              ⭐ {review.rating}/10
                            </span>
                            {review.comment && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{review.comment}</p>
                            )}
                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString("pt-BR")}</span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleLike(review.id); }}
                                className={`inline-flex items-center gap-1 text-xs border px-2 py-0.5 rounded-md transition-colors ${review.liked_by_me ? "border-primary text-primary bg-primary/10" : "border-border/50 hover:border-primary/60"}`}
                              >
                                👍 {review.likes}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Global mode — masonry flat feed */}
        {!loading && feedMode === "global" && (
          <>
            {reviews.length === 0 && (
              <p className="text-muted-foreground text-sm mt-6">No reviews found.</p>
            )}
            <div className="max-w-5xl mx-auto [column-count:1] md:[column-count:2] [column-gap:1rem] mt-6">
              {reviews.filter((r) => r.comment && r.comment.trim().length > 0).map((review) => {
                const movie = movieInfos[review.tmdb_movie_id];
                return (
                  <div
                    key={review.id}
                    className="flex gap-4 p-4 mb-4 rounded-2xl border border-border/40 bg-card/70 shadow-md hover:shadow-lg hover:border-border/80 transition-all duration-200 [break-inside:avoid]"
                  >
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
                          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${review.liked_by_me ? "border-primary text-primary bg-primary/10" : "border-border/70 bg-card/70 hover:border-primary/60"}`}
                        >
                          👍 {review.likes}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {reviews.length === limit && (
              <div className="flex justify-center pt-4 pb-8">
                <Button variant="outline" onClick={() => setLimit((prev) => prev + 20)} className="px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Carregar mais
                </Button>
              </div>
            )}
          </>
        )}
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
