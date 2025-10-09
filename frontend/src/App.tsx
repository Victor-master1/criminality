import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './componentes/Layout'
import Dashboard from './paginas/Dashboard'
import Datasets from './paginas/Datasets'
import Limpieza from './paginas/Limpieza'
import Entrenamiento from './paginas/Entrenamiento'
import Resultados from './paginas/Resultados'
import Login from './paginas/Login'

function App() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!usuario) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/datasets" element={<Datasets />} />
          <Route path="/limpieza/:id" element={<Limpieza />} />
          <Route path="/entrenamiento" element={<Entrenamiento />} />
          <Route path="/resultados" element={<Resultados />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App