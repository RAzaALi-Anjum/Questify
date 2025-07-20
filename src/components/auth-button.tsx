"use client";
import React, { useEffect, useState, useRef } from "react";

const GOOGLE_AUTH_URL = "http://localhost:5000/auth/google";

export default function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; avatar?: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.reload();
  };

  if (isLoggedIn && user) {
    return (
      <div ref={dropdownRef} className="relative flex flex-col items-center gap-2 pointer-events-auto">
        <button
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-200 group"
          onClick={() => setDropdownOpen((v) => !v)}
          aria-label="Profile menu"
        >
          <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-11 h-11 rounded-full object-cover"
              />
            ) : (
              <svg className="w-9 h-9 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M6 20c0-2.21 3.58-4 8-4s8 1.79 8 4" /></svg>
            )}
          </div>
        </button>
        <div className="text-base font-semibold text-white dark:text-white mt-1 mb-2">Welcome, {user.name || 'Raza Al Anjum'}</div>
        {dropdownOpen && (
          <div className="absolute top-16 right-0 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[1100] flex flex-col mt-0 overflow-hidden">
            <button
              className="block w-full text-left px-4 py-3 text-base font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all"
              onClick={() => window.location.href = '/en/manage-subscription'}
            >
              Manage Subscription
            </button>
            <button
              className="block w-full text-left px-4 py-3 text-base font-semibold text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all"
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
