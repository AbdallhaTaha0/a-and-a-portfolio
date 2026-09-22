import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PublicError from "./error";

describe("PublicError", () => {
  it("shows safe recovery copy and invokes reset", () => {
    const reset = vi.fn();
    const internalError = Object.assign(
      new Error("DATABASE_URL=should-never-be-shown"),
      { digest: "safe-reference" },
    );

    render(<PublicError error={internalError} reset={reset} />);

    expect(screen.queryByText(/DATABASE_URL/)).not.toBeInTheDocument();
    expect(screen.getByText(/safe-reference/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
