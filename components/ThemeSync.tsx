"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

/** Applies persisted user theme from the API on load */
export default function ThemeSync() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        const theme = data.user?.theme ?? "light";
        document.documentElement.classList.toggle("dark", theme === "dark");
        localStorage.setItem("theme", theme);
      })
      .catch(() => {});
  }, [status]);

  return null;
}
