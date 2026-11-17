import { FlaskConical, LoaderCircle, Sparkles } from 'lucide-react'
import './ai-suite.css'

export const inputClass = 'ai-field block w-full max-w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-violet-700 focus:outline-2 focus:outline-violet-700'
export const buttonClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-violet-700 bg-violet-700 px-5 py-3 text-base font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-600'
export const secondaryClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100'

export function DemoNotice({ children = 'Interactive preview with sample feedback. No live AI requests are sent.' }) {
  return <div className="mb-6 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-slate-800"><FlaskConical size={20} className="mt-0.5 text-violet-800" aria-hidden="true" /><p><strong className="font-semibold text-violet-900">Demo mode. </strong>{children}</p></div>
}
export function Panel({ title, icon: Icon = Sparkles, children, className = '', action }) {
  return <section className={`min-w-0 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm sm:p-6 ${className}`}><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-3 text-xl font-bold text-slate-900"><Icon size={22} className="text-violet-800" aria-hidden="true" />{title}</h2>{action}</div>{children}</section>
}
export function Pending({ children }) {
  return <span className="inline-flex items-center gap-2"><LoaderCircle size={19} className="animate-spin" aria-hidden="true" />{children}</span>
}
export function ErrorNotice({ message }) {
  return message ? <p role="alert" className="my-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-base text-rose-900">{message}</p> : null
}
export function AccuracyBar({ label, value, max = 100, tone = 'violet' }) {
  const safeValue = Math.max(0, Math.min(max, value))
  const colors = { violet: 'bg-violet-700', emerald: 'bg-emerald-700', amber: 'bg-amber-700' }
  return <div className="space-y-2"><div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800"><span>{label}</span><span>{safeValue}{max === 100 ? '%' : ` / ${max}`}</span></div><div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={safeValue} className="h-3 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${colors[tone] || colors.violet}`} style={{ width: `${safeValue / max * 100}%` }} /></div></div>
}
