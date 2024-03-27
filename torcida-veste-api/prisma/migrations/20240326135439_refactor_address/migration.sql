/*
  Warnings:

  - You are about to drop the column `clientCity` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `clientComplement` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `clientNeighborhood` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `clientNumber` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `clientState` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `clientStreet` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `clientZipCode` on the `Address` table. All the data in the column will be lost.
  - Added the required column `city` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zipCode` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Address` DROP COLUMN `clientCity`,
    DROP COLUMN `clientComplement`,
    DROP COLUMN `clientNeighborhood`,
    DROP COLUMN `clientNumber`,
    DROP COLUMN `clientState`,
    DROP COLUMN `clientStreet`,
    DROP COLUMN `clientZipCode`,
    ADD COLUMN `city` VARCHAR(191) NOT NULL,
    ADD COLUMN `complement` VARCHAR(191) NULL,
    ADD COLUMN `neighborhood` VARCHAR(191) NULL,
    ADD COLUMN `number` VARCHAR(191) NOT NULL,
    ADD COLUMN `state` VARCHAR(191) NOT NULL,
    ADD COLUMN `street` VARCHAR(191) NOT NULL,
    ADD COLUMN `zipCode` VARCHAR(191) NOT NULL;
