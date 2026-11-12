import { View, Text, TouchableOpacity } from 'react-native'
import { C, s } from './theme'
import { useApp } from '../App'

export function Header({ titulo, sub, derecha }) {
  const { user, irA } = useApp()
  return (
    <View style={s.header}>
      <View style={{ flex: 1 }}>
        <Text style={s.headerTitle}>{titulo}</Text>
        {!!sub && <Text style={s.headerSub}>{sub}</Text>}
      </View>
      {derecha}
      <TouchableOpacity style={s.avatar} onPress={() => irA('perfil')}><Text style={s.avatarTxt}>{user?.iniciales}</Text></TouchableOpacity>
    </View>
  )
}

export function Progreso({ porcentaje }) {
  return <View style={s.progBg}><View style={[s.progFill, { width: `${Math.min(100, porcentaje)}%` }]} /></View>
}

export function Error({ msg }) {
  return msg ? <Text style={s.error}>{msg}</Text> : null
}

export function Tabs({ items, activo, onCambio }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingTop: 14, paddingBottom: 10 }}>
      {items.map(([k, label]) => (
        <TouchableOpacity key={k} onPress={() => onCambio(k)}
          style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
            backgroundColor: activo === k ? C.accent : C.card, borderColor: activo === k ? C.accent : C.line }}>
          <Text style={{ fontSize: 12, color: activo === k ? C.white : '#aaa', fontWeight: activo === k ? 'bold' : 'normal' }}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
