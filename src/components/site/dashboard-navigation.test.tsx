import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardNavigation } from "@/components/site/dashboard-navigation";

describe("DashboardNavigation", () => {
  it("renders equivalent desktop and mobile destinations", () => {
    const links = [
      { href: "/admin", label: "Team dashboard" },
      { href: "/admin/profile", label: "My profile" },
    ];

    render(<DashboardNavigation links={links} />);

    for (const name of ["Dashboard navigation", "Mobile dashboard navigation"]) {
      const navigation = screen.getByRole("navigation", { name });
      expect(
        within(navigation).getByRole("link", { name: "Team dashboard" }),
      ).toHaveAttribute("href", "/admin");
      expect(
        within(navigation).getByRole("link", { name: "My profile" }),
      ).toHaveAttribute("href", "/admin/profile");
    }
  });
});
