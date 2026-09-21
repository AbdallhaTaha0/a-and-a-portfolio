import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AmbientBackground } from "./ambient-background";

describe("AmbientBackground", () => {
  it("is decorative and hidden from assistive technology", () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { container } = render(<AmbientBackground />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
