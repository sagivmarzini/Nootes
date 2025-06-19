import type { Metadata } from "next";
import "./globals.css";
import { Rubik } from "next/font/google";

const rubik = Rubik({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Class Summarizer by Sagiv",
  description:
    "Didn't listen in class? No worries! Next time record your teacher and in minutes we will create you a perfect notebook page of what you missed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="school">
      <body className={rubik.className} dir="rtl">
        {children}
      </body>
    </html>
  );
}
