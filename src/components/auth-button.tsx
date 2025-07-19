"use client";
import React, { useEffect, useState } from "react";

const GOOGLE_AUTH_URL = "http://localhost:5000/auth/google";

export default function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; avatar?: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
    if (token) {
      fetch("http://localhost:5000/usage", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then((data) => setUser({ name: data.name, avatar: data.avatar }))
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, []);

  const handleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.reload();
  };

  if (isLoggedIn && user) {
    return (
      <div className="relative">
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          onClick={() => setDropdownOpen((v) => !v)}
        >
          {user.avatar && (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 shadow-sm"
            />
          )}
          <span className="font-medium text-sm max-w-[120px] truncate">{user.name}</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <button
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => window.location.href = '/en/manage-subscription'}
            >
              Manage Subscription
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Sign in with Google
    </button>
  );
}
