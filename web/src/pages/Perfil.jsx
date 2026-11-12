import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Badges, FilaHistorial } from './Inicio'

export default function Perfil() {
  const [p, setP] = useState(null)
  const [err, setErr] = useState('')
  const nav = useNavigate()
  useEffect(() => { api('/profile').then(setP).catch((e) => setErr(e.message)) }, [])

  if (err) return <div className="alert">{err}</div>
  if (!p) return <div className="loading">Cargando…</div>
  const { user, stats } = p

  return (
    <>
      <div className="profile-cover"><div className="profile-pic">{user.iniciales}</div></div>
      <div className="profile-head">
        <div>
          <div className="profile-name">{user.nombre} {user.apellido}</div>
          <div className="profile-bio">{user.bio || `Atleta ${user.nivel_atleta}${user.ciudad ? ' · ' + user.ciudad : ''}`}</div>
        </div>
        <button className="edit-btn" onClick={() => nav('/app/configuracion')}>✏️ Editar perfil</button>
      </div>

      <div className="stat-row">
        <div className="stat-card"><b>{stats.entrenamientos}</b><span>Entrenamientos</span></div>
        <div className="stat-card"><b>{stats.seguidores}</b><span>Seguidores</span></div>
        <div className="stat-card"><b>{stats.siguiendo}</b><span>Siguiendo</span></div>
        <div className="stat-card"><b className="stat-accent">🔥 {stats.racha}</b><span>Racha días</span></div>
      </div>

      <div className="cols">
        <div className="panel">
          <h3>Historial reciente</h3>
          {p.historial.length ? p.historial.map((w) => <FilaHistorial key={w.id} w={w} />) : <div className="empty">Sin entrenamientos todavía.</div>}
        </div>
        <div className="panel">
          <h3>Logros · Nivel {stats.nivel}</h3>
          <div className="prog-bg" style={{ marginBottom: 6 }}><div className="prog-fill" style={{ width: `${stats.xp % 100}%` }} /></div>
          <div className="prog-label" style={{ marginBottom: 18 }}>{stats.xp % 100} / 100 XP para el nivel {stats.nivel + 1}</div>
          <Badges badges={p.badges} />
        </div>
      </div>
    </>
  )
}
