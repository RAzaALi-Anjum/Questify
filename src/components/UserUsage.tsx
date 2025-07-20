"use client";
import { useEffect, useState } from "react";
import { UserCircle, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function UserUsage({ refresh }: { refresh?: number }) {
  const [usage, setUsage] = useState<null | {
    name: string;
    email: string;
    subscriptionStatus: string;
    triesUsed: number;
    remainingTries: number | string;
  }>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setLoading(true);
    fetch("http://localhost:5000/usage", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        setUsage(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [refresh]);

  if (loading) return <div>Loading usage...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!usage) return null;

  // Determine if we are on the main screen (e.g., '/en' or '/[lang]')
  const isMainScreen = /^\/[a-z]{2}$/.test(pathname || "");

  return (
    <div className="relative flex items-center mb-6 gap-3 w-full">
      <Link
        href="/"
        className="px-3 py-2 rounded-lg font-semibold text-white underline ml-0"
        style={{ marginRight: 'auto' }}
      >
        Home
      </Link>
      <div className="absolute left-1/2 transform -translate-x-1/2 top-4">
        {isMainScreen && (
          <div className="pointer-events-none select-none px-8 py-4 rounded-full bg-gray-100 dark:bg-gray-800 shadow text-gray-900 dark:text-white text-xl font-bold flex items-center gap-3 border border-gray-300 dark:border-gray-700">
            <Zap className="w-7 h-7 text-blue-600 dark:text-blue-300" />
            <span>
              {usage && usage.subscriptionStatus === "paid"
                ? "Paid (Unlimited)"
                : `Free: ${usage ? usage.remainingTries : "..."} tries left`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 