import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { VerifyEmailBanner } from "@/components/verify-email-banner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SupportLink } from "@/components/support-card";

export const metadata: Metadata = {
  title: "ExploreAll — travel community",
  description: "A clean, premium travel community. Share your trips, discover places, and check country safety.",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: "/logo.png",
  },
  openGraph: {
    title: "ExploreAll — travel community",
    description: "Share your trips, discover places, and check country safety.",
    url: "https://www.exploreall.eu",
    siteName: "ExploreAll",
    images: [{ url: "/logo.png", width: 1080, height: 1080 }],
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased pb-24 md:pb-0">
        <ThemeProvider>
          <Nav />
          <VerifyEmailBanner />
          <main className="container py-8 animate-fadeIn">{children}</main>
          <footer className="container mt-16 mb-12 text-xs text-muted-foreground flex items-center justify-between gap-4">
            <span>© {new Date().getFullYear()} ExploreAll</span>
            <SupportLink />
          </footer>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
