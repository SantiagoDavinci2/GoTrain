// Cliente de la API REST de GoTrain (backend Flask)
const TOKEN_KEY = 'gotrain_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el backend?')
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && token) {
    setToken(null)
    window.location.href = '/login'
  }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

export const fmtKg = (n) => `${Math.round(n).toLocaleString('es-AR')} kg`
export const fmtPeso = (kg) => (kg > 0 ? `${kg}kg` : 'Peso corp.')
export const fmtDur = (min) => (min >= 60 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}min` : `${min} min`)

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export function fmtFecha(iso, corto = false) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const f = new Date(y, m - 1, d)
  const dia = DIAS[f.getDay()]
  return `${corto ? dia.slice(0, 3) : dia} ${d} ${MESES[m - 1]}`
}
export function hace(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'recién'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  return `hace ${Math.floor(s / 86400)} d`
}
export const saludo = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
}
