import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review Dashboard — QalSync",
  description:
    "Review, edit, and approve AI translation drafts for your QalSync project.",
};

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
