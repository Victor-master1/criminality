import { createContext, useContext, ReactNode } from 'react'
import { useVoiceGuide } from '../hooks/useVoiceGuide'

interface VoiceGuideContextType {
  enabled: boolean
  speaking: boolean
  setEnabled: (enabled: boolean) => void
  speak: (text: string) => void
  stopSpeaking: () => void
  hasSpokenWelcome: boolean
  setHasSpokenWelcome: (v: boolean) => void
  voices: SpeechSynthesisVoice[]
  selectedVoiceName: string | null
  setVoiceByName: (name: string | null) => void
}

const VoiceGuideContext = createContext<VoiceGuideContextType | null>(null)

export function VoiceGuideProvider({ children }: { children: ReactNode }) {
  const voiceGuide = useVoiceGuide()

  return (
    <VoiceGuideContext.Provider value={voiceGuide}>
      {children}
    </VoiceGuideContext.Provider>
  )
}

export function useVoiceGuideContext() {
  const context = useContext(VoiceGuideContext)
  if (!context) {
    throw new Error('useVoiceGuideContext debe usarse dentro de un VoiceGuideProvider')
  }
  return context
}