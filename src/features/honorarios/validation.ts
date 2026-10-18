import { z } from "zod";

export const feeEstimateSchema = z.object({
  caseId: z.uuid(),
  currency: z.enum(["ARS", "USD"]),
  amount: z
    .string()
    .trim()
    .regex(
      /^\d{1,10}([.,]\d{1,2})?$/,
      "Ingresá un importe positivo con hasta dos decimales."
    )
    .transform((value) => {
      const [whole, fraction = ""] = value.replace(",", ".").split(".");
      return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
    })
    .pipe(z.number().int().min(0).max(999999999999)),
  expectedRevision: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(0).max(2147483646))
});

export function formatFee(amountCents: number, currency: string) {
  return `${currency} ${new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amountCents / 100)}`;
}
