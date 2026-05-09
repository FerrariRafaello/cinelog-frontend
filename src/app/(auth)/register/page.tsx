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

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }
    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await register({
                name:form.name,
                age:parseInt(form.age),
                email:form.email,
                cpf:form.cpf,
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
          {[
            { label: "Name", name: "name", type: "text", placeholder: "Your name" },
            { label: "Age", name: "age", type: "number", placeholder: "Your age" },
            { label: "Email", name: "email", type: "email", placeholder: "your@email.com" },
            { label: "CPF", name: "cpf", type: "text", placeholder: "00000000000" },
            { label: "Password", name: "password", type: "password", placeholder: "••••••••" },
          ].map((field) => (
            <div key={field.name}>
              <label className="text-sm font-medium">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={field.placeholder}
                required
              />
            </div>
          ))}

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