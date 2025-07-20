"use client";
import { usePathname } from "next/navigation";
import UserUsage from './UserUsage';
import LanguageSwitcher from "@/components/language-switcher";
import AuthButton from "@/components/auth-button";
import { useEffect, useState } from 'react';
import { Locale } from '@/i18n.config';

export default function UserUsageWrapper({ dictionary, currentLocale, children }: { dictionary: any, currentLocale: Locale, children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSignedIn, setIsSignedIn] = useState(false);
  useEffect(() => {
    setIsSignedIn(!!localStorage.getItem('authToken'));
  }, []);
  // Hide on login page, show everywhere else
  if (pathname && pathname.endsWith('/login')) {
    return <>{children}</>;
  }
  return (
    <>
      <div className="w-full flex justify-end items-center gap-4 px-6 pt-6 pb-2 z-50">
        <LanguageSwitcher dictionary={dictionary} currentLocale={currentLocale} />
        <AuthButton />
      </div>
      {isSignedIn && <UserUsage />}
      {children}
    </>
  );
} 