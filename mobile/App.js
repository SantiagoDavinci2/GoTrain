import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Animated, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import Constants from 'expo-constants'
import { api, cargarToken, guardarToken, alExpirarSesion } from './src/api'
import { C } from './src/theme'
import LoginScreen from './src/screens/LoginScreen'
import RetosScreen from './src/screens/RetosScreen'
import EntrenarScreen from './src/screens/EntrenarScreen'
import CoachScreen from './src/screens/CoachScreen'
import PerfilScreen from './src/screens/PerfilScreen'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

const TABS = [
  ['retos', '🏆', 'Retos'], ['entrenar', '💪', 'Entrenar'], ['coach', '🤖', 'Coach'], ['perfil', '👤', 'Perfil'],
]

function Toast({ msg }) {
  const op = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (msg) Animated.sequence([Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2600), Animated.timing(op, { toValue: 0, duration: 300, useNativeDriver: true })]).start()
  }, [msg])
  if (!msg) return null
  return <Animated.View style={[st.toast, { opacity: op }]} pointerEvents="none"><Text style={st.toastTxt}>{msg}</Text></Animated.View>
}

export default function App() {
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState('retos')
  const [toast, setToast] = useState(null)

  const refrescarUser = () => api('/me').then(setUser)

  useEffect(() => {
    alExpirarSesion(() => setUser(null))
    cargarToken()
      .then((t) => (t ? refrescarUser() : null))
      .catch(() => guardarToken(null))
      .finally(() => setCargando(false))
  }, [])

  const ctx = {
    user, refrescarUser, irA: setTab,
    login: async (token, u) => { await guardarToken(token); setUser(u); setTab('retos') },
    logout: async () => { await guardarToken(null); setUser(null) },
    mostrarToast: (m) => { setToast(null); setTimeout(() => setToast(m), 10) },
  }

  let pantalla
  if (cargando) pantalla = <View style={st.center}><ActivityIndicator color={C.accent} size="large" /></View>
  else if (!user) pantalla = <LoginScreen />
  else pantalla = (
    <>
      <View style={{ flex: 1 }}>
        {tab === 'retos' && <RetosScreen />}
        {tab === 'entrenar' && <EntrenarScreen />}
        {tab === 'coach' && <CoachScreen />}
        {tab === 'perfil' && <PerfilScreen />}
      </View>
      <View style={st.bottomNav}>
        {TABS.map(([k, ic, label]) => (
          <TouchableOpacity key={k} style={st.bnavItem} onPress={() => setTab(k)}>
            <Text style={st.bnavIcon}>{ic}</Text>
            <Text style={[st.bnavLabel, tab === k && { color: C.accent, fontWeight: 'bold' }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  )

  return (
    <AppCtx.Provider value={ctx}>
      <View style={st.root}>
        <StatusBar style="light" />
        {pantalla}
        <Toast msg={toast} />
      </View>
    </AppCtx.Provider>
  )
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgDeep, paddingTop: Constants.statusBarHeight || 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: C.header, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, paddingBottom: 14 },
  bnavItem: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 2 },
  bnavIcon: { fontSize: 20 },
  bnavLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  toast: { position: 'absolute', bottom: 90, left: 20, right: 20, backgroundColor: C.card, borderColor: C.accent, borderWidth: 1, borderRadius: 12, padding: 14 },
  toastTxt: { color: C.white, fontSize: 14, textAlign: 'center' },
})
