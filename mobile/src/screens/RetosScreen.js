import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, StyleSheet } from 'react-native'
import { api, hace } from '../api'
import { C, s } from '../theme'
import { Header, Progreso, Error, Tabs } from '../components'
import { useApp } from '../../App'

const TABS = [['activos', 'Activos'], ['grupales', 'Grupales'], ['actividad', '🔥 Actividad'], ['completados', 'Completados']]
const fmt = (n) => n.toLocaleString('es-AR')
const METRICAS = [['km', 'Km', 'km'], ['entrenos', 'Entrenos', 'entrenos'], ['volumen', 'Volumen', 'kg'], ['dias', 'Días de racha', 'días']]
const DURACIONES = [[7, '1 semana'], [14, '2 semanas'], [30, '1 mes'], [90, '3 meses']]
const isoEn = (dias) => { const d = new Date(Date.now() + dias * 86400000); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }

function Chips({ opciones, valor, onCambio }) {
  return (
    <View style={[s.row, { flexWrap: 'wrap', gap: 6, marginBottom: 10 }]}>
      {opciones.map(([k, l]) => (
        <TouchableOpacity key={k} onPress={() => onCambio(k)} style={[st.chip, valor === k && st.chipOn]}>
          <Text style={{ fontSize: 12, color: valor === k ? C.white : C.muted }}>{l}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

function CrearReto({ onCreado, onCancelar }) {
  const { mostrarToast } = useApp()
  const [f, setF] = useState({ titulo: '', descripcion: '', tipo: 'grupal', metrica: 'km', meta: '', dias: 14 })
  const [err, setErr] = useState('')
  const [enviando, setEnviando] = useState(false)
  const unidad = METRICAS.find((m) => m[0] === f.metrica)[2]
  const crear = async () => {
    setErr('')
    const meta = Number(String(f.meta).replace(',', '.'))
    if (f.titulo.trim().length < 3) return setErr('El título debe tener al menos 3 caracteres')
    if (!(meta > 0)) return setErr('La meta tiene que ser un número mayor a 0')
    setEnviando(true)
    try {
      const r = await api('/challenges', { method: 'POST', body: {
        titulo: f.titulo.trim(), descripcion: f.descripcion.trim(), tipo: f.tipo, metrica: f.metrica, meta,
        fecha_inicio: isoEn(0), fecha_fin: isoEn(f.dias) } })
      mostrarToast(`¡Reto "${r.titulo}" creado! 🏆`)
      onCreado(r)
    } catch (e) { setErr(e.message) } finally { setEnviando(false) }
  }
  return (
    <View style={[s.card, { borderColor: C.accent }]}>
      <Text style={[s.h4, { marginBottom: 10 }]}>Nuevo reto</Text>
      <TextInput style={[s.input, { marginBottom: 10 }]} placeholder="Título (ej.: 50 km en dos semanas)" placeholderTextColor="#666"
        value={f.titulo} onChangeText={(v) => setF({ ...f, titulo: v })} maxLength={120} />
      <TextInput style={[s.input, { marginBottom: 12 }]} placeholder="Descripción (opcional)" placeholderTextColor="#666"
        value={f.descripcion} onChangeText={(v) => setF({ ...f, descripcion: v })} maxLength={200} />
      <Text style={st.label}>Tipo</Text>
      <Chips opciones={[['grupal', 'Grupal (público)'], ['individual', 'Individual']]} valor={f.tipo} onCambio={(v) => setF({ ...f, tipo: v })} />
      <Text style={st.label}>Qué se mide</Text>
      <Chips opciones={METRICAS} valor={f.metrica} onCambio={(v) => setF({ ...f, metrica: v })} />
      <Text style={st.label}>Meta ({unidad})</Text>
      <TextInput style={[s.input, { marginBottom: 12 }]} placeholder="Ej.: 50" placeholderTextColor="#666" keyboardType="numeric"
        value={f.meta} onChangeText={(v) => setF({ ...f, meta: v })} />
      <Text style={st.label}>Duración (empieza hoy)</Text>
      <Chips opciones={DURACIONES} valor={f.dias} onCambio={(v) => setF({ ...f, dias: v })} />
      <Error msg={err} />
      <View style={[s.row, { gap: 10, marginTop: 4 }]}>
        <TouchableOpacity style={[s.btn, { flex: 1, opacity: enviando ? 0.6 : 1 }]} onPress={crear} disabled={enviando}>
          <Text style={s.btnTxt}>{enviando ? 'Creando…' : 'Crear reto'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btnOutline, { flex: 1 }]} onPress={onCancelar}><Text style={s.btnOutlineTxt}>Cancelar</Text></TouchableOpacity>
      </View>
    </View>
  )
}

function Reto({ c, onCambio }) {
  const { mostrarToast } = useApp()
  const [ranking, setRanking] = useState(false)
  const unirse = async () => {
    try {
      const r = await api(`/challenges/${c.id}/join`, { method: c.unido ? 'DELETE' : 'POST' })
      mostrarToast(c.unido ? 'Saliste del reto' : `¡Te uniste a "${c.titulo}"! 🎉`)
      onCambio(r)
    } catch (e) { mostrarToast(e.message) }
  }
  const label = !c.empezo ? 'Todavía no empezó'
    : c.completado ? `${fmt(c.meta)} / ${fmt(c.meta)} ${c.unidad} — ¡Completado!`
    : `${fmt(c.progreso)} / ${fmt(c.meta)} ${c.unidad}`
  return (
    <View style={[s.card, s.row, { alignItems: 'flex-start', gap: 12 }]}>
      <View style={s.iconBox}><Text style={s.iconTxt}>{c.icono}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={s.h4}>{c.titulo}</Text>
        <Text style={[s.small, { marginTop: 2 }]}>Reto {c.tipo} · {c.participantes} {c.participantes === 1 ? 'participante' : 'participantes'} · {c.estado_txt}{c.creador ? ` · Creado por ${c.creador}` : ''}</Text>
        <Progreso porcentaje={c.porcentaje} />
        <Text style={[s.tiny, { marginTop: 5 }]}>{label}</Text>
        {ranking && c.ranking.map((r, i) => (
          <View key={i} style={[s.row, { justifyContent: 'space-between', marginTop: 4 }]}>
            <Text style={{ fontSize: 11, color: r.yo ? C.white : C.muted, fontWeight: r.yo ? 'bold' : 'normal' }}>{i + 1}. {r.yo ? 'Vos' : r.nombre}</Text>
            <Text style={{ fontSize: 11, color: r.yo ? C.white : C.muted }}>{fmt(r.progreso)} {c.unidad}</Text>
          </View>
        ))}
        <View style={[s.row, { gap: 14 }]}>
          {c.completado
            ? <View style={[s.pill, { backgroundColor: C.accent }]}><Text style={[s.pillTxt, { color: C.white }]}>Completado 🏆</Text></View>
            : <TouchableOpacity onPress={unirse} style={[s.pill, c.unido && { backgroundColor: C.accent }]}>
                <Text style={[s.pillTxt, c.unido && { color: C.white }]}>{c.unido ? 'Unido ✓' : 'Unirme'}</Text>
              </TouchableOpacity>}
          <TouchableOpacity onPress={() => setRanking(!ranking)} style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 11, color: C.accent }}>{ranking ? 'Ocultar ranking' : 'Ranking'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default function RetosScreen() {
  const [tab, setTab] = useState('activos')
  const [items, setItems] = useState(null)
  const [err, setErr] = useState('')
  const [refrescando, setRefrescando] = useState(false)
  const [creando, setCreando] = useState(false)

  const cargar = useCallback(async () => {
    setErr('')
    try { setItems(await api(tab === 'actividad' ? '/activity' : `/challenges?tab=${tab}`)) } catch (e) { setErr(e.message) }
  }, [tab])
  useEffect(() => { setItems(null); cargar() }, [cargar])

  const like = async (a) => {
    const r = await api(`/activity/${a.id}/like`, { method: 'POST' })
    setItems(items.map((x) => (x.id === a.id ? { ...x, ...r } : x)))
  }

  return (
    <View style={s.screen}>
      <Header titulo="🏆 Retos" sub="Desafíos individuales y grupales"
        derecha={<TouchableOpacity onPress={() => setTab('actividad')}><Text style={{ fontSize: 20 }}>🔔</Text></TouchableOpacity>} />
      <ScrollView contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refrescando} tintColor={C.accent}
          onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false) }} />}>
        {creando
          ? <CrearReto onCancelar={() => setCreando(false)}
              onCreado={() => { setCreando(false); if (tab === 'activos') cargar(); else setTab('activos') }} />
          : <TouchableOpacity style={[s.btn, { marginHorizontal: 12, marginTop: 12, marginBottom: 4 }]} onPress={() => setCreando(true)}>
              <Text style={s.btnTxt}>+ Crear reto</Text>
            </TouchableOpacity>}
        <Tabs items={TABS} activo={tab} onCambio={setTab} />
        <Error msg={err} />
        {items && !items.length && <Text style={s.empty}>{tab === 'activos' ? 'No estás en ningún reto activo. Mirá los grupales.' : 'Nada por acá todavía.'}</Text>}
        {items && tab === 'actividad' && items.map((a) => (
          <View key={a.id} style={[s.card, s.row, { alignItems: 'flex-start', gap: 10, padding: 12 }]}>
            <View style={[s.iconBox, { width: 36, height: 36, borderRadius: 18 }]}><Text>{a.icono}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#ddd', lineHeight: 18 }}><Text style={{ fontWeight: 'bold', color: C.white }}>{a.usuario}</Text> {a.texto}</Text>
              <Text style={[s.tiny, { marginTop: 4 }]}>{hace(a.fecha)}</Text>
              <TouchableOpacity onPress={() => like(a)} style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 12, color: a.liked ? C.accent : '#777' }}>❤️ {a.likes} {a.liked ? '· Te gusta' : '· Felicitar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {items && tab !== 'actividad' && items.map((c) => (
          <Reto key={c.id} c={c} onCambio={(n) => setItems(items.map((x) => (x.id === n.id ? n : x)))} />
        ))}
      </ScrollView>
    </View>
  )
}

const st = StyleSheet.create({
  label: { fontSize: 11, color: C.dim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: C.line },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
})
