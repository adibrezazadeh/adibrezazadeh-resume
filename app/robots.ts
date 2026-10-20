import type { MetadataRoute } from "next";
import { absolute, siteUrl } from "@/lib/site";

// Search engines and AI answer engines are all welcome; only the assistant endpoint is off limits.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/assistant" },
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Google-Extended", "Applebot-Extended", "Bingbot"],
        allow: "/",
        disallow: "/api/assistant",
      },
    ],
    sitemap: absolute("/sitemap.xml"),
    host: siteUrl,
  };
}
