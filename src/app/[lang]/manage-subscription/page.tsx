"use client";
import { useRouter } from "next/navigation";

export default function ManageSubscriptionPage() {
  const router = useRouter();

  const handlePay = async (plan: "monthly" | "yearly") => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const priceId = plan === "monthly"
      ? "price_monthly_id_here"
      : "price_yearly_id_here";
    const res = await fetch("http://localhost:5000/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ priceId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Payment error: " + (data.message || "Unknown error"));
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 text-center border-2 border-blue-200 dark:border-blue-800">
        <h2 className="text-3xl font-extrabold mb-4 text-blue-700 dark:text-blue-300">Manage Your Subscription</h2>
        <p className="mb-8 text-gray-700 dark:text-gray-300">Choose a plan to unlock unlimited AI usage and premium features.</p>
        <div className="grid grid-cols-1 gap-6">
          <div
            className="rounded-xl p-6 bg-gradient-to-br from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700 shadow-lg transform transition-transform hover:scale-105 cursor-pointer"
            onClick={() => router.push(`/en/plan/monthly`)}
          >
            <div className="flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 1.343-3 3v1a3 3 0 006 0v-1c0-1.657-1.343-3-3-3z"/><path d="M5 20h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z"/></svg>
            </div>
            <div className="font-bold text-lg mb-1 text-blue-800 dark:text-blue-100">Monthly Plan</div>
            <div className="text-3xl font-extrabold mb-2 text-blue-900 dark:text-blue-200">$9.99 <span className="text-base font-normal">/ month</span></div>
            <button
              onClick={e => { e.stopPropagation(); handlePay("monthly"); }}
              className="w-full py-2 mt-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg font-bold shadow hover:from-blue-600 hover:to-blue-800 transition"
            >
              Buy Monthly
            </button>
          </div>
          <div
            className="rounded-xl p-6 bg-gradient-to-br from-green-100 to-green-300 dark:from-green-900 dark:to-green-700 shadow-lg transform transition-transform hover:scale-105 cursor-pointer"
            onClick={() => router.push(`/en/plan/yearly`)}
          >
            <div className="flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-green-600 dark:text-green-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 1.343-3 3v1a3 3 0 006 0v-1c0-1.657-1.343-3-3-3z"/><path d="M5 20h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z"/></svg>
            </div>
            <div className="font-bold text-lg mb-1 text-green-800 dark:text-green-100">Yearly Plan</div>
            <div className="text-3xl font-extrabold mb-2 text-green-900 dark:text-green-200">$99.99 <span className="text-base font-normal">/ year</span></div>
            <button
              onClick={e => { e.stopPropagation(); handlePay("yearly"); }}
              className="w-full py-2 mt-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg font-bold shadow hover:from-green-600 hover:to-green-800 transition"
            >
              Buy Yearly
            </button>
          </div>
        </div>
        <div className="text-gray-500 text-sm mt-8">After payment, your account will be upgraded automatically.</div>
      </div>
    </main>
  );
} 