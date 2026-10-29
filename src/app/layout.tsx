import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Sidebar, { MobileNav } from "@/components/Sidebar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { getLearner } from "@/lib/learner";

export const metadata: Metadata = {
  title: "EMBED:C LAB — 자동차 임베디드 대학원 준비 C 학습",
  description:
    "독일 자동차 임베디드 대학원 입학을 목표로 하는 C언어 학습 플랫폼. 포인터·비트 조작·volatile·ISR·MISRA C·AUTOSAR까지.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "EMBED:C", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#f0a13a",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const learner = await getLearner().catch(() => null);

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans+KR:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans text-[15px] leading-relaxed antialiased">
        <div className="mx-auto flex min-h-dvh max-w-[1400px]">
          <Sidebar
            learnerName={learner?.name ?? null}
            learnerGoal={learner?.goal ?? null}
          />
          <main className="min-w-0 flex-1 px-4 pb-20 pt-6 sm:px-8 lg:pt-10">
            <MobileNav />
            <ServiceWorkerRegister />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
