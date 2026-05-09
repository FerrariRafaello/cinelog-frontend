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
        } catch{
            setError("E-mail or password incorrect.")
        } finally {
            setLoading(false);
        }
    }
    return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Cinelog</h1>
          <p className="text-muted-foreground mt-1">Sing in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
              className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Initiating..." : "Sing in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have account?{" "}
          <a href="/register" className="text-primary hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}