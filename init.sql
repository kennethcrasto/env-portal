-- complaint_mgmt_full.sql
-- Single-file PostgreSQL schema, sample data, triggers, views, functions, indexes, roles, and audit logging
-- Safe to run in a fresh database. Review before running in production.

BEGIN;

-- ==========================
-- DROP (safe re-run)
-- ==========================
DROP TRIGGER IF EXISTS trg_audit_users ON Users;
DROP TRIGGER IF EXISTS trg_audit_complaints ON Complaints;
DROP TRIGGER IF EXISTS trg_set_complaint_in_progress ON ComplaintAssignments;
DROP TRIGGER IF EXISTS trg_set_complaint_resolved ON ComplaintActions;
DROP TRIGGER IF EXISTS trg_set_complaint_closed_on_feedback ON Feedback;

DROP FUNCTION IF EXISTS audit_table() CASCADE;
DROP FUNCTION IF EXISTS set_complaint_in_progress() CASCADE;
DROP FUNCTION IF EXISTS set_complaint_resolved() CASCADE;
DROP FUNCTION IF EXISTS set_complaint_closed_on_feedback() CASCADE;
DROP FUNCTION IF EXISTS update_complaint_status() CASCADE;
DROP FUNCTION IF EXISTS file_complaint(INT, VARCHAR, TEXT, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS officer_workload(INT) CASCADE;

DROP VIEW IF EXISTS ComplaintSummary CASCADE;
DROP VIEW IF EXISTS FeedbackSummary CASCADE;

DROP TABLE IF EXISTS ComplaintActions, ComplaintAssignments, ComplaintEvidence, Feedback, Complaints, Officers, Users, AuditLog CASCADE;

-- ==========================
-- MAIN TABLES
-- ==========================

CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'citizen',
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Complaints (
    complaint_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    category VARCHAR(100),
    description TEXT,
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ComplaintEvidence (
    evidence_id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL REFERENCES Complaints(complaint_id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Feedback (
    feedback_id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL REFERENCES Complaints(complaint_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Officers (
    officer_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    department VARCHAR(100),
    designation VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ComplaintAssignments (
    assignment_id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL REFERENCES Complaints(complaint_id) ON DELETE CASCADE,
    officer_id INT NOT NULL REFERENCES Officers(officer_id) ON DELETE CASCADE,
    assigned_by INT REFERENCES Users(user_id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ComplaintActions (
    action_id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL REFERENCES Complaints(complaint_id) ON DELETE CASCADE,
    officer_id INT NOT NULL REFERENCES Officers(officer_id) ON DELETE CASCADE,
    action_taken TEXT NOT NULL,
    is_final BOOLEAN DEFAULT FALSE,
    action_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- AUDIT LOG
-- ==========================
CREATE TABLE AuditLog (
    audit_id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation CHAR(1) NOT NULL, -- I = insert, U = update, D = delete
    primary_key JSONB,
    changed_by INT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    row_data JSONB
);

-- ==========================
-- CONSTRAINTS and CHECKs
-- ==========================
ALTER TABLE Users
    ADD CONSTRAINT chk_role CHECK (role IN ('citizen', 'officer', 'admin'));

ALTER TABLE Complaints
    ADD CONSTRAINT chk_status CHECK (status IN ('Pending', 'In Progress', 'Resolved', 'Closed', 'Rejected'));

ALTER TABLE Feedback
    ADD CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5);

-- trigger to update last_updated_at on complaint updates
CREATE OR REPLACE FUNCTION complaints_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_complaints_update_ts
BEFORE UPDATE ON Complaints
FOR EACH ROW
EXECUTE FUNCTION complaints_update_timestamp();

-- ==========================
-- INDEXES
-- ==========================
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON Complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON Complaints(category);
CREATE INDEX IF NOT EXISTS idx_assignments_officer ON ComplaintAssignments(officer_id);
CREATE INDEX IF NOT EXISTS idx_actions_complaint ON ComplaintActions(complaint_id);
CREATE INDEX IF NOT EXISTS idx_feedback_complaint ON Feedback(complaint_id);

-- ==========================
-- VIEWS
-- ==========================
CREATE OR REPLACE VIEW ComplaintSummary AS
SELECT
    c.complaint_id,
    c.category,
    c.description,
    c.location,
    c.status,
    c.submitted_at,
    c.resolved_at,
    c.last_updated_at,
    cu.user_id AS citizen_id,
    cu.name AS citizen_name,
    cu.email AS citizen_email,
    o.officer_id,
    ou.name AS officer_name,
    o.department,
    o.designation
FROM Complaints c
JOIN Users cu ON cu.user_id = c.user_id
LEFT JOIN ComplaintAssignments ca ON ca.complaint_id = c.complaint_id
LEFT JOIN Officers o ON ca.officer_id = o.officer_id
LEFT JOIN Users ou ON o.user_id = ou.user_id;

CREATE OR REPLACE VIEW FeedbackSummary AS
SELECT
    f.feedback_id,
    f.rating,
    f.comments,
    f.submitted_at,
    c.complaint_id,
    cu.name AS citizen_name,
    ou.name AS officer_name
FROM Feedback f
JOIN Complaints c ON f.complaint_id = c.complaint_id
JOIN Users cu ON f.user_id = cu.user_id
LEFT JOIN ComplaintAssignments ca ON ca.complaint_id = c.complaint_id
LEFT JOIN Officers o ON ca.officer_id = o.officer_id
LEFT JOIN Users ou ON o.user_id = ou.user_id;

-- ==========================
-- FUNCTIONS: Business logic
-- ==========================

-- File a complaint helper
CREATE OR REPLACE FUNCTION file_complaint(
    p_user_id INT,
    p_category VARCHAR,
    p_description TEXT,
    p_location VARCHAR
) RETURNS INT AS $$
DECLARE
    new_complaint_id INT;
BEGIN
    INSERT INTO Complaints (user_id, category, description, location)
    VALUES (p_user_id, p_category, p_description, p_location)
    RETURNING complaint_id INTO new_complaint_id;

    RETURN new_complaint_id;
END;
$$ LANGUAGE plpgsql;

-- Officer workload report
CREATE OR REPLACE FUNCTION officer_workload(p_officer_id INT)
RETURNS TABLE (
    officer_name TEXT,
    total_assigned INT,
    resolved INT,
    pending INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.name AS officer_name,
        COUNT(DISTINCT ca.complaint_id) AS total_assigned,
        COUNT(DISTINCT CASE WHEN c.status = 'Resolved' THEN c.complaint_id END) AS resolved,
        COUNT(DISTINCT CASE WHEN c.status != 'Resolved' THEN c.complaint_id END) AS pending
    FROM ComplaintAssignments ca
    JOIN Officers o ON ca.officer_id = o.officer_id
    JOIN Users u ON o.user_id = u.user_id
    JOIN Complaints c ON c.complaint_id = ca.complaint_id
    WHERE o.officer_id = p_officer_id
    GROUP BY u.name;
END;
$$ LANGUAGE plpgsql;

-- ==========================
-- TRIGGERS: lifecycle automation
-- ==========================

-- Trigger 1: set complaint 'In Progress' on assignment
CREATE OR REPLACE FUNCTION set_complaint_in_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Complaints
    SET status = 'In Progress'
    WHERE complaint_id = NEW.complaint_id
      AND status = 'Pending';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_complaint_in_progress
AFTER INSERT ON ComplaintAssignments
FOR EACH ROW
EXECUTE FUNCTION set_complaint_in_progress();

-- Trigger 2: set complaint 'Resolved' on final action (is_final = true)
CREATE OR REPLACE FUNCTION set_complaint_resolved()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_final THEN
        UPDATE Complaints
        SET status = 'Resolved',
            resolved_at = CURRENT_TIMESTAMP
        WHERE complaint_id = NEW.complaint_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_complaint_resolved
AFTER INSERT ON ComplaintActions
FOR EACH ROW
EXECUTE FUNCTION set_complaint_resolved();

-- Trigger 3: close complaint when feedback is added (only if previously resolved)
CREATE OR REPLACE FUNCTION set_complaint_closed_on_feedback()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Complaints
    SET status = 'Closed'
    WHERE complaint_id = NEW.complaint_id
      AND status = 'Resolved';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_complaint_closed_on_feedback
AFTER INSERT ON Feedback
FOR EACH ROW
EXECUTE FUNCTION set_complaint_closed_on_feedback();

-- ==========================
-- AUDIT TRIGGER: logs inserts/updates/deletes to AuditLog
-- ==========================
CREATE OR REPLACE FUNCTION audit_table()
RETURNS TRIGGER AS $$
DECLARE
    pk JSONB;
BEGIN
    -- determine primary key(s) dynamically as JSON
    IF TG_OP = 'INSERT' THEN
        pk = jsonb_build_object('pk', NEW.*)::jsonb; -- convenience (stores row)
        INSERT INTO AuditLog(table_name, operation, primary_key, changed_by, row_data)
        VALUES (TG_TABLE_NAME, 'I', to_jsonb(NEW), NULL, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO AuditLog(table_name, operation, primary_key, changed_by, row_data)
        VALUES (TG_TABLE_NAME, 'U', to_jsonb(NEW), NULL, jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO AuditLog(table_name, operation, primary_key, changed_by, row_data)
        VALUES (TG_TABLE_NAME, 'D', to_jsonb(OLD), NULL, to_jsonb(OLD));
        RETURN OLD;
    END IF;

    RETURN NULL; -- should not happen
END;
$$ LANGUAGE plpgsql;

-- Attach audit trigger to important tables
CREATE TRIGGER trg_audit_users
AFTER INSERT OR UPDATE OR DELETE ON Users
FOR EACH ROW
EXECUTE FUNCTION audit_table();

CREATE TRIGGER trg_audit_complaints
AFTER INSERT OR UPDATE OR DELETE ON Complaints
FOR EACH ROW
EXECUTE FUNCTION audit_table();

-- You can add similar audit triggers on other tables as needed.

-- ==========================
-- SAMPLE DATA
-- ==========================
-- Users
-- USERS
INSERT INTO Users (name, email, phone, role, password_hash)
VALUES
('Ravi Sharma', 'ravi.sharma@example.com', '9876543210', 'citizen', 'hashed_pwd_101'),
('Priya Mehta', 'priya.mehta@example.com', '9812345678', 'citizen', 'hashed_pwd_102'),
('Amit Singh', 'amit.singh@example.com', '9822334455', 'citizen', 'hashed_pwd_103'),
('Neha Patel', 'neha.patel@example.com', '9898989898', 'citizen', 'hashed_pwd_104'),
('Officer Rajeev', 'rajeev.kumar@envdept.gov', '9123456789', 'officer', 'hashed_pwd_105'),
('Officer Anjali', 'anjali.nair@envdept.gov', '9090909090', 'officer', 'hashed_pwd_106'),
('Officer Kiran', 'kiran.das@envdept.gov', '9112233445', 'officer', 'hashed_pwd_107'),
('Officer Meera', 'meera.pillai@envdept.gov', '9001122334', 'officer', 'hashed_pwd_108'),
('Officer Rohit', 'rohit.verma@envdept.gov', '9988776655', 'officer', 'hashed_pwd_109'),
('Admin Raj', 'raj@admin.gov', '9998887777', 'admin', 'hashed_pwd_110')
ON CONFLICT (email) DO NOTHING;

-- OFFICERS
INSERT INTO Officers (user_id, department, designation)
VALUES
(5, 'Pollution Control', 'Inspector'),
(6, 'Waste Management', 'Field Officer'),
(7, 'Water Resources', 'Assistant Inspector'),
(8, 'Public Health', 'Environmental Officer'),
(9, 'Noise Regulation', 'Inspector'),
(5, 'Pollution Control', 'Chief Officer'),
(6, 'Waste Management', 'Supervisor')
ON CONFLICT DO NOTHING;

-- COMPLAINTS
INSERT INTO Complaints (user_id, category, description, location, status)
VALUES
(1, 'Air Pollution', 'Thick smoke from nearby factory', 'Sector 12, Indore', 'Pending'),
(2, 'Garbage Dumping', 'Illegal waste near playground', 'Green Park, Pune', 'In Progress'),
(3, 'Noise Pollution', 'Loud construction work at night', 'Main Street, Sector 5', 'Resolved'),
(4, 'Water Leakage', 'Pipe burst on main road', 'DLF Phase 3, Gurugram', 'Pending'),
(1, 'Plastic Waste', 'Shops using banned plastic bags', 'Navi Mumbai Market', 'In Progress'),
(2, 'Deforestation', 'Unauthorized tree cutting', 'Sector 18, Mumbai', 'Resolved'),
(3, 'Illegal Construction', 'Dumping debris into local pond', 'Sector 10, Chandigarh', 'Pending')
ON CONFLICT DO NOTHING;

-- COMPLAINT EVIDENCE
INSERT INTO ComplaintEvidence (complaint_id, file_path, mime_type)
VALUES
(1, '/evidence/photos/air_factory_smoke.jpg', 'image/jpeg'),
(2, '/evidence/videos/garbage_dumping.mp4', 'video/mp4'),
(3, '/evidence/photos/noise_construction.jpg', 'image/jpeg'),
(4, '/evidence/videos/water_leakage.mp4', 'video/mp4'),
(5, '/evidence/photos/plastic_shops.jpg', 'image/jpeg'),
(6, '/evidence/photos/deforestation_area.jpg', 'image/jpeg'),
(7, '/evidence/videos/illegal_construction.mp4', 'video/mp4')
ON CONFLICT DO NOTHING;

-- COMPLAINT ASSIGNMENTS
INSERT INTO ComplaintAssignments (complaint_id, officer_id, assigned_by)
VALUES
(1, 1, 10),
(2, 2, 10),
(3, 3, 10),
(4, 4, 10),
(5, 5, 10),
(6, 1, 10),
(7, 2, 10)
ON CONFLICT DO NOTHING;

-- COMPLAINT ACTIONS
INSERT INTO ComplaintActions (complaint_id, officer_id, action_taken, is_final)
VALUES
(1, 1, 'Factory owner warned and fined for emissions', TRUE),
(2, 2, 'Municipal waste collection scheduled daily', TRUE),
(3, 3, 'Contractors warned to restrict noisy hours', TRUE),
(4, 4, 'Water department alerted; repair scheduled', FALSE),
(5, 5, 'Shops inspected and banned plastic seized', TRUE),
(6, 1, 'Area inspection done; awaiting forestry report', FALSE),
(7, 2, 'Construction work temporarily stopped', TRUE)
ON CONFLICT DO NOTHING;

-- FEEDBACK
INSERT INTO Feedback (complaint_id, user_id, rating, comments)
VALUES
(1, 1, 5, 'Air quality improved significantly.'),
(2, 2, 4, 'Garbage cleared quickly, good work.'),
(3, 3, 5, 'Noise issue resolved effectively.'),
(4, 4, 3, 'Water leakage fixed but delayed.'),
(5, 1, 4, 'Plastic ban being enforced properly.'),
(6, 2, 2, 'Tree cutting still continues. Needs action.'),
(7, 3, 5, 'Construction halted, environment cleaner.')
ON CONFLICT DO NOTHING;

-- ==========================
-- ROLE-BASED (optional) — create sample roles and grant minimal privileges
-- ==========================
DO $$
BEGIN
    -- Create roles only if they don't exist
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'citizen') THEN
        CREATE ROLE citizen NOINHERIT;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'officer') THEN
        CREATE ROLE officer NOINHERIT;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin_role NOINHERIT;
    END IF;
END$$;

GRANT SELECT, INSERT ON Complaints TO citizen;
GRANT SELECT, INSERT, UPDATE ON ComplaintAssignments TO officer;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO admin_role;

-- ==========================
-- HELPER: convenience queries as SQL functions
-- ==========================
-- Find complaints by status
CREATE OR REPLACE FUNCTION complaints_by_status(p_status VARCHAR)
RETURNS TABLE (complaint_id INT, category TEXT, description TEXT, location TEXT, submitted_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY
    SELECT complaint_id, category, description, location, submitted_at
    FROM Complaints
    WHERE status = p_status
    ORDER BY submitted_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ==========================
-- GRACEFUL COMMIT
-- ==========================
COMMIT;