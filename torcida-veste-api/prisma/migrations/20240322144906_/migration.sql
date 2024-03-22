/*
  Warnings:

  - You are about to drop the column `coupon_id` on the `OrderItem` table. All the data in the column will be lost.
  - Added the required column `expiration_at` to the `Coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupon_id` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `OrderItem` DROP FOREIGN KEY `OrderItem_coupon_id_fkey`;

-- AlterTable
ALTER TABLE `Coupon` ADD COLUMN `expiration_at` VARCHAR(191) NOT NULL,
    ADD COLUMN `value` DOUBLE NULL;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `coupon_id` VARCHAR(191) NOT NULL,
    MODIFY `created_at` VARCHAR(191) NOT NULL,
    MODIFY `updated_at` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `OrderItem` DROP COLUMN `coupon_id`;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_coupon_id_fkey` FOREIGN KEY (`coupon_id`) REFERENCES `Coupon`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
