/*
  Warnings:

  - You are about to drop the column `address_id` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `pricePromo` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `Person` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `address_id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `document` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Order` DROP FOREIGN KEY `Order_address_id_fkey`;

-- DropForeignKey
ALTER TABLE `Order` DROP FOREIGN KEY `Order_person_id_fkey`;

-- DropForeignKey
ALTER TABLE `Person` DROP FOREIGN KEY `Person_address_id_fkey`;

-- DropForeignKey
ALTER TABLE `Person` DROP FOREIGN KEY `Person_user_id_fkey`;

-- AlterTable
ALTER TABLE `Order` DROP COLUMN `address_id`;

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `pricePromo`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `address_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `document` VARCHAR(191) NOT NULL,
    ADD COLUMN `phone` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `Person`;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `Address`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
