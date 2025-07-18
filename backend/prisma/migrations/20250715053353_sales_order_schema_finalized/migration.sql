/*
  Warnings:

  - Added the required column `amount` to the `SalesOrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "hsnOrSacCode" TEXT,
ALTER COLUMN "taxRate" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "placeOfSupply" TEXT,
ADD COLUMN     "subTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SalesOrderItem" ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "hsnOrSacCode" TEXT;
