export const subjectNames = ['Mathematics', 'Physics', 'Chemistry', 'Biology']

const samples = [
  ['Mathematics', 'Algebra', 'If f(x) = 2x² + 3x − 5, what is f(3)?', ['18', '22', '24', '26'], 1],
  ['Mathematics', 'Calculus', 'What is the derivative of x³?', ['3x²', 'x²', '3x', 'x⁴/4'], 0],
  ['Mathematics', 'Geometry', 'A triangle has angles of 45° and 65°. What is its third angle?', ['60°', '70°', '80°', '90°'], 1],
  ['Mathematics', 'Probability', 'What is the probability of rolling an even number on a fair die?', ['1/6', '1/3', '1/2', '2/3'], 2],
  ['Mathematics', 'Algebra', 'What is log₁₀(1000)?', ['2', '3', '10', '100'], 1],
  ['Physics', 'Mechanics', 'What is the SI unit of force?', ['Joule', 'Newton', 'Watt', 'Pascal'], 1],
  ['Physics', 'Electricity', 'Which formula describes Ohm’s law?', ['V = IR', 'P = IV²', 'F = ma', 'E = mc²'], 0],
  ['Physics', 'Waves', 'Which wave can travel through a vacuum?', ['Sound', 'Water', 'Light', 'Seismic'], 2],
  ['Physics', 'Mechanics', 'A 2 kg object accelerates at 3 m/s². What force acts on it?', ['1.5 N', '5 N', '6 N', '9 N'], 2],
  ['Physics', 'Energy', 'What is the SI unit of energy?', ['Newton', 'Joule', 'Ampere', 'Volt'], 1],
  ['Chemistry', 'Atoms', 'What is the atomic number of carbon?', ['4', '6', '8', '12'], 1],
  ['Chemistry', 'Acids & bases', 'A solution with a pH of 2 is…', ['Acidic', 'Neutral', 'Basic', 'Always pure water'], 0],
  ['Chemistry', 'Bonding', 'A covalent bond involves…', ['Sharing electrons', 'Sharing protons', 'Losing neutrons', 'Splitting nuclei'], 0],
  ['Chemistry', 'Elements', 'What is the chemical symbol for sodium?', ['S', 'So', 'Na', 'N'], 2],
  ['Chemistry', 'Reactions', 'Which gas is needed for ordinary combustion?', ['Helium', 'Nitrogen', 'Oxygen', 'Neon'], 2],
  ['Biology', 'Cells', 'Which organelle is the main site of aerobic respiration?', ['Nucleus', 'Mitochondrion', 'Ribosome', 'Golgi apparatus'], 1],
  ['Biology', 'Plants', 'Which pigment absorbs light for photosynthesis?', ['Melanin', 'Hemoglobin', 'Chlorophyll', 'Keratin'], 2],
  ['Biology', 'Genetics', 'What does DNA stand for?', ['Deoxyribonucleic acid', 'Dinitrogen acid', 'Dynamic nuclear atom', 'Double nitrogen acid'], 0],
  ['Biology', 'Human body', 'Which organ pumps blood around the body?', ['Liver', 'Lung', 'Kidney', 'Heart'], 3],
  ['Biology', 'Ecology', 'An organism that makes its own food is called a…', ['Consumer', 'Producer', 'Parasite', 'Decomposer'], 1],
]

export const seedQuestions = samples.map(([subject, topic, text, options, answer], i) => ({
  id: `q-${i + 1}`, subject, topic, text, options, answer,
  difficulty: i % 3 === 0 ? 'Medium' : 'Easy', status: 'Published', explanation: `The correct answer is ${options[answer]}.`,
}))
export const seedExams = subjectNames.map((subject, i) => ({
  id: `exam-${i + 1}`, title: `${subject} foundations`, subject, topic: 'All topics',
  count: 5, minutes: 10, negative: false, random: true, status: i === 3 ? 'Draft' : 'Published',
}))
export const seedStudents = [
  { id: 'student-1', name: 'Alex Lewis', email: 'alex@example.com', status: 'Active' },
  { id: 'student-2', name: 'Maya Chen', email: 'maya@example.com', status: 'Active' },
  { id: 'student-3', name: 'James Wilson', email: 'james@example.com', status: 'Inactive' },
  { id: 'student-4', name: 'Sofia Patel', email: 'sofia@example.com', status: 'Active' },
]
export const defaultSettings = { name: 'Prepwise', passMark: 60, defaultMinutes: 10 }

export function eligibleQuestions(questions, subject, topic = 'All topics') {
  return questions.filter(q => q.status === 'Published' && q.subject === subject && (topic === 'All topics' || q.topic === topic))
}

export function validateQuestion(question) {
  if (!question.text.trim() || !question.topic.trim()) return 'Add a question and topic.'
  if (question.options.length !== 4 || question.options.some(o => !o.trim())) return 'Fill in all four answer options.'
  if (new Set(question.options.map(o => o.trim().toLowerCase())).size !== 4) return 'Each answer option must be different.'
  if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) return 'Select a correct answer.'
  return ''
}

export function validateExam(exam, questions) {
  if (!exam.title.trim()) return 'Give your exam a title.'
  if (!Number.isInteger(exam.count) || exam.count < 1 || exam.count > 100) return 'Choose between 1 and 100 questions.'
  if (!Number.isInteger(exam.minutes) || exam.minutes < 1 || exam.minutes > 180) return 'Choose a time limit between 1 and 180 minutes.'
  const available = eligibleQuestions(questions, exam.subject, exam.topic).length
  if (exam.status === 'Published' && available < exam.count) return `Only ${available} published questions match. Lower the count or save as a draft.`
  return ''
}

export function selectQuestions(pool, count, random = true) {
  const shuffled = [...pool]
  if (random) for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}
