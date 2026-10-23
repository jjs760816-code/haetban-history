CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`secret` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`role` text NOT NULL,
	`student_id` text,
	`expires` integer NOT NULL
);
