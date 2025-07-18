-- AlterEnum
ALTER TYPE "OnboardingStatus" ADD VALUE 'INITIATED';

-- AlterTable
ALTER TABLE "TenantOnboardingSession" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
