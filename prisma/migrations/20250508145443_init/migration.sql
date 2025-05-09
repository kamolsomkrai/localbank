/*
  Warnings:

  - You are about to drop the column `customerId` on the `Account` table. All the data in the column will be lost.
  - Added the required column `accountName` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cid` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prefix` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_customerId_fkey";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "customerId",
ADD COLUMN     "accountName" TEXT NOT NULL,
ADD COLUMN     "cid" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "prefix" TEXT NOT NULL;
