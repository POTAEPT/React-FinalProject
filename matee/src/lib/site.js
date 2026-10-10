// Public origin used in sitemap.xml and robots.txt. Set NEXT_PUBLIC_SITE_URL on
// the host; Vercel's production URL is the fallback, then localhost.
export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const origin = explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");

  return origin.replace(/\/+$/, "");
}
