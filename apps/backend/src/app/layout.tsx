import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QalSync — Translation Management",
  description:
    "Localization tool for low-resource languages like Amharic and Afaan Oromo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-void text-ivory antialiased">
        {children}
      </body>
    </html>
  );
}
