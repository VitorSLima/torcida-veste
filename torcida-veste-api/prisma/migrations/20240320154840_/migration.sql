/*
  Warnings:

  - You are about to drop the column `body` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Image` table. All the data in the column will be lost.
  - The values [RECEBIDO,EM_PROCESSAMENTO,ENVIADO,CONCLUIDO,CANCELADO] on the enum `Order_order_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `coupon` on the `OrderItem` table. All the data in the column will be lost.
  - Added the required column `address_id` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_Cover` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coupon_id` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `OrderItem` DROP FOREIGN KEY `OrderItem_coupon_fkey`;

-- AlterTable
ALTER TABLE `Client` ADD COLUMN `address_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Image` DROP COLUMN `body`,
    DROP COLUMN `created_at`,
    DROP COLUMN `status`,
    DROP COLUMN `user_id`,
    ADD COLUMN `is_Cover` BOOLEAN NOT NULL,
    ADD COLUMN `key` VARCHAR(191) NOT NULL,
    ADD COLUMN `url` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Order` MODIFY `order_status` ENUM('RECEIVED', 'PROCESSING', 'SENT', 'CONCLUDED', 'CANCELED') NOT NULL;

-- AlterTable
ALTER TABLE `OrderItem` DROP COLUMN `coupon`,
    ADD COLUMN `coupon_id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `Address`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_coupon_id_fkey` FOREIGN KEY (`coupon_id`) REFERENCES `Coupon`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
