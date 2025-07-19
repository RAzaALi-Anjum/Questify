"use client";
import { useEffect, useState } from "react";

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

  return (
    <div className="mb-4 p-4 rounded bg-gray-100 dark:bg-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-semibold">Welcome, {usage.name}</div>
        <div className="text-sm text-gray-500">{usage.email}</div>
      </div>
      <div className="mt-2 sm:mt-0 flex items-center gap-4">
        <span className="px-3 py-1 rounded-full bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {usage.subscriptionStatus === "paid"
            ? "Paid (Unlimited)"
            : `Free: ${usage.remainingTries} tries left`}
        </span>
      </div>
    </div>
  );
} 