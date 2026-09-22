import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createMessage: vi.fn(),
  consumeRequestRateLimit: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/db/prisma", () => ({
  prisma: { contactMessage: { create: mocks.createMessage } },
}));
vi.mock("@/server/security/rate-limit", () => ({
  consumeRequestRateLimit: mocks.consumeRequestRateLimit,
}));

import { submitContactMessage } from "./contact-actions";

function contactForm(overrides: Record<string, string> = {}) {
  const data = {
    name: "Ada Lovelace",
    email: "ADA@example.com",
    subject: "A product collaboration",
    message: "We would like to discuss building a new digital product together.",
    website: "",
    ...overrides,
  };
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => form.set(key, value));
  return form;
}

describe("submitContactMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consumeRequestRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 3600,
    });
    mocks.createMessage.mockResolvedValue({ id: "message-1" });
  });

  it("validates, normalizes, and stores a team-directed message", async () => {
    const result = await submitContactMessage(
      { status: "idle", message: "" },
      contactForm(),
    );

    expect(result.status).toBe("success");
    expect(mocks.createMessage).toHaveBeenCalledWith({
      data: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        subject: "A product collaboration",
        message: "We would like to discuss building a new digital product together.",
      },
      select: { id: true },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/messages");
  });

  it("returns field errors without consuming a limit", async () => {
    const result = await submitContactMessage(
      { status: "idle", message: "" },
      contactForm({ email: "invalid", message: "short" }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.email).toBeDefined();
    expect(mocks.consumeRequestRateLimit).not.toHaveBeenCalled();
    expect(mocks.createMessage).not.toHaveBeenCalled();
  });

  it("silently accepts honeypot submissions without storing them", async () => {
    const result = await submitContactMessage(
      { status: "idle", message: "" },
      contactForm({ website: "https://spam.example" }),
    );

    expect(result.status).toBe("success");
    expect(mocks.consumeRequestRateLimit).not.toHaveBeenCalled();
    expect(mocks.createMessage).not.toHaveBeenCalled();
  });

  it("rejects a rate-limited submission", async () => {
    mocks.consumeRequestRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 1200,
    });

    const result = await submitContactMessage(
      { status: "idle", message: "" },
      contactForm(),
    );

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/too many messages/i);
    expect(mocks.createMessage).not.toHaveBeenCalled();
  });
});
