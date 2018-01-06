DELIMITER //
DROP TRIGGER IF EXISTS `updateOverallGPA`//
CREATE TRIGGER `updateOverallGPA`
    BEFORE UPDATE ON `undergraduate`
    FOR EACH ROW
BEGIN
	DECLARE calculatedGpa FLOAT;
    IF (OLD.updated_date = NEW.updated_date) THEN
		SET calculatedGpa = (
														(coalesce(NEW.y1s1_gpa, 0) * coalesce(NEW.y1s1_credits, 0)) +
														(coalesce(NEW.y1s2_gpa, 0) * coalesce(NEW.y1s2_credits, 0)) +
														(coalesce(NEW.y2s1_gpa, 0) * coalesce(NEW.y2s1_credits, 0)) +
														(coalesce(NEW.y2s2_gpa, 0) * coalesce(NEW.y2s2_credits, 0)) +
														(coalesce(NEW.y3s1_gpa, 0) * coalesce(NEW.y3s1_credits, 0)) +
														(coalesce(NEW.y3s2_gpa, 0) * coalesce(NEW.y3s2_credits, 0)) +
														(coalesce(NEW.y4s1_gpa, 0) * coalesce(NEW.y4s1_credits, 0)) +
														(coalesce(NEW.y4s2_gpa, 0) * coalesce(NEW.y4s2_credits, 0))
													) / (
														coalesce(NEW.y1s1_credits, 0) + 
														coalesce(NEW.y1s2_credits, 0) + 
														coalesce(NEW.y2s1_credits, 0) + 
														coalesce(NEW.y2s2_credits, 0) + 
														coalesce(NEW.y3s1_credits, 0) + 
														coalesce(NEW.y3s2_credits, 0) + 
														coalesce(NEW.y4s1_credits, 0) + 
														coalesce(NEW.y4s2_credits, 0)
													);
                                                    
        SET NEW.gpa = calculatedGpa;
		SET NEW.credits = (
														coalesce(NEW.y1s1_credits, 0) + 
														coalesce(NEW.y1s2_credits, 0) + 
														coalesce(NEW.y2s1_credits, 0) + 
														coalesce(NEW.y2s2_credits, 0) + 
														coalesce(NEW.y3s1_credits, 0) + 
														coalesce(NEW.y3s2_credits, 0) + 
														coalesce(NEW.y4s1_credits, 0) + 
														coalesce(NEW.y4s2_credits, 0)
													);
		SET NEW.credits_non_gpa = (
														coalesce(NEW.y1s1_credits_non_gpa, 0) + 
														coalesce(NEW.y1s2_credits_non_gpa, 0) + 
														coalesce(NEW.y2s1_credits_non_gpa, 0) + 
														coalesce(NEW.y2s2_credits_non_gpa, 0) + 
														coalesce(NEW.y3s1_credits_non_gpa, 0) + 
														coalesce(NEW.y3s2_credits_non_gpa, 0) + 
														coalesce(NEW.y4s1_credits_non_gpa, 0) + 
														coalesce(NEW.y4s2_credits_non_gpa, 0)
													);
	    SET NEW.updated_date = NOW();
        
        IF (OLD.gpa != calculatedGpa) THEN
			SET NEW.gpa_diff = calculatedGpa - coalesce(OLD.gpa, 0);
		END IF;
        
        IF (OLD.rank != NEW.rank) THEN
			SET NEW.rank_diff = coalesce(NEW.RANK, 0) - coalesce(OLD.rank, 0);
		END IF;
        
    END IF;
END//
DELIMITER ;