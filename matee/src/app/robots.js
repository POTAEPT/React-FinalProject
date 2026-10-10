import { siteUrl } from "@/lib/site";

// หน้าที่ต้องล็อกอิน / หน้าแอดมิน / หน้าจัดการ ไม่ให้ crawler เข้า
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/account",
        "/create",
        "/manage",
        "/my-party",
        "/login",
        "/register",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
