ALTER TABLE `uploaded_roms` ADD `is_playlist` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `uploaded_roms` ADD `m3u_content` text;--> statement-breakpoint
ALTER TABLE `uploaded_roms` ADD `parent_m3u_id` integer;
