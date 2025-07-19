"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    // If not logged in and not already on /login, redirect to login
    if (!token && !pathname.endsWith("/login")) {
      // Detect locale prefix (e.g., /en)
      const match = pathname.match(/^\/([a-z]{2})\b/);
      const locale = match ? match[1] : "en";
      router.replace(`/${locale}/login`);
    }
  }, [router, pathname]);

  return <>{children}</>;
} 