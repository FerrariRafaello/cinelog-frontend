"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogoutDialog } from "@/components/LogoutDialog";

interface NavBarProps {
  showBack?: boolean;
  showLogout?: boolean;
}

export function NavBar({ showBack = false, showLogout = false }: NavBarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-border px-4 sm:px-8 py-3 sm:py-4 grid grid-cols-3 items-center">
      {/* Esquerda */}
      <div className="min-w-0">
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
            Back
          </button>
        ) : (
          <p className="text-[10px] sm:text-xs text-white leading-tight line-clamp-2">
            Plataforma criada para portfolio, sem fins lucrativos.{" "}
            <span className="hidden sm:inline">Desenvolvedor: </span>
            <strong className="text-primary">Rafaello Ferrari</strong>
          </p>
        )}
      </div>

      {/* Centro */}
      <div className="flex justify-center">
        <h1
          className="text-xl sm:text-2xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push("/")}
        >
          CritCine
        </h1>
      </div>

      {/* Direita */}
      <div className="flex justify-end items-center gap-2">
        {/* Desktop — só aparece em lg+ */}
        <div className="hidden lg:flex items-center gap-2">
          <Button variant="ghost" className="rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium hover:border-primary hover:bg-card transition-colors" onClick={() => router.push("/")}>Home</Button>
          <Button variant="ghost" className="rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium hover:border-primary hover:bg-card transition-colors" onClick={() => router.push("/profile")}>Profile</Button>
          <Button variant="ghost" className="rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium hover:border-primary hover:bg-card transition-colors" onClick={() => router.push("/reviews")}>Reviews</Button>
          {showLogout && <LogoutDialog />}
        </div>

        {/* Mobile/tablet — hambúrguer até lg */}
        <div className="relative lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-card/80 text-foreground hover:border-primary transition-colors"
            aria-label="Menu"
          >
            ☰
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 flex flex-col gap-1 rounded-xl border border-border bg-card shadow-xl p-2 min-w-36">
              <button className="px-4 py-2 text-sm text-left rounded-lg hover:bg-muted" onClick={() => { router.push("/"); setMenuOpen(false); }}>Home</button>
              <button className="px-4 py-2 text-sm text-left rounded-lg hover:bg-muted" onClick={() => { router.push("/profile"); setMenuOpen(false); }}>Profile</button>
              <button className="px-4 py-2 text-sm text-left rounded-lg hover:bg-muted" onClick={() => { router.push("/reviews"); setMenuOpen(false); }}>Reviews</button>
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
