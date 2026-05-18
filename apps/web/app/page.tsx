import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function RootPage() {
  const session = await auth()
  if (!session) {
    redirect("/sign-in")
  }
  // Feature 2 will add lastActiveBookId lookup.
  // Placeholder until then:
  redirect("/books/placeholder")
}
