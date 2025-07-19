"use client";
import AuthButton from "@/components/auth-button";
import { useState } from "react";

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = isSignup ? "http://localhost:5000/auth/register" : "http://localhost:5000/auth/login";
      const body = isSignup ? { name, email, password } : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      if (data.token) {
        localStorage.setItem("authToken", data.token);
        window.location.href = "/";
      }
    } catch (err: any) {
      if (err.message) {
        setError(`${err.message}\n${err.error || ""}\n${err.stack || ""}`);
      } else {
        setError(JSON.stringify(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-200 to-green-100 dark:from-gray-900 dark:via-blue-900 dark:to-green-900">
      <div className="max-w-md w-full bg-white/90 dark:bg-gray-900/90 rounded-3xl shadow-2xl p-10 text-center border-2 border-blue-200 dark:border-blue-800 backdrop-blur-md">
        <h1 className="text-3xl font-extrabold mb-4 text-blue-700 dark:text-blue-300">Sign in to Questify</h1>
        <p className="mb-6 text-gray-700 dark:text-gray-300">Sign in with Google or your email and password.</p>
        <form onSubmit={handleSubmit} className="mb-4 space-y-4 text-left">
          {isSignup && (
            <div>
              <label className="block mb-1 font-bold text-blue-700 dark:text-blue-200">Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}
          <div>
            <label className="block mb-1 font-bold text-blue-700 dark:text-blue-200">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus={!isSignup}
            />
          </div>
          <div>
            <label className="block mb-1 font-bold text-blue-700 dark:text-blue-200">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm mb-4">{error}</div>
          )}
          <button
            type="submit"
            className="w-full py-2 mt-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 transition text-lg disabled:opacity-60"
            disabled={loading}
          >
            {loading ? (isSignup ? "Creating..." : "Signing in...") : isSignup ? "Create Account" : "Sign In"}
          </button>
        </form>
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
          <span className="mx-2 text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
        </div>
        <AuthButton />
        <div className="mt-8 text-gray-500 text-sm">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button className="text-blue-600 underline font-bold" onClick={() => setIsSignup(false)}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New to Questify?{' '}
              <button className="text-blue-600 underline font-bold" onClick={() => setIsSignup(true)}>
                Create account
              </button>
            </>
          )}
        </div>
        <div className="text-gray-400 text-xs mt-6">
          Your data is secure. We only use your email for authentication.
        </div>
      </div>
    </main>
  );
} 