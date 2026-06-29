import { z } from 'zod';

const requiredText = z.string().trim().min(1);
const isoDateTime = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value).toISOString());

export const createTripRequestSchema = z
  .object({
    requesterName: requiredText.max(150),
    origin: requiredText.max(150),
    destination: requiredText.max(150),
    departureAt: isoDateTime,
    returnAt: isoDateTime,
    purpose: requiredText,
    passengerCount: z.number().int().positive(),
  })
  .strict()
  .refine(
    (input) =>
      new Date(input.returnAt).getTime() >=
      new Date(input.departureAt).getTime(),
    { path: ['returnAt'] },
  );

export const tripRequestIdParamsSchema = z.object({
  id: z.uuid(),
});
