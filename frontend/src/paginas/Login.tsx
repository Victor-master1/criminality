import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [esRegistro, setEsRegistro] = useState(false)
  const [error, setError] = useState('')
  const { iniciarSesion, registrarse } = useAuth()

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = esRegistro
      ? await registrarse(email, password)
      : await iniciarSesion(email, password)

    if (error) {
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass border border-white/20 rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-blue-100 rounded-3xl rotate-6"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-primary-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">
              {esRegistro ? 'Crear Cuenta' : 'Bienvenido'}
            </h2>
            <p className="text-white/90 text-lg">
              {esRegistro ? 'Regístrate para comenzar' : 'Inicia sesión en ML Studio'}
            </p>
          </div>

          <form onSubmit={manejarEnvio} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/20 border-2 border-rose-400 text-white px-4 py-3 rounded-xl text-sm font-medium backdrop-blur-sm flex items-center space-x-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="w-full bg-white text-primary-600 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105">
              {esRegistro ? 'Registrarse' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setEsRegistro(!esRegistro)}
              className="text-white hover:text-white/90 text-sm font-semibold transition-colors underline decoration-2 underline-offset-4"
            >
              {esRegistro
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}