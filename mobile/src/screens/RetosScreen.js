import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { api, hace } from '../api'
import { C, s } from '../theme'
import { Header, Progreso, Error, Tabs } from '../components'
import { useApp } from '../../App'

const TABS = [['activos', 'Activos'], ['grupales', 'Grupales'], ['actividad', '🔥 Actividad'], ['completados', 'Completados']]
const fmt = (n) => n.toLocaleString('es-AR')

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
        <Text style={[s.small, { marginTop: 2 }]}>Reto {c.tipo} · {c.participantes} participantes · {c.estado_txt}</Text>
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
