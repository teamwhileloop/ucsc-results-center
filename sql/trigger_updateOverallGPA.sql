DELIMITER //
DROP TRIGGER IF EXISTS `updateOverallGPA`//
CREATE TRIGGER `updateOverallGPA`
    BEFORE UPDATE ON `undergraduate`
    FOR EACH ROW
BEGIN
    IF (OLD.updated_date = NEW.updated_date) THEN
		SET NEW.gpa = (
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
        SET NEW.gpa_diff = NEW.gpa - coalesce(OLD.gpa, 0);
    END IF;
END//
DELIMITER ;