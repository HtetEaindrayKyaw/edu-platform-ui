import { useId, useState } from 'react'
import { BookOpenCheck, CheckCheck, FilePenLine, Lightbulb, NotebookPen } from 'lucide-react'
import { AccuracyBar, DemoNotice, ErrorNotice, Panel, Pending, buttonClass, inputClass, secondaryClass } from './AiShared'
import useAiRequest from './useAiRequest'
import { countWords, gradeEssay, sampleEssay } from './mockAiService'

/** grade({ topic, examType, essay }, { signal }) => Promise<EssayFeedback> */
export default function AiEssayChecker({ grade = gradeEssay }) {
  const id = useId()
  const [topic, setTopic] = useState('Should schools introduce a four-day week?')
  const [examType, setExamType] = useState('IGCSE English')
  const [essay, setEssay] = useState('')
  const [feedback, setFeedback] = useState(null)
  const request = useAiRequest()
  const words = countWords(essay)
  const valid = topic.trim() && words >= 50 && words <= 5000
  function edit(setter, value) { request.cancel(); setter(value); setFeedback(null) }
  function submit(e) {
    e.preventDefault()
    if (!valid || request.pending) return
    request.run(signal => grade({ topic: topic.trim(), examType, essay: essay.trim() }, { signal }), setFeedback)
  }
  return <div className="ai-suite">
    <DemoNotice>Scores and feedback are illustrative examples, not an assessment of your writing.</DemoNotice>
    <div className="ai-two-column grid items-start gap-6 xl:grid-cols-2">
      <Panel title="Make your words count" icon={FilePenLine}>
        <form onSubmit={submit} className="ai-form">
          <label className="block text-sm font-semibold text-slate-800" htmlFor={`${id}-type`}>Exam type<select id={`${id}-type`} className={`${inputClass} mt-2`} value={examType} onChange={e => edit(setExamType, e.target.value)}><option>IGCSE English</option><option>IELTS</option></select></label>
          <label className="block text-sm font-semibold text-slate-800" htmlFor={`${id}-topic`}>Essay prompt or topic<input id={`${id}-topic`} className={`${inputClass} mt-2`} value={topic} maxLength={1000} required onChange={e => edit(setTopic, e.target.value)} placeholder="Enter the question you are answering" /></label>
          <div><div className="mb-2 flex flex-wrap items-center justify-between gap-3"><label htmlFor={`${id}-essay`} className="text-sm font-semibold text-slate-800">Your essay</label><button type="button" className="text-sm font-semibold text-violet-800 underline underline-offset-4" onClick={() => edit(setEssay, sampleEssay)}>Use sample essay</button></div><textarea id={`${id}-essay`} className={`${inputClass} min-h-96 leading-7`} rows={16} maxLength={40000} value={essay} onChange={e => edit(setEssay, e.target.value)} placeholder="Start writing or paste your essay here…" aria-describedby={`${id}-words`} /><div id={`${id}-words`} className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-slate-600"><span aria-live="polite">{words.toLocaleString()} words</span><span>50–5,000 words for this preview</span></div></div>
          <ErrorNotice message={request.error} />
          <button className={`${buttonClass} w-full`} disabled={!valid || request.pending} type="submit">{request.pending ? <Pending>Preparing scorecard…</Pending> : <><BookOpenCheck size={20} aria-hidden="true" />Grade My Essay</>}</button>
          <p className="text-sm text-slate-600">Your draft stays in this page only. Editing it clears the previous scorecard.</p>
        </form>
      </Panel>
      <div aria-live="polite" aria-busy={request.pending} className="min-w-0 space-y-6">
        {!feedback ? <Panel title="Your feedback, at a glance" icon={NotebookPen}><div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center"><span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-800"><FilePenLine size={30} aria-hidden="true" /></span><h3 className="mb-3 text-xl font-semibold text-slate-900">A clearer path to your next draft</h3><p className="max-w-sm text-base text-slate-600">Add at least 50 words, then grade your essay to explore a scorecard, sentence suggestions, and practical next steps.</p></div></Panel> : <>
          <Panel title="Your scorecard" icon={BookOpenCheck} action={<span className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-900">Sample feedback</span>}>
            <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50 p-5"><p className="text-sm font-semibold text-violet-900">Overall {examType === 'IELTS' ? 'band' : 'grade'} · {examType}</p><p className="my-2 text-4xl font-bold text-slate-900">{feedback.overall}</p><p className="text-base text-slate-700">{feedback.summary}</p></div>
            <p className="mb-4 text-sm text-slate-600">Illustrative rubric profile · each dimension out of 9</p><div className="space-y-5">{feedback.rubrics.map(rubric => <AccuracyBar key={rubric.label} label={rubric.label} value={rubric.value} max={9} />)}</div>
          </Panel>
          <Panel title="Sentence-by-sentence review" icon={CheckCheck}><div className="space-y-5">{feedback.corrections.map((correction, index) => <div key={index} className="space-y-3 rounded-xl border border-slate-300 p-4"><p className="text-sm font-bold text-slate-800">Sentence {index + 1} · Style suggestion</p><div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-base text-rose-950"><p className="mb-1 text-sm font-semibold">Original</p><p className="break-words">{correction.original}</p></div><p className="text-center text-lg font-semibold text-slate-700" aria-hidden="true">↓</p><div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-base text-emerald-950"><p className="mb-1 text-sm font-semibold">Suggested correction</p><p className="break-words">{correction.suggested}</p></div><p className="text-sm text-slate-700"><strong className="text-slate-900">Why: </strong>{correction.why}</p></div>)}</div></Panel>
          <Panel title="Build on this draft" icon={Lightbulb}><ol className="list-decimal space-y-3 pl-6 text-base text-slate-800">{feedback.tips.map(tip => <li key={tip}>{tip}</li>)}</ol><button className={`${secondaryClass} mt-5`} onClick={() => document.getElementById(`${id}-essay`)?.focus()}>Return to your essay</button></Panel>
        </>}
      </div>
    </div>
  </div>
}
