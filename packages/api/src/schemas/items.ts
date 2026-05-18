import { z } from "zod"

export const CreateItemInput = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
})

export const UpdateItemInput = CreateItemInput.partial()

export const ItemQueryParams = z.object({
  q: z.string().optional(),
})

export type CreateItemInput = z.infer<typeof CreateItemInput>
export type UpdateItemInput = z.infer<typeof UpdateItemInput>
export type ItemQueryParams = z.infer<typeof ItemQueryParams>
