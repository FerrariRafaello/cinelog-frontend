import Cookies from "js-cookie";
import axios from "axios";
import { api } from "./api";
import { AuthToken } from "@/types";

export async function login(email: string, password: string): Promise<void> {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
        throw new Error("Email and password are required.");
    }

    // Try form-encoded first (OAuth2 standard), fall back to JSON on 422
    const formData = new URLSearchParams();
    formData.append("username", normalizedEmail);
    formData.append("email", normalizedEmail);
    formData.append("password", normalizedPassword);

    try {
        const response = await api.post<AuthToken>("/v1/auth/login", formData, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        Cookies.set("token", response.data.access_token, { expires: 1 });
        return;
    } catch (firstError) {
        if (axios.isAxiosError(firstError) && firstError.response?.status === 422) {
            try {
                const response = await api.post<AuthToken>("/v1/auth/login", {
                    email: normalizedEmail,
                    password: normalizedPassword,
                });
                Cookies.set("token", response.data.access_token, { expires: 1 });
                return;
            } catch (secondError) {
                if (axios.isAxiosError(secondError)) {
                    const detail = secondError.response?.data?.detail;
                    if (typeof detail === "string") throw new Error(detail);
                }
                throw secondError;
            }
        }

        if (axios.isAxiosError(firstError)) {
            const detail = firstError.response?.data?.detail;
            if (typeof detail === "string") throw new Error(detail);
        }
        throw firstError;
    }
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