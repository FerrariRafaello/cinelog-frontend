"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { Notification } from "@/types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchNotifications() {
    if (!isAuthenticated()) return;
    try {
      const resp = await api.get("/v1/notifications?limit=20&offset=0");
      setNotifications(resp.data);
    } catch {
      // silently fail — não bloqueia a UI
    }
  }

  async function markAsRead(id: number) {
    try {
      await api.patch(`/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAsRead };
}
