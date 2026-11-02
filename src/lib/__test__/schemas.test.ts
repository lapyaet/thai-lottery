import {
  checkoutSchema,
  checkTicketSchema,
  loginSchema,
  signupSchema,
  ticketSearchSchema,
} from "@/lib/schemas";

const firstMessage = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.error?.issues[0]?.message;

describe("checkTicketSchema", () => {
  it("accepts a 6-digit number", () => {
    expect(checkTicketSchema.safeParse({ ticketNumber: "274916" }).success).toBe(true);
  });
  it.each([
    ["", "required"],
    ["12a456", "digitsOnly"],
    ["123", "ticketLength"],
  ])("rejects %j with %s", (ticketNumber, message) => {
    expect(firstMessage(checkTicketSchema.safeParse({ ticketNumber }))).toBe(message);
  });
});

describe("ticketSearchSchema", () => {
  it("allows empty and partial digits", () => {
    expect(ticketSearchSchema.safeParse({ query: "" }).success).toBe(true);
    expect(ticketSearchSchema.safeParse({ query: "27" }).success).toBe(true);
  });
  it("rejects letters", () => {
    expect(ticketSearchSchema.safeParse({ query: "ab" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a Myanmar phone or an email", () => {
    for (const identifier of ["09450012345", "+959450012345", "a@b.co"]) {
      expect(loginSchema.safeParse({ identifier, password: "secret1" }).success).toBe(true);
    }
  });
  it("rejects bad identifier and short password", () => {
    expect(firstMessage(loginSchema.safeParse({ identifier: "nope", password: "secret1" }))).toBe("phoneOrEmail");
    expect(firstMessage(loginSchema.safeParse({ identifier: "a@b.co", password: "123" }))).toBe("passwordLength");
  });
});

describe("signupSchema", () => {
  const base = { name: "Aung", identifier: "a@b.co", password: "secret1" };
  it("requires matching passwords", () => {
    const r = signupSchema.safeParse({ ...base, confirmPassword: "different" });
    expect(r.success).toBe(false);
    expect(firstMessage(r)).toBe("passwordMismatch");
  });
  it("accepts a valid signup", () => {
    expect(signupSchema.safeParse({ ...base, confirmPassword: "secret1" }).success).toBe(true);
  });
});

describe("checkoutSchema", () => {
  const valid = {
    fullName: "Aung Aung",
    phone: "09 450 012 345",
    nrc: "12/OUKAMA(N)123456",
    paymentMethod: "qr" as const,
  };
  it("accepts valid data", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects invalid phone and NRC", () => {
    expect(firstMessage(checkoutSchema.safeParse({ ...valid, phone: "12345" }))).toBe("phone");
    expect(firstMessage(checkoutSchema.safeParse({ ...valid, nrc: "bad" }))).toBe("nrc");
  });
  it("rejects an unknown payment method", () => {
    expect(checkoutSchema.safeParse({ ...valid, paymentMethod: "cash" }).success).toBe(false);
  });
});
