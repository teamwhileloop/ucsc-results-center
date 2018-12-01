-- User Info Showcasing feature
ALTER TABLE `results`.`undergraduate`
ADD COLUMN `user_showcase` INT NULL DEFAULT 0 AFTER `y4s2_credits_non_gpa`;
