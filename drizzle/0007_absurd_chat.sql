CREATE TABLE `personalizationMemories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`memoryType` enum('user_preference','conversation_context','learned_info') NOT NULL,
	`content` text NOT NULL,
	`source` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personalizationMemories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `userSettings` ADD `styleTone_baseTone` enum('formal','friendly','concise','detailed') DEFAULT 'friendly';--> statement-breakpoint
ALTER TABLE `userSettings` ADD `styleTone_additionalPreferences` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `nickname` varchar(50);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `occupation` varchar(100);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `aboutUser_interests` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `aboutUser_values` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `aboutUser_communicationPreferences` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `memorySettings_allowSavedMemory` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `chatHistorySettings_allowReferenceHistory` boolean DEFAULT true;