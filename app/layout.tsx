import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:5173";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  const socialImage = `${protocol}://${host}/og.png`;

  return {
    title: "AI VOC Decision Lab | GongDoYoon",
    description:
      "고객 피드백을 근거 기반 제품 의사결정으로 바꾸는 AI 기획 포트폴리오",
    openGraph: {
      title: "근거가 있는 AI 제품 의사결정",
      description: "VOC 분석부터 PRD, 골든셋 평가, 출시 판단까지",
      images: [{ url: socialImage, width: 1536, height: 1024 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "AI VOC Decision Lab",
      description: "Evidence-backed AI product discovery",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
