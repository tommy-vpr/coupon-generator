import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coupon Generator — Shopify",
  description:
    "Generate single and batch discount codes for your Shopify store",
  icons: {
    icon: "/favicon-96x96.png",
    shortcut: "/favicon-96x96.png",
    apple: "/favicon-96x96.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-0 antialiased">{children}</body>
    </html>
  );
}
