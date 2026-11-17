-- IGCSE LanThit: Phase 1 foundation.
-- Import into a NEW database selected in phpMyAdmin/cPanel (no CREATE DATABASE/USE).
-- MySQL >= 8.0.16 or MariaDB >= 10.4, InnoDB, utf8mb4_unicode_ci.
-- Use a currently maintained database release in production.
-- This is a one-time baseline, not an idempotent migration. Do not reimport into live data.
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

CREATE TABLE schema_migrations (
  version VARCHAR(64) NOT NULL PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('pending','active','suspended','archived') NOT NULL DEFAULT 'pending',
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Rangoon',
  email_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(80) NOT NULL,
  UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id SMALLINT UNSIGNED NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CIE and Edexcel are boards; AS/A/IGCSE are qualifications, not boards.
CREATE TABLE exam_boards (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(120) NOT NULL,
  UNIQUE KEY uq_boards_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE qualifications (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(80) NOT NULL,
  UNIQUE KEY uq_qualifications_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subjects (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_subjects_slug (slug),
  CONSTRAINT ck_subject_active CHECK (is_active IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE curricula (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  board_id SMALLINT UNSIGNED NOT NULL,
  qualification_id SMALLINT UNSIGNED NOT NULL,
  subject_id INT UNSIGNED NOT NULL,
  syllabus_code VARCHAR(32) NOT NULL,
  title VARCHAR(160) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_curriculum (board_id, qualification_id, subject_id, syllabus_code),
  KEY ix_curricula_subject (subject_id, qualification_id),
  CONSTRAINT fk_curr_board FOREIGN KEY (board_id) REFERENCES exam_boards(id),
  CONSTRAINT fk_curr_qualification FOREIGN KEY (qualification_id) REFERENCES qualifications(id),
  CONSTRAINT fk_curr_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT ck_curr_active CHECK (is_active IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE topics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  curriculum_id INT UNSIGNED NOT NULL,
  parent_id BIGINT UNSIGNED NULL,
  slug VARCHAR(100) NOT NULL,
  name VARCHAR(160) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_topic_slug (curriculum_id, slug),
  UNIQUE KEY uq_topic_curriculum (id, curriculum_id),
  CONSTRAINT fk_topic_curriculum FOREIGN KEY (curriculum_id) REFERENCES curricula(id),
  CONSTRAINT fk_topic_parent FOREIGN KEY (parent_id, curriculum_id) REFERENCES topics(id, curriculum_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Store private object keys/relative paths, not blobs, public URLs, or executable files.
CREATE TABLE media_assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  storage_key VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  byte_size BIGINT UNSIGNED NOT NULL,
  sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  alt_text VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_media_storage (storage_key),
  CONSTRAINT fk_media_user FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE past_papers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  curriculum_id INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  paper_code VARCHAR(32) NOT NULL,
  session_code VARCHAR(32) NOT NULL,
  exam_year SMALLINT UNSIGNED NOT NULL,
  variant_code VARCHAR(16) NOT NULL DEFAULT '',
  duration_seconds INT UNSIGNED NULL,
  total_marks DECIMAL(8,2) NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by BIGINT UNSIGNED NOT NULL,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_paper_identity (curriculum_id, paper_code, session_code, exam_year, variant_code),
  UNIQUE KEY uq_paper_curriculum (id, curriculum_id),
  KEY ix_paper_filters (curriculum_id, status, exam_year, session_code, paper_code),
  CONSTRAINT fk_paper_curr FOREIGN KEY (curriculum_id) REFERENCES curricula(id),
  CONSTRAINT fk_paper_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT ck_paper_year CHECK (exam_year BETWEEN 1900 AND 2200),
  CONSTRAINT ck_paper_duration CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  CONSTRAINT ck_paper_marks CHECK (total_marks IS NULL OR total_marks > 0),
  CONSTRAINT ck_paper_published CHECK (status <> 'published' OR published_at IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE past_paper_files (
  past_paper_id BIGINT UNSIGNED NOT NULL,
  asset_id BIGINT UNSIGNED NOT NULL,
  kind ENUM('question_paper','mark_scheme','insert','audio','transcript','examiner_report') NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (past_paper_id, asset_id),
  KEY ix_paper_file_kind (past_paper_id, kind),
  CONSTRAINT fk_pf_paper FOREIGN KEY (past_paper_id) REFERENCES past_papers(id),
  CONSTRAINT fk_pf_asset FOREIGN KEY (asset_id) REFERENCES media_assets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  curriculum_id INT UNSIGNED NOT NULL,
  topic_id BIGINT UNSIGNED NULL,
  question_type ENUM('single_choice','multiple_choice','short_answer','essay','comprehension') NOT NULL DEFAULT 'single_choice',
  difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_version_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_question_curriculum (id, curriculum_id),
  KEY ix_question_selection (curriculum_id, status, difficulty, topic_id),
  CONSTRAINT fk_question_curr FOREIGN KEY (curriculum_id) REFERENCES curricula(id),
  CONSTRAINT fk_question_topic FOREIGN KEY (topic_id, curriculum_id) REFERENCES topics(id, curriculum_id),
  CONSTRAINT fk_question_author FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT ck_question_published CHECK (status <> 'published' OR published_version_id IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Append new revisions; never update a revision used in an attempt.
CREATE TABLE question_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT UNSIGNED NOT NULL,
  version_number INT UNSIGNED NOT NULL,
  prompt_text MEDIUMTEXT NOT NULL,
  passage_text MEDIUMTEXT NULL,
  explanation_text MEDIUMTEXT NULL,
  marking_rubric_json JSON NULL,
  max_marks DECIMAL(8,2) NOT NULL DEFAULT 1.00,
  authored_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_qv_number (question_id, version_number),
  UNIQUE KEY uq_qv_owner (question_id, id),
  CONSTRAINT fk_qv_question FOREIGN KEY (question_id) REFERENCES questions(id),
  CONSTRAINT fk_qv_author FOREIGN KEY (authored_by) REFERENCES users(id),
  CONSTRAINT ck_qv_number CHECK (version_number > 0),
  CONSTRAINT ck_qv_marks CHECK (max_marks > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE questions ADD CONSTRAINT fk_question_published_version
  FOREIGN KEY (id, published_version_id) REFERENCES question_versions(question_id, id);

CREATE TABLE question_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  question_version_id BIGINT UNSIGNED NOT NULL,
  option_text TEXT NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY uq_option_order (question_version_id, sort_order),
  UNIQUE KEY uq_option_version (id, question_version_id),
  CONSTRAINT fk_option_version FOREIGN KEY (question_version_id) REFERENCES question_versions(id),
  CONSTRAINT ck_option_correct CHECK (is_correct IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE past_paper_questions (
  past_paper_id BIGINT UNSIGNED NOT NULL,
  curriculum_id INT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  question_version_id BIGINT UNSIGNED NOT NULL,
  question_label VARCHAR(32) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (past_paper_id, question_version_id),
  UNIQUE KEY uq_pq_label (past_paper_id, question_label),
  UNIQUE KEY uq_pq_order (past_paper_id, sort_order),
  CONSTRAINT fk_pq_paper_curr FOREIGN KEY (past_paper_id, curriculum_id) REFERENCES past_papers(id, curriculum_id),
  CONSTRAINT fk_pq_question_curr FOREIGN KEY (question_id, curriculum_id) REFERENCES questions(id, curriculum_id),
  CONSTRAINT fk_pq_revision FOREIGN KEY (question_id, question_version_id) REFERENCES question_versions(question_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exams (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_version_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_exam_listing (status, created_at),
  CONSTRAINT fk_exam_author FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT ck_exam_published CHECK (status <> 'published' OR published_version_id IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exam_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  exam_id BIGINT UNSIGNED NOT NULL,
  version_number INT UNSIGNED NOT NULL,
  instructions TEXT NULL,
  selection_mode ENUM('fixed','random_pool') NOT NULL DEFAULT 'fixed',
  selection_rules_json JSON NULL,
  question_count SMALLINT UNSIGNED NOT NULL,
  timer_mode ENUM('untimed','whole_exam','per_question') NOT NULL DEFAULT 'whole_exam',
  duration_seconds INT UNSIGNED NULL,
  per_question_seconds INT UNSIGNED NULL,
  wrong_answer_penalty DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  unanswered_penalty DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  pass_percentage DECIMAL(5,2) NOT NULL DEFAULT 60.00,
  shuffle_questions BOOLEAN NOT NULL DEFAULT TRUE,
  shuffle_options BOOLEAN NOT NULL DEFAULT FALSE,
  review_policy ENUM('immediate','after_submission','after_close','never') NOT NULL DEFAULT 'after_submission',
  opens_at DATETIME NULL,
  closes_at DATETIME NULL,
  max_attempts SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ev_number (exam_id, version_number),
  UNIQUE KEY uq_ev_owner (exam_id, id),
  CONSTRAINT fk_ev_exam FOREIGN KEY (exam_id) REFERENCES exams(id),
  CONSTRAINT ck_ev_number CHECK (version_number > 0),
  CONSTRAINT ck_ev_count CHECK (question_count > 0),
  CONSTRAINT ck_ev_attempts CHECK (max_attempts > 0),
  CONSTRAINT ck_ev_pass CHECK (pass_percentage BETWEEN 0 AND 100),
  CONSTRAINT ck_ev_penalties CHECK (wrong_answer_penalty >= 0 AND unanswered_penalty >= 0),
  CONSTRAINT ck_ev_shuffle CHECK (shuffle_questions IN (0,1) AND shuffle_options IN (0,1)),
  CONSTRAINT ck_ev_window CHECK (opens_at IS NULL OR closes_at IS NULL OR closes_at > opens_at),
  CONSTRAINT ck_ev_timer CHECK (
    (timer_mode = 'untimed' AND duration_seconds IS NULL AND per_question_seconds IS NULL) OR
    (timer_mode = 'whole_exam' AND duration_seconds IS NOT NULL AND duration_seconds > 0 AND per_question_seconds IS NULL) OR
    (timer_mode = 'per_question' AND per_question_seconds IS NOT NULL AND per_question_seconds > 0 AND duration_seconds IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE exams ADD CONSTRAINT fk_exam_published_version
  FOREIGN KEY (id, published_version_id) REFERENCES exam_versions(exam_id, id);

CREATE TABLE exam_version_questions (
  exam_version_id BIGINT UNSIGNED NOT NULL,
  question_version_id BIGINT UNSIGNED NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (exam_version_id, question_version_id),
  UNIQUE KEY uq_evq_order (exam_version_id, sort_order),
  CONSTRAINT fk_evq_exam FOREIGN KEY (exam_version_id) REFERENCES exam_versions(id),
  CONSTRAINT fk_evq_question FOREIGN KEY (question_version_id) REFERENCES question_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  kind ENUM('practice','mock_exam','past_paper') NOT NULL,
  exam_version_id BIGINT UNSIGNED NULL,
  past_paper_id BIGINT UNSIGNED NULL,
  start_request_key VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  status ENUM('in_progress','submitted','expired','abandoned') NOT NULL DEFAULT 'in_progress',
  settings_snapshot_json JSON NOT NULL,
  pass_percentage DECIMAL(5,2) NOT NULL,
  max_points DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  earned_points DECIMAL(10,2) NULL,
  passed BOOLEAN NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  finalized_at DATETIME NULL,
  last_saved_at DATETIME NULL,
  UNIQUE KEY uq_attempt_request (user_id, start_request_key),
  UNIQUE KEY uq_attempt_owner (id, user_id),
  KEY ix_attempt_history (user_id, status, started_at),
  KEY ix_attempt_expiry (status, expires_at),
  CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_attempt_exam FOREIGN KEY (exam_version_id) REFERENCES exam_versions(id),
  CONSTRAINT fk_attempt_paper FOREIGN KEY (past_paper_id) REFERENCES past_papers(id),
  CONSTRAINT ck_attempt_source CHECK (
    (kind = 'practice' AND exam_version_id IS NULL AND past_paper_id IS NULL) OR
    (kind = 'mock_exam' AND exam_version_id IS NOT NULL AND past_paper_id IS NULL) OR
    (kind = 'past_paper' AND past_paper_id IS NOT NULL AND exam_version_id IS NULL)
  ),
  CONSTRAINT ck_attempt_pass CHECK (pass_percentage BETWEEN 0 AND 100),
  CONSTRAINT ck_attempt_points CHECK (max_points >= 0),
  CONSTRAINT ck_attempt_passed CHECK (passed IS NULL OR passed IN (0,1)),
  CONSTRAINT ck_attempt_expiry CHECK (expires_at IS NULL OR expires_at > started_at),
  CONSTRAINT ck_attempt_final_time CHECK (finalized_at IS NULL OR finalized_at >= started_at),
  CONSTRAINT ck_attempt_finalized CHECK (status NOT IN ('submitted','expired') OR finalized_at IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Snapshot JSON is private: contains immutable question content/option order/rubric.
CREATE TABLE attempt_questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attempt_id BIGINT UNSIGNED NOT NULL,
  question_version_id BIGINT UNSIGNED NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL,
  question_snapshot_json JSON NOT NULL,
  max_points DECIMAL(8,2) NOT NULL,
  opened_at DATETIME NULL,
  expires_at DATETIME NULL,
  UNIQUE KEY uq_aq_order (attempt_id, display_order),
  UNIQUE KEY uq_aq_once (attempt_id, question_version_id),
  UNIQUE KEY uq_aq_version (id, question_version_id),
  CONSTRAINT fk_aq_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id),
  CONSTRAINT fk_aq_version FOREIGN KEY (question_version_id) REFERENCES question_versions(id),
  CONSTRAINT ck_aq_points CHECK (max_points > 0),
  CONSTRAINT ck_aq_deadline CHECK (expires_at IS NULL OR (opened_at IS NOT NULL AND expires_at > opened_at))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attempt_answers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attempt_question_id BIGINT UNSIGNED NOT NULL,
  question_version_id BIGINT UNSIGNED NOT NULL,
  answer_text MEDIUMTEXT NULL,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  revision INT UNSIGNED NOT NULL DEFAULT 1,
  time_spent_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  grading_status ENUM('ungraded','auto_graded','awaiting_review','reviewed') NOT NULL DEFAULT 'ungraded',
  awarded_points DECIMAL(8,2) NULL,
  feedback_json JSON NULL,
  saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_answer_question (attempt_question_id),
  UNIQUE KEY uq_answer_version (id, question_version_id),
  CONSTRAINT fk_answer_question FOREIGN KEY (attempt_question_id, question_version_id) REFERENCES attempt_questions(id, question_version_id),
  CONSTRAINT ck_answer_flag CHECK (is_flagged IN (0,1)),
  CONSTRAINT ck_answer_revision CHECK (revision > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Composite keys prevent selecting an option belonging to a different question revision.
CREATE TABLE attempt_answer_options (
  answer_id BIGINT UNSIGNED NOT NULL,
  question_version_id BIGINT UNSIGNED NOT NULL,
  option_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (answer_id, option_id),
  CONSTRAINT fk_ao_answer FOREIGN KEY (answer_id, question_version_id) REFERENCES attempt_answers(id, question_version_id),
  CONSTRAINT fk_ao_option FOREIGN KEY (option_id, question_version_id) REFERENCES question_options(id, question_version_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE past_paper_progress (
  user_id BIGINT UNSIGNED NOT NULL,
  past_paper_id BIGINT UNSIGNED NOT NULL,
  status ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  last_page SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
  last_opened_at DATETIME NULL,
  completed_at DATETIME NULL,
  PRIMARY KEY (user_id, past_paper_id),
  KEY ix_progress_filter (user_id, status, past_paper_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_progress_paper FOREIGN KEY (past_paper_id) REFERENCES past_papers(id),
  CONSTRAINT ck_progress_page CHECK (last_page > 0),
  CONSTRAINT ck_progress_bookmark CHECK (is_bookmarked IN (0,1)),
  CONSTRAINT ck_progress_complete CHECK (status <> 'completed' OR completed_at IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A database-backed queue can be consumed by a short-lived cPanel cron worker.
-- No OpenAI request is made by this migration or Phase 1 PHP scripts.
CREATE TABLE ai_submissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  module ENUM('study_assistant','essay_checker','reading_comprehension','listening_comprehension','weakness_analysis') NOT NULL,
  curriculum_id INT UNSIGNED NULL,
  source_question_version_id BIGINT UNSIGNED NULL,
  source_attempt_id BIGINT UNSIGNED NULL,
  input_asset_id BIGINT UNSIGNED NULL,
  request_key VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  input_text LONGTEXT NOT NULL,
  context_snapshot_json JSON NULL,
  prompt_version VARCHAR(64) NOT NULL,
  output_schema_key VARCHAR(64) NOT NULL,
  output_schema_version VARCHAR(32) NOT NULL,
  output_schema_json JSON NOT NULL,
  status ENUM('queued','processing','succeeded','failed','refused','incomplete','cancelled') NOT NULL DEFAULT 'queued',
  available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked_at DATETIME NULL,
  locked_by VARCHAR(64) NULL,
  retry_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  UNIQUE KEY uq_ai_request (user_id, request_key),
  KEY ix_ai_queue (status, available_at, id),
  KEY ix_ai_history (user_id, module, created_at),
  CONSTRAINT fk_ai_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_ai_curr FOREIGN KEY (curriculum_id) REFERENCES curricula(id),
  CONSTRAINT fk_ai_question FOREIGN KEY (source_question_version_id) REFERENCES question_versions(id),
  CONSTRAINT fk_ai_attempt_owner FOREIGN KEY (source_attempt_id, user_id) REFERENCES attempts(id, user_id),
  CONSTRAINT fk_ai_asset FOREIGN KEY (input_asset_id) REFERENCES media_assets(id),
  CONSTRAINT ck_ai_schema CHECK (JSON_TYPE(output_schema_json) = 'OBJECT'),
  CONSTRAINT ck_ai_completed CHECK (status NOT IN ('succeeded','failed','refused','incomplete','cancelled') OR completed_at IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  submission_id BIGINT UNSIGNED NOT NULL,
  run_number SMALLINT UNSIGNED NOT NULL,
  provider VARCHAR(32) NOT NULL DEFAULT 'openai',
  model VARCHAR(100) NOT NULL,
  provider_response_id VARCHAR(200) NULL,
  status ENUM('processing','succeeded','failed','refused','incomplete') NOT NULL DEFAULT 'processing',
  input_tokens INT UNSIGNED NULL,
  output_tokens INT UNSIGNED NULL,
  estimated_cost_usd DECIMAL(12,6) NULL,
  error_code VARCHAR(100) NULL,
  refusal_text TEXT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME NULL,
  UNIQUE KEY uq_run_number (submission_id, run_number),
  UNIQUE KEY uq_run_submission (id, submission_id),
  KEY ix_run_provider_response (provider_response_id),
  CONSTRAINT fk_run_submission FOREIGN KEY (submission_id) REFERENCES ai_submissions(id),
  CONSTRAINT ck_run_number CHECK (run_number > 0),
  CONSTRAINT ck_run_cost CHECK (estimated_cost_usd IS NULL OR estimated_cost_usd >= 0),
  CONSTRAINT ck_run_finished CHECK (finished_at IS NULL OR finished_at >= started_at),
  CONSTRAINT ck_run_terminal CHECK (status = 'processing' OR finished_at IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert only after application JSON Schema + score/rubric validation.
-- AI feedback remains provisional until human review where official marks are involved.
CREATE TABLE ai_results (
  submission_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  run_id BIGINT UNSIGNED NOT NULL,
  result_json JSON NOT NULL,
  schema_validated_at DATETIME NOT NULL,
  score DECIMAL(8,2) NULL,
  max_score DECIMAL(8,2) NULL,
  review_status ENUM('provisional','approved','rejected') NOT NULL DEFAULT 'provisional',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  reviewer_notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_result_run (run_id),
  CONSTRAINT fk_result_run_owner FOREIGN KEY (run_id, submission_id) REFERENCES ai_runs(id, submission_id),
  CONSTRAINT fk_result_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id),
  CONSTRAINT ck_result_object CHECK (JSON_TYPE(result_json) = 'OBJECT'),
  CONSTRAINT ck_result_score CHECK (
    (score IS NULL AND max_score IS NULL) OR
    (score IS NOT NULL AND max_score IS NOT NULL AND max_score > 0 AND score >= 0 AND score <= max_score)
  ),
  CONSTRAINT ck_result_review CHECK (review_status = 'provisional' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_user_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  request_id CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_audit_entity (entity_type, entity_id, created_at),
  KEY ix_audit_actor (actor_user_id, created_at),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Marker comes LAST: absent marker means installation is incomplete.
INSERT INTO schema_migrations (version) VALUES ('001_initial');
