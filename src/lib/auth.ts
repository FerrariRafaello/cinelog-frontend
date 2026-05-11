//IMPORTS
import Cookies from  "js-cookie";
import { api } from "./api";
import { AuthToken } from "@/types";


export async function login(email:string, password:string):Promise<void> {
    const formData=new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response=await api.post<AuthToken>("/v1/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    Cookies.set("token", response.data.access_token, { expires: 1 });
}


export async function register(data: {
    name:string;
    age:number;
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