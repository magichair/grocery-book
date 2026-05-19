-- CreateTable
CREATE TABLE "BookInvite" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "role" "BookMemberRole" NOT NULL DEFAULT 'EDITOR',
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "claimedBy" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookInvite_token_key" ON "BookInvite"("token");

-- CreateIndex
CREATE INDEX "BookInvite_bookId_idx" ON "BookInvite"("bookId");

-- CreateIndex
CREATE INDEX "BookInvite_token_idx" ON "BookInvite"("token");

-- AddForeignKey
ALTER TABLE "BookInvite" ADD CONSTRAINT "BookInvite_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookInvite" ADD CONSTRAINT "BookInvite_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
