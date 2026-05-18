import { z } from "zod"

export const CreateStoreInput = z.object({
  name: z.string().min(1).max(200),
  location: z.string().max(500).optional(),
})

export const UpdateStoreInput = CreateStoreInput.partial()

export type CreateStoreInput = z.infer<typeof CreateStoreInput>
export type UpdateStoreInput = z.infer<typeof UpdateStoreInput>
