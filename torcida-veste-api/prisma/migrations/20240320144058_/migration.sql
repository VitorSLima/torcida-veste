/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `clientCpf` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `clientEmail` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `clientFirstName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `clientLastName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `clientPhone` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Order` DROP FOREIGN KEY `Order_client_id_fkey`;

-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    DROP COLUMN `clientCpf`,
    DROP COLUMN `clientEmail`,
    DROP COLUMN `clientFirstName`,
    DROP COLUMN `clientLastName`,
    DROP COLUMN `clientPhone`,
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `password` VARCHAR(191) NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- CreateTable
CREATE TABLE `Client` (
    `id` VARCHAR(191) NOT NULL,
    `clientFirstName` VARCHAR(191) NOT NULL,
    `clientLastName` VARCHAR(191) NOT NULL,
    `clientEmail` VARCHAR(191) NOT NULL,
    `clientCpf` VARCHAR(191) NOT NULL,
    `clientPhone` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'CLIENT') NOT NULL,

    UNIQUE INDEX `Client_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
