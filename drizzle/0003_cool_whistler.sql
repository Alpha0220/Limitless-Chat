CREATE TABLE `monthlyBilling` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`creditsUsed` int NOT NULL DEFAULT 0,
	`amountCharged` decimal(10,2) NOT NULL DEFAULT '0.00',
	`stripeInvoiceId` varchar(255),
	`status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthlyBilling_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `creditTransactions` MODIFY COLUMN `type` enum('purchase','usage','refund','bonus','auto_charge') NOT NULL;--> statement-breakpoint
ALTER TABLE `pricingTiers` ADD `pricePerCredit` decimal(10,4) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `billingType` enum('prepaid','payg') DEFAULT 'prepaid' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripePaymentMethodId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `monthlySpendingCap` decimal(10,2) DEFAULT '100.00';