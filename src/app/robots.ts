import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://sbltcup.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/tournaments", "/rules", "/announcements"],
        disallow: ["/admin", "/dashboard", "/api", "/auth"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
