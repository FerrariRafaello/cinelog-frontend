import axios from "axios";
import Cookies from "js-cookie";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "https://cinelog-production-95d5.up.railway.app";

export const api = axios.create({
    baseURL: API_URL,
});

// Attach the JWT token to every request
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = Cookies.get("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// On 401, clear the token and redirect to login — skip auth/register routes to avoid loops
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = String(error.config?.url || "");
        const isAuthFlow = requestUrl.includes("/v1/auth/login") || requestUrl.includes("/v1/users");

        if (error.response?.status === 401 && typeof window !== "undefined") {
            Cookies.remove("token");
            if (!isAuthFlow && window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);