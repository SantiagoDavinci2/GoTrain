import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, StyleSheet } from 'react-native'
import { api, fmtDur, fmtFecha, fmtKg } from '../api'
import { C, s } from '../theme'
import { Error } from '../components'
import { useApp } from '../../App'

export default function PerfilScreen() {
  const { logout, refrescarUser, mostrarToast } = useApp()
  const [p, setP] = useState(null)
  const [err, setErr] = useState('')
  const [edit, setEdit] = useState(null)
  const [refrescando, setRefrescando] = useState(false)

  const cargar = useCallback(() => api('/profile').then(setP).catch((e) => setErr(e.message)), [])
  useEffect(() => { cargar() }, [cargar])

  const guardar = async () => {
    try {
      await api('/me', { method: 'PUT', body: edit })
      setEdit(null); await cargar(); refrescarUser(); mostrarToast('✅ Perfil actualizado')
    } catch (e) { setErr(e.message) }
  }

  if (!p) return <View style={s.screen}>{err ? <Error msg={err} /> : <Text style={s.empty}>Cargando…</Text>}</View>
  const { user, stats } = p

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refrescando} tintColor={C.accent}
          onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false) }} />}>
        <View style={st.cover}><View style={st.pic}><Text style={st.picTxt}>{user.iniciales}</Text></View></View>
        <View style={{ paddingHorizontal: 16, paddingTop: 44 }}>
          {edit ? (
            <View style={{ gap: 8 }}>
              <TextInput style={s.input} value={edit.nombre} placeholder="Nombre" placeholderTextColor="#666" onChangeText={(v) => setEdit({ ...edit, nombre: v })} />
              <TextInput style={s.input} value={edit.apellido} placeholder="Apellido" placeholderTextColor="#666" onChangeText={(v) => setEdit({ ...edit, apellido: v })} />
              <TextInput style={s.input} value={edit.bio} placeholder="Bio" placeholderTextColor="#666" maxLength={200} onChangeText={(v) => setEdit({ ...edit, bio: v })} />
              <View style={[s.row, { gap: 8 }]}>
                <TouchableOpacity style={[s.btn, { flex: 1, paddingVertical: 11 }]} onPress={guardar}><Text style={s.btnTxt}>Guardar</Text></TouchableOpacity>
                <TouchableOpacity style={[s.btnOutline, { flex: 1 }]} onPress={() => setEdit(null)}><Text style={s.btnOutlineTxt}>Cancelar</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={st.name}>{user.nombre} {user.apellido}</Text>
              <Text style={st.bio}>{user.bio || `Atleta ${user.nivel_atleta}`}</Text>
            </>
          )}
          <View style={[s.row, { gap: 20, marginTop: 14 }]}>
            {[[stats.entrenamientos, 'Entrenamientos'], [stats.seguidores, 'Seguidores'], [stats.siguiendo, 'Siguiendo'], [`🔥 ${stats.racha}`, 'Racha días']].map(([v, l]) => (
              <View key={l} style={{ alignItems: 'center' }}><Text style={st.pVal}>{v}</Text><Text style={s.tiny}>{l}</Text></View>
            ))}
          </View>
          {!edit && (
            <TouchableOpacity style={st.editBtn} onPress={() => setEdit({ nombre: user.nombre, apellido: user.apellido, bio: user.bio })}>
              <Text style={{ color: C.accent, fontSize: 13 }}>✏️ Editar perfil</Text>
            </TouchableOpacity>
          )}
        </View>

        <Error msg={err} />
        <View style={{ paddingHorizontal: 14, paddingTop: 16 }}>
          <Text style={s.sectionLabel}>Logros · Nivel {stats.nivel} ({stats.xp} XP)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {p.badges.map((b) => (
              <View key={b.codigo} style={[st.badge, !b.desbloqueado && { opacity: 0.35 }]}>
                <Text style={{ fontSize: 22 }}>{b.icono}</Text>
                <Text style={st.badgeLbl}>{b.desbloqueado ? b.label : 'Bloqueado'}</Text>
              </View>
            ))}
          </View>

          <Text style={[s.sectionLabel, { marginTop: 16 }]}>Historial reciente</Text>
          {!p.historial.length && <Text style={s.empty}>Sin entrenamientos todavía.</Text>}
          {p.historial.map((w) => (
            <View key={w.id} style={st.hist}>
              <View><Text style={s.h4}>{w.nombre}</Text><Text style={s.small}>{fmtFecha(w.fecha)}</Text></View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: C.accent }}>{w.tipo === 'running' ? `${w.distancia_km} km` : fmtKg(w.volumen_kg)}</Text>
                <Text style={s.small}>{fmtDur(w.duracion_min)}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={[s.btnOutline, { marginTop: 12 }]} onPress={logout}><Text style={s.btnOutlineTxt}>← Cerrar sesión</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const st = StyleSheet.create({
  cover: { height: 100, backgroundColor: C.accentDark },
  pic: { position: 'absolute', bottom: -36, left: 16, width: 72, height: 72, borderRadius: 36, backgroundColor: C.card, borderWidth: 3, borderColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  picTxt: { color: C.white, fontSize: 24, fontWeight: 'bold' },
  name: { fontSize: 18, fontWeight: 'bold', color: C.white },
  bio: { fontSize: 13, color: C.muted, marginTop: 4 },
  pVal: { fontSize: 18, fontWeight: 'bold', color: C.white },
  editBtn: { marginTop: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: C.accent, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 7 },
  badge: { width: 72, backgroundColor: C.card, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: C.line },
  badgeLbl: { fontSize: 9, color: '#777', marginTop: 3, textAlign: 'center' },
  hist: { backgroundColor: C.card, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: C.line },
})
