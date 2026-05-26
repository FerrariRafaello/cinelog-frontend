import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const viewport={
  width: "device-width",
  initialScale:1,
  maximumScale:1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://critcine.com"),
  title: "CritCine",
  description: "Movie rating platform",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "CritCine",
    description: "Movie rating platform",
    url: "https://critcine.com",
    siteName: "CritCine",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CritCine",
    description: "Movie rating platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
    </body>
    </html>
  );
}
