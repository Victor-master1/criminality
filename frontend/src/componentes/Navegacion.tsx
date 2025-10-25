import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useVoiceGuideContext } from '../contextos/VoiceGuideContext'

export default function Navegacion() {
  const location = useLocation()
  const { cerrarSesion } = useAuth()
  const {
    enabled,
    speaking,
    setEnabled,
    voices,
    selectedVoiceName,
    setVoiceByName,
    speak,
    stopSpeaking
  } = useVoiceGuideContext()

  const enlaces = [
    { ruta: '/', texto: 'Dashboard', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ) },
    { ruta: '/datasets', texto: 'Datasets', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ) },
    { ruta: '/entrenamiento', texto: 'Entrenamiento', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>) },
    { ruta: '/resultados', texto: 'Resultados', icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>) },
  ]

  return (
    <nav className="glass sticky top-0 z-50 shadow-soft border-b border-white/20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-bold text-gradient">ML Studio</span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              {enlaces.map((enlace) => (
                <Link
                  key={enlace.ruta}
                  to={enlace.ruta}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    location.pathname === enlace.ruta
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-slate-700 hover:bg-white/80 hover:text-primary-600'
                  }`}
                >
                  {enlace.icon}
                  <span className="font-semibold text-sm">{enlace.texto}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Selector de voz (visible en pantallas >= sm) */}
            <div className="hidden sm:flex items-center space-x-2">
              <select
                value={selectedVoiceName ?? ''}
                onChange={(e) => setVoiceByName(e.target.value || null)}
                className="text-sm px-3 py-2 rounded-lg border bg-white"
                title="Selecciona la voz de la guía"
              >
                {voices.length === 0 ? (
                  <option value="">Cargando voces...</option>
                ) : (
                  <>
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} {v.lang ? `(${v.lang})` : ''}
                      </option>
                    ))}
                  </>
                )}
              </select>

              <button
                onClick={() => speak('Esta es una prueba de la voz seleccionada.')}
                className="px-3 py-2 bg-white/90 rounded-lg text-sm hover:scale-105 transition-transform"
                aria-label="Probar voz"
                title="Probar voz"
              >
                Probar
              </button>
            </div>

            <button
              onClick={() => {
                // Si está hablando, cancelar reproducción inmediata antes de desactivar
                if (enabled) stopSpeaking()
                setEnabled(!enabled)
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                enabled ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-700 hover:bg-white/80'
              }`}
              title={enabled ? 'Desactivar guía de voz' : 'Activar guía de voz'}
            >
              {speaking ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0 0l.707.707m-.707-.707a9 9 0 01-2.12-9.193 9 9 0 010-3.535m0 0a9 9 0 0112.728 0M10 13a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              )}
              <span className="text-sm font-semibold">Guía de Voz</span>
            </button>

            <button
              onClick={cerrarSesion}
              className="flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}