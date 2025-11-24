-- DropIndex
DROP INDEX "Category_slug_idx";

-- DropIndex
DROP INDEX "City_slug_idx";

-- AlterTable
ALTER TABLE "Ad" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
