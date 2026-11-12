import { useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { api, hora } from '../api'
import { C, s } from '../theme'
import { Error } from '../components'
import { useApp } from '../../App'

const SUGERENCIAS = ['Tengo 55 min, quiero pecho y tríceps', 'Armame un leg day', 'Full body de 30 min']

export default function CoachScreen() {
  const { irA } = useApp()
  const [msgs, setMsgs] = useState([])
  const [modo, setModo] = useState('demo')
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [err, setErr] = useState('')
  const scroll = useRef(null)

  useEffect(() => { api('/coach/messages').then((r) => { setMsgs(r.mensajes); setModo(r.modo) }).catch((e) => setErr(e.message)) }, [])

  const enviar = async (t) => {
    const contenido = (t ?? texto).trim()
    if (!contenido || pensando) return
    setTexto(''); setErr(''); setPensando(true)
    setMsgs((m) => [...m, { id: 'tmp', rol: 'user', contenido, fecha: new Date().toISOString() }])
    try {
      const r = await api('/coach/messages', { method: 'POST', body: { contenido } })
      setMsgs((m) => [...m.filter((x) => x.id !== 'tmp'), r.enviado, r.respuesta]); setModo(r.modo)
    } catch (e) { setErr(e.message); setMsgs((m) => m.filter((x) => x.id !== 'tmp')) } finally { setPensando(false) }
  }
  const importar = async (m) => {
    try { await api(`/coach/messages/${m.id}/import`, { method: 'POST' }); setMsgs((await api('/coach/messages')).mensajes) }
    catch (e) { setErr(e.message) }
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={st.head}>
        <View style={st.avatar}><Text style={{ fontSize: 20 }}>🤖</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: C.white }}>Coach GoTrain AI</Text>
          <Text style={{ fontSize: 11, color: C.ok }}>● En línea</Text>
        </View>
        <Text style={st.modo}>{modo === 'claude' ? '⚡ Claude' : 'Demo'}</Text>
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 14, gap: 10 }}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        {msgs.map((m) => {
          const yo = m.rol === 'user'
          return (
            <View key={m.id} style={{ maxWidth: '85%', alignSelf: yo ? 'flex-end' : 'flex-start' }}>
              <View style={[st.bubble, yo ? st.bUser : st.bCoach]}>
                <Text style={{ color: yo ? C.white : '#ccc', fontSize: 14, lineHeight: 20 }}>{m.contenido}</Text>
                {m.rutina && (
                  <View style={st.routine}>
                    <Text style={st.rTitle}>🏋️ {m.rutina.nombre}</Text>
                    {m.rutina.ejercicios.map((e, i) => (
                      <View key={i} style={st.rItem}>
                        <Text style={st.rTxt} numberOfLines={1}>{e.icono} {e.nombre}</Text>
                        <Text style={st.rTxt}>{e.series}×{e.reps}{e.peso_kg ? ` @ ${e.peso_kg}kg` : ''}</Text>
                      </View>
                    ))}
                    <TouchableOpacity style={[st.rBtn, m.importada && { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.line }]}
                      onPress={() => (m.importada ? irA('entrenar') : importar(m))}>
                      <Text style={{ color: C.white, fontSize: 12, fontWeight: 'bold' }}>{m.importada ? 'Importada ✓ · Ir a entrenar' : 'Importar al log de hoy'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={[s.tiny, { marginTop: 3, textAlign: yo ? 'right' : 'left' }]}>{yo ? 'Vos' : 'Coach'} · {hora(m.fecha)}</Text>
            </View>
          )
        })}
        {pensando && <Text style={{ color: C.dim, fontStyle: 'italic', fontSize: 13 }}>El coach está escribiendo…</Text>}
      </ScrollView>

      <Error msg={err} />
      {msgs.length < 4 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingBottom: 8 }}>
          {SUGERENCIAS.map((t) => (
            <TouchableOpacity key={t} style={st.chip} onPress={() => enviar(t)}><Text style={{ color: '#aaa', fontSize: 12 }}>{t}</Text></TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={st.inputBar}>
        <TextInput style={st.input} placeholder="Preguntá al coach..." placeholderTextColor="#666" value={texto}
          onChangeText={setTexto} onSubmitEditing={() => enviar()} returnKeyType="send" />
        <TouchableOpacity style={[st.send, (pensando || !texto.trim()) && { opacity: 0.5 }]} onPress={() => enviar()} disabled={pensando || !texto.trim()}>
          <Text style={{ color: C.white, fontSize: 16 }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const st = StyleSheet.create({
  head: { backgroundColor: C.card, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  modo: { fontSize: 10, color: C.muted, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bCoach: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderBottomLeftRadius: 4 },
  bUser: { backgroundColor: C.accent, borderBottomRightRadius: 4 },
  routine: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.accent, borderRadius: 10, padding: 10, marginTop: 8 },
  rTitle: { fontSize: 13, fontWeight: 'bold', color: C.accent, marginBottom: 6 },
  rItem: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.card },
  rTxt: { fontSize: 12, color: '#aaa', flexShrink: 1 },
  rBtn: { backgroundColor: C.accent, borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 8 },
  chip: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  inputBar: { backgroundColor: C.header, borderTopWidth: 1, borderTopColor: C.line, padding: 10, flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: C.txt, fontSize: 14 },
  send: { backgroundColor: C.accent, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
})
