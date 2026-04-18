import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import SessionScreen from './screens/SessionScreen'
import { useProgress } from './hooks/useProgress'
import { useStreak } from './hooks/useStreak'
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
  const [sessionWords, setSessionWords] = useState([])
  const [packName, setPackName] = useState('')
  const [vocabulary, setVocabulary] = useState(loadVocab)
  const progress = useProgress()
  const streak = useStreak()

  const startSession = (words, name) => {
    setSessionWords(words)
    setPackName(name)
    setScreen('session')
  }

  const continueSession = (remainingWords) => {
    setSessionWords(remainingWords)
    setScreen('session')
  }

  const endSession = () => {
    streak.recordSession()
    setScreen('home')
  }

  const updateVocab = (words) => {
    setVocabulary(words)
    localStorage.setItem(VOCAB_KEY, JSON.stringify(words))
  }

  if (screen === 'session') {
    return (
      <SessionScreen
        key={`${packName}-${sessionWords[0]?.id}`}
        words={sessionWords}
        packName={packName}
        progress={progress}
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
      onStartSession={startSession}
      onVocabUpdate={updateVocab}
    />
  )
}
