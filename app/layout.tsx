import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Compasslab Calendar",
  description: "Team schedule calendar for Compasslab instructors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
