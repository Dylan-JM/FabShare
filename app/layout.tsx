import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FabShare — Share Your Fab Library",
  description:
    "Share your Fab asset library with your team via a single URL. No backend, no accounts, just a link.",
  openGraph: {
    title: "FabShare — Share Your Fab Library",
    description:
      "Share your Fab asset library with your team via a single URL.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bebasNeue.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
