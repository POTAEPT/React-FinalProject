import { Noto_Sans_Thai } from "next/font/google";
import { cookies } from "next/headers";

import { SiteHeader } from "@/components/site-header";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
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

// The signed-in user's name and avatar for the header, or null for guests.
async function loadAccount() {
  if (!getSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    return {
      displayName: profile?.display_name ?? user.email ?? "บัญชีของฉัน",
      avatarUrl: profile?.avatar_url ?? null,
    };
  } catch (error) {
    console.error("load header account", error);
    return null;
  }
}

export default async function RootLayout({ children }) {
  const [cookieStore, account] = await Promise.all([cookies(), loadAccount()]);
  const theme = readTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <html
      lang="th"
      data-theme={theme === "system" ? undefined : theme}
      className={`${notoSansThai.variable} h-full antialiased`}
    >
      {/* Bottom padding keeps content clear of the mobile tab bar. */}
      <body className={`${notoSansThai.className} flex min-h-full flex-col pb-20 sm:pb-0`}>
        <SiteHeader account={account} theme={theme} />
        {children}
      </body>
    </html>
  );
}
