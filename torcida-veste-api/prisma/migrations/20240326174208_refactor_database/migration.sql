/*
  Warnings:

  - You are about to drop the column `client_id` on the `Order` table. All the data in the column will be lost.
  - The values [CLIENT] on the enum `User_role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `person_id` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Client` DROP FOREIGN KEY `Client_address_id_fkey`;

-- DropForeignKey
ALTER TABLE `Client` DROP FOREIGN KEY `Client_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `Order` DROP FOREIGN KEY `Order_client_id_fkey`;

-- AlterTable
ALTER TABLE `Order` DROP COLUMN `client_id`,
    ADD COLUMN `person_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('ADMIN', 'USER') NULL;

-- DropTable
DROP TABLE `Client`;

-- CreateTable
CREATE TABLE `Person` (
    `id` VARCHAR(191) NOT NULL,
    `document` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `address_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Person_id_key`(`id`),
    UNIQUE INDEX `Person_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Person` ADD CONSTRAINT `Person_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Person` ADD CONSTRAINT `Person_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `Address`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
