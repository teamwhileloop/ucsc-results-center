USE results;
DROP FUNCTION IF EXISTS accessControl;
DELIMITER //

CREATE FUNCTION accessControl (requestorIndex INT, requesteeIndex INT)
RETURNS INT

BEGIN
	DECLARE privacyCode VARCHAR(20);
    
    -- Assign variables
    SELECT `privacy` INTO privacyCode FROM `undergraduate` WHERE `indexNumber`=requesteeIndex;
    
    -- Check 
    CASE privacyCode
		WHEN 'public' THEN RETURN 1;
		WHEN 'private' THEN
			BEGIN
				IF requestorIndex = requesteeIndex THEN
					RETURN 1; 
				ELSE 
					RETURN 0;
                END IF;
            END;
		WHEN 'shared' THEN
			BEGIN
				IF SUBSTRING(requestorIndex,1,2) = SUBSTRING(requesteeIndex,1,2) THEN
					RETURN 1; 
				ELSE 
					RETURN 0;
                END IF;
            END;
        ELSE RETURN 1;
	END CASE;

END; //

DELIMITER ;