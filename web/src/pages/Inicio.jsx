import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, fmtDur, fmtFecha, fmtKg, saludo } from '../api'

export function FilaHistorial({ w }) {
  const run = w.tipo === 'running'
  return (
    <div className="wk-row">
      <div><div className="wk-name">{w.nombre}</div><div className="wk-date">{fmtFecha(w.fecha)} · {fmtDur(w.duracion_min)}</div></div>
      <div>
        <div className="wk-vol">{run ? `${w.distancia_km} km` : fmtKg(w.volumen_kg)}</div>
        <div className="wk-dur">{run ? 'Outdoor GPS' : `${w.ejercicios.length} ejercicios`}</div>
      </div>
    </div>
  )
}

export function Badges({ badges }) {
  return (
    <div className="badge-row">
      {badges.map((b) => (
        <div key={b.codigo} className={`badge ${b.desbloqueado ? '' : 'locked'}`} title={b.desbloqueado ? b.label : 'Bloqueado'}>
          <div className="bi">{b.icono}</div><span>{b.desbloqueado ? b.label : '🔒 ' + b.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function Inicio() {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const nav = useNavigate()

  useEffect(() => { api('/dashboard').then(setD).catch((e) => setErr(e.message)) }, [])

  if (err) return <div className="alert">{err}</div>
  if (!d) return <div className="loading">Cargando…</div>
  const { user, stats, proximo_reto: reto, sugerencia_coach: sug } = d

  return (
    <>
      <h1>{saludo()}, {user.nombre} 👋</h1>
      <div className="sub">
        {stats.racha > 0 ? `Racha activa de ${stats.racha} días — así viene tu semana.` : '¡Hoy es un gran día para arrancar una racha!'}
      </div>

      <div className="stat-row">
        <div className="stat-card"><b>{stats.entrenamientos}</b><span>Entrenamientos totales</span></div>
        <div className="stat-card"><b className="stat-accent">🔥 {stats.racha}</b><span>Racha de días</span></div>
        <div className="stat-card"><b>{stats.seguidores}</b><span>Seguidores</span></div>
        <div className="stat-card"><b>Nivel {stats.nivel}</b><span>{stats.xp.toLocaleString('es-AR')} XP</span></div>
      </div>

      <div className="cols">
        <div>
          <div className="panel">
            <h3>Historial reciente <button className="link" onClick={() => nav('/app/perfil')}>Ver todo →</button></h3>
            {d.historial.length ? d.historial.map((w) => <FilaHistorial key={w.id} w={w} />)
              : <div className="empty">Todavía no registraste entrenamientos. ¡Arrancá hoy!</div>}
          </div>
          <div className="panel">
            <h3>Logros desbloqueados</h3>
            {d.badges.length ? <Badges badges={d.badges} /> : <div className="empty">Completá entrenamientos para desbloquear logros.</div>}
          </div>
        </div>
        <div>
          <div className="panel">
            <h3>🤖 Coach IA</h3>
            {sug ? (
              <>
                <p className="muted">Tu última rutina sugerida por el coach:</p>
                <div className="coach-mini">
                  <div className="cm-title">{sug.rutina.nombre}</div>
                  <p>{sug.rutina.ejercicios.slice(0, 4).map((e) => `${e.nombre} ${e.series}×${e.reps}${e.peso_kg ? ` @ ${e.peso_kg}kg` : ''}`).join(' · ')}</p>
                </div>
              </>
            ) : <p className="muted">Pedile al coach una rutina basada en tu progreso. ¿La armamos?</p>}
            <button className="btn-sm" style={{ marginTop: 14 }} onClick={() => nav('/app/coach')}>Hablar con el coach →</button>
          </div>
          <div className="panel">
            <h3>🏆 Próximo desafío</h3>
            {reto ? (
              <>
                <p className="muted">{reto.titulo} — {reto.estado_txt.toLowerCase()}.</p>
                <div className="prog-bg" style={{ marginTop: 12 }}><div className="prog-fill" style={{ width: `${reto.porcentaje}%` }} /></div>
                <div className="prog-label">{reto.progreso.toLocaleString('es-AR')} / {reto.meta.toLocaleString('es-AR')} {reto.unidad}</div>
              </>
            ) : <p className="muted">No estás en ningún reto activo.</p>}
            <button className="link" style={{ marginTop: 12 }} onClick={() => nav('/app/retos')}>Ver retos →</button>
          </div>
        </div>
      </div>
    </>
  )
}
