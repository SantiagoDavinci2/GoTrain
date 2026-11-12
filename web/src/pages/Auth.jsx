import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../App'

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export default function Auth({ modo }) {
  const registro = modo === 'registro'
  const { login } = useAuth()
  const [f, setF] = useState({ nombre: '', apellido: '', email: '', password: '', nivel_atleta: 'principiante' })
  const [tocado, setTocado] = useState({})
  const [err, setErr] = useState('')
  const [enviando, setEnviando] = useState(false)

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const toca = (k) => () => setTocado({ ...tocado, [k]: true })

  // Validaciones en tiempo real (HU-01)
  const errores = {
    nombre: registro && !f.nombre.trim() ? 'Ingresá tu nombre' : '',
    email: !emailOk(f.email) ? 'Ingresá un email válido' : '',
    password: f.password.length < 6 ? 'Mínimo 6 caracteres' : '',
  }
  const valido = !Object.values(errores).some(Boolean)

  const enviar = async (e) => {
    e.preventDefault()
    setTocado({ nombre: true, email: true, password: true })
    if (!valido) return
    setErr(''); setEnviando(true)
    try {
      const r = await api(registro ? '/auth/register' : '/auth/login', { method: 'POST', body: f })
      login(r.token, r.user)
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setEnviando(false)
    }
  }

  const demo = async () => {
    setErr(''); setEnviando(true)
    try {
      const r = await api('/auth/login', { method: 'POST', body: { email: 'santiago@gotrain.com', password: 'gotrain123' } })
      login(r.token, r.user)
    } catch (ex) { setErr(ex.message) } finally { setEnviando(false) }
  }

  const campo = (k, props) => (
    <>
      <input className={`field ${tocado[k] && errores[k] ? 'invalid' : ''}`} value={f[k]} onChange={set(k)} onBlur={toca(k)} {...props} />
      {tocado[k] && errores[k] && <div className="field-err">{errores[k]}</div>}
    </>
  )

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={enviar} noValidate>
        <Link to="/" className="logo">GoTrain</Link>
        <div className="auth-sub">{registro ? 'Creá tu cuenta y sumate a la comunidad' : 'Tu comunidad fitness te espera'}</div>
        {err && <div className="alert">{err}</div>}
        {registro && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>{campo('nombre', { placeholder: 'Nombre' })}</div>
            <div style={{ flex: 1 }}><input className="field" placeholder="Apellido" value={f.apellido} onChange={set('apellido')} /></div>
          </div>
        )}
        {campo('email', { placeholder: '✉  Email', type: 'email', autoComplete: 'email' })}
        {campo('password', { placeholder: '🔒  Contraseña', type: 'password', autoComplete: registro ? 'new-password' : 'current-password' })}
        {registro && (
          <select className="field" value={f.nivel_atleta} onChange={set('nivel_atleta')}>
            <option value="principiante">Nivel: Principiante</option>
            <option value="intermedio">Nivel: Intermedio</option>
            <option value="avanzado">Nivel: Avanzado</option>
          </select>
        )}
        <button className="btn-full" disabled={enviando}>{enviando ? 'Un momento…' : registro ? 'Crear cuenta →' : 'Iniciar Sesión →'}</button>
        <div className="divider"><hr /><span>o</span><hr /></div>
        <button type="button" className="btn-ghost" onClick={demo} disabled={enviando}>⚡ Entrar con la cuenta demo</button>
        <div className="auth-foot">
          {registro ? <>¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link></> : <>¿No tenés cuenta? <Link to="/registro">Registrate gratis</Link></>}
        </div>
        <div className="demo-hint">Demo: santiago@gotrain.com · gotrain123</div>
      </form>
    </div>
  )
}
