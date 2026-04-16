import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Cutting Meal Macro Tracker",
  description:
    "Upload a meal photo, describe it, and keep a running daily macro total for a cutting phase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

