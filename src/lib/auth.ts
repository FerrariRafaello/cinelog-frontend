import Cookies from "js-cookie";
import { api } from "./api";
import { AuthToken } from "@/types";

export async function login(email: string, password: string): Promise<void> {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
        throw new Error("Email and password are required.");
    }

    const params = new URLSearchParams();
    params.append("username", normalizedEmail);
    params.append("password", normalizedPassword);

    const response = await api.post<AuthToken>("/v1/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    Cookies.set("token", response.data.access_token, { expires: 1 });
}


export async function register(data: {
    name:string;
    age?:number;
    email:string;
    cpf?:string;
    password:string;
}): Promise<void> {
    await api.post("/v1/users", data);
}


export function logout():void {
    Cookies.remove("token");
    window.location.href="/login";
}


export function isAuthenticated():boolean {
    if (typeof window === "undefined") return true;
    return !!Cookies.get("token");
}