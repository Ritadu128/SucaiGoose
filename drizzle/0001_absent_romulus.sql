CREATE TABLE `generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`referenceImageUrl` text NOT NULL,
	`styleAnalysis` json,
	`status` enum('pending','analyzing','generating','done','error') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`generationId` int NOT NULL,
	`type` enum('main_title','sub_title','tip_box','divider','decoration') NOT NULL,
	`label` varchar(128),
	`imageUrl` text NOT NULL,
	`prompt` text,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
);
