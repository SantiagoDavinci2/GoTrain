import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, hace } from '../api'
import { useToast } from '../App'

const TABS = [['activos', 'Activos'], ['grupales', 'Grupales'], ['actividad', '🔥 Actividad'], ['completados', 'Completados']]

function Reto({ c, onCambio }) {
  const toast = useToast()
  const [abierto, setAbierto] = useState(false)
  const unirse = async () => {
    try {
      const r = await api(`/challenges/${c.id}/join`, { method: c.unido ? 'DELETE' : 'POST' })
      toast(c.unido ? 'Saliste del reto' : `¡Te uniste a "${c.titulo}"! 🎉`)
      onCambio(r)
    } catch (e) { toast(e.message) }
  }
  const fmt = (n) => n.toLocaleString('es-AR')
  return (
    <div className="ch-card">
      <div className="ch-ic">{c.icono}</div>
      <div className="ch-body">
        <h4>{c.titulo}</h4>
        <div className="ch-meta">Reto {c.tipo} · {c.participantes} participantes · {c.estado_txt}</div>
        <div className="prog-bg"><div className="prog-fill" style={{ width: `${c.porcentaje}%` }} /></div>
        <div className="prog-label">
          {!c.empezo ? 'Todavía no empezó' : c.completado ? `${fmt(c.meta)} / ${fmt(c.meta)} ${c.unidad} — ¡Completado!` : `${fmt(c.progreso)} / ${fmt(c.meta)} ${c.unidad}`}
        </div>
        {abierto && (
          <div className="ranking">
            {c.ranking.map((r, i) => <div key={i} className={r.yo ? 'yo' : ''}><span>{i + 1}. {r.yo ? 'Vos' : r.nombre}</span><span>{fmt(r.progreso)} {c.unidad}</span></div>)}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {!c.completado && <button className={`ch-cta ${c.unido ? 'joined' : ''}`} onClick={unirse}>{c.unido ? 'Unido ✓' : 'Unirme'}</button>}
          {c.completado && <span className="ch-cta joined">Completado 🏆</span>}
          <button className="link" style={{ marginTop: 14 }} onClick={() => setAbierto(!abierto)}>{abierto ? 'Ocultar ranking' : 'Ver ranking'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Retos() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'activos'
  const [items, setItems] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    setItems(null); setErr('')
    api(tab === 'actividad' ? '/activity' : `/challenges?tab=${tab}`).then(setItems).catch((e) => setErr(e.message))
  }, [tab])

  const actualizar = (nuevo) => setItems(items.map((c) => (c.id === nuevo.id ? nuevo : c)))
  const like = async (a) => {
    const r = await api(`/activity/${a.id}/like`, { method: 'POST' })
    setItems(items.map((x) => (x.id === a.id ? { ...x, ...r } : x)))
  }

  return (
    <>
      <h1>Retos</h1>
      <div className="sub">Desafíos individuales y grupales con ranking entre amigos.</div>
      <div className="challenge-tabs">
        {TABS.map(([k, l]) => <button key={k} className={`ctab ${tab === k ? 'active' : ''}`} onClick={() => setParams({ tab: k })}>{l}</button>)}
      </div>
      {err && <div className="alert">{err}</div>}
      {!items && !err && <div className="loading">Cargando…</div>}
      {items && !items.length && <div className="empty">{tab === 'activos' ? 'No estás en ningún reto activo. Mirá los grupales para sumarte.' : 'No hay nada para mostrar acá todavía.'}</div>}

      {items && tab === 'actividad' && items.map((a) => (
        <div className="act-item" key={a.id}>
          <div className="act-ic">{a.icono}</div>
          <div>
            <div className="act-text"><b>{a.usuario}</b> {a.texto}</div>
            <div className="act-time">{hace(a.fecha)}</div>
            <button className={`act-like ${a.liked ? 'liked' : ''}`} onClick={() => like(a)}>❤️ {a.likes} {a.liked ? '· Te gusta' : '· Felicitar'}</button>
          </div>
        </div>
      ))}
      {items && tab !== 'actividad' && <div className="ch-grid">{items.map((c) => <Reto key={c.id} c={c} onCambio={actualizar} />)}</div>}
    </>
  )
}
