-- CreateTable
CREATE TABLE "InterestCalculationLog" (
    "id" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "periodIdentifier" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staffId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "accountsAffected" INTEGER NOT NULL,
    "totalInterestPaid" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "InterestCalculationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterestCalculationLog_periodIdentifier_key" ON "InterestCalculationLog"("periodIdentifier");

-- AddForeignKey
ALTER TABLE "InterestCalculationLog" ADD CONSTRAINT "InterestCalculationLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
