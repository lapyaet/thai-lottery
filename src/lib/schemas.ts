import { z } from "zod";
import { TICKET_DIGITS } from "@/lib/lottery";

/**
 * Schema messages are translation keys under the `errors` namespace; forms
 * resolve them with `useTranslations("errors")`.
 */

export const checkTicketSchema = z.object({
  ticketNumber: z
    .string()
    .min(1, "required")
    .regex(/^\d*$/, "digitsOnly")
    .length(TICKET_DIGITS, "ticketLength"),
});
export type CheckTicketValues = z.infer<typeof checkTicketSchema>;

export const ticketSearchSchema = z.object({
  query: z.string().regex(/^\d*$/, "digitsOnly").max(TICKET_DIGITS, "ticketLength"),
});
export type TicketSearchValues = z.infer<typeof ticketSearchSchema>;

const PHONE = /^(\+?95|0)9\d{7,9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isPhoneOrEmail = (v: string) => {
  const value = v.replace(/[\s-]/g, "");
  return PHONE.test(value) || EMAIL.test(value);
};

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "required")
    .refine(isPhoneOrEmail, "phoneOrEmail"),
  password: z.string().min(1, "required").min(6, "passwordLength"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = loginSchema
  .extend({
    name: z.string().trim().min(2, "nameLength"),
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  });
export type SignupValues = z.infer<typeof signupSchema>;

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "nameLength"),
  phone: z
    .string()
    .min(1, "required")
    .refine((v) => PHONE.test(v.replace(/[\s-]/g, "")), "phone"),
  nrc: z
    .string()
    .min(1, "required")
    .regex(/^\d{1,2}\/[A-Za-z]+\(N\)\d{6}$/, "nrc"),
  paymentMethod: z.enum(["qr", "bank", "card"]),
});
export type CheckoutValues = z.infer<typeof checkoutSchema>;
