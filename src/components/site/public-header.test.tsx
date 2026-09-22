import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicHeader } from "@/components/site/public-header";

describe("PublicHeader", () => {
  it("provides equivalent desktop and mobile navigation", () => {
    render(<PublicHeader />);

    expect(screen.getByRole("link", { name: "A&A home" })).toHaveAttribute(
      "href",
      "/",
    );
    const desktop = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    const mobile = screen.getByRole("navigation", {
      name: "Mobile primary navigation",
    });

    for (const navigation of [desktop, mobile]) {
      expect(within(navigation).getByRole("link", { name: "Projects" })).toHaveAttribute(
        "href",
        "/projects",
      );
      expect(within(navigation).getByRole("link", { name: "Members" })).toHaveAttribute(
        "href",
        "/members",
      );
      expect(
        within(navigation).getByRole("link", { name: "Team sign in" }),
      ).toHaveAttribute("href", "/login");
    }
  });
});
