import { describe, expect, it } from "vitest";

import { contactMessageSchema } from "@/features/contact/contact-schema";

const validMessage = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "A new product collaboration",
  message: "We would like to discuss building a new digital product together.",
  website: "",
};

describe("contactMessageSchema", () => {
  it("accepts a valid message and normalizes whitespace", () => {
    const result = contactMessageSchema.parse({
      ...validMessage,
      name: "  Ada Lovelace  ",
      email: " ada@example.com ",
    });

    expect(result.name).toBe("Ada Lovelace");
    expect(result.email).toBe("ada@example.com");
  });

  it("rejects invalid email, short content, and unexpected fields", () => {
    expect(
      contactMessageSchema.safeParse({
        ...validMessage,
        email: "not-an-email",
        message: "Too short",
      }).success,
    ).toBe(false);
    expect(
      contactMessageSchema.safeParse({ ...validMessage, memberId: "injected" })
        .success,
    ).toBe(false);
  });

  it("rejects the honeypot when populated", () => {
    expect(
      contactMessageSchema.safeParse({ ...validMessage, website: "spam.example" })
        .success,
    ).toBe(false);
  });
});
