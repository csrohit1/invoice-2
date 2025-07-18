/*
  Warnings:

  - A unique constraint covering the columns `[authId]` on the table `UserProfile` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `expiresAt` on the `EmailVerificationToken` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserProfile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPEPR_ADMIN';

-- DropIndex
DROP INDEX "UserProfile_authId_tenantId_key";

-- AlterTable
ALTER TABLE "EmailVerificationToken" DROP COLUMN "expiresAt",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "contactPersonName" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "supportEmail" TEXT,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "authId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantOnboardingSession" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gstNumber" TEXT,
    "planId" TEXT NOT NULL,
    "paymentId" TEXT,
    "cashfreeOrderId" TEXT NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactPersonName" TEXT,
    "supportEmail" TEXT,
    "website" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "country" TEXT,

    CONSTRAINT "TenantOnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "cashfreeOrderId" TEXT NOT NULL,

    CONSTRAINT "TenantSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "description" TEXT,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_authId_key" ON "PasswordResetToken"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantOnboardingSession_cashfreeOrderId_key" ON "TenantOnboardingSession"("cashfreeOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSubscription_cashfreeOrderId_key" ON "TenantSubscription"("cashfreeOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_authId_key" ON "UserProfile"("authId");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_authId_fkey" FOREIGN KEY ("authId") REFERENCES "Auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantOnboardingSession" ADD CONSTRAINT "TenantOnboardingSession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
