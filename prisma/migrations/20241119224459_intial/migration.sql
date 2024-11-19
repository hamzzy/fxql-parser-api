-- CreateTable
CREATE TABLE "FXQLStatement" (
    "id" SERIAL NOT NULL,
    "sourceCurrency" VARCHAR(3) NOT NULL,
    "destinationCurrency" VARCHAR(3) NOT NULL,
    "buyPrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "capAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FXQLStatement_pkey" PRIMARY KEY ("id")
);
