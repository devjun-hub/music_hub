import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AudioEngineProvider } from "@/audio/AudioEngineProvider";
import { AudioUnlockGate } from "@/components/AudioUnlockGate";
import { BrowserSupportNotice } from "@/components/BrowserSupportNotice";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Music Hub",
  description: "설치 없이 브라우저에서 녹음, 리믹스, 드럼, DJ를 즐기는 무료 음악 제작 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AudioEngineProvider>
          <BrowserSupportNotice />
          <Header />
          <NavBar />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <AudioUnlockGate />
        </AudioEngineProvider>
      </body>
    </html>
  );
}
