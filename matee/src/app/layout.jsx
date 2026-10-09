import { Noto_Sans_Thai } from "next/font/google";
import { cookies } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { BootSplash } from "@/components/boot-splash";
import { loadAccount } from "@/lib/auth/account";
import { readTheme, THEME_COOKIE } from "@/lib/theme";

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

export default async function RootLayout({ children, modal }) {
  const [cookieStore, account] = await Promise.all([cookies(), loadAccount()]);
  const theme = readTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <html
      lang="th"
      data-theme={theme === "system" ? undefined : theme}
      className={`${notoSansThai.variable} h-full antialiased`}
    >
      {/* Bottom padding keeps content clear of the mobile tab bar. */}
      <body className={`${notoSansThai.className} flex min-h-full flex-col pb-20 md:pb-0`}>
        <BootSplash />
        <noscript>
          <style>{"#boot-splash{display:none}"}</style>
        </noscript>
        <AppShell account={account} theme={theme}>
          {children}
        </AppShell>
        {modal}
      </body>
    </html>
  );
}
