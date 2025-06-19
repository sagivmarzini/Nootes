/*
  Warnings:

  - You are about to drop the `Transcript` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "NotebookStatus" AS ENUM ('pending', 'transcribing', 'summarizing', 'completed', 'failed');

-- DropTable
DROP TABLE "Transcript";

-- CreateTable
CREATE TABLE "Notebook" (
    "id" SERIAL NOT NULL,
    "status" "NotebookStatus" NOT NULL DEFAULT 'pending',
    "transcription" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notebook_pkey" PRIMARY KEY ("id")
);
