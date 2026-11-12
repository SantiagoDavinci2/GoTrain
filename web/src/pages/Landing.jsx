import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'

const FEATURES = [
  { icon: '💪', titulo: 'Registro de Entrenamientos', texto: 'Series, repeticiones, peso y duración con historial detallado.', to: '/app/entrenar' },
  { icon: '🏆', titulo: 'Retos y Desafíos', texto: 'Competí con la comunidad en desafíos individuales y grupales.', to: '/app/retos' },
  { icon: '🤖', titulo: 'Coach Virtual IA', texto: 'Rutinas personalizadas y análisis de desempeño con Claude API.', to: '/app/coach' },
  { icon: '👤', titulo: 'Perfil y Gamificación', texto: 'Badges, racha de días y progreso, todo en tu perfil.', to: '/app/perfil' },
]

export default function Landing() {
  const { user } = useAuth()
  const nav = useNavigate()
  const ir = (to) => nav(user ? to : '/registro')

  return (
    <>
      <nav className="nav">
        <div className="logo">GoTrain</div>
        <div className="nav-links">
          <a href="#funciones">Funciones</a>
          <a href="#comunidad">Comunidad</a>
          <Link to="/login">Iniciar sesión</Link>
        </div>
        <button className="nav-cta" onClick={() => ir('/app')}>{user ? 'Ir a mi panel' : 'Empezar gratis'}</button>
      </nav>

      <section className="hero">
        <div className="hero-text">
          <div className="hero-tag">🔥 La app fitness con comunidad + IA</div>
          <div className="hero-title">Entrená con <span>comunidad</span>,<br />progresá con <span>datos</span>.</div>
          <div className="hero-sub">GoTrain combina seguimiento de entrenamientos, un feed social motivador y un coach de IA que arma tus rutinas según tu progreso real.</div>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => ir('/app')}>Empezar gratis →</button>
            <button className="btn-secondary" onClick={() => ir('/app/coach')}>Ver cómo funciona</button>
          </div>
          <div className="hero-stats" id="comunidad">
            <div className="hstat"><b>+2.500</b><span>atletas activos</span></div>
            <div className="hstat"><b>+40k</b><span>entrenos registrados</span></div>
            <div className="hstat"><b>4.8 ★</b><span>valoración</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="glow" />
          <div className="mock-phone">
            <div className="mp-title">🏆 Retos</div>
            <div className="mock-card"><b>🏃 100km del mes</b>
              <div className="prog-bg"><div className="prog-fill" style={{ width: '66%' }} /></div>
              <div className="prog-label">66 / 100 km</div>
            </div>
            <div className="mock-card"><b>🤖 Coach IA</b>Press Banca 4×8 @ 82kg · Press Inclinado 3×10 @ 32kg · Fondos 3×12</div>
            <div className="mock-card"><b>🔥 Racha de 21 días</b>¡No cortes la cadena!</div>
          </div>
        </div>
      </section>

      <section className="features" id="funciones">
        <div className="features-head">
          <h2>Todo lo que necesitás para no bajar los brazos</h2>
          <p>Una sola app para registrar, competir y mejorar.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.titulo} className="fcard" onClick={() => ir(f.to)} style={{ cursor: 'pointer' }}>
              <div className="ficon">{f.icon}</div><h3>{f.titulo}</h3><p>{f.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <span>© 2026 GoTrain · Seminario Final · Da Vinci</span>
        <span>Hecho con React · Flask · Claude API</span>
      </footer>
    </>
  )
}
