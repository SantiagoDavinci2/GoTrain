import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const SUGERENCIAS = ['Tengo 55 minutos, quiero pecho y tríceps', 'Armame un leg day', 'Rutina full body de 30 min', '¿Cómo vengo esta semana?']
const hora = (iso) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

export default function Coach() {
  const [msgs, setMsgs] = useState([])
  const [modo, setModo] = useState('demo')
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [err, setErr] = useState('')
  const fin = useRef(null)
  const nav = useNavigate()

  useEffect(() => { api('/coach/messages').then((r) => { setMsgs(r.mensajes); setModo(r.modo) }).catch((e) => setErr(e.message)) }, [])
  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, pensando])

  const enviar = async (t) => {
    const contenido = (t ?? texto).trim()
    if (!contenido || pensando) return
    setTexto(''); setErr(''); setPensando(true)
    setMsgs((m) => [...m, { id: 'tmp', rol: 'user', contenido, fecha: new Date().toISOString() }])
    try {
      const r = await api('/coach/messages', { method: 'POST', body: { contenido } })
      setMsgs((m) => [...m.filter((x) => x.id !== 'tmp'), r.enviado, r.respuesta])
      setModo(r.modo)
    } catch (e) {
      setErr(e.message); setMsgs((m) => m.filter((x) => x.id !== 'tmp'))
    } finally { setPensando(false) }
  }

  const importar = async (m) => {
    try {
      await api(`/coach/messages/${m.id}/import`, { method: 'POST' })
      const r = await api('/coach/messages')
      setMsgs(r.mensajes)
    } catch (e) { setErr(e.message) }
  }

  return (
    <>
      <h1>Coach IA</h1>
      <div className="sub">Rutinas personalizadas según tu historial, con importación directa a tu log.</div>
      <div className="chat">
        <div className="chat-head">
          <div className="coach-avatar">🤖</div>
          <div><b>Coach GoTrain AI</b><div className="coach-status">● En línea</div></div>
          <span className="mode-tag" title={modo === 'claude' ? 'Respuestas generadas con Claude API' : 'Sin API key: respuestas generadas por reglas'}>
            {modo === 'claude' ? '⚡ Claude API' : 'Modo demo'}
          </span>
        </div>
        <div className="chat-area">
          {msgs.map((m) => (
            <div key={m.id} className={`msg ${m.rol}`}>
              <div className="bubble">
                {m.contenido}
                {m.rutina && (
                  <div className="routine-card">
                    <div className="rc-title">🏋️ {m.rutina.nombre}</div>
                    {m.rutina.ejercicios.map((e, i) => (
                      <div className="rc-item" key={i}><span>{e.icono} {e.nombre}</span><span>{e.series}×{e.reps}{e.peso_kg ? ` @ ${e.peso_kg}kg` : ''}</span></div>
                    ))}
                    {m.importada
                      ? <button className="btn-sm outline" onClick={() => nav('/app/entrenar')}>Importada ✓ · Ir a entrenar →</button>
                      : <button className="btn-sm" onClick={() => importar(m)}>Importar al log de hoy</button>}
                  </div>
                )}
              </div>
              <div className="msg-time">{m.rol === 'coach' ? 'Coach' : 'Vos'} · {hora(m.fecha)}</div>
            </div>
          ))}
          {pensando && <div className="typing">El coach está armando tu respuesta…</div>}
          <div ref={fin} />
        </div>
        {err && <div className="alert" style={{ margin: '0 16px 10px' }}>{err}</div>}
        {msgs.length < 4 && (
          <div className="chips">{SUGERENCIAS.map((s) => <button key={s} className="chip" onClick={() => enviar(s)}>{s}</button>)}</div>
        )}
        <form className="chat-input-bar" onSubmit={(e) => { e.preventDefault(); enviar() }}>
          <input className="chat-input" placeholder="Preguntá al coach..." value={texto} onChange={(e) => setTexto(e.target.value)} />
          <button className="chat-send" disabled={pensando || !texto.trim()}>➤</button>
        </form>
      </div>
    </>
  )
}
