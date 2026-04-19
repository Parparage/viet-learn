import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import SessionScreen from './screens/SessionScreen'
import { useProgress } from './hooks/useProgress'
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
  const [session, setSession] = useState({ words: [], name: '', type: 'flashcard-vn-fr' })
  const [vocabulary, setVocabulary] = useState(loadVocab)
  const progress = useProgress()
  const streak   = useStreak()
  const { silent, toggle: toggleSilent } = useSilentMode()

  const startSession = (words, name, exerciseType) => {
    setSession({ words, name, type: exerciseType })
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

  if (screen === 'session') {
    return (
      <SessionScreen
        key={`${session.name}-${session.words[0]?.id}`}
        words={session.words}
        packName={session.name}
        exerciseType={session.type}
        allWords={vocabulary}
        progress={progress}
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
      streak={streak}
      silent={silent}
      onToggleSilent={toggleSilent}
      onStartSession={startSession}
      onVocabUpdate={updateVocab}
    />
  )
}
