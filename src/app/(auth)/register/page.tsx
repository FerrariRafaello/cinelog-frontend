"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: "",
        age: "",
        email: "",
        cpf: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Weak: < 8 chars or no letters | Medium: 8+ chars with digits | Strong: 10+ with uppercase and special char
    function getPasswordStrength(pwd: string): { label: string; color: string } {
      if (pwd.length === 0) return { label: "", color: "" };
      if (pwd.length < 8 || !/[a-zA-Z]/.test(pwd))
        return { label: "Weak", color: "text-red-500" };
      if (
        pwd.length >= 10 &&
        /[0-9]/.test(pwd) &&
        /[A-Z]/.test(pwd) &&
        /[^a-zA-Z0-9]/.test(pwd)
      )
        return { label: "Strong", color: "text-green-500" };
      if (pwd.length >= 8 && /[0-9]/.test(pwd))
        return { label: "Medium", color: "text-yellow-500" };
      return { label: "Weak", color: "text-red-500" };
    }

    function formatCPF(value: string): string {
      return value
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    // Standard Brazilian CPF check-digit validation
    function validateCPF(cpf: string): boolean {
      cpf = cpf.replace(/\D/g, "");
      if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
      let rest = (sum * 10) % 11;
      if (rest === 10 || rest === 11) rest = 0;
      if (rest !== parseInt(cpf[9])) return false;
      sum = 0;
      for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
      rest = (sum * 10) % 11;
      if (rest === 10 || rest === 11) rest = 0;
      return rest === parseInt(cpf[10]);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      if (e.target.name === "cpf") {
        setForm({ ...form, cpf: formatCPF(e.target.value) });
      } else {
        setForm({ ...form, [e.target.name]: e.target.value });
      }
    }

    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        // Show the terms modal first if the user hasn't accepted yet
        if (!termsAccepted) {
          setShowTerms(true);
          setLoading(false);
          return;
        }
        setLoading(true);
        setError("");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
          setError("Please enter a valid email address.");
          setLoading(false);
          return;
        }

        if (form.name.trim().length < 2) {
          setError("Name must be at least 2 characters.");
          setLoading(false);
          return;
        }

        const parsedAge = form.age ? Number.parseInt(form.age, 10) : undefined;

        if (getPasswordStrength(form.password).label === "Weak") {
          setError("Password is too weak. Use at least 8 characters including letters.");
          setLoading(false);
          return;
        }

        if (form.cpf && !validateCPF(form.cpf)) {
          setError("Please enter a valid CPF.");
          setLoading(false);
          return;
        }

        try {
            await register({
                name: form.name,
                ...(parsedAge !== undefined ? { age: parsedAge } : {}),
                email: form.email,
                password: form.password,
                ...(form.cpf.replace(/\D/g, "").length === 11 ? { cpf: form.cpf.replace(/\D/g, "") } : {}),
            });
            router.push("/login");
        } catch (error: any) {
            const status = error?.response?.status;
            const apiMessage = error?.response?.data?.error?.message;

            if (status === 409) {
              setError("Email or CPF already registered.");
            } else if (status === 422) {
              setError(apiMessage || "Invalid registration data. Please review your information.");
            } else {
              setError("Error creating account. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,oklch(0.75_0.15_55_/_0.18),transparent_45%),radial-gradient(circle_at_15%_65%,oklch(0.65_0.12_200_/_0.18),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,oklch(0.08_0.005_285_/_0.92)_70%)]" />

      <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md p-7 sm:p-8 space-y-6 rounded-2xl border border-border/70 bg-card/85 backdrop-blur-md shadow-2xl">
        <div className="text-center space-y-1">
          <p className="text-xs uppercase tracking-[0.24em] text-primary/80">Join the club</p>
          <h1 className="text-4xl font-bold tracking-tight">CritCine</h1>
          <p className="text-muted-foreground mt-1 text-base">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-3 rounded-lg border border-border/80 bg-background/80 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Your name"
              required
              minLength={2}
              maxLength={50}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Age <span className="text-muted-foreground text-xs">(optional)</span></label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-3 rounded-lg border border-border/80 bg-background/80 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Your age"
              min={1}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-3 rounded-lg border border-border/80 bg-background/80 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="your@email.com"
              required
            />
            {form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
              <p className="text-xs mt-1 text-red-500">Please enter a valid email address.</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">CPF <span className="text-muted-foreground text-xs">(optional)</span></label>
            <input
              type="text"
              name="cpf"
              value={form.cpf}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-3 rounded-lg border border-border/80 bg-background/80 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-3 rounded-lg border border-border/80 bg-background/80 text-base focus:outline-none focus:ring-2 focus:ring-ring pr-16"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {form.password && (
              <p className={`text-xs mt-1 ${getPasswordStrength(form.password).color}`}>
                Password strength: {getPasswordStrength(form.password).label}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
      </div>
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold">Termos de Uso</h2>
            <div className="max-h-48 overflow-y-auto text-sm text-muted-foreground leading-relaxed pr-1">
              <p>
                CritCine é uma plataforma para Reviews e Streaming gratuito de filmes,
                criada para portfólio, desenvolvida por único programador e sem fins lucrativos.
                Qualquer que seja a forma que você utilizar será de sua responsabilidade.
              </p>
              <p className="mt-3">
                Ao criar uma conta você concorda que o CritCine não se responsabiliza
                pelo uso indevido da plataforma, pelo conteúdo de terceiros exibido,
                nem por qualquer dano direto ou indireto decorrente do uso.
              </p>
              <p className="mt-3">
                Esta plataforma não hospeda conteúdo. Todos os dados de filmes vêm
                da API pública do TMDB.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4"
              />
              Li e concordo com os termos de uso
            </label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { setShowTerms(false); setTermsAccepted(false); }}
              >
                Recusar
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!termsAccepted}
                onClick={() => {
                  setShowTerms(false);
                  handleSubmit({ preventDefault: () => {} } as any);
                }}
              >
                Aceitar e criar conta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}