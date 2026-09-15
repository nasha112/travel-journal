-- DropForeignKey
ALTER TABLE `blogs` DROP FOREIGN KEY `blogs_location_id_fkey`;

-- DropIndex
DROP INDEX `blogs_location_id_key` ON `blogs`;

-- CreateIndex
CREATE INDEX `blogs_location_id_idx` ON `blogs`(`location_id`);

-- AddForeignKey
ALTER TABLE `trip_days` ADD CONSTRAINT `trip_days_trip_id_fkey` FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
