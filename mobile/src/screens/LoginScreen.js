import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import { api, API_URL, cambiarServidor } from '../api'
import { C, s } from '../theme'
import { useApp } from '../../App'

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export default function LoginScreen() {
  const { login } = useApp()
  const [registro, setRegistro] = useState(false)
  const [f, setF] = useState({ nombre: '', email: '', password: '' })
  const [tocado, setTocado] = useState(false)
  const [err, setErr] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [servidor, setServidor] = useState(API_URL)
  const [editSrv, setEditSrv] = useState(null)

  const errores = {
    nombre: registro && !f.nombre.trim() ? 'Ingresá tu nombre' : '',
    email: !emailOk(f.email) ? 'Ingresá un email válido' : '',
    password: f.password.length < 6 ? 'Mínimo 6 caracteres' : '',
  }

  const entrar = async (cred) => {
    setErr(''); setEnviando(true)
    try {
      const r = await api(registro && !cred ? '/auth/register' : '/auth/login', { method: 'POST', body: cred || f })
      await login(r.token, r.user)
    } catch (e) { setErr(e.message) } finally { setEnviando(false) }
  }
  const enviar = () => {
    setTocado(true)
    if (Object.values(errores).some(Boolean)) return
    entrar()
  }

  const campo = (k, props) => (
    <View style={{ width: '100%' }}>
      <TextInput style={[s.input, tocado && errores[k] && { borderColor: '#e74c3c' }]} placeholderTextColor="#666"
        value={f[k]} onChangeText={(v) => setF({ ...f, [k]: v })} {...props} />
      {tocado && !!errores[k] && <Text style={st.fieldErr}>{errores[k]}</Text>}
    </View>
  )

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={st.wrap} keyboardShouldPersistTaps="handled">
        <Text style={st.logo}>GoTrain</Text>
        <Text style={st.sub}>{registro ? 'Creá tu cuenta y sumate' : 'Tu comunidad fitness te espera'}</Text>
        {!!err && <Text style={[s.error, { margin: 0, width: '100%' }]}>{err}</Text>}
        {registro && campo('nombre', { placeholder: '👤  Nombre' })}
        {campo('email', { placeholder: '✉  Email', keyboardType: 'email-address', autoCapitalize: 'none', autoComplete: 'email' })}
        {campo('password', { placeholder: '🔒  Contraseña', secureTextEntry: true })}
        <TouchableOpacity style={[s.btn, { width: '100%', opacity: enviando ? 0.6 : 1 }]} onPress={enviar} disabled={enviando}>
          <Text style={s.btnTxt}>{enviando ? 'Un momento…' : registro ? 'Crear cuenta →' : 'Iniciar Sesión →'}</Text>
        </TouchableOpacity>
        <View style={st.divider}><View style={st.hr} /><Text style={st.divTxt}>o</Text><View style={st.hr} /></View>
        <TouchableOpacity style={[s.btnOutline, { width: '100%' }]} disabled={enviando}
          onPress={() => entrar({ email: 'santiago@gotrain.com', password: 'gotrain123' })}>
          <Text style={s.btnOutlineTxt}>⚡ Entrar con la cuenta demo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setRegistro(!registro); setErr(''); setTocado(false) }}>
          <Text style={st.foot}>{registro ? '¿Ya tenés cuenta? ' : '¿No tenés cuenta? '}
            <Text style={{ color: C.accent, fontWeight: 'bold' }}>{registro ? 'Iniciá sesión' : 'Registrate gratis'}</Text></Text>
        </TouchableOpacity>
        {editSrv !== null ? (
          <View style={{ width: '100%', gap: 8 }}>
            <TextInput style={[s.input, { fontSize: 13 }]} value={editSrv} onChangeText={setEditSrv} autoCapitalize="none"
              placeholder="IP de la PC, ej: 192.168.1.9" placeholderTextColor="#666" keyboardType="url" />
            <TouchableOpacity style={s.btnOutline} onPress={async () => { setServidor(await cambiarServidor(editSrv)); setEditSrv(null) }}>
              <Text style={s.btnOutlineTxt}>Guardar servidor</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditSrv(servidor.replace(/^http:\/\//, '').replace(/:5000$/, ''))}>
            <Text style={st.server}>Servidor: {servidor} · ⚙️ cambiar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const st = StyleSheet.create({
  wrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18 },
  logo: { fontSize: 46, color: C.accent, fontWeight: '900', letterSpacing: 3 },
  sub: { color: '#777', fontSize: 14, marginBottom: 6 },
  fieldErr: { color: '#ff6b81', fontSize: 12, marginTop: 4, marginLeft: 4 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  hr: { flex: 1, height: 1, backgroundColor: C.line },
  divTxt: { color: '#555', fontSize: 12 },
  foot: { color: '#666', fontSize: 13 },
  server: { color: '#444', fontSize: 10, marginTop: 10 },
})
