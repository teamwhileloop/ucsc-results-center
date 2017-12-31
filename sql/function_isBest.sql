USE results;
DROP FUNCTION IF EXISTS isBest;
DELIMITER //

CREATE FUNCTION isBest ( resultId INT)
RETURNS INT

BEGIN
	DECLARE userIndexNumber INT;
	DECLARE subjectCode VARCHAR(20);
	DECLARE currentGrade VARCHAR(20);
	DECLARE currentExamYear INT;
    DECLARE perfectMatch INT;
    
    -- Assign variables
    SELECT `index`, `subject`, `grade`, `examYear` INTO userIndexNumber, subjectCode, currentGrade, currentExamYear FROM `result` WHERE `id`=resultId;
    
    -- Matching
    SELECT `grade` = currentGrade AND `examYear` = currentExamYear INTO perfectMatch
    FROM `result` WHERE `index` = userIndexNumber AND `subject` = subjectCode order by case 
		WHEN `grade`='A+' THEN 4.25  
		WHEN `grade`='A'   THEN 4.0 
		WHEN `grade`='A-'  THEN 3.75 

		WHEN `grade`='B+' THEN 3.25 
		WHEN `grade`='B' 	 THEN 3.0 
		WHEN `grade`='B-'  THEN 2.75 

		WHEN `grade`='C+' THEN 2.25
		WHEN `grade`='C'   THEN 2.0
		WHEN `grade`='C-'  THEN 1.75

		WHEN `grade`='D+' THEN 1.25 
		WHEN `grade`='D'   THEN 1.0 
		WHEN `grade`='D-'  THEN 0.75

		WHEN `grade`='E' THEN 0.5 
		WHEN `grade`='F' THEN 0.4
		
		ELSE 0 
    END
	DESC LIMIT 1;

	RETURN perfectMatch;
END; //

DELIMITER ;