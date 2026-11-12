import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native'
import { api, fmtFecha, fmtKg, fmtPeso } from '../api'
import { C, s } from '../theme'
import { Error } from '../components'
import { useApp } from '../../App'

const GRUPOS = { Pecho: '🏋️', Espalda: '🚣', Piernas: '🦵', Hombros: '🤸', Bíceps: '💪', Tríceps: '💡', Core: '🧱' }
const VACIO = { nombre: '', grupo: 'Pecho', series: '3', reps: '10', peso_kg: '' }

function Cronometro({ desde }) {
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t) }, [])
  const seg = Math.max(0, Math.floor((Date.now() - new Date(desde).getTime()) / 1000))
  return <Text style={st.statVal}>{String(Math.floor(seg / 60)).padStart(2, '0')}:{String(seg % 60).padStart(2, '0')}</Text>
}

export default function EntrenarScreen() {
  const { refrescarUser, mostrarToast } = useApp()
  const [w, setW] = useState(null)
  const [rutinas, setRutinas] = useState([])
  const [form, setForm] = useState(null)
  const [run, setRun] = useState(null)
  const [err, setErr] = useState('')

  const cargar = () => Promise.all([api('/workouts/today'), api('/routines')]).then(([a, b]) => { setW(a); setRutinas(b) })
  useEffect(() => { cargar().catch((e) => setErr(e.message)) }, [])
  const accion = async (fn) => { setErr(''); try { await fn() } catch (e) { setErr(e.message) } }

  const agregar = () => accion(async () => {
    if (!form.nombre.trim()) throw new Error('Indicá el nombre del ejercicio')
    setW(await api(`/workouts/${w.id}/exercises`, { method: 'POST', body: {
      ...form, icono: GRUPOS[form.grupo], series: Number(form.series) || 3, reps: Number(form.reps) || 10, peso_kg: Number(form.peso_kg) || 0 } }))
    setForm(null)
  })
  const borrar = (id) => accion(async () => setW(await api(`/exercises/${id}`, { method: 'DELETE' })))
  const iniciar = () => accion(async () => setW(await api(`/workouts/${w.id}/start`, { method: 'POST' })))
  const finalizar = () => accion(async () => {
    const r = await api(`/workouts/${w.id}/finish`, { method: 'POST', body: {} })
    mostrarToast(`✅ ¡Guardado! +${r.xp_ganada} XP${r.badges_nuevos.length ? ` · Logro: ${r.badges_nuevos.join(', ')}` : ''}`)
    await cargar(); refrescarUser()
  })
  const usar = (id) => accion(async () => { setW(await api(`/routines/${id}/use`, { method: 'POST' })); mostrarToast('Rutina cargada 💪') })
  const guardarRun = () => accion(async () => {
    const r = await api('/workouts/running', { method: 'POST', body: { distancia_km: Number(run.km), duracion_min: Number(run.min) } })
    mostrarToast(`🏃 ${r.workout.distancia_km} km registrados · +${r.xp_ganada} XP`); setRun(null); refrescarUser()
  })

  if (!w) return <View style={s.screen}>{err ? <Error msg={err} /> : <Text style={s.empty}>Cargando…</Text>}</View>
  const enCurso = !!w.iniciado

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={st.hero}>
          <Text style={st.date}>{fmtFecha(w.fecha, true)}</Text>
          <Text style={st.title}>💪 {w.nombre}</Text>
          <View style={[s.row, { gap: 18 }]}>
            <View style={st.stat}><Text style={st.statVal}>{w.ejercicios.length}</Text><Text style={st.statLbl}>Ejercicios</Text></View>
            <View style={st.stat}><Text style={st.statVal}>{w.total_series}</Text><Text style={st.statLbl}>Series</Text></View>
            <View style={st.stat}>{enCurso ? <Cronometro desde={w.iniciado} /> : <Text style={st.statVal}>~{w.total_series * 3}min</Text>}
              <Text style={st.statLbl}>{enCurso ? 'En curso' : 'Duración'}</Text></View>
            <View style={st.stat}><Text style={st.statVal}>{fmtKg(w.volumen_kg)}</Text><Text style={st.statLbl}>Volumen est.</Text></View>
          </View>
        </View>

        <Error msg={err} />
        <View style={{ padding: 14, paddingBottom: 0 }}>
          <Text style={s.sectionLabel}>Ejercicios</Text>
          {!w.ejercicios.length && <Text style={s.empty}>Agregá ejercicios o cargá una rutina.</Text>}
          {w.ejercicios.map((e) => (
            <View key={e.id} style={st.ex}>
              <View style={[s.iconBox, { width: 38, height: 38, borderRadius: 10 }]}><Text>{e.icono}</Text></View>
              <View style={{ flex: 1 }}><Text style={s.h4}>{e.nombre}</Text><Text style={s.small}>{e.grupo} · {e.series} series</Text></View>
              <Text style={st.sets}>{fmtPeso(e.peso_kg)} × {e.reps}</Text>
              {!enCurso && <TouchableOpacity onPress={() => borrar(e.id)} hitSlop={10}><Text style={{ color: C.dim, fontSize: 16 }}>✕</Text></TouchableOpacity>}
            </View>
          ))}
        </View>

        {form ? (
          <View style={[s.card, { marginTop: 8, gap: 10 }]}>
            <TextInput style={s.input} placeholder="Nombre del ejercicio" placeholderTextColor="#666" value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} autoFocus />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {Object.keys(GRUPOS).map((g) => (
                <TouchableOpacity key={g} onPress={() => setForm({ ...form, grupo: g })}
                  style={[st.chip, form.grupo === g && { backgroundColor: C.accent, borderColor: C.accent }]}>
                  <Text style={{ color: form.grupo === g ? C.white : '#aaa', fontSize: 12 }}>{GRUPOS[g]} {g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[s.row, { gap: 8 }]}>
              {[['series', 'Series'], ['reps', 'Reps'], ['peso_kg', 'Kg']].map(([k, ph]) => (
                <TextInput key={k} style={[s.input, { flex: 1 }]} placeholder={ph} placeholderTextColor="#666" keyboardType="numeric"
                  value={form[k]} onChangeText={(v) => setForm({ ...form, [k]: v })} />
              ))}
            </View>
            <View style={[s.row, { gap: 8 }]}>
              <TouchableOpacity style={[s.btn, { flex: 1, paddingVertical: 11 }]} onPress={agregar}><Text style={s.btnTxt}>Agregar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.btnOutline, { flex: 1 }]} onPress={() => setForm(null)}><Text style={s.btnOutlineTxt}>Cancelar</Text></TouchableOpacity>
            </View>
          </View>
        ) : !enCurso && (
          <TouchableOpacity style={st.addBtn} onPress={() => setForm(VACIO)}><Text style={{ color: C.accent, fontSize: 14 }}>+ Agregar ejercicio</Text></TouchableOpacity>
        )}

        <TouchableOpacity style={[s.btn, { marginHorizontal: 14, marginTop: 4 }, enCurso && { backgroundColor: C.ok }]} onPress={enCurso ? finalizar : iniciar}>
          <Text style={s.btnTxt}>{enCurso ? '✓ Finalizar y guardar' : '▶ Iniciar Entrenamiento'}</Text>
        </TouchableOpacity>

        {!enCurso && !!rutinas.length && (
          <View style={{ padding: 14, paddingBottom: 0, marginTop: 8 }}>
            <Text style={s.sectionLabel}>Rutinas guardadas</Text>
            {rutinas.map((r) => (
              <TouchableOpacity key={r.id} style={st.ex} onPress={() => usar(r.id)}>
                <View style={{ flex: 1 }}><Text style={s.h4}>{r.nombre}</Text><Text style={s.small}>{r.descripcion || `${r.ejercicios.length} ejercicios`}</Text></View>
                <Text style={{ color: C.accent, fontWeight: 'bold', fontSize: 13 }}>Usar →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ padding: 14, paddingBottom: 0 }}>
          <Text style={s.sectionLabel}>Running</Text>
          {run ? (
            <View style={{ gap: 8 }}>
              <View style={[s.row, { gap: 8 }]}>
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Km" placeholderTextColor="#666" keyboardType="numeric" value={run.km} onChangeText={(v) => setRun({ ...run, km: v })} />
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Minutos" placeholderTextColor="#666" keyboardType="numeric" value={run.min} onChangeText={(v) => setRun({ ...run, min: v })} />
              </View>
              <View style={[s.row, { gap: 8 }]}>
                <TouchableOpacity style={[s.btn, { flex: 1, paddingVertical: 11 }]} onPress={guardarRun}><Text style={s.btnTxt}>Guardar</Text></TouchableOpacity>
                <TouchableOpacity style={[s.btnOutline, { flex: 1 }]} onPress={() => setRun(null)}><Text style={s.btnOutlineTxt}>Cancelar</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={s.btnOutline} onPress={() => setRun({ km: '', min: '' })}><Text style={s.btnOutlineTxt}>🏃 Registrar una salida</Text></TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const st = StyleSheet.create({
  hero: { backgroundColor: '#16213e', padding: 16, paddingTop: 20 },
  date: { fontSize: 12, color: C.dim, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 'bold', color: C.white, marginBottom: 10 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 17, fontWeight: 'bold', color: C.accent },
  statLbl: { fontSize: 10, color: C.dim },
  ex: { backgroundColor: C.card, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.line },
  sets: { backgroundColor: C.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, color: '#aaa' },
  addBtn: { marginHorizontal: 14, marginVertical: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: C.accent, borderRadius: 10, padding: 12, alignItems: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: C.line },
})
