import type { Metadata } from "next";

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
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
