import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lantern House | Design Studio",
  description: "Explore Lantern House, present the final mezzanine concept, compare finishes and record design decisions.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
