-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportTemplate_tenantId_idx" ON "ReportTemplate"("tenantId");

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
