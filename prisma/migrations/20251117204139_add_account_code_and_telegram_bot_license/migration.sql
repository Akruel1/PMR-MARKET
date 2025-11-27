-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountCode" TEXT,
ADD COLUMN     "telegramBotLicenseAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegramBotLicenseAcceptedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_accountCode_key" ON "User"("accountCode");




















