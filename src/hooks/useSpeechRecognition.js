/**
 * useSpeechRecognition — wrapper autour de la Web Speech API
 * pour la reconnaissance vocale en vietnamien (vi-VN).
 *
 * Retourne : { start, stop, transcript, interim, isListening, isSupported, error, confidence }
 */
import { useState, useRef, useCallback, useEffect } from 'react'

export function useSpeechRecognition() {
  const [isListening, setIsListening]   = useState(false)
  const [transcript, setTranscript]     = useState('')
  const [interim, setInterim]           = useState('')
  const [confidence, setConfidence]     = useState(0)
  const [error, setError]               = useState(null)
  const recognitionRef = useRef(null)

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  /** Lance l'écoute. Réinitialise le transcript précédent. */
  const start = useCallback(() => {
    if (!isSupported) {
      setError('La reconnaissance vocale n\'est pas supportée par ce navigateur. Utilisez Chrome.')
      return
    }

    // Reset
    setTranscript('')
    setInterim('')
    setConfidence(0)
    setError(null)

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()

    recognition.lang            = 'vi-VN'
    recognition.continuous      = false   // une seule phrase
    recognition.interimResults  = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      let finalText   = ''
      let interimText = ''
      let conf        = 0

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
          conf = result[0].confidence
        } else {
          interimText += result[0].transcript
        }
      }

      if (finalText) {
        setTranscript(finalText)
        setConfidence(conf)
      }
      setInterim(interimText)
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      switch (event.error) {
        case 'no-speech':
          setError('Aucune voix détectée. Parlez plus fort ou rapprochez-vous du micro.')
          break
        case 'audio-capture':
          setError('Aucun microphone trouvé. Vérifiez votre périphérique audio.')
          break
        case 'not-allowed':
          setError('L\'accès au microphone a été refusé. Autorisez-le dans les paramètres du navigateur.')
          break
        case 'network':
          setError('Erreur réseau. La reconnaissance vocale nécessite une connexion internet.')
          break
        case 'aborted':
          break // abandon volontaire, pas d'erreur
        default:
          setError(`Erreur de reconnaissance : ${event.error}`)
      }
    }

    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }, [isSupported])

  /** Arrête l'écoute manuellement (déclenche onend). */
  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  /** Reset pour un nouvel essai sans relancer l'écoute. */
  const reset = useCallback(() => {
    setTranscript('')
    setInterim('')
    setConfidence(0)
    setError(null)
  }, [])

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  return { start, stop, reset, transcript, interim, confidence, isListening, isSupported, error }
}
