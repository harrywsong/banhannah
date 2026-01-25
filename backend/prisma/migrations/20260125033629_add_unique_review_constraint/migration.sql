/*
  Warnings:

  - A unique constraint covering the columns `[userId,itemType,itemId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_itemType_itemId_key" ON "Review"("userId", "itemType", "itemId");
