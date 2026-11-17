import { useEffect, useId, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import { ArrowUp, Bot, MessageSquare, RotateCcw, Sparkles, UserRound } from 'lucide-react'
import { DemoNotice, ErrorNotice, Pending, buttonClass, inputClass, secondaryClass } from './AiShared'
import useAiRequest from './useAiRequest'
import { tutorPrompts, tutorReply, tutorSubjects } from './mockAiService'

const welcome = subject => [{ id: 'welcome', role: 'assistant', content: `### Your study space for ${subject}\n\nChoose a starter below to explore a prepared lesson, or try the practice question.\n\n- Break a concept into small steps\n- Work through an example\n- Check your understanding\n\n**What would you like to work on?**` }]
const markdownComponents = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  h1: ({ children }) => <h3 className="mb-3 text-xl font-bold text-slate-900">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-3 text-xl font-bold text-slate-900">{children}</h3>,
  h3: ({ children }) => <h3 className="mb-3 text-xl font-bold text-slate-900">{children}</h3>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-2 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-2 pl-6">{children}</ol>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-violet-800 underline">{children}</a>,
  pre: ({ children }) => <pre className="my-3 overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm text-slate-900">{children}</pre>,
  code: ({ children }) => <code className="break-words rounded bg-slate-100 px-1 text-sm text-slate-900">{children}</code>,
}

/** reply({ subject, messages }, { signal }) => Promise<{ content: string }> */
export default function AiTutorChat({ reply = tutorReply }) {
  const id = useId()
  const [subject, setSubject] = useState(tutorSubjects[0])
  const [messages, setMessages] = useState(() => welcome(tutorSubjects[0]))
  const [draft, setDraft] = useState('')
  const [failed, setFailed] = useState(null)
  const log = useRef(null)
  const composer = useRef(null)
  const request = useAiRequest()
  useEffect(() => { if (log.current) log.current.scrollTop = messages.length === 1 ? 0 : log.current.scrollHeight }, [messages, request.pending])

  function changeSubject(value) {
    request.cancel(); setSubject(value); setMessages(welcome(value)); setDraft(''); setFailed(null)
  }
  async function send(text = draft, retryMessages = null) {
    if (request.pending || (!text.trim() && !retryMessages)) return
    const next = retryMessages || [...messages, { id: crypto.randomUUID(), role: 'user', content: text.trim() }]
    if (!retryMessages) { setMessages(next); setDraft('') }
    setFailed(next)
    composer.current?.focus()
    await request.run(signal => reply({ subject, messages: next.filter(m => m.id !== 'welcome').map(({ role, content }) => ({ role, content })) }, { signal }), response => {
      setMessages([...next, { id: crypto.randomUUID(), role: 'assistant', content: response.content }]); setFailed(null)
    })
  }
  return <div className="ai-suite">
    <DemoNotice />
    <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm" aria-label="AI tutor chat">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
        <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-800"><Bot size={25} aria-hidden="true" /></span><div><h2 className="text-xl font-bold text-slate-900">Your personal AI tutor</h2><p className="text-sm text-slate-600">A little clarity, whenever you need it.</p></div></div>
        <label htmlFor={`${id}-subject`} className="flex min-w-0 flex-wrap items-center gap-3 text-sm font-semibold text-slate-800">Subject<select id={`${id}-subject`} className={`${inputClass} sm:w-auto`} value={subject} onChange={e => changeSubject(e.target.value)}>{tutorSubjects.map(item => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div ref={log} role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions text" className="h-[430px] space-y-6 overflow-y-auto overscroll-contain bg-slate-50 p-4 sm:p-6">
        {messages.map(message => <div key={message.id} className={`flex min-w-0 items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
          <span className={`hidden h-10 w-10 shrink-0 sm:flex items-center justify-center rounded-full ${message.role === 'user' ? 'bg-slate-800 text-white' : 'border border-violet-200 bg-violet-100 text-violet-800'}`}>{message.role === 'user' ? <UserRound size={19} aria-hidden="true" /> : <Sparkles size={19} aria-hidden="true" />}</span>
          <div className={`min-w-0 max-w-full rounded-2xl border p-4 text-base text-slate-800 sm:max-w-[80%] sm:p-5 ${message.role === 'user' ? 'border-violet-200 bg-violet-100' : 'border-slate-300 bg-white'}`}>
            <p className="mb-2 text-sm font-bold text-slate-900">{message.role === 'user' ? 'You' : 'AI Tutor'}</p>
            <div className="break-words [overflow-wrap:anywhere]">{message.role === 'user' ? <p className="whitespace-pre-wrap">{message.content}</p> : <Markdown skipHtml components={markdownComponents}>{message.content}</Markdown>}</div>
          </div>
        </div>)}
        {request.pending && <div role="status" className="rounded-xl border border-slate-300 bg-white p-4 text-base text-slate-800"><Pending>Preparing your lesson…</Pending></div>}
      </div>
      <div className="sticky bottom-0 border-t border-slate-300 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap gap-2">{tutorPrompts.map(prompt => <button key={prompt} type="button" className={secondaryClass} disabled={request.pending || !!failed} onClick={() => send(prompt)}><MessageSquare size={16} aria-hidden="true" />{prompt}</button>)}</div>
        <ErrorNotice message={request.error} />
        {request.error && failed && <button type="button" className={`${secondaryClass} mb-4`} onClick={() => send('', failed)}><RotateCcw size={17} aria-hidden="true" />Retry last message</button>}
        <form onSubmit={e => { e.preventDefault(); send() }} className="flex items-end gap-3">
          <div className="min-w-0 flex-1"><label htmlFor={`${id}-message`} className="mb-2 block text-sm font-semibold text-slate-800">Message your tutor</label><textarea id={`${id}-message`} ref={composer} rows={2} maxLength={4000} className={`${inputClass} block max-h-48 min-h-20`} placeholder="Ask a question or share what you are working on…" value={draft} disabled={request.pending || !!failed} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }} /></div>
          <button type="submit" aria-label="Send message" className={`${buttonClass} shrink-0 px-4`} disabled={request.pending || !!failed || !draft.trim()}><ArrowUp size={22} aria-hidden="true" /><span className="hidden sm:inline">Send</span></button>
        </form>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"><span>Enter to send · Shift + Enter for a new line</span><button type="button" className="flex items-center gap-2 font-semibold text-slate-800 underline underline-offset-4" onClick={() => changeSubject(subject)}><RotateCcw size={15} aria-hidden="true" />New conversation</button></div>
      </div>
    </section>
  </div>
}
