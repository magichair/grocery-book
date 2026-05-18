import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@grocery-book/db"
import BookHeader from "@/components/book-header"
import type { ReactNode } from "react"

type Props = {
  children: ReactNode
  params: Promise<{ bookId: string }>
}

export default async function BookLayout({ children, params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const { bookId } = await params

  const membership = await prisma.bookMember.findFirst({
    where: {
      bookId,
      userId: session.user.id,
      acceptedAt: { not: null },
    },
    include: {
      book: { select: { name: true } },
    },
  })

  if (!membership) redirect("/")

  return (
    <>
      <BookHeader
        bookId={bookId}
        bookName={membership.book.name}
        userId={session.user.id}
      />
      <div className="pt-14">{children}</div>
    </>
  )
}
