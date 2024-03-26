/*
  Warnings:

  - You are about to drop the column `clientAddress` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `clientEmail` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `clientFirstName` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `clientLastName` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Client` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientStreet` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Address` DROP COLUMN `clientAddress`,
    ADD COLUMN `clientStreet` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Client` DROP COLUMN `clientEmail`,
    DROP COLUMN `clientFirstName`,
    DROP COLUMN `clientLastName`,
    DROP COLUMN `role`,
    ADD COLUMN `user_id` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Client_user_id_key` ON `Client`(`user_id`);

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
