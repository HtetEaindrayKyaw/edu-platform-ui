<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$config = require dirname(__DIR__) . '/bootstrap.php';
// Never import into a configured live or populated database.
if ($config['app']['environment'] !== 'test' || !preg_match('/\Alanthit_phase1_[a-z0-9]+_test\z/', $config['database']['name'])) {
    fwrite(STDERR, 'Use APP_ENV=test and a NEW empty database named lanthit_phase1_<suffix>_test.' . PHP_EOL);
    exit(1);
}
$pdo = \LanThit\Database::connect($config['database']);
if ($pdo->query('SHOW TABLES')->fetchColumn() !== false) {
    fwrite(STDERR, 'Refusing to import into a nonempty database. Create a fresh test database.' . PHP_EOL);
    exit(1);
}

function importFile(PDO $pdo, string $path): void {
    // This controlled baseline has no procedures, delimiter changes or semicolons
    // inside string literals. This helper is NOT a parser for user SQL imports.
    $sql = preg_replace('/^\s*--[^\r\n]*$/m', '', file_get_contents($path));
    foreach (explode(';', $sql) as $statement) {
        if (trim($statement) !== '') { $pdo->exec($statement); }
    }
}
importFile($pdo, dirname(__DIR__) . '/database/schema.sql');
importFile($pdo, dirname(__DIR__) . '/database/seed.sql');
importFile($pdo, dirname(__DIR__) . '/database/seed.sql');
$checks = 0;
function check(bool $condition, string $label): void {
    global $checks;
    if (!$condition) { throw new RuntimeException('FAIL: ' . $label); }
    $checks++; echo 'PASS: ', $label, PHP_EOL;
}
function run(PDO $pdo, string $sql, array $params = []): int {
    $statement = $pdo->prepare($sql); $statement->execute($params);
    return (int) $pdo->lastInsertId();
}
function rejects(callable $action, string $label): void {
    try { $action(); } catch (PDOException $error) {
        // Only expected integrity/JSON errors qualify, not syntax/connection failures.
        if (!in_array((int) ($error->errorInfo[1] ?? 0), [1062,1452,4025,3819,3140], true)) { throw $error; }
        check(true, $label); return;
    }
    throw new RuntimeException('FAIL: ' . $label);
}

check($pdo->query("SELECT version FROM schema_migrations")->fetchColumn() === '001_initial', 'baseline import completed');
check((int) $pdo->query('SELECT COUNT(*) FROM exam_boards')->fetchColumn() === 2, 'lookup seed can be reapplied');
check((int) $pdo->query('SELECT COUNT(*) FROM qualifications')->fetchColumn() === 3, 'boards and qualifications stored separately');
check((int) $pdo->getAttribute(PDO::ATTR_EMULATE_PREPARES) === 0, 'native PDO prepares enabled');
check($pdo->query('SELECT @@session.time_zone')->fetchColumn() === '+00:00', 'database session uses UTC');
check($pdo->query('SELECT @@character_set_connection')->fetchColumn() === 'utf8mb4', 'connection uses utf8mb4');

$pdo->beginTransaction();
try {
    $hash = password_hash('Integration-only-not-a-real-account', PASSWORD_DEFAULT);
    $u1 = run($pdo, "INSERT INTO users(display_name,email,password_hash,status) VALUES (?,?,?,'active')", ['စမ်းသပ် 📚', 'test-one@example.invalid', $hash]);
    $u2 = run($pdo, "INSERT INTO users(display_name,email,password_hash,status) VALUES (?,?,?,'active')", ['Second test', 'test-two@example.invalid', $hash]);
    $stmt = $pdo->prepare('SELECT display_name FROM users WHERE id=?'); $stmt->execute([$u1]);
    check($stmt->fetchColumn() === 'စမ်းသပ် 📚', 'Myanmar text and emoji round-trip');
    rejects(fn() => run($pdo, 'INSERT INTO users(display_name,email,password_hash) VALUES (?,?,?)', ['Duplicate', 'TEST-ONE@example.invalid', $hash]), 'case-insensitive duplicate email rejected');
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?'); $stmt->execute(["x' OR 1=1 --"]);
    check($stmt->fetchColumn() === false, 'SQL injection text remains bound data');
    rejects(fn() => run($pdo, 'INSERT INTO user_roles(user_id,role_id) VALUES (999999999,1)'), 'orphan role assignment rejected');
    $curr = run($pdo, "INSERT INTO curricula(board_id,qualification_id,subject_id,syllabus_code,title) VALUES (1,1,1,'TEST','Test syllabus')");
    $curr2 = run($pdo, "INSERT INTO curricula(board_id,qualification_id,subject_id,syllabus_code,title) VALUES (1,1,2,'TEST2','Other syllabus')");
    $topic = run($pdo, "INSERT INTO topics(curriculum_id,slug,name) VALUES (?,'algebra','Algebra')", [$curr]);
    rejects(fn() => run($pdo, 'INSERT INTO questions(curriculum_id,topic_id,created_by) VALUES (?,?,?)', [$curr2,$topic,$u1]), 'question cannot use a topic from another curriculum');
    $q1 = run($pdo, 'INSERT INTO questions(curriculum_id,topic_id,created_by) VALUES (?,?,?)', [$curr,$topic,$u1]);
    $q2 = run($pdo, 'INSERT INTO questions(curriculum_id,created_by) VALUES (?,?)', [$curr,$u1]);
    $v1 = run($pdo, "INSERT INTO question_versions(question_id,version_number,prompt_text,authored_by) VALUES (?,1,'First question',?)", [$q1,$u1]);
    $v2 = run($pdo, "INSERT INTO question_versions(question_id,version_number,prompt_text,authored_by) VALUES (?,1,'Other question',?)", [$q2,$u1]);
    run($pdo, "UPDATE questions SET published_version_id=?, status='published' WHERE id=?", [$v1,$q1]);
    rejects(fn() => run($pdo, 'UPDATE questions SET published_version_id=? WHERE id=?', [$v2,$q1]), 'published revision must belong to its question');
    $o1 = run($pdo, "INSERT INTO question_options(question_version_id,option_text,sort_order,is_correct) VALUES (?,'Correct',1,1)", [$v1]);
    $o2 = run($pdo, "INSERT INTO question_options(question_version_id,option_text,sort_order,is_correct) VALUES (?,'Other option',1,1)", [$v2]);
    $paper = run($pdo, "INSERT INTO past_papers(curriculum_id,title,paper_code,session_code,exam_year,created_by) VALUES (?,'Test paper','P1','MAY_JUNE',2026,?)", [$curr,$u1]);
    run($pdo, "INSERT INTO past_paper_questions(past_paper_id,curriculum_id,question_id,question_version_id,question_label,sort_order) VALUES (?,?,?,?,'1(a)',1)", [$paper,$curr,$q1,$v1]);
    check(true, 'past paper references a pinned question revision');
    $exam = run($pdo, "INSERT INTO exams(title,created_by) VALUES ('Test exam',?)", [$u1]);
    rejects(fn() => run($pdo, 'INSERT INTO exam_versions(exam_id,version_number,question_count,duration_seconds,pass_percentage) VALUES (?,1,1,60,101)', [$exam]), 'invalid pass percentage rejected');
    rejects(fn() => run($pdo, 'INSERT INTO exam_versions(exam_id,version_number,question_count,duration_seconds) VALUES (?,1,1,0)', [$exam]), 'zero-length timed exam rejected');
    $ev = run($pdo, 'INSERT INTO exam_versions(exam_id,version_number,question_count,duration_seconds) VALUES (?,1,1,60)', [$exam]);
    $attempt = run($pdo, "INSERT INTO attempts(user_id,kind,exam_version_id,start_request_key,settings_snapshot_json,pass_percentage) VALUES (?,'mock_exam',?,'start-1','{}',60)", [$u1,$ev]);
    rejects(fn() => run($pdo, "INSERT INTO attempts(user_id,kind,start_request_key,settings_snapshot_json,pass_percentage) VALUES (?,'practice','start-1','{}',60)", [$u1]), 'retry key prevents duplicate attempt creation');
    $aq = run($pdo, "INSERT INTO attempt_questions(attempt_id,question_version_id,display_order,question_snapshot_json,max_points) VALUES (?,?,1,'{}',1)", [$attempt,$v1]);
    $answer = run($pdo, 'INSERT INTO attempt_answers(attempt_question_id,question_version_id) VALUES (?,?)', [$aq,$v1]);
    run($pdo, 'INSERT INTO attempt_answer_options(answer_id,question_version_id,option_id) VALUES (?,?,?)', [$answer,$v1,$o1]);
    rejects(fn() => run($pdo, 'INSERT INTO attempt_answer_options(answer_id,question_version_id,option_id) VALUES (?,?,?)', [$answer,$v1,$o2]), 'answer cannot select an option from another question');
    $schema = file_get_contents(dirname(__DIR__) . '/ai/schemas/essay-feedback.v1.json');
    $aiSql = "INSERT INTO ai_submissions(user_id,module,source_attempt_id,request_key,input_text,prompt_version,output_schema_key,output_schema_version,output_schema_json) VALUES (?,'essay_checker',?,'essay-1','Test input','essay-v1','essay-feedback','1',?)";
    rejects(fn() => run($pdo, $aiSql, [$u2,$attempt,$schema]), 'AI input cannot reference another student’s attempt');
    $submission = run($pdo, $aiSql, [$u1,$attempt,$schema]);
    rejects(fn() => run($pdo, $aiSql, [$u1,$attempt,$schema]), 'AI retry key prevents duplicate submissions');
    rejects(fn() => run($pdo, "UPDATE ai_submissions SET status='succeeded' WHERE id=?", [$submission]), 'terminal AI state requires a completion timestamp');
    rejects(fn() => run($pdo, 'UPDATE ai_submissions SET context_snapshot_json=? WHERE id=?', ['not json',$submission]), 'malformed JSON rejected by the database');
    $run = run($pdo, "INSERT INTO ai_runs(submission_id,run_number,model,status,finished_at) VALUES (?,1,'gpt-4o','succeeded',UTC_TIMESTAMP())", [$submission]);
    rejects(fn() => run($pdo, "INSERT INTO ai_results(submission_id,run_id,result_json,schema_validated_at,score,max_score) VALUES (?,?,'{}',UTC_TIMESTAMP(),11,10)", [$submission,$run]), 'AI score cannot exceed the rubric maximum');
    run($pdo, "INSERT INTO ai_results(submission_id,run_id,result_json,schema_validated_at,score,max_score) VALUES (?,?,'{}',UTC_TIMESTAMP(),8,10)", [$submission,$run]);
    check(true, 'AI feedback storage supports provisional review state');
} finally {
    $pdo->rollBack(); // Test records only. Schema/lookup seed remain in the isolated DB.
}
echo $checks, ' database checks passed.', PHP_EOL;
