import { z } from "zod"

export const UpdateMeInput = z.object({
  name: z.string().min(1).max(200).optional(),
})

export const UpdatePreferencesInput = z.object({
  lastActiveBookId: z.string().cuid().nullable().optional(),
})

export type UpdateMeInput = z.infer<typeof UpdateMeInput>
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesInput>
