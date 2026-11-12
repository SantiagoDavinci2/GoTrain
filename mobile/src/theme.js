// Paleta y estilos compartidos (tomados del prototipo mobile GoTrain_Prototipo.html)
import { StyleSheet } from 'react-native'

export const C = {
  bg: '#0f0f1a', bgDeep: '#0a0a14', header: '#12121f', card: '#1a1a2e', line: '#2a2a4a',
  accent: '#e94560', accentDark: '#c0392b', txt: '#e0e0e0', white: '#fff', muted: '#888', dim: '#666', ok: '#27ae60',
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 24 },
  header: { backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: C.accent },
  headerSub: { fontSize: 11, color: C.dim },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: C.white, fontWeight: 'bold', fontSize: 13 },
  card: { backgroundColor: C.card, marginHorizontal: 12, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: C.line, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  iconTxt: { fontSize: 18 },
  h4: { fontSize: 14, color: C.white, fontWeight: 'bold' },
  small: { fontSize: 11, color: C.muted },
  tiny: { fontSize: 10, color: C.dim },
  sectionLabel: { fontSize: 12, color: C.dim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  progBg: { backgroundColor: C.bg, borderRadius: 5, height: 6, width: '100%', marginTop: 8 },
  progFill: { backgroundColor: C.accent, height: 6, borderRadius: 5 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, color: C.txt, fontSize: 15 },
  btn: { backgroundColor: C.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnTxt: { color: C.white, fontWeight: 'bold', fontSize: 15 },
  btnOutline: { borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnOutlineTxt: { color: '#aaa', fontSize: 14 },
  pill: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: C.accent },
  pillTxt: { fontSize: 11, fontWeight: 'bold', color: C.accent },
  error: { backgroundColor: 'rgba(231,76,60,0.15)', borderColor: 'rgba(231,76,60,0.4)', borderWidth: 1, borderRadius: 10, padding: 10, color: '#ff8a9b', fontSize: 13, margin: 12 },
  empty: { color: C.dim, fontSize: 13, textAlign: 'center', padding: 24 },
})
