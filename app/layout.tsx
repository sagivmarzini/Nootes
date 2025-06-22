import type { Metadata } from "next";
import "./globals.css";
import { Rubik } from "next/font/google";
import NavBar from "./components/NavBar";
import SessionProviderWrapper from "./components/SessionProviderWrapper";

const rubik = Rubik({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nootes",
  description:
    "לא הקשבתם בשיעור? אין בעיה! תקליטו את השיעור ותקבלו סיכום חכם, כתוב על דף מחברת – כאילו הייתם שם.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="school">
      <body className={rubik.className} dir="rtl">
        <SessionProviderWrapper>
          <NavBar />
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
