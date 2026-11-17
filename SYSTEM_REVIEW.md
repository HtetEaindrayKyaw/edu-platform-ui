# Prepwise system review

Review date: 14 November 2026. Scope: the current repository, its student and admin flows, data model, browser persistence, tests, and readiness for a real exam-practice service. No application behavior was changed during this review. Isolated browser contexts were used for diagnostic data; these checks did not change the user's browser records.

**Assessment:** this is a connected frontend prototype suitable for demonstrating the product and collecting client feedback. It is not yet a dependable multi-user education platform. The next milestone should be a secure, persistent, recoverable practice product, followed by stronger assessment controls where the client needs them.

## What already works

- Student overview, subject selection, topic-filtered practice, timed and untimed sessions, answer selection, basic scoring, and local result history.
- Admin overview, question creation/editing, subject and status filters, archiving/restoring, exam creation/editing, publishing, student directory records, local results, and settings.
- A shared bank with sample questions across four subjects. Published admin content is available to the student portal.
- Checks against duplicate answer text, invalid answer indices, insufficient eligible questions, and removing questions required by a published exam.
- Responsive admin layouts and native admin dialogs. The existing tests exercise meaningful connections between admin publishing and student completion.

These features are useful foundations. Authentication, server authorization, a PHP API, and MySQL are absent from this repository.

## Findings ordered by launch impact

P0 means a blocker before real accounts or trusted assessments. P1 means important for a dependable pilot. P2 means useful after the foundation is reliable. Severity here describes readiness for the intended real-world use, rather than an exploit against an existing production backend.

| ID | Priority | Finding and evidence | Improvement |
| --- | --- | --- | --- |
| A01 | P0 | The admin interface opens directly without login. `src/PlatformApp.jsx:22` selects it using the URL hash. Student activation/deactivation changes directory records only. | Add real accounts, password recovery, server sessions, roles, record-level permission checks, and enforced account status. Protect every API request, not just navigation. |
| A02 | P0 | Questions, answer keys, exams, students, and results are held in browser storage. See `src/PlatformApp.jsx:10` and `src/useLocalData.js:6`. Separate devices have separate datasets; browser edits can change marks or content. | Move authoritative data to MySQL behind the PHP API. Browser storage may hold preferences or recoverable drafts, never the authoritative grades or authorization state. |
| A03 | P0 | Correct answer indices are shipped to the browser and saved locally; `src/App.jsx:19` copies them into the live session. `src/App.jsx:14` calculates the grade in JavaScript. | The API must select questions and calculate grades. Assessment responses must omit correct answers and protected explanations until the permitted review stage. Never accept a score submitted by the client as authoritative. |
| A04 | P0 for assessed exams | `launchExam()` opens the same editable setup form used by free practice. See `src/App.jsx:22` and `src/App.jsx:23`. A browser probe changed a published five-question timed exam into a one-question untimed study session with immediate feedback. | Separate custom practice from assigned/published assessment attempts. Lock assessment rules on the server. Create explicit policy for what students may customize in each mode. |
| A05 | P0 for timed assessments | `src/App.jsx:15` subtracts one second per interval callback. It does not compare against a deadline. A simulated 90-second browser sleep left a one-minute session displaying 0:59. | Store server `started_at` and `expires_at`; derive the display from the deadline. On reconnect, resynchronize. The server must enforce expiration and finalize overdue attempts even when the browser closes. |
| A06 | P1, or P0 for assessed exams | Answers and the active session exist only in React state. Refreshing mid-attempt discarded the session without a saved attempt. Closing the student modal also drops it immediately. | Create a durable attempt before the first question. Autosave answers, show pending/saved status, support reconnect/resume, and warn before abandoning. Give each save and submission a retry-safe identifier. |
| A07 | P1 | Submitted history contains subject/title, total, correct count, percentage, and date, but no user ID, exam/version ID, question IDs, selected answers, grading rules, or timestamps. See `src/App.jsx:14`. | Store attempt ownership, immutable question and rule versions, question/option order, each response, earned/possible points, and timestamps. This enables review, appeals, analytics, and reproducible grading. |
| A08 | P1 | Admin Results compares old scores to the current global passing threshold (`src/AdminPanel.jsx:95`). An isolated 65% result changed from Passed to Practice more when the default threshold changed from 60 to 80. Student result encouragement also has its own fixed 70% threshold. | Save the applicable pass mark and grading policy with each attempt. Compute a single outcome used everywhere. Historical grades should change only through an explicit audited regrade. Distinguish encouragement text from an official pass/fail outcome. |
| A09 | P1 | Student streak, study time, weekly chart, subject progress, recent sample results, and several comparison values are illustrative. The mock-exam badge is fixed. See `src/App.jsx:25` and the following view definitions. | Remove sample totals from real accounts. Calculate metrics from owned attempts and answer events, distinguish accuracy from penalized score, define how averages are weighted, and display honest empty states. |
| A10 | P1 | Stored JSON is only checked at a coarse array/object level. A valid JSON array containing `null` in the question bank caused the admin page to crash. See `src/useLocalData.js:6` and `src/AdminPanel.jsx:72`. | Validate records against a schema, version stored formats, provide recoverable error states, and add an error boundary. Later enforce the same constraints in the API and database. Avoid silently overwriting damaged records without a recovery path. |
| A11 | P1 | Subjects are a fixed array; topics are free text; difficulty is stored but not used for practice filtering or exam composition. See `src/platform.js:1` and `eligibleQuestions()`. | Add managed subjects, chapters/topics, consistent IDs, optional syllabus tags, difficulty filters, and balanced question-selection rules. |
| A12 | P1 | Every question has exactly four options and one correct answer. Marking is +1 with an optional fixed -0.25, and scores are rounded/clamped in the browser. | Define the client's scoring rules explicitly: points per question, wrong/unanswered penalties, minimum score, rounding, partial credit if needed, and pass criteria. Add richer question types only when required. |
| A13 | P1 | Existing protection checks available question counts but does not version a published question or exam. Content/answer edits can affect later attempts under the same exam title. | Introduce draft revisions and immutable published versions. A running or completed attempt must retain its original content and policy, even after an admin edits the bank. |
| A14 | P1 | Student dialogs are plain containers with `aria-modal`; code does not provide native modal behavior, focus containment, Escape handling, or focus restoration. Much text and several action targets are very small. | Use consistent accessible dialogs, review contrast and text size, support keyboard navigation and screen readers, test zoom/reflow, and provide timing accommodations where appropriate. This review is not a full accessibility conformance audit. |
| A15 | P1 before launch | No deployment workflow, PHP/API tests, authorization tests, backup/restore procedure, monitoring, or recovery runbook is present. Browser tests are configured around Windows and installed Edge. | Add a staging environment, reproducible setup, CI checks, server tests, logging/alerts, restore drills, and a portable browser test configuration. Actual hosting security and capacity cannot be assessed without a deployed environment. |
| A16 | P2 | The student component combines rendering, timers, exam setup, grading, and history in long dense lines. Arrays with positional fields represent session questions; navigation is partly component state and partly URL hashes. | Extract an attempt/session layer, shared validation, page components, and an API client. Use named fields and consider TypeScript. Give student pages and attempts stable URLs with expected back/refresh behavior. |

There are also small presentation defects, such as literal question marks replacing some icons/separators in the student mock-exam cards. Those should be corrected, but they are lower priority than the persistence and assessment issues.

## Functions to add for the first real client version

### Accounts and access

- Registration or admin invitation, login/logout, email verification if using email-based accounts, password reset, and profile management.
- Start with Student and Admin. Add Teacher/Editor and Reviewer only if content approval or teaching responsibilities require separate permissions.
- Enforced deactivation, session expiry/revocation, login throttling, and a clear permission model for reading or changing another user's data.
- Admin MFA is a useful protection before broad admin access. An admin URL or hidden button is not an access-control mechanism.
- For a first-party web application, secure server-managed cookie sessions are a reasonable default. Use HttpOnly, Secure, an appropriate SameSite setting, CSRF protection, and session rotation. JWT is an architectural choice, not a requirement for a REST API.

OWASP recommends checking permissions on every request and denying access by default: [Authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html). Cookie attributes do not replace server authorization or CSRF defenses: [Session management guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

### Student practice and examination

- A dedicated exam introduction page with instructions, allowed attempts, duration, grading policy, review policy, and start confirmation.
- Question navigator with answered, unanswered, and flagged states; clear answer; mark for review; submit summary with unanswered count.
- Autosave with visible save state, retry, recovery after refresh, resume on another device according to policy, and a single authoritative active attempt policy.
- Configurable whole-exam versus per-question timers, warnings, timed accommodations, and deadline-driven auto-submission. Define whether students may go back in per-question mode.
- Topic and difficulty filtering, multiple-topic selection, curriculum-balanced question quotas, and optional option shuffling. Shuffle option IDs as well as their display order so correct answers remain mapped correctly.
- Full answer review with the student's response, correct answer, explanation, points, and topic. An administrator controls when review becomes available.
- Wrong-answer practice, bookmarks, and retry of weak topics. These offer practical learning value before sophisticated adaptive algorithms.

Established learning systems expose opening/closing dates, attempt limits, individual/group overrides, grading rules, and timed review release. These are useful reference behaviors, not a reason to copy every LMS feature: [Moodle quiz settings](https://docs.moodle.org/en/Quiz_settings).

### Question bank and content operations

- Managed subjects, topics, chapters, tags, difficulty, author, reviewer, and content version history.
- CSV import with a downloadable template, preview, validation, duplicate detection, row-level error messages, and rollback or an import audit record. Add XLSX only if client workflows need it.
- Bulk publish/archive and bulk edits with a clear selection summary.
- Math notation, diagrams/images with alternative text, and richer explanations. Secure uploads must validate type, size, storage access, and content handling.
- Question reporting by students, issue review, corrections, and a controlled regrade process.
- Draft/review/publish workflow when multiple staff members maintain the bank. Preserve who changed or approved a question.

### Exam and student administration

- Exam scheduling, start/end windows, per-exam pass marks, attempt limits, retake cooldowns, and result-release policy.
- Explicit question selection or random pools, exam duplication, preview, versioning, and assignment to classes/cohorts or individual students.
- Student account detail with assigned exams, attempts, progress, and status history. Link each result to a real student.
- Result filters by student, exam, cohort, date, and status; pagination; CSV export; printable reports if required.
- Audit history for publishing, grading-policy changes, account changes, and regrades. Retain sufficient history to explain a disputed mark.
- Operational notifications such as invitations, password-reset links, assigned-exam reminders, and published results, with retry and delivery status.

### Analytics

- Define metrics first: accuracy = correct/answered, completion = answered/assigned, score = earned/possible after the configured policy. Do not treat a penalized grade as raw accuracy.
- Student trends, actual study time, streaks with a defined timezone, topic strengths/weaknesses, and changes over comparable attempts.
- Admin completion rate, pass rate, score distribution, abandoned attempts, and question-level performance.
- Avoid precise mastery claims from one or two answers. Show sample size and separate practice from assessed exam results.

### Accessibility and reliability

- Keyboard and screen-reader checks of the entire student attempt, not just admin forms; readable sizes, visible focus, sufficient contrast, touch targets, and zoom support.
- Timing accommodations appropriate to the assessment. WCAG timing guidance includes exceptions where timing is essential; an untimed toggle that bypasses assessment rules is not a substitute for a defined accommodation policy. See [W3C timing guidance](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html).
- Offline/reconnecting states, useful errors, retry-safe saves, abandoned-attempt warnings, and explicit save recovery.
- Backups with tested restoration, staging separate from production, environment configuration, migrations, and secrets kept out of source control.
- Monitoring for API errors, save failures, submission failures, overdue attempts, and email failures. Keep private student content and credentials out of logs.

## Recommended data and responsibility model

Keep React for the interface, add the PHP REST API for authorization and business rules, and use MySQL as the authoritative store. A separate database per browser is not an acceptable substitute for a shared backend. A single well-structured backend is enough initially; microservices are unnecessary for the current scope.

| Data area | Suggested entities | Important constraint |
| --- | --- | --- |
| Identity | users, roles, user_roles, sessions, password_reset_tokens | Unique normalized email; password hashes; server-enforced access. |
| Teaching structure | subjects, topics, cohorts, cohort_memberships | Stable IDs instead of matching names or free-text tags. |
| Question bank | questions, question_versions, question_options, media | Correct answers stay server-side when review is restricted; versions used in attempts remain reproducible. |
| Exams | exams, exam_versions, exam_sections/pool_rules, exam_assignments | Published policy is versioned; assignment controls eligibility. |
| Attempts | attempts, attempt_questions, attempt_answers | Foreign keys to user and exam version; fixed question/option order; start/deadline/submission timestamps; retry-safe submission. |
| Grading | attempt totals and outcome, applied rule/pass-mark snapshot, regrade_events | Preserve unrounded points and original grading policy; record authorized regrades. |
| Operations | audit_logs, import_jobs, notifications | Track actor, action, target, timestamp, and job outcome without storing secrets. |

The attempt should store an ID and status such as `in_progress`, `submitted`, `expired`, or `abandoned`. Each answer save belongs to an owned active attempt. Submission runs in a transaction, calculates marks on the server, and returns the same completed result when retried. Store elapsed-time events only as learning telemetry; the server deadline decides exam expiration.

Typical API areas are authentication/profile, authorized admin question/exam management, student eligible exams, create/resume attempt, save answer, submit attempt, permitted review, analytics, and imports/exports. Apply server-side validation and database constraints even when the frontend has already validated a form.

## Delivery sequence and acceptance criteria

| Stage | Work | Evidence needed before moving on |
| --- | --- | --- |
| 1. Agree the rules | Confirm exam type, student/admin roles, grading, attempts, content workflow, and review policy. | A written example showing a correct, wrong, and unanswered question; expected result; permitted review timing. |
| 2. Persistent accounts and API | PHP/MySQL setup, migrations, seed data, login/recovery, permissions, account ownership, question/exam APIs. | Two students on separate devices see their own history; students cannot call admin endpoints; deactivated users cannot continue unauthorized activity. |
| 3. Dependable attempts | Server question selection, immutable rules, answer autosave, deadline, resume, submission and grading, review. | Refresh preserves an attempt; a repeated submission creates one result; expired attempts cannot gain time; answer keys are absent before release; editing an exam cannot change an existing attempt. |
| 4. Practical staff workflow | Content import, taxonomy, cohorts/assignments, scheduling, exports, audit logs, real analytics. | Staff can import a representative bank, diagnose bad rows, assign an exam, trace a result to a student, and explain a published mark. |
| 5. Staging pilot and handover | Accessibility checks, failure-path/security tests, representative load tests, monitoring, backup/restore, deployment documentation, client acceptance. | Demonstrated restore, successful reconnect test, ownership/permission tests, agreed capacity test, and client approval of the documented scope. |

A practice-only MVP can defer advanced question types, complex approval chains, and cohort reporting when the client does not need them. It still needs persistent accounts, safe data boundaries, accurate results, and recovery. A formal assessment product needs stronger rule enforcement and auditability from the beginning.

## Optional scope to defer

- Paid plans, subscriptions, coupon codes, and payment processing: only if selling access is part of the business model.
- Multiple institutions and tenant isolation: only if serving separate organizations in one installation.
- Certificates, leaderboards, parent portals, live lessons, and native apps: scope separately against an actual user need.
- AI question generation or recommendations: add after content quality and real usage data are reliable; generated content needs staff review.
- Remote proctoring: a separate product and privacy decision. Fullscreen or tab-switch tracking alone cannot establish that an exam is cheat-proof.

## Verification and boundaries

- Lint and production build passed during this review.
- All four unit tests passed. All four existing browser scenarios reported passing. The browser runner stalled during web-server teardown on this Windows environment and was stopped after the scenarios completed; this does not add coverage beyond those four scenarios.
- Additional isolated browser probes confirmed open admin access, browser-visible answer keys, editable published-exam rules, lost active attempts after refresh, historical outcome changes, and a crash from malformed stored record structure.
- The timer finding used Playwright's simulated browser sleep/missed-tick behavior, not a measured outage on a deployed server.
- Evidence and the diagnostic script are in `outputs/system-audit-evidence.json` and `outputs/system-audit-probe.mjs` (ignored local artifacts).
- No PHP server or production infrastructure exists here to audit. Load capacity, production headers, backup effectiveness, and full accessibility conformance remain unverified.
- This review produced a plan and evidence; it did not fix the findings or add the proposed backend.

The recommended next implementation is stages 1–3: settle the rules, build authenticated PHP/MySQL storage, and make attempts reliable. Additional dashboard pages should follow trustworthy data and exam behavior.
