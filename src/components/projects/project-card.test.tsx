import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectCard } from "./project-card";

describe("ProjectCard", () => {
  it("links to the public slug and presents project status and technologies", () => {
    render(
      <ProjectCard
        project={{
          slug: "accessible-platform",
          title: "Accessible Platform",
          shortDescription: "A production-ready collaboration platform.",
          thumbnailUrl: null,
          status: "IN_PROGRESS",
          isFeatured: true,
          technologies: [
            { technology: { name: "Next.js" } },
            { technology: { name: "PostgreSQL" } },
          ],
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /accessible platform/i })).toHaveAttribute(
      "href",
      "/projects/accessible-platform",
    );
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
  });

  it("does not render an unsafe thumbnail as an image", () => {
    render(
      <ProjectCard
        project={{
          slug: "safe-media",
          title: "Safe Media",
          shortDescription: null,
          thumbnailUrl: "javascript:alert(1)",
          status: "PLANNING",
          isFeatured: false,
          technologies: [],
        }}
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
