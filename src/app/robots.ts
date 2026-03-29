import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login", "/dashboard", "/posts/", "/settings", "/comments", "/media", "/friend-links"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
