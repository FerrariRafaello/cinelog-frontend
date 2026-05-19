import { useEffect, useRef } from "react";
import Cookies from "js-cookie";

// Resets the inactivity timer on any user interaction; logs out after `minutes` of silence
export function useInactivityLogout(onLogout: () => void, minutes = 60) {
    const timeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const ms = minutes * 60 * 1000;

        function reset() {
            if (timeRef.current) clearTimeout(timeRef.current);
            timeRef.current = setTimeout(() => {
                Cookies.remove("token");
                onLogout();
            }, ms);
        }

        // Covers mouse, keyboard, touch, and scroll — anything that counts as "active"
        const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
        events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
        reset();

        return () => {
            if (timeRef.current) clearTimeout(timeRef.current);
            events.forEach((e) => window.removeEventListener(e, reset));
        };
    }, [onLogout, minutes]);
}