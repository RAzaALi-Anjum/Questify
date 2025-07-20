import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import AuthButton from "@/components/auth-button";
import Link from "next/link";
import LanguageSwitcher from "@/components/language-switcher";
import { Locale } from "@/i18n.config";
import { getDictionary } from "./dictionaries";
import UserUsageWrapper from '@/components/UserUsageWrapper';
import { i18n, Locale } from '@/i18n.config';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const awaitedParams = await params;
    const dictionary = await getDictionary(awaitedParams.lang);
    const seoTranslations = dictionary.seo; 

    return {
        title: seoTranslations.title,
        description: seoTranslations.description,
        keywords: seoTranslations.keywords,
        authors: [{ name: "Miguel07Code" }],
        openGraph: {
            type: "website",
            locale: awaitedParams.lang === "en" ? "en_US" : awaitedParams.lang,
            url: "https://text2question.miguel07code.dev",
            title: seoTranslations.title,
            description: seoTranslations.description,
            images: [
                {
                    url: "https://text2question.miguel07code.dev/og-image-1200x630.png",
                    width: 1200,
                    height: 630,
                    alt: seoTranslations.title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: seoTranslations.title,
            description: seoTranslations.description,
            images: [
                "https://text2question.miguel07code.dev/og-image-1200x630.png",
            ],
            creator: "@miguel07code",
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
    };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>; 
}>) {
  const awaitedParams = await params;
  const session = await auth(); 
  const dictionary = await getDictionary(awaitedParams.lang); 
  const currentLocale = awaitedParams.lang;

  return (
      <SessionProvider session={session}>
          <html lang={currentLocale} suppressHydrationWarning>
              <body
                  className={`${geistSans.variable} ${geistMono.variable} antialiased`}
              >
                  <ThemeProvider
                      attribute="class"
                      defaultTheme="system"
                      enableSystem
                  >
                    <UserUsageWrapper dictionary={dictionary} currentLocale={currentLocale}>
                      {children}
                    </UserUsageWrapper>
                  </ThemeProvider>
                  <Toaster />
              </body>
              <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
          </html>
      </SessionProvider>
  );
}
