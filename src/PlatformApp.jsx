import { useEffect, useState } from 'react'
import StudentPortal from './App'
import AdminPanel from './AdminPanel'
import useLocalData from './useLocalData'
import { defaultSettings, seedExams, seedQuestions, seedStudents } from './platform'

export default function PlatformApp() {
  const [route, setRoute] = useState(() => window.location.hash)
  const [initialExam, setInitialExam] = useState(null)
  const [questions, setQuestions, questionError] = useLocalData('prepwise-questions-v1', seedQuestions)
  const [exams, setExams, examError] = useLocalData('prepwise-exams-v1', seedExams)
  const [students, setStudents, studentError] = useLocalData('prepwise-students-v1', seedStudents)
  const [settings, setSettings, settingsError] = useLocalData('prepwise-settings-v1', defaultSettings)
  const [history, setHistory, historyError] = useLocalData('prepwise-results', [])
  useEffect(() => {
    const listener = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', listener)
    return () => window.removeEventListener('hashchange', listener)
  }, [])
  const data = { questions, setQuestions, exams, setExams, students, setStudents, settings, setSettings, history, setHistory,
    storageError: questionError || examError || studentError || settingsError || historyError }
  const admin = /^#\/admin(?:\/|$)/.test(route)
  if (admin) return <AdminPanel section={route.split('/')[2]} data={data} onStudent={() => { setInitialExam(null); window.location.hash = '/student' }} onLaunch={exam => { setInitialExam(exam); window.location.hash = '/student' }}/>
  return <StudentPortal data={data} initialExam={initialExam} onAdmin={() => { window.location.hash = '/admin/overview' }}/>
}
