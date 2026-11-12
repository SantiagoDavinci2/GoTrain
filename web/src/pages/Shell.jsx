import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api, fmtFecha } from '../api'
import { useAuth } from '../App'

const ITEMS = [
  ['', '🏠', 'Inicio'], ['entrenar', '💪', 'Entrenar'], ['retos', '🏆', 'Retos'],
  ['coach', '🤖', 'Coach IA'], ['perfil', '👤', 'Perfil'], ['configuracion', '⚙️', 'Configuración'],
]

function Buscador() {
  const [q, setQ] = useState('')
  const [res, setRes] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    if (q.trim().length < 2) { setRes(null); return }
    const t = setTimeout(() => api(`/search?q=${encodeURIComponent(q)}`).then(setRes).catch(() => {}), 250)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="search-wrap">
      <input className="search" placeholder="🔍 Buscar entrenamientos, usuarios..." value={q}
        onChange={(e) => setQ(e.target.value)} onBlur={() => setTimeout(() => setRes(null), 200)} />
      {res && (
        <div className="search-res">
          {!res.entrenamientos.length && !res.usuarios.length && <div className="sr-i">Sin resultados</div>}
          {!!res.entrenamientos.length && <div className="sr-h">Mis entrenamientos</div>}
          {res.entrenamientos.map((w) => (
            <div key={w.id} className="sr-i" onClick={() => nav('/app/perfil')}><span>{w.nombre}</span><span className="wk-date">{fmtFecha(w.fecha, true)}</span></div>
          ))}
          {!!res.usuarios.length && <div className="sr-h">Usuarios</div>}
          {res.usuarios.map((u) => (
            <div key={u.id} className="sr-i"><span>{u.nombre}</span><span className="wk-date">Nivel {u.nivel}</span></div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Shell() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sb-logo">GoTrain</div>
        {ITEMS.map(([to, ic, label]) => (
          <NavLink key={label} to={`/app${to ? '/' + to : ''}`} end={!to} className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`}>
            <span className="sb-icon">{ic}</span>{label}
          </NavLink>
        ))}
        <button className="sb-bottom" onClick={() => { logout(); nav('/') }}>← Cerrar sesión</button>
      </aside>
      <div className="main">
        <div className="topbar">
          <Buscador />
          <div className="top-right">
            <span style={{ color: '#9B9BB0', fontSize: '1.1rem', cursor: 'pointer' }} title="Actividad" onClick={() => nav('/app/retos?tab=actividad')}>🔔</span>
            <div className="top-user" style={{ cursor: 'pointer' }} onClick={() => nav('/app/perfil')}>
              <div className="avatar">{user.iniciales}</div>
              <b style={{ fontSize: '.9rem' }}>{user.nombre}</b>
            </div>
          </div>
        </div>
        <div className="content"><Outlet /></div>
      </div>
    </div>
  )
}
