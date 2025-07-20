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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full bg-gray-950 rounded-3xl shadow-2xl shadow-blue-900 p-10 text-center border-4 border-blue-700">
        <h1 className="text-3xl font-black mb-4 text-white">Sign in to Questify</h1>
        <p className="mb-6 text-gray-200 font-bold">Sign in with Google or your email and password.</p>
        <form onSubmit={handleSubmit} className="mb-4 space-y-4 text-left">
          {isSignup && (
            <div>
              <label className="block mb-1 font-extrabold text-blue-200">Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg border-2 border-blue-400 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold text-white placeholder-gray-400"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}
          <div>
            <label className="block mb-1 font-extrabold text-blue-200">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg border-2 border-blue-400 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold text-white placeholder-gray-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus={!isSignup}
            />
          </div>
          <div>
            <label className="block mb-1 font-extrabold text-blue-200">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-lg border-2 border-blue-400 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 font-bold text-white placeholder-gray-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-red-400 text-base font-bold mb-4">{error}</div>
          )}
          <button
            type="submit"
            className="w-full py-2 mt-2 bg-blue-600 text-white rounded-lg font-extrabold shadow-lg hover:bg-blue-800 transition text-lg disabled:opacity-60 border-2 border-blue-400"
            disabled={loading}
          >
            {loading ? (isSignup ? "Creating..." : "Signing in...") : isSignup ? "Create Account" : "Sign In"}
          </button>
        </form>
        <div className="flex items-center my-4">
          <div className="flex-grow border-t-2 border-blue-700" />
          <span className="mx-2 text-blue-300 font-bold">OR</span>
          <div className="flex-grow border-t-2 border-blue-700" />
        </div>
        <AuthButton />
        <div className="mt-8 text-blue-200 text-base font-bold">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button className="text-blue-300 underline font-extrabold" onClick={() => setIsSignup(false)}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New to Questify?{' '}
              <button className="text-blue-300 underline font-extrabold" onClick={() => setIsSignup(true)}>
                Create account
              </button>
            </>
          )}
        </div>
        <div className="text-blue-400 text-xs mt-6 font-bold">
          Your data is secure. We only use your email for authentication.
        </div>
      </div>
    </div>
  );
} 