"use client";
import { useRouter, useParams } from "next/navigation";

const PLAN_DETAILS = {
  monthly: {
    name: "Monthly Plan",
    price: "$9.99 / month",
    description: "Unlimited AI usage, priority support, and all premium features. Billed monthly.",
    color: "from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700",
    button: "Buy Monthly",
    priceId: "price_monthly_id_here"
  },
  yearly: {
    name: "Yearly Plan",
    price: "$99.99 / year",
    description: "Unlimited AI usage, priority support, and all premium features. Billed yearly (save 17%).",
    color: "from-green-100 to-green-300 dark:from-green-900 dark:to-green-700",
    button: "Buy Yearly",
    priceId: "price_yearly_id_here"
  }
};

export default function PlanDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const plan = PLAN_DETAILS[params.plan as "monthly" | "yearly"];

  if (!plan) {
    return <div className="p-8 text-center text-red-600">Invalid plan selected.</div>;
  }

  const handlePay = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const res = await fetch("http://localhost:5000/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ priceId: plan.priceId }),
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
      <div className={`max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 text-center border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br ${plan.color}`}>
        <h2 className="text-3xl font-extrabold mb-4 text-blue-700 dark:text-blue-300">{plan.name}</h2>
        <div className="text-4xl font-extrabold mb-2">{plan.price}</div>
        <p className="mb-8 text-gray-700 dark:text-gray-300">{plan.description}</p>
        <button
          onClick={handlePay}
          className="w-full py-3 mt-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg font-bold shadow hover:from-blue-600 hover:to-blue-800 transition text-lg"
        >
          {plan.button}
        </button>
        <div className="text-gray-500 text-sm mt-8">After payment, your account will be upgraded automatically.</div>
        <button className="mt-6 text-blue-600 underline" onClick={() => router.back()}>Back</button>
      </div>
    </main>
  );
} 