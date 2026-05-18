import { z } from "zod"

export const BookVisibilityEnum = z.enum(["PRIVATE", "INVITE_ONLY"])

export const CreateBookInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  visibility: BookVisibilityEnum.default("INVITE_ONLY"),
})

export const UpdateBookInput = CreateBookInput.partial()

export const InviteMemberInput = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]).default("EDITOR"),
})

export const AcceptInviteInput = z.object({
  action: z.literal("accept"),
})

export type BookVisibility = z.infer<typeof BookVisibilityEnum>
export type CreateBookInput = z.infer<typeof CreateBookInput>
export type UpdateBookInput = z.infer<typeof UpdateBookInput>
export type InviteMemberInput = z.infer<typeof InviteMemberInput>
export type AcceptInviteInput = z.infer<typeof AcceptInviteInput>
