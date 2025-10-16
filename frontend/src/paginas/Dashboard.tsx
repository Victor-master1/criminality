import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

interface EstadisticasDashboard {
  total_datasets: number
  total_experimentos: number
  experimentos_activos: number
  ultimo_entrenamiento?: string
}

export default function Dashboard() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasDashboard | null>(null)
  const [experimentosRecientes, setExperimentosRecientes] = useState([])
  const [eliminando, setEliminando] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [respEst, respExp] = await Promise.all([
        axios.get('http://localhost:5000/api/estadisticas'),
        axios.get('http://localhost:5000/api/experimentos/recientes'),
      ])

      setEstadisticas(respEst.data)
      setExperimentosRecientes(respExp.data)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
  }

  const eliminarExperimento = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este experimento?')) return
    
    setEliminando(id)
    try {
      await axios.delete(`http://localhost:5000/api/experimentos/${id}`)
      cargarDatos()
    } catch (error) {
      console.error('Error al eliminar experimento:', error)
    } finally {
      setEliminando(null)
    }
  }

  const tarjetas = [
    {
      titulo: 'Total Datasets',
      valor: estadisticas?.total_datasets || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      titulo: 'Experimentos',
      valor: estadisticas?.total_experimentos || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      titulo: 'Activos',
      valor: estadisticas?.experimentos_activos || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
    {
      titulo: 'Último Entrenamiento',
      valor: estadisticas?.ultimo_entrenamiento
        ? new Date(estadisticas.ultimo_entrenamiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        : 'N/A',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    }
  ]

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600 text-lg">Panel de control de Machine Learning</p>
        </div>
        <Link to="/datasets" className="btn-primary space-x-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Proyecto</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tarjetas.map((tarjeta, index) => (
          <div
            key={index}
            className="stat-card group animate-scale-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-16 h-16 rounded-2xl ${tarjeta.bgColor} flex items-center justify-center ${tarjeta.textColor} group-hover:scale-110 transition-transform duration-300`}>
                {tarjeta.icon}
              </div>
            </div>
            <h3 className="text-slate-600 text-sm font-semibold mb-2 uppercase tracking-wide">{tarjeta.titulo}</h3>
            <p className="text-4xl font-bold text-slate-900">{tarjeta.valor}</p>
            <div className={`mt-4 h-1.5 rounded-full bg-gradient-to-r ${tarjeta.gradient}`}></div>
          </div>
        ))}
      </div>

      <div className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Experimentos Recientes</h2>
          </div>
          <Link to="/resultados" className="text-primary-600 hover:text-primary-700 font-semibold flex items-center space-x-1 group">
            <span>Ver todos</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="space-y-3">
          {experimentosRecientes.length > 0 ? (
            experimentosRecientes.map((exp: any, index) => (
              <div
                key={exp.id}
                className="group flex items-center justify-between p-5 bg-slate-50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 border-2 border-transparent hover:border-primary-200 animate-slide-up relative"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Link to={`/resultados?experimento=${exp.id}`} className="flex items-center space-x-4 flex-1">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl opacity-75"></div>
                    <div className="relative w-full h-full bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary-600 transition-colors">
                      {exp.nombre}
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{new Date(exp.fecha_creacion).toLocaleString('es-ES')}</span>
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <span className={`badge ${
                    exp.estado === 'completado' ? 'badge-success' :
                    exp.estado === 'entrenando' ? 'badge-warning' : 'badge-error'
                  }`}>
                    {exp.estado}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      eliminarExperimento(exp.id)
                    }}
                    disabled={eliminando === exp.id}
                    className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    title="Eliminar experimento"
                  >
                    {eliminando === exp.id ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No hay experimentos</h3>
              <p className="text-slate-600">Crea tu primer experimento para comenzar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}