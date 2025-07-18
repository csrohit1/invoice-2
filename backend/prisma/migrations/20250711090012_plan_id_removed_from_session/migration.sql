/*
  Warnings:

  - You are about to drop the column `planId` on the `TenantOnboardingSession` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TenantOnboardingSession" DROP CONSTRAINT "TenantOnboardingSession_planId_fkey";

-- AlterTable
ALTER TABLE "TenantOnboardingSession" DROP COLUMN "planId";
