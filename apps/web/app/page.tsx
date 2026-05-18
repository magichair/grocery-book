import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@grocery-book/db"

export default async function RootPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  const userId = session.user.id

  // Check if there's a last-active book preference
  const prefs = await prisma.userPreference.findUnique({
    where: { userId },
    select: { lastActiveBookId: true },
  })

  if (prefs?.lastActiveBookId) {
    // Verify user is still a member of that book
    const membership = await prisma.bookMember.findFirst({
      where: {
        bookId: prefs.lastActiveBookId,
        userId,
        acceptedAt: { not: null },
      },
    })
    if (membership) {
      redirect(`/books/${prefs.lastActiveBookId}`)
    }
  }

  // Fall back to their first book
  const firstMembership = await prisma.bookMember.findFirst({
    where: { userId, acceptedAt: { not: null } },
    orderBy: { book: { createdAt: "asc" } },
    select: { bookId: true },
  })

  if (firstMembership) {
    redirect(`/books/${firstMembership.bookId}`)
  }

  // No books yet — go to onboarding
  redirect("/books/new")
}
