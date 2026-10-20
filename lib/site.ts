// The public origin, used for canonical URLs, the sitemap, and structured data.
// Set NEXT_PUBLIC_SITE_URL in production; on Vercel the production domain is the fallback.
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/+$/, "");

export function absolute(path = "/"): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
