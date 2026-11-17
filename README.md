# Prepwise education platform

An interactive React + Vite frontend for exam practice and administration. The existing portal uses custom CSS and a shared local question bank; the AI Suite uses Tailwind CSS, Lucide icons, and React Markdown.

## Run locally

```sh
npm install
npm run dev
```

Use the local URL printed by Vite. Select **Admin panel** in the student sidebar, or open `/#/admin/overview` on that local URL.

## Admin pages

- `/#/admin/overview`: live counts, published question coverage, and recent exam configurations.
- `/#/admin/question-bank`: search and filter questions; add, edit, publish, archive, and restore them. Questions include four answer options, a correct answer, subject, topic, difficulty, and explanation.
- `/#/admin/exams`: create and edit exams, configure topic, question count, timer, negative marking, and randomized order. Publish/unpublish and try an exam in the student portal.
- `/#/admin/students`: add and edit local student directory records, search, and change active status.
- `/#/admin/results`: review attempts completed in the local student portal and their outcome against the workspace passing score.
- `/#/admin/settings`: workspace name, default exam timer, and passing score.

Publishing requires enough published questions matching the subject and topic. Exam attempts use unique questions, without repeating questions to reach a requested count. Archiving or editing a question cannot leave a published exam short of questions; update or unpublish the exam first.

## Student integration

The student portal is at `/#/student`. Student navigation focuses on Dashboard, Question Bank, Mock Exams, and the separate AI Suite. The question bank supports search, subject/topic/difficulty filters, answer reveal, and focused study practice. Its board and qualification selectors are prototype context only: the original demo questions have not been mapped or verified against CIE or Pearson Edexcel syllabuses. The practice builder supports subject, topic, and difficulty filters, with timed practice or study mode. Mock exams lists searchable, subject-filtered published exams and shows configured rules before an attempt starts. Published exam settings cannot be changed through the student setup form. Submitted attempts appear in both student history and admin results.

## AI Suite

The student sidebar includes four interactive Tailwind components: an AI tutor chat, an essay checker, reading/listening comprehension, and topic weakness analysis with a checkable seven-day plan. The listening player includes local synthetic audio with playback speed, seeking, and a transcript. Weak-topic practice connects to the student practice builder.

All feedback is explicitly labelled demo data. These tools do not call OpenAI or PHP yet. See [the component integration guide](src/components/ai/README.md) for imports, mock service contracts, and the optional function props for Phase 4. AI drafts and task checkmarks remain in page state only. Topic analytics use separate sample history because existing student results do not yet record per-topic answers.

## Persistence and limitations

Questions, exams, student directory records, settings, and submitted results are saved in this browser's localStorage. Reloading the same origin retains them. Clearing site data, using another browser/device, or changing origin does not retain that data. The question bank's board/qualification selection is not a verified curriculum mapping. Authorized past-paper/resource uploads are not implemented yet; do not store or upload real files to this demo. Published exam rules and grading remain client-side and can be altered by someone with browser access; the introductory screen is a UX safeguard, not server-enforced exam security. Do not use timed exams for official or high-stakes assessment.

This is a **frontend demo**, not a secured admin system. The admin URL is open to anyone running the app. Student records do not create accounts, send invitations, or enforce access restrictions. Some original student dashboard statistics remain illustrative demo data. Local attempts are not linked to authenticated users. Changes are not synchronized between browser tabs or devices.

Phase 1 of the PHP/MySQL backend foundation is now available in [backend/README.md](backend/README.md): database schema, private PDO configuration, a health endpoint, and integration tests. The React frontend still uses browser storage. Authentication, feature API endpoints, server-enforced admin permissions, live AI integration, and deployment remain future work. Do not use this version to store real student records or administer high-stakes exams.

## Checks

```sh
npm run lint
npm run build
npm test
npm run test:e2e
```

Browser tests use the installed Microsoft Edge browser in headless mode. They start a local Vite server on port 4175 and use isolated browser storage. They cover question creation, exam publication, student completion, result persistence, question availability safeguards, student records, settings, AI Suite interactions, audio playback, and desktop/mobile readability. Change the browser channel in `playwright.config.js` if your machine does not have Edge installed.
