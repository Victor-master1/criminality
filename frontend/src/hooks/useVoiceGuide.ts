import { useState, useEffect, useCallback } from 'react'

export function useVoiceGuide() {
  const [enabled, setEnabled] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(() => {
    try { return localStorage.getItem('voiceName') } catch { return null }
  })

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

  const stopSpeaking = useCallback(() => {
    if (synth?.speaking) synth.cancel()
    setSpeaking(false)
  }, [synth])

  const loadVoices = useCallback(() => {
    if (!synth) return
    const available = synth.getVoices() || []
    setVoices(available)

    // Si no hay voice seleccionada, elegir una preferente
    if (!selectedVoiceName) {
      const prefer = available.find(v =>
        v.lang.startsWith('es') && /google|neural|wave|microsoft/i.test(v.name)
      ) || available.find(v => v.lang.startsWith('es')) || available[0]
      if (prefer) {
        setSelectedVoiceName(prefer.name)
        try { localStorage.setItem('voiceName', prefer.name) } catch {}
      }
    }
  }, [synth, selectedVoiceName])

  useEffect(() => {
    loadVoices()
    if (!synth) return
    const handler = () => loadVoices()
    synth.addEventListener?.('voiceschanged', handler)
    return () => synth.removeEventListener?.('voiceschanged', handler)
  }, [loadVoices, synth])

  const setVoiceByName = (name: string | null) => {
    setSelectedVoiceName(name)
    try {
      if (name) localStorage.setItem('voiceName', name)
      else localStorage.removeItem('voiceName')
    } catch {}
  }

  const speak = useCallback((text: string) => {
    if (!enabled || !synth || !text) return

    stopSpeaking()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1

    // Asignar la voz seleccionada (si existe)
    const voice = voices.find(v => v.name === selectedVoiceName)
    if (voice) utterance.voice = voice

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    synth.speak(utterance)
  }, [enabled, synth, voices, selectedVoiceName, stopSpeaking])

  useEffect(() => {
    return () => { stopSpeaking() }
  }, [stopSpeaking])

  return {
    enabled,
    speaking,
    setEnabled,
    speak,
    stopSpeaking,
    hasSpokenWelcome,
    setHasSpokenWelcome,
    voices,
    selectedVoiceName,
    setVoiceByName
  }
}