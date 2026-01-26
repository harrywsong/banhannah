-- CreateTable
CREATE TABLE "UserFileAccess" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,
    "accessType" TEXT NOT NULL DEFAULT 'download',
    "firstAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "UserFileAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFileAccess_userId_fileId_key" ON "UserFileAccess"("userId", "fileId");

-- CreateIndex
CREATE INDEX "UserFileAccess_userId_idx" ON "UserFileAccess"("userId");

-- CreateIndex
CREATE INDEX "UserFileAccess_fileId_idx" ON "UserFileAccess"("fileId");

-- AddForeignKey
ALTER TABLE "UserFileAccess" ADD CONSTRAINT "UserFileAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFileAccess" ADD CONSTRAINT "UserFileAccess_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;