/*
  Warnings:

  - Added the required column `role` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ADMIN', 'STAFF');

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "role" "RoleType" NOT NULL;
