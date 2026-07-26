-- CreateTable
CREATE TABLE "ShoppingCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "product" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShoppingCheck_userId_date_idx" ON "ShoppingCheck"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingCheck_userId_date_product_unit_key" ON "ShoppingCheck"("userId", "date", "product", "unit");

-- AddForeignKey
ALTER TABLE "ShoppingCheck" ADD CONSTRAINT "ShoppingCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;
