import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { api, getToken, setToken } from './api'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Shell from './pages/Shell'
import Inicio from './pages/Inicio'
import Entrenar from './pages/Entrenar'
import Retos from './pages/Retos'
import Coach from './pages/Coach'
import Perfil from './pages/Perfil'
import Configuracion from './pages/Configuracion'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

export default function App() {
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(!!getToken())
  const [toast, setToast] = useState(null)

  const refrescarUser = useCallback(() => api('/me').then(setUser), [])

  useEffect(() => {
    if (getToken()) refrescarUser().catch(() => setToken(null)).finally(() => setCargando(false))
  }, [refrescarUser])

  const login = (token, u) => { setToken(token); setUser(u) }
  const logout = () => { setToken(null); setUser(null) }
  const mostrarToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  if (cargando) return <div className="loading">Cargando GoTrain…</div>

  const privada = (el) => (user ? el : <Navigate to="/login" replace />)

  return (
    <AuthCtx.Provider value={{ user, login, logout, refrescarUser }}>
      <ToastCtx.Provider value={mostrarToast}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={user ? <Navigate to="/app" /> : <Auth modo="login" />} />
          <Route path="/registro" element={user ? <Navigate to="/app" /> : <Auth modo="registro" />} />
          <Route path="/app" element={privada(<Shell />)}>
            <Route index element={<Inicio />} />
            <Route path="entrenar" element={<Entrenar />} />
            <Route path="retos" element={<Retos />} />
            <Route path="coach" element={<Coach />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        {toast && <div className="toast">{toast}</div>}
      </ToastCtx.Provider>
    </AuthCtx.Provider>
  )
}
