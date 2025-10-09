import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import type { ColumnaStat } from '../tipos'

export default function Limpieza() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [columnas, setColumnas] = useState<ColumnaStat[]>([])
  const [vistaPrevia, setVistaPrevia] = useState<any[]>([])
  const [procesando, setProcesando] = useState(false)
  const [correlacion, setCorrelacion] = useState<any>(null)
  const [distribucionClases, setDistribucionClases] = useState<any[]>([])
  const [operaciones, setOperaciones] = useState({
    eliminar_nulos: true,
    normalizar: false,
    codificar_categoricas: true,
    detectar_outliers: false,
  })

  const COLORES = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444']

  useEffect(() => {
    cargarDatos()
  }, [id])

  const cargarDatos = async () => {
    try {
      const [respCol, respPrev, respCorr, respDist] = await Promise.all([
        axios.get(`http://localhost:5000/api/datasets/${id}/columnas`),
        axios.get(`http://localhost:5000/api/datasets/${id}/vista-previa`),
        axios.get(`http://localhost:5000/api/datasets/${id}/correlacion`),
        axios.get(`http://localhost:5000/api/datasets/${id}/distribucion-clases`)
      ])
      setColumnas(respCol.data)
      setVistaPrevia(respPrev.data)
      setCorrelacion(respCorr.data)
      setDistribucionClases(respDist.data)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
  }

  const aplicarLimpieza = async () => {
    setProcesando(true)
    try {
      await axios.post(`http://localhost:5000/api/datasets/${id}/limpiar`, operaciones)
      cargarDatos()
    } catch (error) {
      console.error('Error al limpiar:', error)
    } finally {
      setProcesando(false)
    }
  }

  const prepararDatosNulos = () => {
    return columnas.map(col => ({
      nombre: col.nombre.substring(0, 10),
      nulos: col.valores_nulos,
      completos: vistaPrevia.length - col.valores_nulos
    })).slice(0, 8)
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">Exploración y Limpieza</h1>
          <p className="text-slate-600 text-lg">Analiza y prepara tus datos</p>
        </div>
        <button
          onClick={() => navigate('/entrenamiento')}
          className="btn-primary space-x-2"
        >
          <span>Continuar al Entrenamiento</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Vista Previa</h2>
            </div>
            <div className="overflow-x-auto rounded-xl border-2 border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {vistaPrevia[0] && Object.keys(vistaPrevia[0]).map((col) => (
                      <th key={col} className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vistaPrevia.slice(0, 10).map((fila, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      {Object.values(fila).map((valor: any, colIdx) => (
                        <td key={colIdx} className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {String(valor)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {columnas.length > 0 && (
              <div className="card p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center space-x-2">
                  <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Valores Nulos por Columna</span>
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={prepararDatosNulos()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="nombre" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '12px' }} />
                    <Legend />
                    <Bar dataKey="nulos" stackId="a" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="completos" stackId="a" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {distribucionClases.length > 0 && (
              <div className="card p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center space-x-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  </svg>
                  <span>Distribución de Datos</span>
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={distribucionClases}
                      dataKey="cantidad"
                      nameKey="clase"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {distribucionClases.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {columnas.filter(c => c.promedio !== undefined).length > 0 && (
              <div className="card p-6 md:col-span-2">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center space-x-2">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <span>Estadísticas Numéricas</span>
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={columnas.filter(c => c.promedio !== undefined).slice(0, 6).map(c => ({
                    nombre: c.nombre.substring(0, 8),
                    promedio: c.promedio,
                    min: c.min,
                    max: c.max
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="nombre" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '12px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="promedio" stroke="#0ea5e9" strokeWidth={3} />
                    <Line type="monotone" dataKey="min" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Estadísticas Detalladas</h2>
            </div>
            <div className="space-y-4">
              {columnas.map((col) => (
                <div key={col.nombre} className="border-2 border-slate-100 rounded-xl p-5 hover:border-primary-200 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{col.nombre}</h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 mt-1">
                        {col.tipo}
                      </span>
                    </div>
                    <span className="badge badge-info">
                      {col.valores_unicos} únicos
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-slate-600">Nulos:</span>
                      <span className="font-semibold text-slate-900">{col.valores_nulos}</span>
                    </div>
                    {col.promedio !== undefined && (
                      <>
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                          <span className="text-slate-600">Promedio:</span>
                          <span className="font-semibold text-slate-900">{col.promedio.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span className="text-slate-600">Mínimo:</span>
                          <span className="font-semibold text-slate-900">{col.min}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          <span className="text-slate-600">Máximo:</span>
                          <span className="font-semibold text-slate-900">{col.max}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Operaciones</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                <input
                  type="checkbox"
                  checked={operaciones.eliminar_nulos}
                  onChange={(e) => setOperaciones({ ...operaciones, eliminar_nulos: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">Eliminar Valores Nulos</div>
                  <div className="text-sm text-slate-600 mt-1">Remover filas con datos faltantes</div>
                </div>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                <input
                  type="checkbox"
                  checked={operaciones.normalizar}
                  onChange={(e) => setOperaciones({ ...operaciones, normalizar: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">Normalizar Datos</div>
                  <div className="text-sm text-slate-600 mt-1">Escalar valores numéricos</div>
                </div>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                <input
                  type="checkbox"
                  checked={operaciones.codificar_categoricas}
                  onChange={(e) => setOperaciones({ ...operaciones, codificar_categoricas: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">Codificar Categóricas</div>
                  <div className="text-sm text-slate-600 mt-1">Convertir texto a números</div>
                </div>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                <input
                  type="checkbox"
                  checked={operaciones.detectar_outliers}
                  onChange={(e) => setOperaciones({ ...operaciones, detectar_outliers: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">Detectar Outliers</div>
                  <div className="text-sm text-slate-600 mt-1">Identificar valores atípicos</div>
                </div>
              </label>
            </div>
            <button
              onClick={aplicarLimpieza}
              disabled={procesando}
              className="w-full mt-6 btn-primary"
            >
              {procesando ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Procesando...</span>
                </div>
              ) : (
                'Aplicar Limpieza'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}