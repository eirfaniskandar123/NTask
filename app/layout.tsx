import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "@/components/RegisterSW";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SonnerToaster } from "@/components/SonnerToaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NTask+",
  description: "Personal task manager with daily email digest",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "NTask+",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <RegisterSW />
          {children}
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
