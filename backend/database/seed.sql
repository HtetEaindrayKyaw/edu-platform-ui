-- Optional lookup data only. Safe to reapply; creates no accounts/passwords/papers.
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
START TRANSACTION;
INSERT INTO roles (code, name) VALUES
  ('student', 'Student'), ('admin', 'Administrator'), ('editor', 'Content editor')
ON DUPLICATE KEY UPDATE name = VALUES(name);
INSERT INTO exam_boards (code, name) VALUES
  ('CIE', 'Cambridge International'), ('EDEXCEL', 'Pearson Edexcel')
ON DUPLICATE KEY UPDATE name = VALUES(name);
INSERT INTO qualifications (code, name) VALUES
  ('IGCSE', 'IGCSE'), ('AS', 'AS Level'), ('A_LEVEL', 'A Level')
ON DUPLICATE KEY UPDATE name = VALUES(name);
INSERT INTO subjects (slug, name) VALUES
  ('mathematics', 'Mathematics'), ('physics', 'Physics'), ('chemistry', 'Chemistry'),
  ('biology', 'Biology'), ('english-language', 'English Language')
ON DUPLICATE KEY UPDATE name = VALUES(name);
COMMIT;
