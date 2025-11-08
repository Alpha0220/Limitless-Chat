CREATE TABLE `creditTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('purchase','usage','refund','bonus') NOT NULL,
	`amount` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`description` text,
	`messageId` int,
	`stripePaymentId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricingTiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`credits` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`stripePriceId` varchar(255),
	`isActive` boolean DEFAULT true,
	`isPopular` boolean DEFAULT false,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pricingTiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `aiModels` ADD `creditCost` int NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `creditsUsed` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `credits` int DEFAULT 0 NOT NULL;