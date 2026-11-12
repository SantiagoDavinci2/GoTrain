import { useEffect, useState } from 'react'
import { api, fmtFecha, fmtKg, fmtPeso } from '../api'
import { useAuth, useToast } from '../App'

const GRUPOS = { Pecho: '🏋️', Espalda: '🚣', Piernas: '🦵', Hombros: '🤸', Bíceps: '💪', Tríceps: '💡', Core: '🧱', Cardio: '🏃' }
const VACIO = { nombre: '', grupo: 'Pecho', series: 3, reps: 10, peso_kg: '' }

function Cronometro({ desde }) {
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t) }, [])
  const s = Math.max(0, Math.floor((Date.now() - new Date(desde).getTime()) / 1000))
  const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60
  return <div className="timer">{hh ? `${hh}:` : ''}{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</div>
}

export default function Entrenar() {
  const { refrescarUser } = useAuth()
  const toast = useToast()
  const [w, setW] = useState(null)
  const [rutinas, setRutinas] = useState([])
  const [form, setForm] = useState(null)
  const [run, setRun] = useState(null)
  const [err, setErr] = useState('')

  const cargar = () => Promise.all([api('/workouts/today'), api('/routines')]).then(([a, b]) => { setW(a); setRutinas(b) })
  useEffect(() => { cargar().catch((e) => setErr(e.message)) }, [])

  const accion = async (fn) => { setErr(''); try { await fn() } catch (e) { setErr(e.message) } }

  const agregar = (e) => accion(async () => {
    e.preventDefault()
    setW(await api(`/workouts/${w.id}/exercises`, { method: 'POST', body: { ...form, icono: GRUPOS[form.grupo], peso_kg: Number(form.peso_kg) || 0 } }))
    setForm(null)
  })
  const borrar = (id) => accion(async () => setW(await api(`/exercises/${id}`, { method: 'DELETE' })))
  const iniciar = () => accion(async () => setW(await api(`/workouts/${w.id}/start`, { method: 'POST' })))
  const finalizar = () => accion(async () => {
    const r = await api(`/workouts/${w.id}/finish`, { method: 'POST', body: {} })
    toast(`✅ ¡Entrenamiento guardado! +${r.xp_ganada} XP${r.badges_nuevos.length ? ` · Nuevo logro: ${r.badges_nuevos.join(', ')}` : ''}`)
    await cargar(); refrescarUser()
  })
  const usarRutina = (id) => accion(async () => { setW(await api(`/routines/${id}/use`, { method: 'POST' })); toast('Rutina cargada para hoy 💪') })
  const guardarRun = (e) => accion(async () => {
    e.preventDefault()
    const r = await api('/workouts/running', { method: 'POST', body: run })
    toast(`🏃 ¡${r.workout.distancia_km} km registrados! +${r.xp_ganada} XP`); setRun(null); refrescarUser()
  })

  if (!w) return err ? <div className="alert">{err}</div> : <div className="loading">Cargando…</div>
  const enCurso = !!w.iniciado
  const series = w.total_series
  const duracionEst = Math.round(series * 3)

  return (
    <>
      <h1>Entrenar</h1>
      <div className="sub">{fmtFecha(w.fecha)} — {w.nombre}</div>
      {err && <div className="alert" style={{ marginBottom: 20 }}>{err}</div>}

      <div className="stat-row">
        <div className="stat-card"><b>{w.ejercicios.length}</b><span>Ejercicios</span></div>
        <div className="stat-card"><b>{series}</b><span>Series</span></div>
        <div className="stat-card">{enCurso ? <Cronometro desde={w.iniciado} /> : <b>~{duracionEst} min</b>}<span>{enCurso ? 'En curso' : 'Duración estimada'}</span></div>
        <div className="stat-card"><b className="stat-accent">{fmtKg(w.volumen_kg)}</b><span>Volumen estimado</span></div>
      </div>

      <div className="cols">
        <div className="panel">
          <h3>Ejercicios de hoy</h3>
          {!w.ejercicios.length && <div className="empty">Agregá ejercicios o cargá una rutina guardada.</div>}
          {w.ejercicios.map((e) => (
            <div className="ex-row" key={e.id}>
              <div className="ex-ic">{e.icono}</div>
              <div><div className="ex-name2">{e.nombre}</div><div className="ex-detail2">{e.grupo} · {e.series} series</div></div>
              <div className="ex-sets2">{fmtPeso(e.peso_kg)} × {e.reps}</div>
              {!enCurso && <button className="ex-del" title="Quitar" onClick={() => borrar(e.id)}>✕</button>}
            </div>
          ))}

          {form ? (
            <form onSubmit={agregar}>
              <div className="form-grid">
                <input className="field" placeholder="Ejercicio" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoFocus required />
                <select className="field" value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })}>
                  {Object.keys(GRUPOS).map((g) => <option key={g}>{g}</option>)}
                </select>
                <input className="field" type="number" min="1" placeholder="Series" value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value })} />
                <input className="field" type="number" min="1" placeholder="Reps" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} />
                <input className="field" type="number" min="0" step="0.5" placeholder="Kg" value={form.peso_kg} onChange={(e) => setForm({ ...form, peso_kg: e.target.value })} />
              </div>
              <div className="form-actions">
                <button className="btn-sm">Agregar</button>
                <button type="button" className="btn-sm outline" onClick={() => setForm(null)}>Cancelar</button>
              </div>
            </form>
          ) : !enCurso && <button className="add-ex" onClick={() => setForm(VACIO)}>+ Agregar ejercicio</button>}

          {enCurso
            ? <button className="start-wk finish" onClick={finalizar}>✓ Finalizar y guardar entrenamiento</button>
            : <button className="start-wk" onClick={iniciar}>▶ Iniciar Entrenamiento</button>}
        </div>

        <div>
          <div className="panel">
            <h3>Rutinas guardadas</h3>
            {!rutinas.length && <div className="empty">Importá rutinas desde el Coach IA.</div>}
            {rutinas.map((r) => (
              <div className="wk-row" key={r.id}>
                <div><div className="wk-name">{r.nombre}</div><div className="wk-date">{r.descripcion || `${r.ejercicios.length} ejercicios`}</div></div>
                <button className="link" disabled={enCurso} onClick={() => usarRutina(r.id)}>Usar →</button>
              </div>
            ))}
          </div>
          <div className="panel">
            <h3>🏃 Registrar running</h3>
            {run ? (
              <form onSubmit={guardarRun} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="field" type="number" step="0.1" min="0.1" placeholder="Distancia (km)" value={run.distancia_km} onChange={(e) => setRun({ ...run, distancia_km: e.target.value })} required autoFocus />
                <input className="field" type="number" min="1" placeholder="Duración (min)" value={run.duracion_min} onChange={(e) => setRun({ ...run, duracion_min: e.target.value })} required />
                <div className="form-actions"><button className="btn-sm">Guardar</button><button type="button" className="btn-sm outline" onClick={() => setRun(null)}>Cancelar</button></div>
              </form>
            ) : (
              <>
                <p className="muted">Sumá kilómetros a tus retos de running.</p>
                <button className="btn-sm" style={{ marginTop: 12 }} onClick={() => setRun({ distancia_km: '', duracion_min: '' })}>+ Nueva salida</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
