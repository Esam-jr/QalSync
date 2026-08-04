import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QalSync — AI Localization for Amharic, Afaan Oromo & Tigrinya",
  description:
    "Localize your React and Next.js apps into Amharic, Afaan Oromo, and Tigrinya. Zero manual JSON wrangling. AST scanning, incremental caching, and Gemini AI with an optional human review dashboard.",
  openGraph: {
    title: "QalSync — AI Localization for East African Languages",
    description:
      "Localize your React and Next.js apps into Amharic, Afaan Oromo, and Tigrinya with one CLI command.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "QalSync — AI Localization for East African Languages",
    description:
      "Localize your React and Next.js apps into Amharic, Afaan Oromo, and Tigrinya with one CLI command.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${geist.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-void text-ivory antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
