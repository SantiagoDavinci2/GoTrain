import { useState } from 'react'
import { api } from '../api'
import { useAuth, useToast } from '../App'

export default function Configuracion() {
  const { user, refrescarUser } = useAuth()
  const toast = useToast()
  const [f, setF] = useState({ nombre: user.nombre, apellido: user.apellido, ciudad: user.ciudad, bio: user.bio, nivel_atleta: user.nivel_atleta })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const guardar = async (e) => {
    e.preventDefault(); setErr('')
    try { await api('/me', { method: 'PUT', body: f }); await refrescarUser(); toast('✅ Perfil actualizado') } catch (ex) { setErr(ex.message) }
  }

  return (
    <>
      <h1>Configuración</h1>
      <div className="sub">Editá los datos de tu perfil.</div>
      <form className="panel" style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={guardar}>
        {err && <div className="alert">{err}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="field" placeholder="Nombre" value={f.nombre} onChange={set('nombre')} required />
          <input className="field" placeholder="Apellido" value={f.apellido} onChange={set('apellido')} />
        </div>
        <input className="field" placeholder="Ciudad" value={f.ciudad} onChange={set('ciudad')} />
        <textarea className="field" rows="3" placeholder="Bio" maxLength="200" value={f.bio} onChange={set('bio')} />
        <select className="field" value={f.nivel_atleta} onChange={set('nivel_atleta')}>
          <option value="principiante">Principiante</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
        <div className="wk-date">Email: {user.email}</div>
        <button className="btn-full">Guardar cambios</button>
      </form>
    </>
  )
}
