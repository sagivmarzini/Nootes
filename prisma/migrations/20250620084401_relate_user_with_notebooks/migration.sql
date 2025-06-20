-- AlterTable
ALTER TABLE "Notebook" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Notebook" ADD CONSTRAINT "Notebook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
