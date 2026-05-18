import { z } from "zod"

export const CreateObservationInput = z.object({
  genericItemId: z.string().cuid(),
  storeId: z.string().cuid().optional(),
  storeRaw: z.string().max(200).optional(),
  brand: z.string().max(200).optional(),
  productName: z.string().min(1).max(500),
  barcode: z.string().max(50).optional(),
  totalPrice: z.number().positive(),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  isOnSale: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  observedAt: z.string().datetime().optional(),
})

export const UpdateObservationInput = CreateObservationInput.partial().omit({
  genericItemId: true,
})

export const ObservationQueryParams = z.object({
  itemId: z.string().cuid().optional(),
  best: z.enum(["true", "false"]).optional(),
  storeId: z.string().cuid().optional(),
  barcode: z.string().optional(),
  since: z.string().datetime().optional(),
  recordedBy: z.string().optional(),
})

export type CreateObservationInput = z.infer<typeof CreateObservationInput>
export type UpdateObservationInput = z.infer<typeof UpdateObservationInput>
export type ObservationQueryParams = z.infer<typeof ObservationQueryParams>
