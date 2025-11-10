CREATE TABLE `generatedImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`prompt` text NOT NULL,
	`imageUrl` text NOT NULL,
	`model` varchar(100) NOT NULL DEFAULT 'fal-ai/flux/schnell',
	`imageSize` varchar(50),
	`width` int,
	`height` int,
	`creditsUsed` int NOT NULL DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generatedImages_id` PRIMARY KEY(`id`)
);
