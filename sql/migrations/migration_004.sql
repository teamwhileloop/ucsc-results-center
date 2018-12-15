-- Subjectwise stats
USE `results`;
DROP PROCEDURE IF EXISTS `subjectwise_stat`;
DELIMITER //
CREATE PROCEDURE subjectwise_stat
(IN subjectCode VARCHAR(12), IN pattern VARCHAR(2))
BEGIN
	DECLARE total INT;
	DECLARE total_all INT;
	SELECT COUNT(grade) INTO total FROM result WHERE `subject`= subjectCode AND `index` LIKE CONCAT(pattern, '%');
	SELECT COUNT(grade) INTO total_all FROM result WHERE `subject`= subjectCode;
	SELECT B.`grade`, A.`batch_count`, A.`batch_perc`, B.`overall_count`, B.`overall_perc` FROM (
		SELECT COUNT(grade) as overall_count, COUNT(grade)*100/total_all as overall_perc, grade FROM result WHERE `subject`= subjectCode GROUP BY grade
	) as B
    LEFT JOIN (
		SELECT COUNT(grade) as batch_count, COUNT(grade)*100/total as batch_perc, grade FROM result WHERE `subject`= subjectCode AND `index` LIKE CONCAT(pattern, '%') GROUP BY grade
	) as A
    ON B.`grade` =  A.`grade`;
END //
DELIMITER ;