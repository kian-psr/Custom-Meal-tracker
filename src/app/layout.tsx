import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Meal Macro Tracker",
  description:
    "Upload a meal photo, describe it, and keep a running daily calorie and macro total against personalized targets.",
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
