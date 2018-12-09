-- Feedback recording
CREATE TABLE `resultsdev`.`feedback` (
  `feedback_id` INT NOT NULL AUTO_INCREMENT,
  `fbid` VARCHAR(100) NOT NULL,
  `text` VARCHAR(3000) CHARACTER SET 'utf8' NOT NULL,
  `state` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`feedback_id`));
