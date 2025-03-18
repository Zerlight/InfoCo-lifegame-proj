import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TwoFALayout } from "@/components/2fa-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "InfoCo Game of Life",
  description: "Conway's Game of Life for infoCo Gamer's Night",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <TwoFALayout>{children}</TwoFALayout>
      </body>
    </html>
  );
}
