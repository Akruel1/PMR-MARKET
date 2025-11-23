-- CreateTable
CREATE TABLE "BroadcastTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BroadcastTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BroadcastTemplate_createdAt_idx" ON "BroadcastTemplate"("createdAt");
