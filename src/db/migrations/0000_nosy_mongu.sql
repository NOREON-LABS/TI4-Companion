CREATE TABLE `game_planets` (
	`game_id` integer NOT NULL,
	`planet_id` text NOT NULL,
	PRIMARY KEY(`game_id`, `planet_id`),
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `game_techs` (
	`game_id` integer NOT NULL,
	`tech_id` text NOT NULL,
	PRIMARY KEY(`game_id`, `tech_id`),
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`faction_id` text,
	`enabled_content` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
