import type { MetadataRoute } from "next";

const siteUrl = "https://voidcrawl.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/play`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/play/daily`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];
}
