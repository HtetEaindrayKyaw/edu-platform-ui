import { useMemo, useState } from 'react'
import './study.css'

const boards = ['Cambridge International (CIE)', 'Pearson Edexcel']
const qualifications = ['IGCSE', 'AS Level', 'A Level']

export default function StudyQuestionBank({ questions, onPractice }) {
  const [board, setBoard] = useState(boards[0])
  const [qualification, setQualification] = useState(qualifications[0])
  const [subject, setSubject] = useState('All subjects')
  const [topic, setTopic] = useState('All topics')
  const [difficulty, setDifficulty] = useState('All difficulties')
  const [search, setSearch] = useState('')

  const published = useMemo(() => questions.filter(question => question.status === 'Published'), [questions])
  const subjects = [...new Set(published.map(question => question.subject))]
  const topics = [...new Set(published
    .filter(question => subject === 'All subjects' || question.subject === subject)
    .map(question => question.topic))]
  const visible = published.filter(question =>
    (subject === 'All subjects' || question.subject === subject)
    && (topic === 'All topics' || question.topic === topic)
    && (difficulty === 'All difficulties' || question.difficulty === difficulty)
    && `${question.text} ${question.subject} ${question.topic}`.toLowerCase().includes(search.trim().toLowerCase()))

  return <section className="study-bank">
    <div className="study-cycle" aria-label="Suggested study process">
      <div><span>01</span><b>Choose a syllabus</b><small>Board, level, and subject</small></div>
      <div><span>02</span><b>Study a topic</b><small>Use questions to retrieve what you know</small></div>
      <div><span>03</span><b>Check and correct</b><small>Reveal the answer and explanation</small></div>
      <div><span>04</span><b>Apply under time</b><small>Finish with a published mock exam</small></div>
    </div>

    <div className="study-curriculum card">
      <div>
        <div className="eyebrow">YOUR STUDY ROUTE</div>
        <h2>{board} · {qualification}</h2>
        <p>Choose your exam route to keep your study context clear.</p>
      </div>
      <div className="study-route-fields">
        <label>Exam board<select value={board} onChange={event => setBoard(event.target.value)}>{boards.map(item => <option key={item}>{item}</option>)}</select></label>
        <label>Qualification<select value={qualification} onChange={event => setQualification(event.target.value)}>{qualifications.map(item => <option key={item}>{item}</option>)}</select></label>
      </div>
      <p className="study-demo-note">Preview data only: route selectors provide context but do not filter this general sample set, which is not mapped or verified against a board syllabus. Past papers and resources require authorized files and secure backend storage.</p>
    </div>

    <section className="card study-question-section" aria-label="Question bank">
      <div className="section-head">
        <div><h2>Question bank</h2><p>{published.length} published demo questions · answer, check, then practise.</p></div>
        <span>{visible.length} shown</span>
      </div>
      <div className="study-filters">
        <label className="study-search">Search questions<input aria-label="Search questions" type="search" placeholder="Search a question, topic, or subject" value={search} onChange={event => setSearch(event.target.value)}/></label>
        <label>Subject<select aria-label="Filter questions by subject" value={subject} onChange={event => { setSubject(event.target.value); setTopic('All topics') }}><option>All subjects</option>{subjects.map(item => <option key={item}>{item}</option>)}</select></label>
        <label>Topic<select aria-label="Filter questions by topic" value={topic} onChange={event => setTopic(event.target.value)}><option>All topics</option>{topics.map(item => <option key={item}>{item}</option>)}</select></label>
        <label>Difficulty<select aria-label="Filter questions by difficulty" value={difficulty} onChange={event => setDifficulty(event.target.value)}>{['All difficulties', 'Easy', 'Medium', 'Hard'].map(item => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="study-question-list">
        {visible.map((question, index) => <article className="study-question" key={question.id}>
          <div className="study-question-meta"><span>Question {index + 1}</span><span>{question.subject} · {question.topic}</span><span>{question.difficulty}</span></div>
          <h3>{question.text}</h3>
          <ol type="A">{question.options.map(option => <li key={option}>{option}</li>)}</ol>
          <details>
            <summary>Reveal answer and explanation</summary>
            <p><b>Answer:</b> {question.options[question.answer]}</p>
            {question.explanation && <p>{question.explanation}</p>}
          </details>
          <button className="text-button" onClick={() => onPractice(question)}>Practise {question.topic} <span>→</span></button>
        </article>)}
        {!visible.length && <div className="study-empty"><h3>No matching questions</h3><p>Try clearing a filter or search for another subject or topic.</p></div>}
      </div>
    </section>
  </section>
}
