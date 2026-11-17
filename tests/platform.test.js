import test from 'node:test'
import assert from 'node:assert/strict'
import { eligibleQuestions, seedExams, seedQuestions, selectQuestions, validateExam, validateQuestion } from '../src/platform.js'

test('only published questions in the selected subject and topic can enter an exam', () => {
  const pool = eligibleQuestions([...seedQuestions, { ...seedQuestions[0], id: 'draft', status: 'Draft' }], 'Mathematics', 'Algebra')
  assert.equal(pool.length, 2)
  assert.ok(pool.every(q => q.subject === 'Mathematics' && q.topic === 'Algebra' && q.status === 'Published'))
})
test('publishing requires enough unique eligible questions; drafts can be prepared early', () => {
  assert.equal(validateExam(seedExams[0], seedQuestions), '')
  assert.match(validateExam({ ...seedExams[0], count: 6 }, seedQuestions), /Only 5/)
  assert.equal(validateExam({ ...seedExams[0], count: 6, status: 'Draft' }, seedQuestions), '')
  assert.match(validateExam({ ...seedExams[0], minutes: 0 }, seedQuestions), /time limit/)
})
test('question validation rejects duplicate answers and invalid answer indices', () => {
  assert.equal(validateQuestion(seedQuestions[0]), '')
  assert.match(validateQuestion({ ...seedQuestions[0], options: ['Yes',' yes ','No','Maybe'] }), /different/)
  assert.match(validateQuestion({ ...seedQuestions[0], answer: 4 }), /correct answer/)
})
test('question selection never duplicates or mutates the question bank', () => {
  const pool = eligibleQuestions(seedQuestions, 'Physics')
  const ids = pool.map(q => q.id)
  const chosen = selectQuestions(pool, 10)
  assert.equal(chosen.length, 5)
  assert.equal(new Set(chosen.map(q => q.id)).size, 5)
  assert.deepEqual(pool.map(q => q.id), ids)
  assert.deepEqual(selectQuestions(pool, 2, false), pool.slice(0, 2))
})
