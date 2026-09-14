import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEORALINK | Korean Business Network",
  description: "Premier international business ecosystem engineered on universal queue progression and high-performance dual-tier rewards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#040711] text-[#e2e8f0] antialiased selection:bg-[#d4af37] selection:text-black">
        {children}
      </body>
    </html>
  );
}
