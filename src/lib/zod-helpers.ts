import { z } from "zod";

// Empty string inputs from optional numeric form fields must become undefined,
// not coerce to 0 — the field is genuinely optional.
const emptyToUndefined = (val: unknown) =>
  val === "" || val === null || val === undefined ? undefined : val;

export function optionalNonNegativeNumber(message = "El valor no puede ser negativo.") {
  return z.preprocess(emptyToUndefined, z.coerce.number().min(0, message)).optional();
}

export function optionalNonNegativeInt(message = "El valor no puede ser negativo.") {
  return z.preprocess(emptyToUndefined, z.coerce.number().int().min(0, message)).optional();
}
