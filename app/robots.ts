import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/setup/",
          "/auth/callback",
          "/profile/edit",
          "/_next/",
          "/test-optimization/",
          "/creator-cards-test/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/setup/",
          "/auth/callback",
          "/profile/edit",
          "/_next/",
          "/test-optimization/",
          "/creator-cards-test/",
        ],
      },
    ],
    sitemap: "https://algomancer.cc/sitemap.xml",
  };
}
