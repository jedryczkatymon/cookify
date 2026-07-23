-- CreateIndex
CREATE INDEX "Recipe_createdById_idx" ON "Recipe"("createdById");

-- CreateIndex
CREATE INDEX "Recipe_createdById_createdAt_idx" ON "Recipe"("createdById", "createdAt");
