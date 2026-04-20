import { useState, useEffect } from 'react'
import HomeScreen from './screens/HomeScreen'
import SessionScreen from './screens/SessionScreen'
import AssimilScreen from './screens/AssimilScreen'
import { useProgress } from './hooks/useProgress'
import { usePacksProgress } from './hooks/usePacksProgress'
import { useStreak } from './hooks/useStreak'
import { useSilentMode } from './hooks/useSilentMode'
import { vocabulary as defaultVocab } from './data/words'

const VOCAB_KEY = 'viet-vocab'

function loadVocab() {
  try {
    const saved = localStorage.getItem(VOCAB_KEY)
    return saved ? JSON.parse(saved) : defaultVocab
  } catch { return defaultVocab }
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [session, setSession] = useState({ words: [], name: '', type: 'flashcard-vn-fr', packId: null })
  const [online, setOnline]   = useState(navigator.onLine)

  useEffect(() => {
    const up   = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online',  up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])
  const [vocabulary, setVocabulary] = useState(loadVocab)
  const progress      = useProgress()
  const packsProgress = usePacksProgress()
  const streak        = useStreak()
  const { silent, toggle: toggleSilent } = useSilentMode()

  const startSession = (words, name, exerciseType, packId = null) => {
    setSession({ words, name, type: exerciseType, packId })
    setScreen('session')
  }

  const continueSession = (remainingWords) => {
    setSession(s => ({ ...s, words: remainingWords }))
    setScreen('session')
  }

  const endSession = () => {
    streak.recordSession()
    setScreen('home')
  }

  const updateVocab = (words) => {
    const existing = new Set(vocabulary.map(w => w.viet.toLowerCase()))
    const newWords = words.filter(w => !existing.has(w.viet.toLowerCase()))
    if (newWords.length > 0) {
      console.info('Nouveaux mots (relancer generate_audio.py) :', newWords.map(w => `${w.id}. ${w.viet}`))
    }
    setVocabulary(words)
    localStorage.setItem(VOCAB_KEY, JSON.stringify(words))
  }

  if (screen === 'assimil') {
    return <AssimilScreen online={online} onBack={() => setScreen('home')} />
  }

  const sessionProgress = session.packId
    ? packsProgress.getProgressFor(session.packId)
    : progress

  if (screen === 'session') {
    return (
      <SessionScreen
        key={`${session.name}-${session.words[0]?.id}`}
        words={session.words}
        packName={session.name}
        exerciseType={session.type}
        allWords={vocabulary}
        progress={sessionProgress}
        silent={silent}
        onBack={endSession}
        onComplete={continueSession}
      />
    )
  }

  return (
    <HomeScreen
      vocabulary={vocabulary}
      progress={progress}
      packsProgress={packsProgress}
      streak={streak}
      silent={silent}
      online={online}
      onToggleSilent={toggleSilent}
      onStartSession={startSession}
      onVocabUpdate={updateVocab}
      onOpenAssimil={() => setScreen('assimil')}
    />
  )
}
