-- ==========================================================
-- Course Learning & Payment Schema
-- Study4YouV2 — Migration Reference Script
-- Note: JPA ddl-auto=update will auto-create these tables.
--       This script is for manual inspection / fresh DB setup.
-- ==========================================================

-- Courses
CREATE TABLE IF NOT EXISTS courses (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        VARCHAR(255)   NOT NULL,
    description  TEXT,
    price        NUMERIC(12,2)  NOT NULL DEFAULT 0,
    thumbnail_url VARCHAR(512),
    status       VARCHAR(20)    NOT NULL DEFAULT 'DRAFT',
    created_at   TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_title  ON courses USING gin(to_tsvector('english', title));

-- Sections
CREATE TABLE IF NOT EXISTS sections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sections_course ON sections(course_id);

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_id  UUID REFERENCES sections(id) ON DELETE SET NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    video_url   VARCHAR(512),
    duration    INT NOT NULL DEFAULT 0,
    order_index INT NOT NULL DEFAULT 0,
    is_preview  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lessons_course  ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_section ON lessons(section_id);

-- Enrollments (unique per user+course)
CREATE TABLE IF NOT EXISTS enrollments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress    INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP,
    CONSTRAINT uq_enrollment UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_user   ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    amount          NUMERIC(12,2) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method  VARCHAR(20) NOT NULL DEFAULT 'MOCK',
    transaction_ref VARCHAR(128),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_user   ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_course ON payments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
