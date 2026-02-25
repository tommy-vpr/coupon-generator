import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coupon Generator — Shopify",
  description: "Generate single and batch discount codes for your Shopify store",
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
