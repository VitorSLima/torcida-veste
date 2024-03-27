-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_address_id_fkey`;

-- AlterTable
ALTER TABLE `User` MODIFY `address_id` VARCHAR(191) NULL,
    MODIFY `document` VARCHAR(191) NULL,
    MODIFY `phone` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `Address`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
