# AI Suite components

The student sidebar includes **AI Tutor**, **Essay Checker**, **Comprehension**, and **Weakness Analysis**. All four are frontend demos with no OpenAI requests or PHP API calls. Drafts, conversations, and plan checkmarks are held in component state and reset when leaving a page.

```jsx
import {
  AiTutorChat,
  AiEssayChecker,
  AiComprehension,
  AiWeaknessAnalysis,
} from './components/ai'

// Render whichever component matches your navigation:
<AiTutorChat />
<AiEssayChecker />
<AiComprehension />
<AiWeaknessAnalysis />
```

Each component loads the shared stylesheet through `AiShared.jsx`. Keep the whole `ai` directory when copying the components. Dependencies: `react`, `react-markdown`, `lucide-react`, `tailwindcss`, and `@tailwindcss/vite`. The Vite config must include the Tailwind plugin. Utilities are compiled without Preflight to preserve the existing portal CSS. If integrating into an app that already imports Tailwind, keep its normal Tailwind setup and remove the duplicate imports from `ai-suite.css`.

Comprehension uses `public/audio/community-garden.wav`, a local synthetic narration of the included transcript. Copy that file too. Playback, pause, restart, seeking, speed, and the transcript toggle work without a remote media service. Its URL respects Vite's configured base path.

## Phase 4 service contracts

The mock implementations and sample data live in `mockAiService.js`. Each component accepts an async function prop so the UI can stay unchanged when the backend is ready. Pass the provided AbortSignal to `fetch`; the UI cancels pending work on navigation or input changes and retains input after errors.

| Component | Optional prop | Request payload | Response |
| --- | --- | --- | --- |
| `AiTutorChat` | `reply` | `{ subject, messages: [{ role, content }] }` | `{ content: 'Markdown response' }` |
| `AiEssayChecker` | `grade` | `{ topic, examType, essay }` | `{ overall, summary, rubrics: [{ label, value }], corrections: [{ original, suggested, why }], tips: [string] }` |
| `AiComprehension` | `analyze` | `{ mode: 'reading' \| 'listening', answers: { [questionId]: string } }` | `{ accuracy, captured: [string], missed: [string] }` |
| `AiWeaknessAnalysis` | `generatePlan` | `{ topics: [{ id, subject, topic, correct, total, accuracy }] }` | `[{ id, day, subject, topic, task, minutes }]` |

All functions have the signature `async (payload, { signal }) => response`. Essay rubric values use a 0–9 display scale; scores and suggested corrections in the mock are illustrative, not generated assessments. Comprehension uses a simple keyword heuristic that is explicitly labelled in the interface. Topic analysis correctly aggregates correct answers divided by attempts across exams.

```jsx
async function reply(payload, { signal }) {
  const response = await fetch('/api/ai/tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
    signal,
  })
  if (!response.ok) throw new Error('Tutor request failed')
  return response.json()
}

<AiTutorChat reply={reply} />
```

The endpoint above is a future integration example, not an implemented route. Implement authentication, authorization, server validation, response-schema validation, and usage limits in PHP. Store the OpenAI key on the server. Update `DemoNotice` labels when live services replace the mocks.

`AiWeaknessAnalysis` also accepts `history` (see `mockExamHistory` for its shape) and `onPracticeWeakTopics(topics)`. The portal supplies a callback opening study mode with the lowest-scoring topic that has published questions. When used alone, the button opens a short written retrieval exercise within the component. Existing student results do not yet store topic-level attempts, so the dashboard intentionally uses separate sample exam history.
