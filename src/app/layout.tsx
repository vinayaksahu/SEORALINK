import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FloatingThemeToggle } from "@/components/FloatingThemeToggle";
import { LanguageProvider } from "@/components/LanguageProvider";
import { FloatingLanguageToggle } from "@/components/FloatingLanguageToggle";

export const metadata: Metadata = {
  title: "SEORALINK | Korean Business Network",
  description: "Premier international business ecosystem engineered on universal queue progression and high-performance dual-tier rewards.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/logo-icon.png", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: "/logo-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="icon" type="image/png" href="/logo-icon.png" />
        <link rel="apple-touch-icon" href="/logo-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
        {/* Anti-FOUC Theme Script: Synchronously apply stored theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('seoralink_theme') || 'system';
                const isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-[#040711] text-slate-900 dark:text-[#e2e8f0] antialiased selection:bg-[#d4af37] selection:text-black min-h-screen">
        <LanguageProvider>
          <ThemeProvider>
            {children}
            <FloatingLanguageToggle />
            <FloatingThemeToggle />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
