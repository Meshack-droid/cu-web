-- TECUMP / TUMCU schema consistency repair
-- Idempotent recovery for databases initialized from an older release where
-- security hardening was not recorded/applied. Safe to run repeatedly.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_login_attempts SMALLINT NOT NULL DEFAULT 0 AFTER last_login_at,
  ADD COLUMN IF NOT EXISTS locked_until DATETIME NULL AFTER failed_login_attempts,
  ADD COLUMN IF NOT EXISTS password_changed_at DATETIME NULL AFTER locked_until;

CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users (locked_until);

CREATE TABLE IF NOT EXISTS security_events (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NULL,
  event_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_secevt_user_v4 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_secevt_user (user_id),
  INDEX idx_secevt_type_created (event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
