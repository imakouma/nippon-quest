import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { ProgressSync } from "@/components/providers/ProgressSync";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "にっぽん探検たい",
  description: "小学3〜6年生向け社会科学習ゲーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-gray-900">
        <ConvexClientProvider>
          {process.env.NEXT_PUBLIC_CONVEX_URL ? <ProgressSync /> : null}
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
