import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeHighlightSections } from "./home-highlight-sections";

describe("HomeHighlightSections", () => {
  it("renders public team, technology, achievement, and testimonial data", () => {
    render(
      <HomeHighlightSections
        highlights={{
          members: [
            {
              slug: "ada-lovelace",
              fullName: "Ada Lovelace",
              headline: "Software engineer",
              profileImageUrl: null,
            },
          ],
          technologies: [{ name: "Next.js", category: "Web" }],
          achievements: [
            {
              title: "Accessibility Award",
              description: "Recognized for inclusive product design.",
              issuer: "Design Guild",
              date: new Date("2025-06-01T00:00:00.000Z"),
              url: "https://example.com/award",
            },
          ],
          testimonials: [
            {
              name: "Grace Hopper",
              role: "Engineering lead",
              company: "Example Co",
              content: "A thoughtful and dependable collaboration.",
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /ada lovelace/i })).toHaveAttribute(
      "href",
      "/members/ada-lovelace",
    );
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /accessibility award/i })).toHaveAttribute(
      "href",
      "https://example.com/award",
    );
    expect(screen.getByText(/thoughtful and dependable/i)).toBeInTheDocument();
  });

  it("omits empty public sections", () => {
    const { container } = render(
      <HomeHighlightSections
        highlights={{ members: [], technologies: [], achievements: [], testimonials: [] }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
