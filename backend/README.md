# Phase 1 — Core PHP + MySQL foundation

This phase adds the database and connection layer for IGCSE LanThit. It does not change the React interface, connect its localStorage data to MySQL, implement authentication, or call OpenAI. The dark theme, full sidebar, REST feature endpoints, and AI interfaces belong to subsequent phases.

## Files

| File | Purpose |
| --- | --- |
| `database/schema.sql` | One-time baseline: 28 InnoDB tables, foreign keys, checks, indexes, and a completion marker. |
| `database/seed.sql` | Reusable lookup seed for boards, qualifications, subjects, and roles. No accounts or passwords. |
| `config/config.example.php` | Private configuration template with GPT-4o retained as the requested default model. |
| `config/database.php` | Reusable script returning a configured PDO connection. |
| `src/Config.php` | Private PHP configuration plus environment-variable overrides. |
| `src/Database.php` | Native prepared statements, exceptions, utf8mb4, UTC, and nonpersistent connections. |
| `bin/check-db.php` | CLI-only connectivity and schema-readiness check. |
| `public/index.php` | Minimal JSON health endpoint; no user/content/AI endpoints are enabled. |
| `ai/schemas/essay-feedback.v1.json` | Example strict structured-output schema for a later essay-grading implementation. |
| `tests/` | Configuration, relational integrity, and HTTP/private-source tests. |

## Requirements

- PHP 8.0+ syntax; use a currently supported PHP release offered by the host. Enable `PDO` and `pdo_mysql`. A later OpenAI implementation also needs HTTPS connectivity and `curl`.
- MySQL 8.0.16+ or MariaDB 10.4+ syntax, InnoDB, and utf8mb4. Use a currently maintained database release for production. MySQL 5.7 and early MySQL 8 releases are not supported because this schema relies on enforced CHECK constraints. The PDO factory rejects unsupported server versions.
- This baseline was executed on the locally available PHP 8.2.12 and MariaDB 10.4.32. Native MySQL execution and the client's actual cPanel environment have not been tested here; test the import on staging first.
- No Composer, Node runtime, Redis, database triggers, events, or persistent background daemon is needed by these PHP connection scripts. Node is only used for the existing frontend and optional HTTP tests.

The CHECK-constraint requirement follows the [MySQL documentation](https://dev.mysql.com/doc/refman/8.0/en/create-table-check-constraints.html). PDO settings follow the [PHP PDO MySQL manual](https://www.php.net/manual/en/ref.pdo-mysql.php).

## Data model

| Area | Tables |
| --- | --- |
| Baseline and identity | `schema_migrations`, `users`, `roles`, `user_roles` |
| Syllabus taxonomy | `exam_boards`, `qualifications`, `subjects`, `curricula`, `topics` |
| Files and past papers | `media_assets`, `past_papers`, `past_paper_files`, `past_paper_questions`, `past_paper_progress` |
| Question bank | `questions`, `question_versions`, `question_options` |
| Mock-exam configuration | `exams`, `exam_versions`, `exam_version_questions` |
| Saved attempts and responses | `attempts`, `attempt_questions`, `attempt_answers`, `attempt_answer_options` |
| AI pipeline | `ai_submissions`, `ai_runs`, `ai_results` |
| Staff traceability | `audit_logs` |

**Boards and levels:** CIE/Edexcel belong in `exam_boards`; IGCSE/AS/A Level belong in `qualifications`. A `curriculum` joins board, qualification, subject, and syllabus code. “All boards” is a UI filter value, not a database record. Do not assume every board offers every qualification or subject; create only the combinations the client actually provides.

**Past papers:** each paper has a curriculum, component/paper code, session, year, and variant. Multiple assets can represent the question PDF, mark scheme, insert, listening audio, transcript, or examiner report. Individual digitized questions can be pinned to specific revisions. Per-student viewing/bookmark/completion progress supports the Progress dropdown independently of an assessed attempt. The presence of a `mark_scheme` file supports its UI tag; “Answer” is an action based on available digital questions, not a stored status.

**Question bank:** subject/topic/difficulty metadata and question type live on the question identity. Prompt, passage, explanation, rubric, marks, and options belong to a revision. Create a question as a draft, add its revision/options, validate it, then set its own `published_version_id` and publish in a transaction. Composite foreign keys prevent publishing another question's revision or using a topic from another curriculum.

**Exams and attempts:** exam revisions support fixed question lists or selection-rule JSON, whole-exam/per-question/untimed modes, penalties, pass percentage, shuffling, review release, schedules, and attempt limits. At attempt creation, save the exact rules, original title, question metadata/content, option order, and marking policy in private snapshots. Each recorded response references the correct revision; option foreign keys reject answers from a different question. `start_request_key` prevents duplicate starts for a user. `revision` supports optimistic answer-save concurrency in the later API.

**History:** do not recompute old pass/fail outcomes using current settings. Save the applicable pass mark, server-calculated earned/max points, and outcome on the attempt. Timed sessions use a server `expires_at`; the display timer is derived from it. Keep a record of authorized regrades in the audit log.

## cPanel installation

1. Open cPanel's **Database Wizard** (or **MySQL Databases**, depending on the host). Create a new database and a dedicated database user, then associate that user with the database. Record the full names including the cPanel prefix. Database creation is intentionally not part of `schema.sql`, since a shared-hosting application user may not have that privilege. See the [cPanel Database Wizard documentation](https://docs.cpanel.net/cpanel/databases/mysql-database-wizard/).
2. Use an installation/migration account with CREATE, ALTER, INDEX, REFERENCES, INSERT, and SELECT privileges for the initial import. Hosting panels may expose these as individual privileges or an ALL PRIVILEGES installation choice. Do not use the cPanel login or a server root account as the application DB account.
3. In phpMyAdmin, select that **empty** database. Import `database/schema.sql`, then `database/seed.sql`. The schema contains no DROP statements and does not create an administrator. The seed can be reapplied; the schema cannot. MySQL DDL autocommits: if an import fails, diagnose it and use a fresh empty staging database rather than blindly reimporting over partial tables or live data.
4. Keep the private backend outside `public_html`. A recommended layout is:

```text
/home/CPANEL_USER/
  lanthit-backend/
    bootstrap.php
    config/local.php
    config/config.example.php
    config/database.php
    src/
    database/
    bin/
    ai/
    storage/
  public_html/
    index.html                 # Vite dist contents when the frontend is deployed
    assets/
    api/
      index.php                # copy of backend/public/index.php
      .htaccess                # copy of backend/public/.htaccess
```

5. Copy `config/config.example.php` to `config/local.php`. Fill in the dedicated database user's values. Use restrictive file permissions supported by the host (normally 600 for the secret file and 700 for private directories, subject to the host's PHP execution model). Do not put credentials or `OPENAI_API_KEY` in a frontend `VITE_*` variable.
6. In the deployed `public_html/api/index.php` copy, replace the `$privateRoot = ...` line with the correct absolute path, for example:

```php
$privateRoot = '/home/CPANEL_USER/lanthit-backend';
```

Alternatively configure `LANTHIT_BACKEND_ROOT` through the host's supported environment mechanism. Do not point it at a public directory. `LANTHIT_CONFIG_FILE` can select a different private PHP configuration file if needed.
7. Select the host's supported PHP version and enable `pdo_mysql`. Keep `display_errors` off in production; logs belong outside the document root. Use HTTPS. If the database is remote, supply the host's verified database TLS CA path as `database.ssl_ca`; do not disable certificate verification. If `localhost` fails, ask the host for its hostname or Unix socket path rather than exposing MySQL publicly.
8. Run `php /home/CPANEL_USER/lanthit-backend/bin/check-db.php` from the cPanel terminal, if available. The CLI command may report engine/version/charset/timezone for diagnostics, but never prints credentials.
9. Visit `https://YOUR_DOMAIN/api/index.php?route=health`. Successful installation returns only `{"status":"ok"}`. Missing configuration/schema or an unavailable DB returns a generic 503 JSON error with a request ID. Unknown endpoints return 404; unsupported health methods return 405. This endpoint verifies readiness, not user authentication.
10. Use a separate runtime DB user with SELECT, INSERT, UPDATE, and DELETE only on the necessary application tables; reserve schema-changing privileges for migrations. Do not grant DROP/ALTER/CREATE to public request handlers. Limit table-level UPDATE/DELETE on immutable revisions/audit data where the application design permits it. Enforce immutability in the later API as well.

When available, a subdomain with its document root set directly to `backend/public` is another valid layout. The repository's root `backend/.htaccess` denies Apache access to private files as a fallback; the public directory has its own authorization rule. The PHP development server ignores `.htaccess`, so **always** serve only `backend/public`, never the repository/backend root. The Vite development server is configured to deny all backend files, including private PHP source.

## Private configuration

`config/local.php` can contain only the settings that differ from the template:

```php
<?php
declare(strict_types=1);
return [
    'database' => [
        'host' => 'localhost',
        'name' => 'CPANELUSER_education',
        'username' => 'CPANELUSER_app',
        'password' => 'REPLACE_WITH_DATABASE_PASSWORD',
    ],
    'openai' => [
        'model' => 'gpt-4o',
        'api_key' => '', // Not needed for Phase 1.
    ],
];
```

Environment variables override the template/local file: `APP_ENV`, `APP_NAME`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SOCKET`, `DB_SSL_CA`, `OPENAI_API_KEY`, `OPENAI_MODEL`. Production is the default; an empty database password is rejected in production. Never commit the local file; it is ignored by Git. Ignore rules do not remove a secret already committed in the past.

## PDO use in future private API services

```php
$pdo = require '/home/CPANEL_USER/lanthit-backend/config/database.php';
$statement = $pdo->prepare(
    'SELECT id, title, exam_year FROM past_papers WHERE curriculum_id = :curriculum AND status = :status ORDER BY exam_year DESC LIMIT 20'
);
$statement->execute(['curriculum' => $authorizedCurriculumId, 'status' => 'published']);
$papers = $statement->fetchAll();
```

This example is a query pattern, not an authenticated public endpoint. Bind user input; whitelist any dynamic sort column/direction. Serialize BIGINT identifiers as strings for React clients to avoid JavaScript integer precision loss. DECIMAL marks should use decimal-safe calculations or integer hundredths, not binary floating-point arithmetic. Do not expose `SELECT *` responses for users, options, snapshots, rubrics, AI inputs, or provider records.

## AI submission lifecycle for a later phase

1. Authenticate the user, enforce quotas and input limits, verify ownership of any referenced attempt/file, and select a server-controlled rubric and JSON schema. Store the text, input/context snapshot, prompt/schema versions, and user-scoped request key in `ai_submissions`.
2. A short-lived cPanel cron worker can claim a queued row in a transaction using `SELECT ... FOR UPDATE`, set processing/lock metadata, and commit **before** calling the provider. Implement stale-lock recovery, bounded retries/backoff, and a bounded job duration. This phase supplies the data model only; no worker or cron job is installed.
3. Create a numbered `ai_runs` record for every provider attempt. Retain the requested/returned model, response ID, token counts, outcome, and optional cost estimate. Costs are not hardcoded and usage limits are not implemented yet.
4. With GPT-4o, request strict Structured Outputs using the canonical JSON schema; a plain JSON-mode response is not a schema-validation guarantee. `essay-feedback.v1.json` is a starting contract, not an official IGCSE rubric. Supply the board/qualification/question-specific rubric from the server. The `band` is nullable because band definitions vary.
5. Handle refusals, incomplete responses, API/network failures, and successful content as different outcomes. Only schema-validated content that passes business checks belongs in `ai_results`. Validate score ranges, criterion totals/names, rubric maximums, and any text offsets. The database checks JSON syntax/object shape and normalized score bounds; it does not perform complete JSON Schema validation.
6. Save accepted feedback as `provisional`. Human review is needed before using AI feedback as official assessment marks. Structured output controls format, not grading correctness.

This separation follows the [official OpenAI Structured Outputs guidance](https://developers.openai.com/api/docs/guides/structured-outputs), including explicit refusal/error handling. No API key was requested, no provider request was sent, and no AI credit was spent during this phase. A local request key prevents duplicate local submissions; it does not by itself guarantee a timed-out provider call cannot incur a second charge on retry.

Future weakness analysis should use the authenticated student's recorded responses and immutable question/topic snapshots, rather than sending every student's history or the full question bank. Listening submissions can reference a private audio asset; transcription/audio processing and access control are later work. Persistent multi-turn tutor conversations will need a conversation/message model in the AI phase; the reserved `study_assistant` module alone does not implement chat.

## Rules that the next API must enforce

- Authorization and record ownership on every route; a foreign key is not a permission check. Account creation must hash passwords with PHP `password_hash`; never store or log plaintext passwords.
- Publication/cardinality validation: a single-choice question needs exactly one correct option, a multiple-choice question needs the allowed selection rules, and a fixed/random exam needs enough published eligible questions. SQL cannot enforce these cross-row counts using the included CHECK constraints.
- Published revision immutability and atomic updates to the published pointer. Protect drafts and answer keys through separate response projections/review policies.
- Frozen titles, question types/difficulty/topic, options/order, correct answers, rubric, penalties, pass mark, rounding policy, and score floor in attempt snapshots. Do not trust snapshots or marks posted by students.
- Server-authoritative deadlines, allowed schedules/attempt counts, answer ownership, idempotent final submission, conflict-safe saves, and completed-attempt immutability. The schema provides fields/keys, not the execution of those rules.
- Only accept an AI result from a successful run; make the run/result/submission terminal-state update transactional. Verify asset ownership and relevance of selected curriculum/question/attempt context in the API.
- Validate uploads, scan/limit supported MIME types and sizes, generate storage keys, keep files private, and authorize mark-scheme/feedback downloads according to policy. The schema does not authorize redistribution of exam-board materials.
- Archive learning records instead of cascading deletion through history. Define privacy/retention/anonymization behavior separately; user FKs deliberately restrict deletion of referenced history.
- Avoid cycles in parent topics, implement pagination, use consistent UTC timestamps, and translate UTC only at the UI boundary.
- To-do lists, flashcards, gamification, leaderboard aggregation, resource management, full chat persistence, authentication/session handling, and frontend migration are not implemented in this phase.

## Local verification

PHP CLI examples (on this machine replace `php` with `C:/xampp/php/php.exe` if it is not on PATH):

```sh
php backend/tests/unit.php
php backend/bin/check-db.php
php -S 127.0.0.1:8080 -t backend/public
```

`check-db.php` and the local server use your private configuration/environment; import the schema first. Do not use the built-in PHP server for production.

For database integration tests, create a separate **empty** database named `lanthit_phase1_<suffix>_test`, and supply its credentials through the test process environment. The test refuses any other naming pattern, any APP_ENV other than `test`, and any nonempty database. It imports the baseline and lookup seed, runs integrity checks, and rolls back test accounts/content. It does not drop databases or tables; the test schema remains for inspection.

PowerShell example for an already-running disposable local server (use that server's actual test credentials):

```powershell
$env:APP_ENV = 'test'
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '3308'
$env:DB_NAME = 'lanthit_phase1_local_test'
$env:DB_USER = 'YOUR_TEST_DATABASE_USER'
$env:DB_PASSWORD = 'YOUR_TEST_DATABASE_PASSWORD'
& 'C:/xampp/php/php.exe' backend/tests/integration.php
$env:PHP_BINARY = 'C:/xampp/php/php.exe'
node backend/tests/http.mjs
```

The HTTP test starts and stops temporary PHP servers. It verifies safe health/error responses and Vite private-source restrictions. The database integration test must use a fresh empty database each time; HTTP checks may reuse the completed test schema. Test scripts require command-line execution and are not public endpoints.

Validated locally: all PHP files passed syntax checks; 20 configuration/schema-contract checks, 23 MariaDB integration checks, and 12 HTTP/privacy checks passed. The test DB was a separate loopback-only MariaDB instance with its own data directory under ignored `outputs/`; no existing XAMPP database was modified. No actual cPanel deployment or native MySQL server was available for verification.
