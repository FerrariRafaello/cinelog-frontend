"use client";

//IMPORTS
import {useState} from "react";
import {useRouter} from "next/navigation";
import {login} from "@/lib/auth";
import {Button} from "@/components/ui/button"


export default function LoginPage() {
    const router=useRouter();
    const [email, setEmail]=useState("");
    const [password, setPassword]=useState("");
    const [error, setError]=useState("");
    const [loading, setLoading]=useState(false);

    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await login(email, password);
            router.push("/");
        } catch (error: unknown) {
          setError(error instanceof Error ? error.message : "E-mail or password incorrect.")
        } finally {
            setLoading(false);
        }
    }
    return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,oklch(0.84_0.16_55_/_0.28),transparent_48%),radial-gradient(circle_at_80%_30%,oklch(0.78_0.14_200_/_0.26),transparent_48%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,oklch(0.18_0.015_285_/_0.35),oklch(0.10_0.008_285_/_0.55)_72%)]" />

      <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md p-7 sm:p-8 space-y-6 rounded-2xl border border-border/70 bg-card/92 backdrop-blur-md shadow-2xl">
          <div className="text-center space-y-1">
            <p className="text-xs uppercase tracking-[0.24em] text-primary/80">Welcome back</p>
            <h1 className="text-4xl font-bold tracking-tight">Cinelog</h1>
            <p className="text-muted-foreground mt-1 text-base">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-3 py-3 rounded-lg border border-border/80 bg-background/80 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-3 py-3 rounded-lg border border-border/80 bg-background/80 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? "Initiating..." : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have account?{" "}
            <a href="/register" className="text-primary hover:underline font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}