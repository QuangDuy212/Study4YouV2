-- Study4YouV2: Fill Analytics Data Patch
-- Use this script to quickly populate random tests for the last 30 days
-- Highlight and execute in your DB client (pgAdmin, DBeaver, IntelliJ Database tool, etc.)

DO $$
DECLARE
    v_user_id UUID;
    v_test_id UUID;
    i INT;
    d INT;
    v_time TIMESTAMP;
    v_count INT;
BEGIN
    -- Get a sample user and test
    SELECT id INTO v_user_id FROM users LIMIT 1;
    SELECT id INTO v_test_id FROM toeic_tests LIMIT 1;

    IF v_user_id IS NULL OR v_test_id IS NULL THEN
        RAISE NOTICE 'Cannot insert dummy data: No users or tests found in database.';
        RETURN;
    END IF;

    -- Loop over the last 30 days
    FOR d IN 0..30 LOOP
        -- Random number of attempts per day (between 3 and 10 for super high density)
        v_count := floor(random() * 8) + 3;
        
        FOR i IN 1..v_count LOOP
            -- Create a randomized time within that day
            v_time := NOW() - (d || ' days')::INTERVAL - (floor(random() * 23) || ' hours')::INTERVAL - (floor(random() * 59) || ' minutes')::INTERVAL;
            
            INSERT INTO toeic_attempts (
                id, 
                created_at, 
                updated_at, 
                started_at, 
                submitted_at, 
                test_id, 
                user_id, 
                raw_score, 
                toeic_score
            ) VALUES (
                gen_random_uuid(),
                v_time,
                v_time,
                v_time,
                v_time + '45 minutes'::INTERVAL + (floor(random() * 60) || ' minutes')::INTERVAL,
                v_test_id,
                v_user_id,
                floor(random() * 140) + 60,
                floor(random() * 700) + 200
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Successfully generated test attempt density!';
END $$;
