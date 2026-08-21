import { useState, useEffect } from 'react'
import HomeScreen from './screens/HomeScreen'
import SessionScreen from './screens/SessionScreen'
import AssimilScreen from './screens/AssimilScreen'
import ExpressionOraleScreen from './screens/ExpressionOraleScreen'
import ManageWordsScreen from './screens/ManageWordsScreen'
import ExitConfirm from './components/ExitConfirm'
import { useProgress } from './hooks/useProgress'
import { usePacksProgress } from './hooks/usePacksProgress'
import { useStreak } from './hooks/useStreak'
import { useSilentMode } from './hooks/useSilentMode'
import { useMissingAudio } from './hooks/useMissingAudio'
import { useExitGuard } from './hooks/useExitGuard'
import { loadVocab as readVocab, saveVocab } from './utils/vocabStore'
import { vocabulary as defaultVocab } from './data/words'

const loadVocab = () => readVocab(defaultVocab)

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
  const missingAudio = useMissingAudio(vocabulary)

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

  // Bouton « retour » du téléphone : on recule dans l'application plutôt que
  // de la fermer. Retourne false uniquement à l'accueil, où la confirmation
  // de sortie prend le relais.
  const handleHardwareBack = () => {
    if (screen === 'session') { endSession(); return true }
    if (screen !== 'home')    { setScreen('home'); return true }
    return false
  }
  const { askExit, cancelExit, confirmExit } = useExitGuard(handleHardwareBack)

  const updateVocab = (words) => {
    const existing = new Set(vocabulary.map(w => w.viet.toLowerCase()))
    const newWords = words.filter(w => !existing.has(w.viet.toLowerCase()))
    if (newWords.length > 0) {
      console.info('Nouveaux mots (relancer generate_audio.py) :', newWords.map(w => `${w.id}. ${w.viet}`))
    }
    setVocabulary(words)
    saveVocab(words)
  }

  const sessionProgress = session.packId
    ? packsProgress.getProgressFor(session.packId)
    : progress

  // L'écran courant est calculé puis rendu sous la modale de sortie,
  // afin que celle-ci puisse s'afficher par-dessus n'importe quel écran.
  let current
  if (screen === 'assimil') {
    current = <AssimilScreen online={online} onBack={() => setScreen('home')} />
  } else if (screen === 'expression') {
    current = <ExpressionOraleScreen onBack={() => setScreen('home')} />
  } else if (screen === 'manage') {
    current = (
      <ManageWordsScreen
        vocabulary={vocabulary}
        missingAudio={missingAudio}
        onVocabUpdate={updateVocab}
        onBack={() => setScreen('home')}
      />
    )
  } else if (screen === 'session') {
    current = (
      <SessionScreen
        key={`${session.name}-${session.words[0]?.id}`}
        words={session.words}
        packName={session.name}
        exerciseType={session.type}
        allWords={vocabulary}
        progress={sessionProgress}
        silent={silent}
        missingAudio={missingAudio}
        onBack={endSession}
        onComplete={continueSession}
      />
    )
  } else {
    current = (
      <HomeScreen
        vocabulary={vocabulary}
        progress={progress}
        packsProgress={packsProgress}
        streak={streak}
        silent={silent}
        online={online}
        missingAudio={missingAudio}
        onToggleSilent={toggleSilent}
        onStartSession={startSession}
        onVocabUpdate={updateVocab}
        onOpenAssimil={() => setScreen('assimil')}
        onOpenExpression={() => setScreen('expression')}
        onOpenManage={() => setScreen('manage')}
      />
    )
  }

  return (
    <>
      {current}
      {askExit && <ExitConfirm onCancel={cancelExit} onQuit={confirmExit} />}
    </>
  )
}
