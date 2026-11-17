import { useId, useMemo, useState } from 'react'
import { ArrowRight, CalendarCheck, ChartNoAxesCombined, CheckCircle2, Crosshair, Medal, RotateCcw, TrendingUp } from 'lucide-react'
import { AccuracyBar, DemoNotice, ErrorNotice, Panel, Pending, buttonClass, inputClass, secondaryClass } from './AiShared'
import useAiRequest from './useAiRequest'
import { buildStudyPlan, generateStudyPlan, mockExamHistory, summarizeTopics } from './mockAiService'

function QuickDrill({ focus }) {
  const [answer, setAnswer] = useState('')
  return <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-5"><h3 className="mb-2 text-xl font-semibold text-slate-900">Your focused practice has started</h3><p className="mb-4 text-base text-slate-800">Without looking at your notes, explain one key idea in {focus.topic} ({focus.subject}), then write an example.</p><label className="block text-sm font-semibold text-slate-800">Retrieval practice<textarea rows={4} className={`${inputClass} mt-2`} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Recall the idea, explain it, and give an example…" /></label><p className="mt-3 text-sm text-slate-700">{answer.trim().length >= 30 ? 'Next: compare your explanation with your notes and correct any gaps.' : 'Aim for at least two sentences before checking your notes.'}</p></div>
}

/** history: [{ id, topics: [{ subject, topic, correct, total }] }]
 * onPracticeWeakTopics(topics) can open your question-bank practice builder.
 */
export default function AiWeaknessAnalysis({ history = mockExamHistory, generatePlan = generateStudyPlan, onPracticeWeakTopics }) {
  const id = useId()
  const [subject, setSubject] = useState('All subjects')
  const allTopics = useMemo(() => summarizeTopics(history), [history])
  const topics = allTopics.filter(row => subject === 'All subjects' || row.subject === subject)
  // Aggregate correct / attempted across exams, rather than averaging percentages.
  const sorted = [...topics].sort((a, b) => a.accuracy - b.accuracy || a.id.localeCompare(b.id))
  const weakest = sorted.slice(0, 3), strongest = [...sorted].reverse().slice(0, 3)
  const attempts = topics.reduce((sum, row) => sum + row.total, 0)
  const correct = topics.reduce((sum, row) => sum + row.correct, 0)
  const planKey = `${subject}:${topics.map(t => `${t.id}:${t.correct}:${t.total}`).join('|')}`
  const [generated, setGenerated] = useState(null)
  const [completed, setCompleted] = useState({})
  const [focus, setFocus] = useState(null)
  const request = useAiRequest()
  const plan = generated?.key === planKey ? generated.days : buildStudyPlan(topics)
  const completedCount = plan.filter(day => completed[`${planKey}:${day.id}`]).length
  function changeSubject(value) { request.cancel(); setSubject(value); setFocus(null) }
  return <div className="ai-suite">
    <DemoNotice>{history === mockExamHistory ? 'This dashboard uses two sample mock exams. ' : 'This dashboard summarizes the supplied topic-level history. '}Study recommendations are prepared examples until live AI is connected.</DemoNotice>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold text-slate-900">Turn insight into your next step</h2><p className="mt-2 text-base text-slate-600">See what is working, then give your gaps a little attention.</p></div><label className="min-w-0 text-sm font-semibold text-slate-800" htmlFor={`${id}-subject`}>Filter subject<select id={`${id}-subject`} className={`${inputClass} mt-2 block sm:w-56`} value={subject} onChange={e => changeSubject(e.target.value)}>{['All subjects', ...new Set(allTopics.map(row => row.subject))].map(item => <option key={item}>{item}</option>)}</select></label></div>
    {!topics.length ? <Panel title="Start with a practice session" icon={ChartNoAxesCombined}><p className="text-base text-slate-700">Topic insights will appear when your mock history includes answered questions with topic-level results.</p></Panel> : <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">{[['Questions answered', attempts, 'Across the selected topics'], ['Overall accuracy', `${Math.round(correct / attempts * 100)}%`, 'Correct answers / total attempts'], ['Focus topics', weakest.length, 'Your next revision priorities']].map(([label, value, description]) => <section key={label} className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-700">{label}</p><p className="my-2 text-3xl font-bold text-slate-900">{value}</p><p className="text-sm text-slate-600">{description}</p></section>)}</div>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Panel title="Topic-by-topic accuracy" icon={ChartNoAxesCombined}><p className="mb-5 text-sm text-slate-600">Ranked from lowest to highest. Prioritize topics with enough attempts to show a pattern.</p><div className="space-y-5">{sorted.map(row => <div key={row.id}><AccuracyBar label={`${row.topic} · ${row.subject}`} value={row.accuracy} tone={row.accuracy >= 75 ? 'emerald' : 'amber'} /><p className="mt-1 text-sm text-slate-600">{row.correct} of {row.total} correct</p></div>)}</div></Panel>
        <div className="space-y-6">
          <section className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 sm:p-6"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-emerald-950"><Medal size={23} aria-hidden="true" />Top {strongest.length} Strongest Topics</h2><ol className="list-none space-y-4 p-0">{strongest.map((row, index) => <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-4"><div><p className="text-base font-semibold text-slate-900">{index + 1}. {row.topic}</p><p className="text-sm text-slate-600">{row.subject}</p></div><span className="text-xl font-bold text-emerald-800">{row.accuracy}%</span></li>)}</ol></section>
          <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-amber-950"><Crosshair size={23} aria-hidden="true" />Top {weakest.length} Weakest Topics</h2><ol className="list-none space-y-4 p-0">{weakest.map((row, index) => <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white p-4"><div><p className="text-base font-semibold text-slate-900">{index + 1}. {row.topic}</p><p className="text-sm text-slate-600">{row.subject}</p></div><span className="text-xl font-bold text-amber-900">{row.accuracy}%</span></li>)}</ol></section>
        </div>
      </div>
      <Panel title="AI-Generated 7-Day Study Plan" icon={CalendarCheck} className="mt-6" action={<span className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-900">Demo recommendation</span>}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><p className="text-base text-slate-700">A manageable routine, focused on your lowest-scoring topics.</p><button className={secondaryClass} disabled={request.pending} onClick={() => request.run(signal => generatePlan({ topics: sorted }, { signal }), days => { setGenerated({ key: planKey, days }); setCompleted(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith(`${planKey}:`)))) })}>{request.pending ? <Pending>Preparing plan…</Pending> : <><RotateCcw size={17} aria-hidden="true" />Regenerate plan</>}</button></div>
        <ErrorNotice message={request.error} /><div className="mb-5"><AccuracyBar label={`${completedCount} of ${plan.length} days complete`} value={Math.round(completedCount / Math.max(1, plan.length) * 100)} /></div>
        <div className="grid gap-3 lg:grid-cols-2">{plan.map(day => {
          const key = `${planKey}:${day.id}`, checked = !!completed[key]
          return <label key={day.id} className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 ${checked ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 bg-slate-50'}`}><input type="checkbox" aria-label={`Day ${day.day}: ${day.topic}`} checked={checked} onChange={e => setCompleted(previous => ({ ...previous, [key]: e.target.checked }))} className="mt-1" /><span className="min-w-0"><span className="flex flex-wrap items-center gap-2 text-sm font-bold text-violet-900">Day {day.day}<span className="font-medium text-slate-600">· {day.minutes} min · {day.subject}</span>{checked && <CheckCircle2 size={17} className="text-emerald-800" aria-hidden="true" />}</span><span className="mt-1 block text-base font-semibold text-slate-900">{day.topic}</span><span className={`mt-1 block text-base text-slate-700 ${checked ? 'line-through' : ''}`}>{day.task}</span></span></label>
        })}</div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-violet-200 bg-violet-50 p-5"><div><p className="flex items-center gap-2 text-lg font-bold text-slate-900"><TrendingUp size={21} aria-hidden="true" />Ready to close the gaps?</p><p className="mt-1 text-base text-slate-700">Start with {weakest[0].topic} in {weakest[0].subject}.</p></div><button className={buttonClass} onClick={() => onPracticeWeakTopics ? onPracticeWeakTopics(weakest) : setFocus(weakest[0])}>Practice Weak Topics Now<ArrowRight size={20} aria-hidden="true" /></button></div>
        {focus && <QuickDrill key={focus.id} focus={focus} />}
        <p className="mt-4 text-sm text-slate-600">Task checkmarks stay here while this page is open. Account-based progress saving comes with the PHP integration.</p>
      </Panel>
    </>}
  </div>
}
