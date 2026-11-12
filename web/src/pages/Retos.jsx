import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, hace } from '../api'
import { useToast } from '../App'

const TABS = [['activos', 'Activos'], ['grupales', 'Grupales'], ['actividad', '🔥 Actividad'], ['completados', 'Completados']]
const METRICAS = [['km', 'Kilómetros corriendo', 'km'], ['entrenos', 'Cantidad de entrenamientos', 'entrenos'],
  ['volumen', 'Volumen levantado', 'kg'], ['dias', 'Días de racha', 'días']]
const isoLocal = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const enDias = (n) => isoLocal(new Date(Date.now() + n * 86400000))
const NUEVO = () => ({ titulo: '', descripcion: '', tipo: 'grupal', metrica: 'km', meta: '', fecha_inicio: enDias(0), fecha_fin: enDias(14) })

function CrearReto({ onCreado, onCancelar }) {
  const toast = useToast()
  const [f, setF] = useState(NUEVO)
  const [err, setErr] = useState('')
  const [enviando, setEnviando] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const unidad = METRICAS.find((m) => m[0] === f.metrica)[2]
  const enviar = async (e) => {
    e.preventDefault()
    setErr('')
    if (f.titulo.trim().length < 3) return setErr('El título debe tener al menos 3 caracteres')
    if (!(Number(f.meta) > 0)) return setErr('La meta tiene que ser un número mayor a 0')
    if (f.fecha_fin <= f.fecha_inicio) return setErr('La fecha de fin tiene que ser posterior a la de inicio')
    setEnviando(true)
    try {
      const r = await api('/challenges', { method: 'POST', body: { ...f, titulo: f.titulo.trim(), meta: Number(f.meta) } })
      toast(`¡Reto "${r.titulo}" creado! Ya estás participando 🏆`)
      onCreado(r)
    } catch (e2) { setErr(e2.message) } finally { setEnviando(false) }
  }
  return (
    <form className="ch-form" onSubmit={enviar}>
      <h3>Nuevo reto</h3>
      <div className="ch-form-grid">
        <label className="full">Título<input className="field" value={f.titulo} onChange={set('titulo')} maxLength={120} placeholder="Ej.: 50 km en dos semanas" autoFocus /></label>
        <label className="full">Descripción (opcional)<input className="field" value={f.descripcion} onChange={set('descripcion')} maxLength={200} placeholder="¿De qué se trata?" /></label>
        <label>Tipo<select className="field" value={f.tipo} onChange={set('tipo')}><option value="grupal">Grupal (público)</option><option value="individual">Individual (solo vos)</option></select></label>
        <label>Qué se mide<select className="field" value={f.metrica} onChange={set('metrica')}>{METRICAS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label>Meta ({unidad})<input className="field" type="number" min="1" step="any" value={f.meta} onChange={set('meta')} placeholder="Ej.: 50" /></label>
        <label>Empieza<input className="field" type="date" value={f.fecha_inicio} min={enDias(0)} onChange={set('fecha_inicio')} /></label>
        <label>Termina<input className="field" type="date" value={f.fecha_fin} min={f.fecha_inicio} onChange={set('fecha_fin')} /></label>
      </div>
      {err && <div className="field-err" style={{ marginTop: 4 }}>{err}</div>}
      <div className="form-actions">
        <button className="btn-sm" disabled={enviando}>{enviando ? 'Creando…' : 'Crear reto'}</button>
        <button type="button" className="btn-sm outline" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  )
}

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
        <div className="ch-meta">Reto {c.tipo} · {c.participantes} {c.participantes === 1 ? 'participante' : 'participantes'} · {c.estado_txt}{c.creador && ` · Creado por ${c.creador}`}</div>
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
  const [creando, setCreando] = useState(false)

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
      <div className="ch-head">
        <div>
          <h1>Retos</h1>
          <div className="sub">Desafíos individuales y grupales con ranking entre amigos.</div>
        </div>
        {!creando && <button className="btn-sm" onClick={() => setCreando(true)}>+ Crear reto</button>}
      </div>
      {creando && <CrearReto onCancelar={() => setCreando(false)} onCreado={() => { setCreando(false); setParams({ tab: 'activos' }); setItems(null); api('/challenges?tab=activos').then(setItems) }} />}
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
