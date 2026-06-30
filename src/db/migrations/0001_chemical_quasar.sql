CREATE TABLE `game_pins` (
	`game_id` integer NOT NULL,
	`tech_id` text NOT NULL,
	PRIMARY KEY(`game_id`, `tech_id`),
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `game_queue` (
	`game_id` integer NOT NULL,
	`tech_id` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`game_id`, `tech_id`),
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
