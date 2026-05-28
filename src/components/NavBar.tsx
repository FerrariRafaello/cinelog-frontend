"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { LogoutDialog } from "@/components/LogoutDialog";
import { NotificationPanel } from "@/components/NotificationPanel";

function getMyUserId(): number | null {
  try {
    const token = Cookies.get("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return parseInt(payload.sub);
  } catch {
    return null;
  }
}

interface NavBarProps {
  showBack?: boolean;
  showLogout?: boolean;
}

export function NavBar({ showBack = false, showLogout = false }: NavBarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    // flex layout: left and right are flex-1, center is flex-shrink-0 so the logo never gets squished
    <nav className="border-b border-border px-4 sm:px-8 py-3 sm:py-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        {showBack ? (
          <button
            onClick={() => router.back()}
            className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-2 py-2 pr-4 text-sm font-semibold hover:border-primary hover:bg-card transition-colors"
          >
            <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-6 -translate-x-[2px]">
                <path d="M14.5 18L8 11L14.5 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            Voltar
          </button>
        ) : (
          <p className="text-[10px] sm:text-xs text-white leading-tight line-clamp-2">
            Plataforma criada para portfolio, sem fins lucrativos.{" "}
            <span className="hidden sm:inline">Desenvolvedor: </span>
            <a
              href="https://www.linkedin.com/in/rafaello-ferrari-0ba87a349/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 font-bold hover:underline transition-colors"
            >
              Rafaello Ferrari
            </a>
          </p>
        )}
      </div>

      <div className="flex-shrink-0">
        <h1
          className="text-xl sm:text-2xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push("/")}
        >
          CritCine
        </h1>
      </div>

      <div className="flex-1 flex justify-end items-center gap-2">
        {/* Desktop nav — hidden below xl where the hamburger takes over */}
        <div className="hidden xl:flex items-center gap-1.5">
          <Button variant="ghost" className="rounded-full border border-border/70 bg-card/80 px-3 py-2 text-sm font-medium hover:border-primary hover:bg-card transition-colors" onClick={() => {
            if (window.location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              router.push("/");
            }
          }}>Home</Button>
          <Button variant="ghost" className="rounded-full border border-border/70 bg-card/80 px-3 py-2 text-sm font-medium hover:border-primary hover:bg-card transition-colors" onClick={() => { const id = getMyUserId(); router.push(id ? `/profile?user=${id}` : "/profile"); }}>Perfil</Button>
          <Button variant="ghost" className="rounded-full border border-border/70 bg-card/80 px-3 py-2 text-sm font-medium hover:border-primary hover:bg-card transition-colors" onClick={() => router.push("/reviews")}>Reviews</Button>
          <Button variant="ghost" className="rounded-full border border-border/70 bg-card/80 px-3 py-2 text-sm font-medium hover:border-primary hover:bg-card transition-colors" onClick={() => router.push("/reviews?mode=following")}>Seguindo</Button>
          {showLogout && <NotificationPanel />}
          {showLogout && <LogoutDialog />}
        </div>

        {/* Mobile notification bell — visível apenas quando logado */}
        {showLogout && (
          <div className="xl:hidden">
            <NotificationPanel />
          </div>
        )}

        {/* Mobile/tablet — hambúrguer até xl */}
        <div className="relative xl:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-card/80 text-foreground hover:border-primary transition-colors"
            aria-label="Menu"
          >
            ☰
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 flex flex-col gap-1 rounded-xl border border-border bg-card shadow-xl p-2 min-w-40">
              <button className="px-4 py-2.5 text-sm text-left rounded-lg hover:bg-muted" onClick={() => {
                setMenuOpen(false);
                if (window.location.pathname === "/") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  router.push("/");
                }
              }}>Home</button>
              <button className="px-4 py-2.5 text-sm text-left rounded-lg hover:bg-muted" onClick={() => { const id = getMyUserId(); router.push(id ? `/profile?user=${id}` : "/profile"); setMenuOpen(false); }}>Perfil</button>
              <button className="px-4 py-2.5 text-sm text-left rounded-lg hover:bg-muted" onClick={() => { router.push("/reviews"); setMenuOpen(false); }}>Reviews</button>
              <button className="px-4 py-2.5 text-sm text-left rounded-lg hover:bg-muted" onClick={() => { router.push("/reviews?mode=following"); setMenuOpen(false); }}>Seguindo</button>
              {showLogout && (
                <div className="px-2 pt-1 border-t border-border mt-1">
                  <LogoutDialog />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
