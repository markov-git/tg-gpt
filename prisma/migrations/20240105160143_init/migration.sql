/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Post";

-- CreateTable
CREATE TABLE "USER" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "username" TEXT,

    CONSTRAINT "USER_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QUESTION" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "text" TEXT,
    "audioLink" TEXT,

    CONSTRAINT "QUESTION_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QUESTION" ADD CONSTRAINT "QUESTION_userId_fkey" FOREIGN KEY ("userId") REFERENCES "USER"("id") ON DELETE SET NULL ON UPDATE CASCADE;
