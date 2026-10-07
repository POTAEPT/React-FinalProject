import { Noto_Sans_Thai } from "next/font/google";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "MaTee | มาตี้กัน",
  description: "หาตี้ทำกิจกรรมสำหรับนักศึกษา มช.",
};

export default function RootLayout({ children }) {
  console.log('✅ [Server] Rendering RootLayout')
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <body className={`${notoSansThai.className} flex min-h-full flex-col`}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
