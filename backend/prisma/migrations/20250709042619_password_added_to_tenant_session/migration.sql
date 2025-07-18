/*
  Warnings:

  - Added the required column `password` to the `TenantOnboardingSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TenantOnboardingSession" ADD COLUMN     "password" TEXT NOT NULL;
