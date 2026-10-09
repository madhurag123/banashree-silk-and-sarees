ALTER TABLE `carts` ADD `revision` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `cart_revision` text;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_cart_revision_unique` ON `orders` (`cart_revision`);