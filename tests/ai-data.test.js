import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildStudyPlan, countWords, summarizeTopics, tutorReply } from '../src/components/ai/mockAiService.js'

test('topic accuracy weights question counts across exams and does not mutate history', () => {
  const history = [
    { topics: [{ subject: 'Biology', topic: 'Cells', correct: 1, total: 1 }] },
    { topics: [{ subject: 'Biology', topic: 'Cells', correct: 1, total: 9 }] },
  ]
  const before = JSON.stringify(history)
  const [topic] = summarizeTopics(history)
  assert.equal(topic.accuracy, 20)
  assert.equal(topic.total, 10)
  assert.equal(JSON.stringify(history), before)
})

test('empty and invalid attempt totals do not create invalid progress bars', () => {
  assert.deepEqual(summarizeTopics([{ topics: [{ subject: 'Biology', topic: 'Cells', correct: 0, total: 0 }, { total: NaN, correct: 1 }] }]), [])
  assert.deepEqual(summarizeTopics([]), [])
  assert.deepEqual(buildStudyPlan([]), [])
  assert.equal(countWords(' \n  '), 0)
  assert.equal(countWords('One\n two   three'), 3)
})

test('the seven-day plan prioritizes the weakest topics and produces unique task IDs', () => {
  const topics = [90, 40, 50, 60, 80].map((accuracy, i) => ({ id: `topic-${i}`, topic: `Topic ${i}`, subject: 'Chemistry', accuracy }))
  const before = JSON.stringify(topics)
  const plan = buildStudyPlan(topics)
  assert.equal(plan.length, 7)
  assert.equal(new Set(plan.map(task => task.id)).size, 7)
  assert.equal(plan[0].topic, 'Topic 1')
  assert.ok(plan.every(task => ['Topic 1', 'Topic 2', 'Topic 3'].includes(task.topic)))
  assert.equal(JSON.stringify(topics), before)
})

test('mock AI requests honor cancellation for navigation and draft changes', async () => {
  const controller = new AbortController()
  const response = tutorReply({ subject: 'IGCSE Biology', messages: [] }, { signal: controller.signal })
  controller.abort()
  await assert.rejects(response, { name: 'AbortError' })
})
