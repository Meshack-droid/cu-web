-- TECUMP / TUMCU event schema repair
-- Safe for MySQL 8.0.29+ (including MySQL 8.0.46).
-- Adds only optional event columns that may be missing when an older
-- database was created before the operational event migration completed.

SET NAMES utf8mb4;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status ENUM('draft','budgeted','approved','registration_open','ongoing','completed','archived')
    NOT NULL DEFAULT 'draft' AFTER organized_by,
  ADD COLUMN IF NOT EXISTS capacity INT NULL AFTER status,
  ADD COLUMN IF NOT EXISTS registration_deadline DATETIME NULL AFTER capacity;

CREATE INDEX IF NOT EXISTS idx_events_public_schedule
  ON events (status, start_at);

CREATE INDEX IF NOT EXISTS idx_events_location_date
  ON events (location, start_at);
