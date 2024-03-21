-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('ADMIN', 'CLIENT') NULL,
    MODIFY `password` VARCHAR(191) NULL;
