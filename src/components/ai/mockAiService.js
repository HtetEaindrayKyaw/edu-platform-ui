/**
 * Replace these async functions with authenticated PHP fetch calls in Phase 4.
 * Each accepts a plain JSON payload and { signal }; no API credentials belong here.
 * All returned scores are illustrative, never official exam assessments.
 */
function pause(signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Cancelled', 'AbortError'))
    const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')) }
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve() }, 650)
    signal?.addEventListener('abort', abort, { once: true })
  })
}
export const countWords = text => text.trim().split(/\s+/u).filter(Boolean).length

const lessons = {
  'IGCSE Chemistry': { concept: 'covalent bonding', explanation: 'A covalent bond forms when atoms **share a pair of electrons**. Each atom attracts the shared electrons.', steps: ['Think of two atoms holding the same pair of electrons.', 'Sharing can help each atom reach a stable outer electron shell.', 'In a hydrogen molecule, two hydrogen atoms share one pair.'], question: 'How many pairs of electrons are shared in a single covalent bond?', hint: 'A single line in a bonding diagram represents one shared pair.' },
  'IGCSE Biology': { concept: 'photosynthesis', explanation: 'Plants use **light energy** to turn carbon dioxide and water into glucose. Oxygen is released.', steps: ['Chlorophyll absorbs light energy.', 'Carbon dioxide enters the leaves; roots absorb water.', 'Glucose stores the energy the plant can use for growth.'], question: 'Which two raw materials does a plant need for photosynthesis?', hint: 'Look at the substances that enter the process, rather than the energy source.' },
  'IGCSE English': { concept: 'evidence-based paragraphs', explanation: 'A clear paragraph makes a **point**, supports it with **evidence**, and explains how that evidence supports the argument.', steps: ['State one clear idea in the topic sentence.', 'Add a short, relevant quotation or example.', 'Explain the effect of the language and link back to the question.'], question: 'Write a topic sentence arguing that school libraries benefit students.', hint: 'Make one specific claim you could support with an example.' },
  'IGCSE Mathematics': { concept: 'linear equations', explanation: 'Solving an equation means finding a value that makes both sides equal. **Do the same operation to both sides** to keep the balance.', steps: ['For 2x + 3 = 11, subtract 3 from both sides.', 'This gives 2x = 8. Divide both sides by 2.', 'So x = 4. Check: 2 × 4 + 3 = 11.'], question: 'Solve 3x + 2 = 14. Show each step.', hint: 'Subtract 2 from both sides first, then divide by 3.' },
}
export const tutorSubjects = Object.keys(lessons)
export const tutorPrompts = ['Explain this concept simply', 'Give me a practice question', 'Help me revise step by step']
export async function tutorReply({ subject, messages }, { signal } = {}) {
  await pause(signal)
  const lesson = lessons[subject] || lessons['IGCSE Chemistry']
  const latest = messages.at(-1)?.content || ''
  if (/practice question/i.test(latest)) return { content: `### Try it yourself\n\n${lesson.question}\n\n**Hint:** ${lesson.hint}\n\nTell me how you would approach it.\n\n*This is a prepared demo exercise.*` }
  return { content: `### Let's explore ${lesson.concept}\n\n${lesson.explanation}\n\n${lesson.steps.map(s => `- ${s}`).join('\n')}\n\n**Check your understanding:** ${lesson.question}\n\n*Demo: this prepared lesson illustrates the tutor interface. Free-form questions will be answered after the PHP AI connection is added.*` }
}

export const sampleEssay = `Many people believe that schools should introduce a four-day week. In my opinion, this change could benefit students, but it requires careful planning. A shorter week may give learners more time to rest and pursue their own interests.

One advantage is that students would have more time for independent study. They could review difficult topics, read books or practise a new skill. For example, a student who finds mathematics challenging could use Friday mornings to work through extra questions. This flexibility might also improve motivation during normal lessons.

However, some families would face practical difficulties. Parents who work five days a week might need to arrange childcare. Longer school days could also leave younger children tired. Schools should consult families before making a decision and offer supervised activities when necessary.

Overall, a four-day week could work if schools protect learning time and support families. A small trial would help teachers understand the effects before introducing a permanent change. The aim should be better learning rather than simply spending fewer days in school.`
export async function gradeEssay({ essay, examType }, { signal } = {}) {
  await pause(signal)
  const original = essay.match(/[^.!?]+[.!?]/u)?.[0]?.trim() || essay.trim().slice(0, 180)
  return {
    overall: examType === 'IELTS' ? 'Band 6.5' : 'Grade B',
    summary: 'Sample scorecard: a clear position, developed examples, and more precise language are the focus of this demonstration.',
    rubrics: [{ label: 'Grammar', value: 7 }, { label: 'Vocabulary', value: 6 }, { label: 'Coherence', value: 7 }, { label: 'Task Response', value: 6 }],
    corrections: [{ original, suggested: `One perspective is that ${original.charAt(0).toLowerCase()}${original.slice(1)}`, why: 'Illustrative style alternative: introducing a perspective can frame a discussion. Check that the revised sentence still expresses your intended meaning; it is not a detected grammar error.' }],
    tips: ['Give each body paragraph one main idea and a specific supporting example.', 'Explain why your example supports the argument instead of leaving the connection implicit.', 'Reserve a final review for subject–verb agreement, punctuation, and repeated words.'],
  }
}

export const readingExercise = {
  title: 'A cooler city, one rooftop at a time', subtitle: 'Environment · IGCSE practice · Approx. 2 minutes',
  paragraphs: ['In many cities, dark roofs absorb sunlight and release it as heat. This makes buildings and the surrounding streets warmer. Some schools have begun replacing bare roofs with shallow gardens to help address this problem.', 'The plants provide shade, while water evaporating from their leaves helps cool the air. Roof gardens can also absorb rainwater, reducing the amount that runs into drains during storms. They are not a complete solution: buildings must be checked to ensure they can safely support the extra weight.', 'At Riverside School, pupils compared two classrooms during the summer. The room beneath a planted roof was three degrees Celsius cooler than the one beneath a bare roof. The pupils measured both rooms at the same time each afternoon. However, the study lasted only two weeks, so the findings do not show how the roofs perform throughout the year.'],
  questions: [
    { id: 'cooling', text: 'How do the plants help cool the building?', points: [{ label: 'Plants provide shade', terms: ['shade', 'shading'] }, { label: 'Evaporating water cools the air', terms: ['evaporat', 'transpir'] }] },
    { id: 'caution', text: 'What must be checked before installing a roof garden, and why?', points: [{ label: 'The building must support the extra weight', terms: ['weight', 'load', 'structur', 'support'] }] },
    { id: 'evidence', text: 'What did the pupils find, and what limits their conclusion?', points: [{ label: 'The planted-roof room was three degrees cooler', terms: ['three degrees', '3 degrees', '3°'] }, { label: 'The two-week study cannot establish year-round performance', terms: ['two weeks', 'two-week', '2 weeks', 'year', 'season', 'short'] }] },
  ],
}
export const listeningExercise = {
  title: 'The school community garden', subtitle: 'School life · Synthetic demo narration',
  transcript: 'Last spring, a group of students turned an unused school courtyard into a community garden. They planted vegetables in raised beds and collected rainwater in barrels. The rainwater reduced their use of tap water by thirty percent. Every Friday, students measured plant growth and recorded their results. The garden also attracted bees, which helped pollinate the plants. At first, keeping the soil moist during hot weather was difficult. The students solved this problem by covering the soil with straw. They donated half of the harvested vegetables to a local food bank and used the rest in the school kitchen. Next year, they plan to invite nearby residents to join weekend gardening workshops.',
  questions: [
    { id: 'water', text: 'How did students save water, and by how much?', points: [{ label: 'They collected rainwater', terms: ['rainwater', 'rain water', 'barrel'] }, { label: 'Tap-water use fell by 30%', terms: ['30', 'thirty'] }] },
    { id: 'soil', text: 'What problem did hot weather cause, and how did students solve it?', points: [{ label: 'Keeping the soil moist was difficult', terms: ['dry', 'moist', 'dried'] }, { label: 'They covered the soil with straw', terms: ['straw'] }] },
    { id: 'harvest', text: 'What happened to the harvested vegetables?', points: [{ label: 'Half went to a food bank', terms: ['food bank', 'foodbank'] }, { label: 'The rest went to the school kitchen', terms: ['kitchen'] }] },
  ],
}
export async function analyzeComprehension({ mode, answers }, { signal } = {}) {
  await pause(signal)
  const exercise = mode === 'reading' ? readingExercise : listeningExercise
  const captured = [], missed = []
  exercise.questions.forEach(q => q.points.forEach(point => {
    const target = (answers[q.id] || '').toLowerCase()
    ;(point.terms.some(term => target.includes(term)) ? captured : missed).push(point.label)
  }))
  return { accuracy: Math.round(captured.length / (captured.length + missed.length) * 100), captured, missed }
}

export const mockExamHistory = [
  { id: 'mock-1', title: 'Foundation mock', topics: [{ subject: 'Chemistry', topic: 'Bonding', correct: 18, total: 20 }, { subject: 'Biology', topic: 'Cells', correct: 17, total: 20 }, { subject: 'Mathematics', topic: 'Algebra', correct: 16, total: 20 }] },
  { id: 'mock-2', title: 'Mixed-topic mock', topics: [{ subject: 'Mathematics', topic: 'Probability', correct: 8, total: 20 }, { subject: 'Biology', topic: 'Genetics', correct: 10, total: 20 }, { subject: 'Chemistry', topic: 'Reactions', correct: 11, total: 20 }] },
]
export function summarizeTopics(history) {
  const totals = new Map()
  for (const exam of history) for (const entry of exam.topics || []) {
    if (!Number.isFinite(entry.total) || entry.total <= 0 || !Number.isFinite(entry.correct)) continue
    const id = `${entry.subject}:${entry.topic}`
    const row = totals.get(id) || { id, subject: entry.subject, topic: entry.topic, correct: 0, total: 0 }
    row.correct += Math.max(0, Math.min(entry.correct, entry.total)); row.total += entry.total
    totals.set(id, row)
  }
  return [...totals.values()].map(row => ({ ...row, accuracy: Math.round(row.correct / row.total * 100) }))
}
export function buildStudyPlan(topics) {
  if (!topics.length) return []
  const weakest = [...topics].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3)
  return Array.from({ length: 7 }, (_, index) => {
    const focus = weakest[index % weakest.length]
    const tasks = [`Review ${focus.topic.toLowerCase()} notes and write three key ideas.`, `Answer five ${focus.topic.toLowerCase()} questions and explain each answer.`, `Revisit mistakes in ${focus.topic.toLowerCase()} and make two flashcards.`]
    return { id: `${index}:${focus.id}`, day: index + 1, subject: focus.subject, topic: focus.topic, task: index === 6 ? 'Take a short mixed-topic mock and compare it with your starting scores.' : tasks[Math.floor(index / 3)], minutes: index === 6 ? 30 : 20 }
  })
}
export async function generateStudyPlan({ topics }, { signal } = {}) {
  await pause(signal)
  return buildStudyPlan(topics)
}
