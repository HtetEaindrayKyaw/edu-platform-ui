import { useEffect, useId, useRef, useState } from 'react'
import { AudioLines, BookOpen, CheckCircle2, ClipboardCheck, Eye, Headphones, Pause, Play, RotateCcw, Volume2 } from 'lucide-react'
import { DemoNotice, ErrorNotice, Panel, Pending, buttonClass, inputClass, secondaryClass } from './AiShared'
import useAiRequest from './useAiRequest'
import { analyzeComprehension, listeningExercise, readingExercise } from './mockAiService'

const timeLabel = seconds => `${Math.floor((seconds || 0) / 60)}:${String(Math.floor((seconds || 0) % 60)).padStart(2, '0')}`
function ListeningPlayer() {
  const id = useId()
  const audio = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState('1')
  const [transcript, setTranscript] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const element = audio.current
    return () => { element?.pause() }
  }, [])
  async function toggle() {
    if (!audio.current) return
    setError('')
    try {
      if (audio.current.paused) { audio.current.playbackRate = Number(speed); await audio.current.play() }
      else audio.current.pause()
    } catch { setError('Audio could not start. Try again, or open the transcript to continue the exercise.') }
  }
  return <div className="space-y-5">
    <audio ref={audio} src={`${import.meta.env.BASE_URL}audio/community-garden.wav`} preload="auto" onLoadedMetadata={e => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)} onTimeUpdate={e => setPosition(e.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setError('The audio sample could not load. Use the transcript to continue.')} />
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
      <div className="mb-5 flex items-center gap-3"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-violet-800"><Headphones size={27} aria-hidden="true" /></span><div><h3 className="text-lg font-bold text-slate-900">Listen with purpose</h3><p className="text-sm text-slate-700">Notice the facts, reasons, and outcomes.</p></div></div>
      <div className="mb-5 flex h-16 items-center justify-center gap-1" aria-hidden="true">{Array.from({ length: 32 }, (_, i) => <span key={i} className={`w-1.5 rounded-full ${playing ? 'bg-violet-700' : 'bg-violet-400'}`} style={{ height: `${20 + ((i * 17) % 45)}px` }} />)}</div>
      <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor={`${id}-seek`}>Audio progress</label><input id={`${id}-seek`} type="range" min={0} max={duration || 1} step="0.1" value={Math.min(position, duration || 1)} disabled={!duration} onChange={e => { const value = Number(e.target.value); audio.current.currentTime = value; setPosition(value) }} aria-valuetext={`${timeLabel(position)} of ${timeLabel(duration)}`} className="block w-full accent-violet-700" />
      <div className="mt-2 flex justify-between text-sm font-medium text-slate-700"><span>{timeLabel(position)}</span><span>{timeLabel(duration)}</span></div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><button className={buttonClass} onClick={toggle} aria-label={playing ? 'Pause audio' : 'Play audio'}>{playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}{playing ? 'Pause' : 'Play'}</button><button className={secondaryClass} aria-label="Restart audio" onClick={() => { audio.current.currentTime = 0; setPosition(0) }}><RotateCcw size={18} aria-hidden="true" /></button><label className="flex items-center gap-2 text-sm font-semibold text-slate-800" htmlFor={`${id}-speed`}>Speed<select id={`${id}-speed`} className={`${inputClass} w-auto px-3 py-2`} value={speed} onChange={e => { setSpeed(e.target.value); audio.current.playbackRate = Number(e.target.value) }}>{['0.75', '1', '1.25', '1.5'].map(value => <option key={value} value={value}>{value}×</option>)}</select></label></div>
    </div>
    <ErrorNotice message={error} />
    <button className={secondaryClass} aria-expanded={transcript} aria-controls={`${id}-transcript`} onClick={() => setTranscript(value => !value)}><Eye size={18} aria-hidden="true" />{transcript ? 'Hide' : 'Show'} transcript</button>
    {transcript && <div id={`${id}-transcript`} className="rounded-xl border border-slate-300 bg-slate-50 p-5"><h3 className="mb-3 text-lg font-semibold text-slate-900">Transcript</h3><p className="text-base leading-8 text-slate-800">{listeningExercise.transcript}</p></div>}
    <p className="flex items-start gap-2 text-sm text-slate-600"><Volume2 size={18} className="mt-0.5" aria-hidden="true" />You can pause, replay, and change the speed as often as you need.</p>
  </div>
}

/** analyze({ mode, answers: { [questionId]: string } }, { signal }) => Promise<ComprehensionFeedback> */
export default function AiComprehension({ analyze = analyzeComprehension }) {
  const id = useId()
  const [mode, setMode] = useState('reading')
  const [drafts, setDrafts] = useState({ reading: {}, listening: {} })
  const [feedback, setFeedback] = useState(null)
  const request = useAiRequest()
  const exercise = mode === 'reading' ? readingExercise : listeningExercise
  const answers = drafts[mode]
  const valid = exercise.questions.every(q => (answers[q.id] || '').trim().length >= 10)
  function changeMode(value) { request.cancel(); setMode(value); setFeedback(null) }
  const modes = [['reading', 'Reading Passage Mode', BookOpen], ['listening', 'Listening Audio Mode', AudioLines]]
  return <div className="ai-suite">
    <DemoNotice>The sample accuracy score uses keyword matching to demonstrate feedback. Live AI analysis is not connected.</DemoNotice>
    <div role="tablist" aria-label="Comprehension mode" className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-300 bg-white p-2">
      {modes.map(([key, label, Icon], index) => <button key={key} type="button" role="tab" id={`${id}-${key}-tab`} aria-controls={`${id}-exercise`} aria-selected={mode === key} tabIndex={mode === key ? 0 : -1} onClick={() => changeMode(key)} onKeyDown={e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : (index + 1) % 2; changeMode(modes[next][0]); document.getElementById(`${id}-${modes[next][0]}-tab`)?.focus() } }} className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold sm:text-base ${mode === key ? 'border-violet-700 bg-violet-700 text-white' : 'border-transparent bg-white text-slate-800 hover:bg-slate-100'}`}><Icon size={20} aria-hidden="true" />{label}</button>)}
    </div>
    <div id={`${id}-exercise`} role="tabpanel" aria-labelledby={`${id}-${mode}-tab`} className="ai-two-column grid items-start gap-6 xl:grid-cols-2">
      <Panel title={mode === 'reading' ? 'Read and reflect' : 'Listen and understand'} icon={mode === 'reading' ? BookOpen : Headphones}>
        <p className="mb-3 text-sm font-medium text-slate-600">{exercise.subtitle}</p><h3 className="mb-5 text-2xl font-bold text-slate-900">{exercise.title}</h3>
        {mode === 'reading' ? <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5">{exercise.paragraphs.map((paragraph, index) => <div key={paragraph}><p className="mb-2 text-sm font-bold text-violet-900">Paragraph {index + 1}</p><p className="text-base leading-8 text-slate-800">{paragraph}</p></div>)}</div> : <ListeningPlayer />}
      </Panel>
      <div className="min-w-0 space-y-6">
        <Panel title="Explain it in your own words" icon={ClipboardCheck}><p className="mb-5 text-base text-slate-600">Answer all three questions. Focus on meaning and supporting details.</p>
          <form onSubmit={e => { e.preventDefault(); if (valid && !request.pending) request.run(signal => analyze({ mode, answers: { ...answers } }, { signal }), setFeedback) }} className="ai-form">
            {exercise.questions.map((question, index) => <div key={question.id}><label htmlFor={`${id}-${question.id}`} className="mb-2 block text-base font-semibold text-slate-900">{index + 1}. {question.text}</label><textarea id={`${id}-${question.id}`} rows={3} maxLength={2000} className={inputClass} value={answers[question.id] || ''} onChange={e => { request.cancel(); setFeedback(null); setDrafts(previous => ({ ...previous, [mode]: { ...previous[mode], [question.id]: e.target.value } })) }} placeholder="Write what you understood…" /></div>)}
            <p className="text-sm text-slate-600">Write at least 10 characters per answer to analyze your understanding.</p><ErrorNotice message={request.error} /><button type="submit" className={`${buttonClass} w-full`} disabled={!valid || request.pending}>{request.pending ? <Pending>Reviewing your answers…</Pending> : <><ClipboardCheck size={20} aria-hidden="true" />Analyze Understanding</>}</button>
          </form>
        </Panel>
        <div aria-live="polite" aria-busy={request.pending}>{feedback && <Panel title="Your understanding" icon={CheckCircle2}><div className="mb-5 rounded-xl border border-violet-200 bg-violet-50 p-5"><p className="text-sm font-semibold text-violet-900">Demo accuracy score</p><p className="my-2 text-4xl font-bold text-slate-900">{feedback.accuracy}%</p><p className="text-sm text-slate-700">Keyword-based preview. Wording alone does not establish comprehension.</p></div><div className="space-y-4"><div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4"><h3 className="mb-3 text-lg font-semibold text-emerald-900">Key points captured</h3>{feedback.captured.length ? <ul className="list-disc space-y-2 pl-5 text-base text-emerald-950">{feedback.captured.map(point => <li key={point}>{point}</li>)}</ul> : <p className="text-base text-emerald-950">No sample keywords matched. Revisit the source and add specific details.</p>}</div><div className="rounded-xl border border-amber-300 bg-amber-50 p-4"><h3 className="mb-3 text-lg font-semibold text-amber-900">Missed details</h3>{feedback.missed.length ? <ul className="list-disc space-y-2 pl-5 text-base text-amber-950">{feedback.missed.map(point => <li key={point}>{point}</li>)}</ul> : <p className="text-base text-amber-950">All sample key points matched. Try explaining the ideas without looking at the source.</p>}</div></div></Panel>}</div>
      </div>
    </div>
  </div>
}
