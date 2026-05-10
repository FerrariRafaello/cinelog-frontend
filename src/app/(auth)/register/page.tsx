"use client";

//IMPORTS
import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth";
import { Button } from "@/components/ui/button"


export default function RegisterPage() {
    const router=useRouter();
    const [form, setForm]=useState({
        name:"",
        age:"",
        email:"",
        cpf:"",
        password:"",
    });
    const [error, setError]=useState("");
    const [loading, setLoading]=useState(false);
    const [showPassword, setShowPassword]=useState(false);

    function getPasswordStrength(pwd: string): { label: string; color: string } {
      if (pwd.length === 0) return { label: "", color: "" };
      if (pwd.length < 8 || !/[a-zA-Z]/.test(pwd))
        return { label: "Weak", color: "text-green-500" };
      if (
        pwd.length >= 10 &&
        /[0-9]/.test(pwd) &&
        /[A-Z]/.test(pwd) &&
        /[^a-zA-Z0-9]/.test(pwd)
      )
        return { label: "Strong", color: "text-red-500" };
      if (pwd.length >= 8 && /[0-9]/.test(pwd))
        return { label: "Medium", color: "text-yellow-500" };
      return { label: "Weak", color: "text-green-500"}
    }

    function formatCPF(value:string):string {
      return value
        .replace(/\D/g, "")
        .slice(0,11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    function validateCPF(cpf:string):boolean{
      cpf=cpf.replace(/\D/g, "");
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
        setForm({...form, cpf:formatCPF(e.target.value) })
      } else {
        setForm({ ...form, [e.target.name]: e.target.value });
      }
    }
    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
          setError("Please enter a valid email address.");
          setLoading(false);
          return;
        }

        if (getPasswordStrength(form.password).label === "Weak") {
          setError("Password is too week. Use at least 8 characters including letters");
          setLoading(false);
          return;
        }

        if (form.cpf && !validateCPF(form.cpf)) {
          setError("Please enter a valid CPF.");
          setLoading(false);
          return;
        }

        if (parseInt(form.age) < 16) {
          setLoading(false);
          return;
        }

        try {
            await register({
                name:form.name,
                age:parseInt(form.age),
                email:form.email,
                cpf:form.cpf.replace(/\D/g, ""),
                password:form.password,
            });
            router.push("/login");
        } catch{
            setError("Error creating account. Check your details.");
        } finally{
            setLoading(false);
        }
    }

     return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Cinelog</h1>
          <p className="text-muted-foreground mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Date of Birth</label>
            <input
              type="date"
              name="birth_date"
              onChange={(e) => {
                const birth = new Date(e.target.value);
                const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                setForm({ ...form, age: String(age) });
              }}
              className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            {form.age && parseInt(form.age) < 16 && (
              <p className="text-xs mt-1 text-red-500">You must be at least 16 years old to register.</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
              className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-16"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}