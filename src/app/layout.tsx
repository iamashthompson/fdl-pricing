import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flour Deux Lis — Pricing Calculator",
  description: "Bakery pricing calculator for Flour Deux Lis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
