/*
  Warnings:

  - You are about to drop the column `audioLink` on the `QUESTION` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "QUESTION" DROP COLUMN "audioLink",
ADD COLUMN     "audioURL" TEXT;
