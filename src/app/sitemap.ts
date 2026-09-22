import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";
import { safeHttpsUrl } from "@/lib/urls";
import { getPublishedMemberSitemapEntries } from "@/server/members/public-members";
import { getPublishedProjectSitemapEntries } from "@/server/projects/public-projects";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [members, projects] = await Promise.all([
    getPublishedMemberSitemapEntries(),
    getPublishedProjectSitemapEntries(),
  ]);

  return [
    {
      url: getSiteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: getSiteUrl("/projects"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: getSiteUrl("/members"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...projects.map((project) => {
      const image = safeHttpsUrl(project.thumbnailUrl);

      return {
        url: getSiteUrl(`/projects/${project.slug}`),
        lastModified: project.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.8,
        images: image ? [image] : undefined,
      };
    }),
    ...members.map((member) => {
      const image = safeHttpsUrl(member.profileImageUrl);

      return {
        url: getSiteUrl(`/members/${member.slug}`),
        lastModified: member.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
        images: image ? [image] : undefined,
      };
    }),
  ];
}
