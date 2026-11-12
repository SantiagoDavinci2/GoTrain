// Cliente de la API REST de GoTrain para la app mobile
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

// La URL del backend se detecta sola: el celular usa la misma IP de la PC que corre Expo.
// Si no conecta, poné la IP de tu PC a mano, por ejemplo: 'http://192.168.1.9:5000'
const IP_MANUAL = ''

function detectarApi() {
  if (IP_MANUAL) return IP_MANUAL
  if (Platform.OS === 'web') return `http://${window.location.hostname}:5000`
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  if (host) return `http://${host}:5000`
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000'
}
export let API_URL = detectarApi()

// En el APK instalado no hay Expo: la dirección del servidor se puede cambiar desde el login
const SERVER_KEY = 'gotrain_server'
export async function cambiarServidor(url) {
  let u = url.trim().replace(/\/+$/, '')
  if (u && !/^https?:\/\//.test(u)) u = `http://${u}`
  if (u && !/:\d+$/.test(u) && u.startsWith('http://')) u += ':5000'
  API_URL = u || detectarApi()
  if (u) await AsyncStorage.setItem(SERVER_KEY, u)
  else await AsyncStorage.removeItem(SERVER_KEY)
  return API_URL
}

const TOKEN_KEY = 'gotrain_token'
let token = null
export const cargarToken = async () => {
  const srv = await AsyncStorage.getItem(SERVER_KEY)
  if (srv) API_URL = srv
  return (token = await AsyncStorage.getItem(TOKEN_KEY))
}
export const guardarToken = async (t) => {
  token = t
  if (t) await AsyncStorage.setItem(TOKEN_KEY, t)
  else await AsyncStorage.removeItem(TOKEN_KEY)
}

let onNoAutorizado = () => {}
export const alExpirarSesion = (fn) => (onNoAutorizado = fn)

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(`${API_URL}/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error(`No se pudo conectar con el servidor (${API_URL}). Revisá que el backend esté corriendo y que el celular esté en la misma red WiFi.`)
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && token) { await guardarToken(null); onNoAutorizado() }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

export const fmtKg = (n) => `${Math.round(n).toLocaleString('es-AR')} kg`
export const fmtPeso = (kg) => (kg > 0 ? `${kg}kg` : 'Peso corp.')
export const fmtDur = (min) => (min >= 60 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}min` : `${min} min`)

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DIAS_L = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export function fmtFecha(iso, largo = false) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const f = new Date(y, m - 1, d)
  return largo ? `${DIAS_L[f.getDay()]} · ${d} ${MESES[m - 1]} ${y}` : `${DIAS[f.getDay()]} ${d} ${MESES[m - 1]}`
}
export function hace(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'recién'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  return `hace ${Math.floor(s / 86400)} d`
}
export const hora = (iso) => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
