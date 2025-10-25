import { ReactNode, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navegacion from './Navegacion'
import { useVoiceGuideContext } from '../contextos/VoiceGuideContext'
import { TEXTOS_GUIA } from '../constantes/guiaVoz'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { speak } = useVoiceGuideContext()
  const { usuario } = useAuth()

  useEffect(() => {
    if (usuario) {
      const path = location.pathname.split('/')[1] || 'dashboard'
      const texto = TEXTOS_GUIA[path as keyof typeof TEXTOS_GUIA]
      if (texto) {
        speak(texto)
      }
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navegacion />
      <main className="container mx-auto px-6 py-8 max-w-7xl animate-fade-in">
        {children}
      </main>
    </div>
  )
}