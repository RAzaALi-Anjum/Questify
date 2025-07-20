"use client";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/components/language-switcher";
import { Locale } from '@/i18n.config';

export default function HeaderWithLanguageSwitcher({ dictionary, currentLocale, children }: { dictionary: any, currentLocale: Locale, children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname && pathname.endsWith('/login')) {
    return <>{children}</>;
  }
  // children is UserUsageWrapper, so we want LanguageSwitcher above UserUsage
  // We'll assume children is a single element and we can clone it to inject LanguageSwitcher above its children
  // But for simplicity, just render LanguageSwitcher, then children (which includes UserUsageWrapper)
  return (
    <>
      <div className="w-full flex justify-end items-center px-6 pt-6 pb-2 z-50">
        <LanguageSwitcher dictionary={dictionary} currentLocale={currentLocale} />
      </div>
      {children}
    </>
  );
} 