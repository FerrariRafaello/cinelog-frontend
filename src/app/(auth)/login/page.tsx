"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const LINKEDIN = "https://www.linkedin.com/in/rafaello-ferrari-0ba87a349/";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface TrendingMovie {
  id: number;
  title: string;
  poster_path?: string;
  vote_average: number;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<TrendingMovie[]>([]);

  // Fetch trending without auth interceptor to avoid redirect loop on the login page
  useEffect(() => {
    fetch(`${API_URL}/v1/tmdb/trending`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setTrending((data.results ?? []).slice(0, 20)))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/");
    } catch {
      setError("E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">

      {/* ── Background igual ao register ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,oklch(0.75_0.15_55_/_0.35),transparent_45%),radial-gradient(circle_at_15%_65%,oklch(0.65_0.12_200_/_0.35),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,oklch(0.08_0.005_285_/_0.92)_70%)]" />
      </div>

      {/* ──────────────────────────────────────────────
          HERO + LOGIN FORM
      ────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex flex-col">

        {/* Header */}
        <header className="flex items-center px-8 sm:px-14 pt-7 pb-4">
          <a href="/" className="text-primary text-3xl sm:text-4xl font-black tracking-tight leading-none">
            CritCine
          </a>
        </header>

        {/* Hero content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
          <p className="text-primary text-xs sm:text-sm uppercase tracking-[0.3em] font-bold mb-5">
            Cinema · Crítica · Comunidade
          </p>

          <h1 className="text-white text-4xl sm:text-5xl lg:text-[3.75rem] font-black tracking-tight leading-[1.08] text-balance mb-5">
            Descubra. Avalie.<br className="hidden sm:block" /> Compartilhe.
          </h1>

          <p className="text-white/55 text-base sm:text-xl max-w-lg leading-relaxed mb-10">
            O espaço gratuito para amantes de cinema escreverem críticas e descobrirem novos filmes.
          </p>

          {/* Login card */}
          <div className="w-full max-w-sm sm:max-w-[430px] bg-card/85 backdrop-blur-md rounded-2xl border border-border/70 px-8 sm:px-12 py-9 space-y-5 text-left shadow-2xl">
            <h2 className="text-white text-2xl sm:text-3xl font-bold">Entrar</h2>

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-white/80">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-3 rounded-lg border border-border/80 bg-background/80 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-white/80">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mt-1 px-3 py-3 rounded-lg border border-border/80 bg-background/80 text-base focus:outline-none focus:ring-2 focus:ring-ring pr-16"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm sm:text-base text-orange-400 bg-orange-400/10 border border-orange-400/25 rounded-lg px-3 py-2.5 leading-snug">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base sm:text-lg font-bold rounded-lg mt-1"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-foreground text-xs">ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <p className="text-[#999] text-sm sm:text-base text-center">
              Novo no CritCine?{" "}
              <a href="/register" className="text-white font-bold hover:underline">
                Crie sua conta.
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          TRENDING MOVIES
      ────────────────────────────────────────────── */}
      {trending.length > 0 && (
        <>
          <div className="relative z-10 h-px bg-white/10" />
          <section className="relative z-10 py-14 sm:py-18 px-8 sm:px-14">
            <h2 className="text-white text-2xl sm:text-3xl font-bold mb-1.5">Em Alta Esta Semana</h2>
            <p className="text-white/50 text-base sm:text-xl mb-8">Os filmes mais assistidos do momento. Entre e dê sua opinião.</p>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-8 px-8 sm:-mx-14 sm:px-14">
              {trending.map((movie) => (
                <div
                  key={movie.id}
                  className="flex-shrink-0 w-32 sm:w-40 rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-primary/60 hover:-translate-y-2 hover:scale-[1.03] transition-all duration-200 cursor-default"
                >
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full aspect-[2/3] object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-white/25 text-xs">
                      sem imagem
                    </div>
                  )}
                  <div className="p-2.5 bg-[#111]">
                    <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2 leading-tight">{movie.title}</p>
                    <p className="text-yellow-400 text-xs mt-1 font-medium">⭐ {movie.vote_average.toFixed(1)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ──────────────────────────────────────────────
          FEATURES GRID
      ────────────────────────────────────────────── */}
      <div className="relative z-10 h-px bg-white/10" />
      <section className="relative z-10 py-16 sm:py-24 px-8 sm:px-14">
        <h2 className="text-white text-2xl sm:text-4xl font-bold text-center mb-2">Mais motivos para entrar</h2>
        <p className="text-white/50 text-base sm:text-xl text-center mb-12 sm:mb-16">
          Tudo o que você precisa para aproveitar o cinema ao máximo.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
          {[
            {
              icon: "🎬",
              title: "Explore filmes",
              desc: "Milhares de títulos de todos os gêneros. Veja o que está em cartaz, em alta no Brasil e o que é clássico.",
            },
            {
              icon: "⭐",
              title: "Escreva críticas",
              desc: "Avalie os filmes que você assistiu, escreva sua opinião e leia o que a comunidade está achando.",
            },
            {
              icon: "👥",
              title: "Siga amigos",
              desc: "Acompanhe as críticas de quem você segue e descubra novos filmes pelo gosto de quem você confia.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 sm:p-9 space-y-4 hover:border-primary/35 hover:bg-white/[0.065] transition-all duration-200"
            >
              <div className="text-5xl sm:text-6xl">{icon}</div>
              <h3 className="text-white text-xl sm:text-2xl font-bold">{title}</h3>
              <p className="text-white/60 text-base sm:text-lg leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          FAQ
      ────────────────────────────────────────────── */}
      <div className="relative z-10 h-px bg-white/10" />
      <section className="relative z-10 py-16 sm:py-24 px-8 sm:px-14 max-w-3xl mx-auto w-full">
        <h2 className="text-white text-2xl sm:text-4xl font-bold mb-10">Perguntas frequentes</h2>
        <div className="space-y-3">
          {[
            {
              q: "O CritCine é gratuito?",
              a: "Sim, completamente gratuito. Crie sua conta e comece agora, sem precisar de cartão de crédito.",
            },
            {
              q: "Preciso de cartão de crédito?",
              a: "Não. Nenhum dado financeiro é necessário para criar ou manter uma conta no CritCine.",
            },
            {
              q: "De onde vêm os dados dos filmes?",
              a: "Todos os dados de filmes vêm da API pública do TMDB (The Movie Database). Não hospedamos nenhum conteúdo.",
            },
            {
              q: "Posso excluir minha conta?",
              a: "Sim. Nas configurações do perfil você pode deletar sua conta e todos os seus dados a qualquer momento.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 sm:px-8 py-5 sm:py-6">
              <p className="text-white text-base sm:text-xl font-semibold mb-2">{q}</p>
              <p className="text-white/60 text-sm sm:text-lg leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          FOOTER
      ────────────────────────────────────────────── */}
      <div className="relative z-10 h-px bg-white/10" />
      <footer className="relative z-10 px-8 sm:px-14 py-4 space-y-1">
        <p className="text-white text-sm sm:text-base leading-relaxed">
          Desenvolvido por{" "}
          <a
            href={LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 font-bold hover:text-orange-300 hover:underline transition-colors"
          >
            Rafaello Ferrari
          </a>
          {" "}· Projeto de portfólio, sem fins lucrativos.
        </p>
        <p className="text-white/50 text-sm sm:text-base">
          Dados fornecidos pela API pública do{" "}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white underline transition-colors"
          >
            TMDB
          </a>
          . © {new Date().getFullYear()} CritCine.
        </p>
      </footer>

    </div>
  );
}
