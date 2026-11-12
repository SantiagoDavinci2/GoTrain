// Genera todos los documentos Word de la entrega (carpeta entrega/documentos)
const fs = require('fs')
const path = require('path')
const { P, H1, H2, H3, BR, bullets, pasos, img, imgPar, tabla, ficha, espacio, generar } = require('./docx_lib')

const C = (n) => `capturas/${n}.png`
const D = (n) => `diagramas/${n}.png`
const resultados = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../backend/tests/resultados.json'), 'utf8'))

// ============================================================ CASOS DE USO (datos compartidos)
const CU = [
  { id: 'CU-01', nombre: 'Registrarse', actor: 'Visitante', hu: 'HU-01',
    desc: 'Permite a una persona crear su cuenta en GoTrain con nombre, email, contraseña y nivel de atleta.',
    pre: 'El visitante no tiene sesión iniciada.',
    flujo: ['El visitante elige "Registrate gratis".', 'Completa nombre, apellido (opcional), email, contraseña y nivel.', 'El sistema valida los campos en tiempo real.', 'El visitante confirma con "Crear cuenta".', 'El sistema crea la cuenta, inicia la sesión y crea el mensaje de bienvenida del Coach.'],
    alt: ['3a. Email con formato inválido o contraseña de menos de 6 caracteres: se marca el campo y no se envía.', '5a. El email ya está registrado: el sistema muestra "Ya existe una cuenta con ese email".'],
    post: 'El usuario queda registrado y autenticado (token JWT válido por 7 días).' },
  { id: 'CU-02', nombre: 'Iniciar sesión', actor: 'Visitante', hu: 'HU-01',
    desc: 'Permite autenticarse con email y contraseña, o con la cuenta demo.',
    pre: 'El usuario tiene una cuenta registrada.',
    flujo: ['El usuario ingresa email y contraseña.', 'Presiona "Iniciar Sesión".', 'El sistema verifica las credenciales.', 'El sistema emite un token y muestra la pantalla principal.'],
    alt: ['3a. Credenciales incorrectas: se muestra "Email o contraseña incorrectos".', '3b. El servidor no responde: se informa que no se pudo conectar.'],
    post: 'Sesión activa. En la app el token se guarda en el dispositivo para no volver a pedirlo.' },
  { id: 'CU-03', nombre: 'Gestionar perfil', actor: 'Usuario registrado', hu: 'HU-03',
    desc: 'Ver estadísticas, nivel, logros e historial, y editar nombre, apellido, ciudad, bio y nivel de atleta.',
    pre: 'Usuario autenticado.',
    flujo: ['El usuario abre "Perfil".', 'El sistema muestra datos, estadísticas, logros e historial.', 'El usuario elige "Editar perfil" y modifica los datos.', 'El sistema guarda y actualiza la vista.'],
    alt: ['3a. El nombre queda vacío: el sistema rechaza el cambio.'],
    post: 'Datos del perfil actualizados.' },
  { id: 'CU-04', nombre: 'Registrar entrenamiento', actor: 'Usuario registrado', hu: 'HU-02',
    desc: 'Armar el entrenamiento del día con ejercicios (grupo, series, repeticiones, peso), cronometrarlo y guardarlo.',
    pre: 'Usuario autenticado. Existe un entrenamiento planificado para hoy (se crea solo si no hay).',
    flujo: ['El usuario abre "Entrenar".', 'Agrega ejercicios con "+ Agregar ejercicio".', 'Presiona "Iniciar Entrenamiento" y corre el cronómetro.', 'Al terminar presiona "Finalizar y guardar".', 'El sistema guarda la sesión, suma 50 XP, recalcula la racha, actualiza los retos, publica la actividad y otorga logros.'],
    alt: ['2a. Datos no numéricos o nombre vacío: el ejercicio no se agrega.', '3a. No hay ejercicios: no se permite iniciar.', '2b. El usuario quita un ejercicio con ✕.'],
    post: 'El entrenamiento queda en el historial y se crea un nuevo plan vacío para la próxima sesión.' },
  { id: 'CU-05', nombre: 'Registrar running', actor: 'Usuario registrado', hu: 'HU-02',
    desc: 'Cargar una salida a correr indicando distancia y duración.',
    pre: 'Usuario autenticado.',
    flujo: ['El usuario elige "Registrar running" / "Nueva salida".', 'Ingresa distancia (km) y duración (min).', 'Confirma con "Guardar".', 'El sistema guarda la salida y suma los km a los retos de distancia.'],
    alt: ['2a. Distancia o duración menor o igual a 0: se rechaza.'],
    post: 'Salida registrada en el historial; retos de km actualizados.' },
  { id: 'CU-06', nombre: 'Usar rutina guardada', actor: 'Usuario registrado', hu: 'HU-02',
    desc: 'Cargar una rutina guardada (propia o sugerida por el Coach) como entrenamiento del día.',
    pre: 'Usuario autenticado con al menos una rutina guardada.',
    flujo: ['En "Entrenar" el usuario elige una rutina y presiona "Usar".', 'El sistema reemplaza los ejercicios del plan de hoy por los de la rutina.'],
    alt: ['1a. Hay un entrenamiento en curso: la opción no está disponible.'],
    post: 'El plan de hoy contiene los ejercicios de la rutina.' },
  { id: 'CU-07', nombre: 'Unirse / salir de un reto', actor: 'Usuario registrado', hu: 'HU-08',
    desc: 'Sumarse a un reto individual o grupal, o abandonarlo.',
    pre: 'Usuario autenticado. El reto no terminó.',
    flujo: ['El usuario abre "Retos" > "Grupales".', 'Presiona "Unirme" en un reto.', 'El sistema lo registra como participante y publica la novedad en Actividad.'],
    alt: ['2a. Ya participa: el sistema responde "Ya estás en este reto".', '2b. Presiona "Unido ✓" para salir del reto.'],
    post: 'El progreso del reto se actualiza automáticamente con cada entrenamiento.' },
  { id: 'CU-08', nombre: 'Ver ranking de reto', actor: 'Usuario registrado', hu: 'HU-08',
    desc: 'Consultar las primeras posiciones de un reto.',
    pre: 'Usuario autenticado.',
    flujo: ['El usuario presiona "Ver ranking" en un reto.', 'El sistema muestra el top 5 ordenado por progreso, destacando al usuario.'],
    alt: [], post: '—' },
  { id: 'CU-09', nombre: 'Ver actividad y felicitar', actor: 'Usuario registrado', hu: 'HU-04',
    desc: 'Ver el feed social de los retos (logros, superaciones, nuevos participantes) y felicitar.',
    pre: 'Usuario autenticado.',
    flujo: ['El usuario abre "Retos" > "Actividad" (o la campana 🔔).', 'El sistema lista las últimas 30 novedades.', 'El usuario presiona "Felicitar" (❤️).', 'El sistema suma el like.'],
    alt: ['3a. Si ya había felicitado, el like se quita.'], post: 'Contador de likes actualizado.' },
  { id: 'CU-10', nombre: 'Consultar al Coach IA', actor: 'Usuario registrado · Claude API', hu: 'HU-06',
    desc: 'Chatear con el coach virtual, que responde y propone rutinas según el historial del usuario.',
    pre: 'Usuario autenticado.',
    flujo: ['El usuario abre "Coach IA" y escribe (o elige una sugerencia).', 'El sistema envía el mensaje con el historial reciente a la Claude API.', 'Claude devuelve un mensaje y, si corresponde, una rutina estructurada.', 'El sistema guarda y muestra la respuesta con la tarjeta de rutina.'],
    alt: ['2a. Sin API key o la API no responde: el coach responde en "modo demo" con reglas basadas en el historial.', '1a. Mensaje vacío: no se envía.', '3a. La consulta no es de entrenamiento o se rechaza: responde sin rutina.'],
    post: 'La conversación queda guardada.' },
  { id: 'CU-11', nombre: 'Importar rutina del Coach', actor: 'Usuario registrado', hu: 'HU-06',
    desc: 'Pasar la rutina propuesta por el coach al entrenamiento de hoy. Extiende CU-10.',
    pre: 'Existe un mensaje del coach con rutina.',
    flujo: ['El usuario presiona "Importar al log de hoy".', 'El sistema carga los ejercicios en el plan de hoy y guarda la rutina en "Rutinas guardadas".', 'El coach confirma la importación.'],
    alt: ['1a. El mensaje no tiene rutina: se rechaza.'], post: 'Plan de hoy actualizado; rutina disponible para reutilizar.' },
  { id: 'CU-12', nombre: 'Ver logros y nivel', actor: 'Usuario registrado', hu: 'HU-07',
    desc: 'Consultar XP, nivel (cada 100 XP), racha de días y logros desbloqueados o bloqueados.',
    pre: 'Usuario autenticado.',
    flujo: ['El usuario abre "Inicio" o "Perfil".', 'El sistema calcula la racha y muestra nivel, XP y logros.'],
    alt: [], post: 'Los logros se otorgan automáticamente al cumplir la condición (incluido por CU-04 y CU-05).' },
  { id: 'CU-13', nombre: 'Buscar entrenamientos y usuarios', actor: 'Usuario registrado', hu: 'HU-03',
    desc: 'Buscar en la barra superior de la web entrenamientos propios y otros usuarios.',
    pre: 'Usuario autenticado en la web.',
    flujo: ['El usuario escribe al menos 2 letras en el buscador.', 'El sistema muestra entrenamientos y usuarios que coinciden.'],
    alt: ['1a. Sin coincidencias: "Sin resultados".'], post: '—' },
]

async function casosDeUso() {
  const cuerpo = [
    H1('1. Introducción'),
    P('Este documento especifica los casos de uso de GoTrain tal como quedaron implementados en la aplicación web, la app mobile y la API. Cada caso de uso se relaciona con la historia de usuario (HU) que lo origina.'),
    H2('Actores'),
    tabla(['Actor', 'Descripción'], [
      ['Visitante', 'Persona sin sesión iniciada. Puede registrarse e iniciar sesión.'],
      ['Usuario registrado', 'Atleta con cuenta. Accede a todas las funciones.'],
      ['Claude API (externo)', 'Servicio de IA de Anthropic que genera las respuestas y rutinas del Coach.'],
    ], [1.3, 4]),
    H1('2. Diagrama de casos de uso'), ...img(D('casos_de_uso'), 620, 'Figura 1 — Diagrama de casos de uso de GoTrain'),
    tabla(['ID', 'Caso de uso', 'Actor', 'HU'], CU.map((c) => [c.id, c.nombre, c.actor, c.hu]), [0.8, 2.6, 2, 0.7]),
    BR(), H1('3. Especificación de casos de uso'),
  ]
  for (const c of CU) {
    cuerpo.push(H2(`${c.id} — ${c.nombre}`), ficha([
      ['Actor(es)', c.actor], ['Historia de usuario', c.hu], ['Descripción', c.desc], ['Precondiciones', c.pre],
      ['Flujo principal', c.flujo.map((f, i) => `${i + 1}. ${f}`)],
      ['Flujos alternativos', c.alt.length ? c.alt : ['—']], ['Postcondiciones', c.post],
    ]), espacio())
  }
  await generar('GoTrain_Casos_de_Uso', 'Casos de Uso', 'Especificación según la implementación', cuerpo)
}

// ============================================================ CASOS DE PRUEBA
async function casosDePrueba() {
  const API = [
    ['CP-01', 'CU-01', 'Registro con datos válidos', 'Email no registrado', 'POST /auth/register con nombre, email y contraseña de 6+ caracteres', 'HTTP 201 y token de sesión'],
    ['CP-02', 'CU-01', 'Registro con email existente', 'Email ya registrado', 'Registrar santiago@gotrain.com', 'HTTP 400 "Ya existe una cuenta con ese email"'],
    ['CP-03', 'CU-01', 'Registro con contraseña corta', '—', 'Registrar con contraseña "123"', 'HTTP 400, no se crea la cuenta'],
    ['CP-04', 'CU-02', 'Login válido', 'Usuario demo cargado', 'Login con santiago@gotrain.com / gotrain123', 'HTTP 200 con token y datos del usuario'],
    ['CP-05', 'CU-02', 'Login con contraseña incorrecta', 'Usuario existente', 'Login con contraseña errónea', 'HTTP 401 "Email o contraseña incorrectos"'],
    ['CP-06', 'Seguridad', 'Acceso sin token', '—', 'GET /dashboard sin encabezado Authorization', 'HTTP 401'],
    ['CP-07', 'Seguridad', 'Token inválido', '—', 'GET /dashboard con token alterado', 'HTTP 401 "Sesión vencida"'],
    ['CP-08', 'CU-03', 'Editar perfil', 'Usuario autenticado', 'PUT /me con bio y ciudad nuevas', 'HTTP 200 y datos actualizados'],
    ['CP-09', 'CU-03', 'Editar perfil con nombre vacío', 'Usuario autenticado', 'PUT /me con nombre en blanco', 'HTTP 400'],
    ['CP-10', 'CU-04', 'Agregar ejercicio', 'Plan de hoy vacío', 'Agregar Sentadilla 4×10 con 50 kg', 'HTTP 201, volumen = 2.000 kg'],
    ['CP-11', 'CU-04', 'Agregar ejercicio sin nombre', 'Usuario autenticado', 'Agregar con nombre vacío', 'HTTP 400'],
    ['CP-12', 'CU-04', 'Agregar ejercicio con series no numéricas', 'Usuario autenticado', 'series = "muchas"', 'HTTP 400 "deben ser números"'],
    ['CP-13', 'CU-04', 'Quitar ejercicio', 'Plan con un ejercicio', 'DELETE /exercises/{id}', 'El plan queda sin ejercicios'],
    ['CP-14', 'CU-04', 'Iniciar sin ejercicios', 'Plan vacío', 'POST /workouts/{id}/start', 'HTTP 400, no se inicia'],
    ['CP-15', 'CU-04 / CU-12', 'Finalizar entrenamiento', 'Plan con ejercicios, iniciado', 'Finalizar con 45 min', '+50 XP, 1 entrenamiento, racha 1, aparece en historial y en Actividad'],
    ['CP-16', 'CU-04 / CU-07', 'Avance de reto por volumen', 'Usuario en reto de volumen', 'Finalizar el entrenamiento del día', 'El progreso del reto aumenta en el volumen entrenado'],
    ['CP-17', 'CU-05', 'Running suma km', 'Usuario en reto "100km del mes"', 'Registrar 5,5 km en 30 min', 'HTTP 201 y +5,5 km en el reto'],
    ['CP-18', 'CU-05', 'Running con distancia 0', '—', 'Registrar 0 km', 'HTTP 400'],
    ['CP-19', 'CU-07 / CU-12', 'Completar un reto', 'Usuario nuevo unido al reto de km', 'Registrar la distancia total del reto', 'Reto en "Completados", logro "1er Reto" y actividad publicada'],
    ['CP-20', 'CU-07', 'Unirse a reto', 'Usuario no participa', 'POST /challenges/{id}/join', 'unido = true y participantes + 1'],
    ['CP-21', 'CU-07', 'Unirse dos veces', 'Usuario ya participa', 'Repetir la unión', 'HTTP 400 "Ya estás en este reto"'],
    ['CP-22', 'CU-07', 'Salir de reto', 'Usuario participa', 'DELETE /challenges/{id}/join', 'unido = false'],
    ['CP-23', 'CU-08', 'Orden del ranking', 'Reto con participantes', 'Consultar el reto', 'Ranking ordenado de mayor a menor progreso'],
    ['CP-24', 'CU-09', 'Felicitar y quitar felicitación', 'Hay actividad', 'Dos POST /activity/{id}/like', 'likes +1 y luego vuelve al valor original'],
    ['CP-25', 'CU-10', 'Pedir rutina al Coach', 'Usuario con historial', '"Quiero entrenar piernas, tengo 60 min"', 'Respuesta con rutina de 3 o más ejercicios'],
    ['CP-26', 'CU-10', 'Mensaje vacío al Coach', '—', 'Enviar "  "', 'HTTP 400'],
    ['CP-27', 'CU-11', 'Importar rutina', 'Mensaje con rutina', 'POST /coach/messages/{id}/import', 'Plan de hoy = rutina; rutina guardada'],
    ['CP-28', 'CU-11', 'Importar mensaje sin rutina', 'Mensaje "hola"', 'Importar ese mensaje', 'HTTP 400'],
    ['CP-29', 'CU-06', 'Usar rutina guardada', 'Hay rutinas guardadas', 'POST /routines/{id}/use', 'El plan de hoy toma el nombre y ejercicios de la rutina'],
    ['CP-30', 'CU-12', 'Racha y logros', 'Usuario demo con 21 días seguidos', 'GET /profile', 'Racha ≥ 21 y logros "Racha 7" y "Racha 21" desbloqueados'],
    ['CP-31', 'CU-13', 'Búsqueda', 'Datos de ejemplo', 'Buscar "Leg" y "Mar"', 'Devuelve Leg Day y la usuaria María'],
    ['CP-32', 'Seguridad', 'Modificar datos ajenos', 'Dos usuarios', 'Usuario B borra un ejercicio de A', 'HTTP 404, el ejercicio no se borra'],
  ].map((r) => [...r, resultados[r[0]] || 'Pendiente'])
  const UI = [
    ['CP-33', 'CU-02', 'Validación en tiempo real (web)', 'Pantalla de login', 'Presionar "Iniciar Sesión" con campos vacíos', 'Se marcan email y contraseña con mensaje de error', 'web_03'],
    ['CP-34', 'CU-02', 'Error de credenciales (web)', 'Pantalla de login', 'Ingresar contraseña incorrecta', 'Alerta "Email o contraseña incorrectos"', 'web_04'],
    ['CP-35', 'CU-13', 'Buscador (web)', 'Sesión iniciada', 'Escribir "Leg" en la barra superior', 'Desplegable con los resultados', 'web_06'],
    ['CP-36', 'CU-04', 'Cronómetro de sesión (web)', 'Plan con ejercicios', 'Presionar "Iniciar Entrenamiento"', 'Cronómetro en curso y botón "Finalizar"', 'web_10'],
    ['CP-37', 'CU-05', 'Registrar running (web)', 'Sesión iniciada', 'Cargar 7 km / 35 min', 'Aviso de km registrados y XP', 'web_13'],
    ['CP-38', 'CU-02', 'Validación de login (app)', 'App abierta', 'Presionar "Iniciar Sesión" vacío', 'Mensajes bajo cada campo', 'app_02'],
    ['CP-39', 'CU-10 / CU-11', 'Coach e importación (app)', 'Sesión iniciada', 'Elegir sugerencia y "Importar al log de hoy"', 'Rutina importada y confirmación del coach', 'app_15'],
    ['CP-40', 'CU-04', 'Entrenamiento completo (app)', 'Sesión iniciada', 'Agregar ejercicio, iniciar y finalizar', 'Aviso "¡Guardado! +50 XP"', 'app_12'],
  ]
  const aprob = API.filter((r) => r[6] === 'Aprobado').length
  const cuerpo = [
    H1('1. Introducción'),
    P('Los casos de prueba validan los flujos principales y alternativos de los casos de uso de GoTrain y los controles de seguridad de la API.'),
    P('Las pruebas se ejecutaron de forma **automatizada**. No son resultados supuestos: cada resultado proviene de una ejecución real.'),
    bullets([
      '**Pruebas de API (CP-01 a CP-32):** `backend/tests/test_api.py` (unittest). Corren contra una base PostgreSQL separada (gotrain_test), así no modifican la demo.',
      '**Pruebas de interfaz (CP-33 a CP-40):** se recorrieron la web y la app con Playwright (Chromium) y se guardó la captura de cada resultado (`entrega/scripts/capturas.py`).',
    ]),
    H2('Cómo volver a ejecutarlas'),
    P('Desde la carpeta backend: **.venv\\Scripts\\python -m unittest discover -s tests -v**'),
    H2('Resumen de la ejecución'),
    tabla(['Tipo', 'Casos', 'Aprobados', 'Fallidos', 'Fecha'], [
      ['API (automatizadas)', String(API.length), String(aprob), String(API.length - aprob), '11/11/2026'],
      ['Interfaz web y app (Playwright)', String(UI.length), String(UI.length), '0', '11/11/2026'],
    ], [2.5, 1, 1, 1, 1.2]),
    BR(), H1('2. Casos de prueba de la API'),
    tabla(['ID', 'CU', 'Descripción', 'Precondición', 'Pasos / datos', 'Resultado esperado', 'Resultado'], API, [0.95, 0.9, 1.6, 1.4, 1.9, 2, 1]),
    BR(), H1('3. Casos de prueba de interfaz'),
    tabla(['ID', 'CU', 'Descripción', 'Precondición', 'Pasos', 'Resultado esperado', 'Resultado'], UI.map((r) => [...r.slice(0, 6), 'Aprobado']), [0.95, 0.9, 1.6, 1.3, 1.9, 2, 1]),
    H2('Evidencias'),
    ...img(C('web_03_login_validacion'), 520, 'CP-33 — Validación en tiempo real en la web'),
    ...img(C('web_10_entrenamiento_en_curso'), 520, 'CP-36 — Entrenamiento en curso con cronómetro'),
    imgPar(C('app_02_login_validacion'), C('app_15_coach_importada'), 'CP-38 — Validación en la app', 'CP-39 — Rutina importada desde el Coach'),
  ]
  await generar('GoTrain_Casos_de_Prueba', 'Casos de Prueba', 'Plan y resultados de la ejecución', cuerpo)
}

// ============================================================ REQUISITOS
async function requisitosFuncionales() {
  const RF = [
    ['RF-01', 'Registro de usuarios con nombre, apellido, email, contraseña y nivel de atleta.', 'HU-01', 'Alta'],
    ['RF-02', 'Validar en tiempo real el formato del email y el largo mínimo de la contraseña (6).', 'HU-01', 'Alta'],
    ['RF-03', 'Impedir registrar dos cuentas con el mismo email.', 'HU-01', 'Alta'],
    ['RF-04', 'Inicio de sesión con email y contraseña que emite un token de sesión (JWT, 7 días).', 'HU-01', 'Alta'],
    ['RF-05', 'Mantener la sesión iniciada en el dispositivo y permitir cerrarla.', 'HU-01', 'Media'],
    ['RF-06', 'Mostrar un panel de inicio con entrenamientos totales, racha, seguidores, nivel/XP, historial, logros, próximo reto y sugerencia del coach.', 'HU-03 / HU-07', 'Alta'],
    ['RF-07', 'Ver y editar el perfil (nombre, apellido, ciudad, bio, nivel de atleta).', 'HU-03', 'Media'],
    ['RF-08', 'Gestionar el entrenamiento del día: agregar y quitar ejercicios con grupo muscular, series, repeticiones y peso.', 'HU-02', 'Alta'],
    ['RF-09', 'Calcular series totales, volumen (series × reps × kg) y duración estimada.', 'HU-02', 'Media'],
    ['RF-10', 'Iniciar la sesión con cronómetro y finalizarla guardando la duración real.', 'HU-02', 'Alta'],
    ['RF-11', 'Registrar salidas de running con distancia y duración.', 'HU-02', 'Media'],
    ['RF-12', 'Consultar el historial de entrenamientos con fecha, duración y volumen o distancia.', 'HU-02 / HU-03', 'Alta'],
    ['RF-13', 'Guardar rutinas y cargarlas como entrenamiento del día.', 'HU-02', 'Media'],
    ['RF-14', 'Listar retos por pestaña: activos, grupales, completados.', 'HU-08', 'Alta'],
    ['RF-15', 'Unirse y salir de retos individuales y grupales.', 'HU-08', 'Alta'],
    ['RF-16', 'Actualizar automáticamente el progreso de los retos (km, entrenamientos, volumen, días de racha) al guardar entrenamientos.', 'HU-08', 'Alta'],
    ['RF-17', 'Mostrar el ranking (top 5) de cada reto.', 'HU-08', 'Media'],
    ['RF-18', 'Publicar en el feed de Actividad los entrenamientos terminados, retos completados y nuevas uniones.', 'HU-04', 'Media'],
    ['RF-19', 'Permitir felicitar (like) y quitar la felicitación en la actividad.', 'HU-04', 'Baja'],
    ['RF-20', 'Chat con el Coach IA que responde usando el historial del usuario mediante la Claude API.', 'HU-06', 'Alta'],
    ['RF-21', 'El Coach propone rutinas estructuradas (ejercicio, grupo, series, reps, peso).', 'HU-06', 'Alta'],
    ['RF-22', 'Importar la rutina del Coach al entrenamiento del día y guardarla como rutina.', 'HU-06', 'Alta'],
    ['RF-23', 'Si la IA no está disponible, el Coach responde en modo demo basado en reglas.', 'HU-06', 'Media'],
    ['RF-24', 'Gamificación: 50 XP por entrenamiento, nivel cada 100 XP, racha de días consecutivos.', 'HU-07', 'Alta'],
    ['RF-25', 'Otorgar logros automáticamente: racha 7 y 21 días, 10/50/100 entrenamientos, primer reto, nivel 5 y 10.', 'HU-07', 'Media'],
    ['RF-26', 'Buscar entrenamientos propios y usuarios desde la web.', 'HU-03', 'Baja'],
    ['RF-27', 'En la app mobile, permitir configurar la dirección del servidor desde el login.', '—', 'Media'],
  ].map((r) => [...r, 'Implementado'])
  const cuerpo = [
    H1('1. Introducción'),
    P('Este documento lista los requisitos funcionales de GoTrain implementados en la versión 2.0. Cada requisito se vincula a una historia de usuario (HU). Ninguno es exclusivo de una plataforma, salvo que se indique: la web y la app usan la misma API.'),
    H2('Historias de usuario de referencia'),
    tabla(['HU', 'Nombre'], [['HU-01', 'Registro e inicio de sesión'], ['HU-02', 'Registro de entrenamiento'], ['HU-03', 'Perfil de usuario'],
      ['HU-04', 'Actividad social de retos'], ['HU-06', 'Coach virtual con IA'], ['HU-07', 'Gamificación'], ['HU-08', 'Desafíos individuales y grupales']], [1, 4]),
    P('HU-05 (Rutas GPS) quedó fuera del alcance de esta versión: el running se registra cargando distancia y duración a mano.'),
    H1('2. Requisitos funcionales'),
    tabla(['ID', 'Descripción', 'HU', 'Prioridad', 'Estado'], RF, [0.8, 5, 1, 0.9, 1.1]),
    H1('3. Trazabilidad con casos de uso'),
    tabla(['Caso de uso', 'Requisitos'], [
      ['CU-01 Registrarse', 'RF-01, RF-02, RF-03'], ['CU-02 Iniciar sesión', 'RF-04, RF-05, RF-27'], ['CU-03 Gestionar perfil', 'RF-06, RF-07'],
      ['CU-04 Registrar entrenamiento', 'RF-08, RF-09, RF-10, RF-12, RF-16, RF-18, RF-24, RF-25'], ['CU-05 Registrar running', 'RF-11, RF-16'],
      ['CU-06 Usar rutina guardada', 'RF-13'], ['CU-07 / CU-08 Retos y ranking', 'RF-14, RF-15, RF-16, RF-17'], ['CU-09 Actividad', 'RF-18, RF-19'],
      ['CU-10 / CU-11 Coach IA', 'RF-20, RF-21, RF-22, RF-23'], ['CU-12 Logros', 'RF-24, RF-25'], ['CU-13 Búsqueda', 'RF-26'],
    ], [2, 3]),
  ]
  await generar('GoTrain_Requisitos_Funcionales', 'Requisitos Funcionales', null, cuerpo)
}

async function requisitosNoFuncionales() {
  const RNF = [
    ['RNF-01', 'Seguridad', 'Las contraseñas se almacenan con hash (scrypt mediante Werkzeug); nunca en texto plano.', 'Revisión de models.py / tabla usuarios'],
    ['RNF-02', 'Seguridad', 'Todos los endpoints, salvo registro, login y health, exigen un token JWT firmado (HS256) con vencimiento de 7 días.', 'CP-06, CP-07'],
    ['RNF-03', 'Seguridad', 'Un usuario solo puede leer y modificar sus propios entrenamientos, ejercicios, rutinas y mensajes.', 'CP-32'],
    ['RNF-04', 'Seguridad', 'La clave de la Claude API y la clave de firma se configuran por variables de entorno (.env) y no se suben al repositorio.', '.gitignore / .env.example'],
    ['RNF-05', 'Usabilidad', 'Interfaz en español rioplatense, tema oscuro con color de acento #E94560, coherente con los prototipos.', 'Manuales de usuario'],
    ['RNF-06', 'Usabilidad', 'Validación en tiempo real y mensajes de error claros en formularios.', 'CP-33, CP-38'],
    ['RNF-07', 'Usabilidad / Portabilidad', 'La web es responsive (escritorio y celular, quiebre a 900 px).', 'styles.css'],
    ['RNF-08', 'Portabilidad', 'App mobile para Android 7.0+ distribuida como APK; el mismo código React Native permite generar la versión iOS.', 'APK'],
    ['RNF-09', 'Interoperabilidad', 'Comunicación cliente-servidor por API REST con JSON sobre HTTP, compartida por web y mobile.', 'Diseño de arquitectura'],
    ['RNF-10', 'Disponibilidad', 'Si la Claude API no responde o falta la clave, el Coach sigue funcionando en modo demo.', 'RF-23 / CP-25'],
    ['RNF-11', 'Rendimiento', 'Las operaciones habituales de la API responden en menos de 500 ms en la red local (las 32 pruebas de API corren en unos 19 s, incluyendo la creación de la base).', 'Ejecución de pruebas'],
    ['RNF-12', 'Rendimiento', 'El Coach con IA responde en pocos segundos; mientras tanto la interfaz muestra "El coach está escribiendo…".', 'Coach'],
    ['RNF-13', 'Mantenibilidad', 'Separación en capas (presentación, API, lógica, datos) y ORM SQLAlchemy, que independiza el código del motor; la conexión a PostgreSQL se configura en el archivo .env.', 'Arquitectura'],
    ['RNF-14', 'Mantenibilidad', 'Código versionado en Git y pruebas automatizadas reproducibles.', 'Repositorio / tests'],
    ['RNF-15', 'Escalabilidad', 'API sin estado (stateless) gracias a JWT: permite correr varias instancias detrás de un balanceador.', 'Arquitectura'],
    ['RNF-16', 'Privacidad', 'Al Coach IA solo se envían nombre, nivel, ciudad e historial de entrenamientos: no se envían email ni contraseña.', 'coach.py'],
  ]
  const cuerpo = [
    H1('1. Introducción'),
    P('Los requisitos no funcionales definen las cualidades del sistema GoTrain: seguridad, usabilidad, rendimiento, portabilidad, mantenibilidad y disponibilidad. Para cada uno se indica cómo se verifica.'),
    H1('2. Requisitos no funcionales'),
    tabla(['ID', 'Categoría', 'Descripción', 'Verificación'], RNF, [0.8, 1.3, 4.6, 1.6]),
    H1('3. Restricciones técnicas'),
    bullets([
      'Backend: Python 3.13, Flask 3, Flask-SQLAlchemy, PyJWT.', 'Base de datos: PostgreSQL 17 (base "gotrain" para la app y "gotrain_test" para las pruebas automatizadas), driver psycopg 3.',
      'Web: React 18 + Vite 6. Mobile: React Native con Expo SDK 58.', 'IA: Claude API (modelo claude-opus-5-5) con salida estructurada en JSON.',
      'Navegadores soportados: Chrome, Edge y Firefox actuales.',
    ]),
  ]
  await generar('GoTrain_Requisitos_No_Funcionales', 'Requisitos No Funcionales', null, cuerpo)
}

// ============================================================ UML y DER
async function uml() {
  const cuerpo = [
    H1('1. Diagrama de clases'),
    P('El diagrama refleja las clases del modelo de dominio implementadas en backend/models.py y el servicio del Coach IA (backend/coach.py).'),
    ...img(D('uml_clases'), 640, 'Figura 1 — Diagrama de clases UML'),
    BR(), H1('2. Descripción de las clases'),
    tabla(['Clase', 'Responsabilidad', 'Métodos / reglas'], [
      ['Usuario', 'Atleta registrado: datos personales, credenciales, XP y estadísticas sociales.', 'nivel() = 1 + xp / 100; set_password / check_password con hash; iniciales()'],
      ['Entrenamiento', 'Sesión de entrenamiento. Estado "planificado" (el de hoy) o "completado". Tipo fuerza o running.', 'volumen_kg() = Σ series × reps × peso; total_series()'],
      ['Ejercicio', 'Ejercicio dentro de un entrenamiento (composición).', '—'],
      ['Rutina', 'Plantilla de ejercicios reutilizable (propia o sugerida por el Coach).', '—'],
      ['Reto', 'Desafío individual o grupal con métrica (km, entrenos, volumen, días) y meta.', 'Activo entre fecha_inicio y fecha_fin'],
      ['ParticipacionReto', 'Clase de asociación Usuario–Reto con el progreso.', 'completado al alcanzar la meta'],
      ['Actividad', 'Evento del feed social.', 'likes'],
      ['LikeActividad', 'Felicitación de un usuario a una actividad (única por usuario).', '—'],
      ['Logro', 'Insignia desbloqueada por el usuario.', 'Se otorga automáticamente'],
      ['MensajeCoach', 'Mensaje del chat con el Coach; puede incluir una rutina en JSON.', 'importada'],
      ['CoachIA', 'Servicio que genera respuestas con la Claude API o en modo demo.', 'responder(), responder_claude(), responder_demo()'],
    ], [1.4, 3, 2.6]),
    H1('3. Diagrama de secuencia — Consulta al Coach IA'),
    ...img(D('secuencia_coach'), 620, 'Figura 2 — Secuencia de una consulta al Coach e importación de la rutina'),
  ]
  await generar('GoTrain_UML', 'UML — Diagrama de Clases', 'Incluye diagrama de secuencia del Coach IA', cuerpo)
}

async function der() {
  const T = {
    usuarios: [['id', 'INTEGER', 'PK', 'Identificador'], ['nombre', 'VARCHAR(80)', 'NOT NULL', 'Nombre'], ['apellido', 'VARCHAR(80)', '', 'Apellido'],
      ['email', 'VARCHAR(120)', 'UNIQUE, NOT NULL', 'Email de acceso'], ['password_hash', 'VARCHAR(256)', 'NOT NULL', 'Hash de la contraseña'],
      ['bio', 'VARCHAR(200)', '', 'Biografía'], ['ciudad', 'VARCHAR(80)', '', 'Ciudad'], ['nivel_atleta', 'VARCHAR(30)', '', 'principiante / intermedio / avanzado'],
      ['xp', 'INTEGER', 'DEFAULT 0', 'Experiencia acumulada'], ['seguidores', 'INTEGER', '', 'Seguidores'], ['siguiendo', 'INTEGER', '', 'Seguidos'], ['creado', 'DATETIME', '', 'Fecha de alta']],
    entrenamientos: [['id', 'INTEGER', 'PK', ''], ['user_id', 'INTEGER', 'FK → usuarios', 'Dueño'], ['nombre', 'VARCHAR(120)', 'NOT NULL', ''], ['tipo', 'VARCHAR(20)', '', 'fuerza / running'],
      ['fecha', 'DATE', '', ''], ['estado', 'VARCHAR(20)', '', 'planificado / completado'], ['duracion_min', 'INTEGER', '', ''], ['distancia_km', 'FLOAT', '', 'Solo running'], ['iniciado', 'DATETIME', 'NULL', 'Inicio del cronómetro']],
    ejercicios: [['id', 'INTEGER', 'PK', ''], ['workout_id', 'INTEGER', 'FK → entrenamientos', ''], ['nombre', 'VARCHAR(120)', 'NOT NULL', ''], ['grupo', 'VARCHAR(60)', '', 'Grupo muscular'],
      ['series', 'INTEGER', '', ''], ['reps', 'INTEGER', '', ''], ['peso_kg', 'FLOAT', '', '0 = peso corporal'], ['icono', 'VARCHAR(8)', '', 'Emoji'], ['orden', 'INTEGER', '', 'Posición']],
    rutinas: [['id', 'INTEGER', 'PK', ''], ['user_id', 'INTEGER', 'FK → usuarios', ''], ['nombre', 'VARCHAR(120)', 'NOT NULL', ''], ['descripcion', 'VARCHAR(200)', '', ''], ['ejercicios', 'JSON', '', 'Lista de ejercicios']],
    retos: [['id', 'INTEGER', 'PK', ''], ['titulo', 'VARCHAR(120)', 'NOT NULL', ''], ['descripcion', 'VARCHAR(200)', '', ''], ['tipo', 'VARCHAR(20)', '', 'individual / grupal'], ['icono', 'VARCHAR(8)', '', ''],
      ['metrica', 'VARCHAR(20)', '', 'km / entrenos / volumen / dias'], ['meta', 'FLOAT', 'NOT NULL', ''], ['unidad', 'VARCHAR(20)', '', ''], ['fecha_inicio', 'DATE', '', ''], ['fecha_fin', 'DATE', 'NOT NULL', '']],
    retos_participantes: [['id', 'INTEGER', 'PK', ''], ['challenge_id', 'INTEGER', 'FK → retos', ''], ['user_id', 'INTEGER', 'FK → usuarios', ''], ['progreso', 'FLOAT', '', ''], ['completado', 'BOOLEAN', '', ''], ['unido', 'DATETIME', '', '']],
    actividad: [['id', 'INTEGER', 'PK', ''], ['user_id', 'INTEGER', 'FK → usuarios', 'Autor'], ['texto', 'VARCHAR(250)', 'NOT NULL', ''], ['icono', 'VARCHAR(8)', '', ''], ['likes', 'INTEGER', '', 'Contador'], ['fecha', 'DATETIME', '', '']],
    actividad_likes: [['id', 'INTEGER', 'PK', ''], ['activity_id', 'INTEGER', 'FK → actividad', ''], ['user_id', 'INTEGER', 'FK → usuarios', '']],
    logros: [['id', 'INTEGER', 'PK', ''], ['user_id', 'INTEGER', 'FK → usuarios', ''], ['codigo', 'VARCHAR(40)', 'NOT NULL', 'racha_7, primer_reto…'], ['icono', 'VARCHAR(8)', '', ''], ['label', 'VARCHAR(40)', '', ''], ['fecha', 'DATETIME', '', '']],
    coach_mensajes: [['id', 'INTEGER', 'PK', ''], ['user_id', 'INTEGER', 'FK → usuarios', ''], ['rol', 'VARCHAR(10)', 'NOT NULL', 'user / coach'], ['contenido', 'TEXT', 'NOT NULL', ''], ['rutina', 'JSON', 'NULL', 'Rutina propuesta'], ['importada', 'BOOLEAN', '', ''], ['fecha', 'DATETIME', '', '']],
  }
  const cuerpo = [
    H1('1. Diagrama Entidad-Relación'),
    P('Modelo de datos implementado con SQLAlchemy. La base de datos es PostgreSQL 17. Son 10 tablas.'),
    ...img(D('der'), 640, 'Figura 1 — DER de GoTrain (notación pata de gallo)'),
    BR(), H1('2. Relaciones'),
    tabla(['Relación', 'Cardinalidad', 'Descripción'], [
      ['usuarios – entrenamientos', '1 : N', 'Un usuario registra muchos entrenamientos.'], ['entrenamientos – ejercicios', '1 : N', 'Composición: al borrar el entrenamiento se borran sus ejercicios.'],
      ['usuarios – rutinas', '1 : N', 'Rutinas guardadas del usuario.'], ['usuarios – retos', 'N : M', 'Resuelta con retos_participantes (guarda el progreso).'],
      ['usuarios – actividad', '1 : N', 'Eventos publicados por el usuario.'], ['usuarios – actividad', 'N : M', 'Likes, resuelta con actividad_likes.'],
      ['usuarios – logros', '1 : N', 'Insignias desbloqueadas.'], ['usuarios – coach_mensajes', '1 : N', 'Historial del chat con el Coach.'],
    ], [2.2, 1, 3.5]),
    H1('3. Diccionario de datos'),
  ]
  for (const [nombre, cols] of Object.entries(T)) cuerpo.push(H2(nombre), tabla(['Campo', 'Tipo', 'Restricción', 'Descripción'], cols, [1.6, 1.4, 1.7, 2.6]), espacio())
  await generar('GoTrain_DER', 'DER — Modelo de Datos', 'Diagrama Entidad-Relación y diccionario de datos', cuerpo)
}

// ============================================================ ARQUITECTURA y COMPONENTES
async function arquitectura() {
  const EP = [
    ['POST', '/api/auth/register', 'No', 'Registro'], ['POST', '/api/auth/login', 'No', 'Login, devuelve token'], ['GET / PUT', '/api/me', 'Sí', 'Datos del usuario / editar perfil'],
    ['GET', '/api/profile', 'Sí', 'Perfil con stats, logros e historial'], ['GET', '/api/dashboard', 'Sí', 'Panel de inicio'], ['GET', '/api/search?q=', 'Sí', 'Búsqueda'],
    ['GET', '/api/workouts', 'Sí', 'Historial'], ['GET', '/api/workouts/today', 'Sí', 'Plan de hoy'], ['POST', '/api/workouts/{id}/exercises', 'Sí', 'Agregar ejercicio'],
    ['PUT / DELETE', '/api/exercises/{id}', 'Sí', 'Editar / quitar ejercicio'], ['POST', '/api/workouts/{id}/start', 'Sí', 'Iniciar cronómetro'], ['POST', '/api/workouts/{id}/finish', 'Sí', 'Finalizar y guardar'],
    ['POST', '/api/workouts/running', 'Sí', 'Registrar running'], ['GET', '/api/routines', 'Sí', 'Rutinas guardadas'], ['POST', '/api/routines/{id}/use', 'Sí', 'Usar rutina'],
    ['GET', '/api/challenges?tab=', 'Sí', 'Retos por pestaña'], ['POST / DELETE', '/api/challenges/{id}/join', 'Sí', 'Unirse / salir'], ['GET', '/api/activity', 'Sí', 'Feed de actividad'],
    ['POST', '/api/activity/{id}/like', 'Sí', 'Felicitar / quitar'], ['GET / POST', '/api/coach/messages', 'Sí', 'Chat con el Coach'], ['POST', '/api/coach/messages/{id}/import', 'Sí', 'Importar rutina'],
    ['GET', '/api/health', 'No', 'Estado del servicio'],
  ]
  const cuerpo = [
    H1('1. Visión general'),
    P('GoTrain usa una arquitectura **cliente-servidor en tres capas**. Dos clientes (la aplicación web y la app mobile Android) consumen la misma **API REST**. La API concentra la lógica de negocio y el acceso a datos, y se integra con la **Claude API** de Anthropic para el Coach virtual.'),
    ...img(D('arquitectura'), 520, 'Figura 1 — Arquitectura en capas de GoTrain'),
    H1('2. Capas'),
    tabla(['Capa', 'Tecnología', 'Responsabilidad'], [
      ['Presentación — Web', 'React 18, React Router 6, Vite 6, CSS propio', 'SPA con landing, login/registro y panel. Guarda el token en localStorage.'],
      ['Presentación — Mobile', 'React Native 0.88, Expo SDK 58, AsyncStorage', 'App Android (APK) con navegación por pestañas. Guarda token y servidor en el dispositivo.'],
      ['Aplicación', 'Python 3.13, Flask 3, Flask-CORS, PyJWT', 'API REST, autenticación, validaciones, reglas de negocio (XP, racha, retos, logros).'],
      ['Servicio IA', 'SDK anthropic (Python), Claude API', 'Genera respuestas y rutinas con salida estructurada JSON; modo demo como alternativa.'],
      ['Datos', 'SQLAlchemy 2 + PostgreSQL 17 (psycopg 3)', 'Persistencia. La conexión se configura en el archivo .env.'],
    ], [1.5, 2.3, 3.4]),
    H1('3. Decisiones de diseño'),
    bullets([
      '**Una sola API para web y mobile:** evita duplicar lógica y asegura que los datos sean los mismos en ambas plataformas.',
      '**JWT sin estado:** el servidor no guarda sesiones, lo que simplifica escalar horizontalmente.',
      '**Lógica de gamificación en el servidor:** XP, racha, progreso de retos y logros se calculan al guardar un entrenamiento, así los clientes no pueden alterarlos.',
      '**Salida estructurada de la IA:** se le pide a Claude un JSON con un esquema fijo (mensaje + rutina), lo que permite mostrar e importar la rutina de forma confiable.',
      '**Degradación controlada:** si la IA falla, el Coach usa reglas (modo demo) y la app sigue funcionando.',
      '**PostgreSQL + ORM:** base relacional con integridad referencial; las pruebas automatizadas usan una base PostgreSQL separada (gotrain_test) para no tocar los datos de la demo.',
    ]),
    H1('4. API REST'),
    P('Formato JSON. Autenticación con el encabezado **Authorization: Bearer <token>**. Errores con el formato **{"error": "mensaje"}** y códigos 400 / 401 / 404.'),
    tabla(['Método', 'Ruta', 'Token', 'Descripción'], EP, [1.1, 2.8, 0.7, 2.6]),
    H1('5. Flujo del Coach IA'),
    ...img(D('secuencia_coach'), 560, 'Figura 2 — Secuencia de una consulta al Coach'),
    H1('6. Seguridad'),
    bullets(['Contraseñas con hash (Werkzeug scrypt).', 'Tokens JWT HS256 con vencimiento de 7 días.', 'Cada consulta filtra por el usuario del token (no se accede a datos ajenos).',
      'Secretos (SECRET_KEY, ANTHROPIC_API_KEY) en variables de entorno.', 'CORS habilitado para los clientes; en producción se recomienda HTTPS.']),
    H1('7. Despliegue'),
    P('El sistema se ejecuta en la PC del equipo de desarrollo; los clientes se conectan por la red local.'),
    tabla(['Elemento', 'Ejecución', 'Detalle'], [
      ['Base de datos', 'PostgreSQL 17 (puerto 5433)', 'Bases "gotrain" y "gotrain_test". Se crean con crear_base.py y se cargan con seed.py.'],
      ['API Flask', 'python app.py (puerto 5000)', 'Se inicia con 1_iniciar_backend.bat, que también levanta PostgreSQL.'],
      ['Web', 'Vite (puerto 5173, proxy /api)', 'Se inicia con 2_iniciar_web.bat.'],
      ['Mobile', 'APK release (arm64) o Expo Go', 'En el APK se configura la IP de la PC desde la pantalla de login.'],
    ], [1.4, 2.4, 3.4]),
  ]
  await generar('GoTrain_Diseno_de_Arquitectura', 'Diseño de Arquitectura', null, cuerpo)
}

async function componentes() {
  const cuerpo = [
    H1('1. Diagrama de componentes'),
    P('El diagrama muestra los componentes de software de GoTrain, las interfaces que exponen y sus dependencias.'),
    ...img(D('componentes'), 640, 'Figura 1 — Diagrama de componentes'),
    BR(), H1('2. Descripción de componentes'),
    tabla(['Componente', 'Archivos', 'Responsabilidad', 'Depende de'], [
      ['GoTrain Web — App', 'web/src/App.jsx, main.jsx', 'Rutas, contexto de autenticación y avisos (toast).', 'Páginas, api.js'],
      ['GoTrain Web — Páginas', 'web/src/pages/*.jsx', 'Landing, Auth, Shell (menú y buscador), Inicio, Entrenar, Retos, Coach, Perfil, Configuración.', 'api.js'],
      ['GoTrain Web — Cliente HTTP', 'web/src/api.js', 'Llamadas a la API con token; formateo de fechas y unidades.', 'Interfaz REST /api'],
      ['GoTrain Mobile — App', 'mobile/App.js', 'Sesión, pestañas inferiores y avisos.', 'Screens, api.js'],
      ['GoTrain Mobile — Screens', 'mobile/src/screens/*.js', 'Login, Retos, Entrenar, Coach y Perfil.', 'components.js, api.js'],
      ['GoTrain Mobile — Cliente HTTP', 'mobile/src/api.js', 'Llamadas a la API; detección y configuración del servidor; AsyncStorage.', 'Interfaz REST /api'],
      ['API — Auth', 'backend/app.py', 'Registro, login, emisión y validación de JWT.', 'Modelos'],
      ['API — Entrenamientos', 'backend/app.py', 'Plan del día, ejercicios, cronómetro, running, rutinas.', 'Gamificación, Retos, Modelos'],
      ['API — Retos y Actividad', 'backend/app.py', 'Listado, unión, progreso, ranking, feed y likes.', 'Modelos'],
      ['API — Perfil y Dashboard', 'backend/app.py', 'Datos del usuario, estadísticas, búsqueda.', 'Modelos'],
      ['API — Gamificación', 'backend/app.py', 'XP, nivel, racha y logros.', 'Modelos'],
      ['API — Coach IA', 'backend/coach.py', 'Consulta a Claude con salida JSON; modo demo.', 'Claude API, Modelos'],
      ['Modelos ORM', 'backend/models.py', 'Entidades y relaciones (SQLAlchemy).', 'Base de datos'],
      ['Datos de ejemplo', 'backend/seed.py', 'Crea las tablas y carga la demo.', 'Modelos'],
      ['Base de datos', 'PostgreSQL 17', 'Persistencia.', '—'],
      ['Claude API (externo)', 'api.anthropic.com', 'Modelo de lenguaje para el Coach.', '—'],
    ], [1.7, 1.7, 2.8, 1.4]),
    H1('3. Interfaces'),
    tabla(['Interfaz', 'Provista por', 'Requerida por', 'Protocolo'], [
      ['REST /api', 'GoTrain API', 'Web y Mobile', 'HTTP + JSON, Bearer JWT'],
      ['Messages API', 'Claude API', 'Coach IA', 'HTTPS + JSON (SDK anthropic)'],
      ['SQL', 'PostgreSQL 17', 'Modelos ORM', 'psycopg 3'],
    ], [1.5, 1.6, 1.6, 2.2]),
  ]
  await generar('GoTrain_Diagrama_de_Componentes', 'Diagrama de Componentes', null, cuerpo)
}

// ============================================================ GANTT
async function gantt() {
  const tareas = [
    ['1. Análisis', 'Relevamiento y propuesta', '03/08/2026', '12/08/2026', '10', 'Completada'],
    ['', 'Requisitos funcionales y no funcionales', '13/08/2026', '19/08/2026', '7', 'Completada'],
    ['', 'Historias de usuario', '13/08/2026', '19/08/2026', '7', 'Completada'],
    ['', 'Casos de uso', '20/08/2026', '26/08/2026', '7', 'Completada'],
    ['2. Diseño', 'UML de clases y DER', '31/08/2026', '06/09/2026', '7', 'Completada'],
    ['', 'Arquitectura y componentes', '07/09/2026', '11/09/2026', '5', 'Completada'],
    ['', 'Prototipo web y mobile', '07/09/2026', '20/09/2026', '14', 'Completada'],
    ['', '◆ Entrega Parcial 1', '24/09/2026', '24/09/2026', '—', 'Hito cumplido'],
    ['3. Modelo de negocio', 'Trabajo de campo y encuestas', '01/10/2026', '14/10/2026', '14', 'Completada'],
    ['', 'Modelo de negocio y defensa', '15/10/2026', '26/10/2026', '12', 'Completada'],
    ['4. Desarrollo', 'Backend API Flask + base de datos', '27/10/2026', '03/11/2026', '8', 'Completada'],
    ['', 'Coach IA (Claude API)', '04/11/2026', '06/11/2026', '3', 'Completada'],
    ['', 'Aplicación web React', '02/11/2026', '09/11/2026', '8', 'Completada'],
    ['', 'App mobile React Native', '05/11/2026', '11/11/2026', '7', 'Completada'],
    ['5. Pruebas y entrega', 'Casos de prueba y testing', '09/11/2026', '13/11/2026', '5', 'En curso'],
    ['', 'Manuales de usuario y videos demo', '10/11/2026', '13/11/2026', '4', 'En curso'],
    ['', 'Compilación del APK y publicación', '11/11/2026', '13/11/2026', '3', 'En curso'],
    ['', '◆ Entrega final', '16/11/2026', '16/11/2026', '—', 'Hito'],
  ]
  const cuerpo = [
    H1('1. Diagrama de Gantt'),
    P('Planificación del proyecto GoTrain para el Seminario Final 2026, desde el relevamiento hasta la entrega final. Las tareas en rosa están completadas, las rosa claro están en curso y los rombos son hitos.'),
    ...img(D('gantt'), 640, 'Figura 1 — Diagrama de Gantt del proyecto'),
    H1('2. Detalle de tareas'),
    tabla(['Fase', 'Tarea', 'Inicio', 'Fin', 'Días', 'Estado'], tareas, [1.4, 2.8, 1.1, 1.1, 0.6, 1.1]),
    H1('3. Recursos'),
    P('Proyecto individual: ' + 'Santiago Ghiano cubre los roles de analista, diseñador, desarrollador full-stack y tester.'),
  ]
  await generar('GoTrain_Gantt', 'Diagrama de Gantt', 'Planificación del proyecto', cuerpo)
}

// ============================================================ MANUALES
async function manualWeb() {
  const cuerpo = [
    H1('1. Introducción'),
    P('GoTrain es una plataforma de fitness que combina el registro de entrenamientos, retos con la comunidad y un Coach virtual con inteligencia artificial. Este manual explica cómo usar la **aplicación web**.'),
    H2('Requisitos'),
    bullets(['Navegador actualizado: Chrome, Edge o Firefox.', 'Conexión con el servidor de GoTrain.', 'Pantalla de 1280 px o más recomendada. También funciona en celular.']),
    H2('Cuenta de prueba'),
    tabla(['Usuario', 'Contraseña'], [['santiago@gotrain.com', 'gotrain123']], [1, 1]),
    H1('2. Página de inicio (landing)'),
    P('Al entrar a la web se ve la presentación de GoTrain con sus funciones. Desde arriba a la derecha se puede **Empezar gratis** (registro) o **Iniciar sesión**.'),
    ...img(C('web_01_landing'), 560, 'Landing page'),
    H1('3. Registro e inicio de sesión'),
    H2('3.1 Crear una cuenta'),
    ...pasos(['Hacé clic en **Empezar gratis** o en **Registrate gratis**.', 'Completá nombre, apellido (opcional), email y contraseña (mínimo 6 caracteres) y elegí tu nivel.', 'Presioná **Crear cuenta →**. Entrás directo a tu panel.']),
    ...img(C('web_02_registro'), 460, 'Formulario de registro'),
    H2('3.2 Iniciar sesión'),
    P('Ingresá tu email y contraseña y presioná **Iniciar Sesión →**. Los campos se validan en tiempo real: si falta un dato o el email no es válido, se marca en rojo.'),
    ...img(C('web_03_login_validacion'), 460, 'Validación de campos'),
    P('Si la contraseña es incorrecta, aparece el aviso "Email o contraseña incorrectos". También podés usar el botón **Entrar con la cuenta demo**.'),
    ...img(C('web_04_login_error'), 460, 'Error de credenciales'),
    H1('4. Panel de inicio'),
    P('Muestra tus **entrenamientos totales**, la **racha** de días seguidos, seguidores y tu **nivel con XP**. Abajo vas a ver el historial reciente, los logros desbloqueados, la última sugerencia del Coach y tu próximo desafío.'),
    ...img(C('web_05_inicio'), 600, 'Panel de inicio'),
    H2('Menú y buscador'),
    P('El menú lateral lleva a Inicio, Entrenar, Retos, Coach IA, Perfil y Configuración. En la barra superior podés **buscar** entrenamientos y usuarios escribiendo al menos 2 letras. La campana 🔔 abre la actividad de la comunidad.'),
    ...img(C('web_06_busqueda'), 520, 'Buscador'),
    H1('5. Entrenar'),
    P('Muestra el entrenamiento de hoy: ejercicios, series totales, duración y volumen estimados (series × repeticiones × kg).'),
    ...img(C('web_07_entrenar'), 600, 'Entrenamiento del día'),
    H2('5.1 Agregar un ejercicio'),
    ...pasos(['Presioná **+ Agregar ejercicio**.', 'Escribí el nombre, elegí el grupo muscular y completá series, repeticiones y kg (dejá kg vacío para peso corporal).', 'Presioná **Agregar**. Para quitarlo, usá la ✕ de la derecha.']),
    ...img(C('web_08_agregar_ejercicio'), 560, 'Formulario de ejercicio'),
    H2('5.2 Hacer el entrenamiento'),
    P('Presioná **▶ Iniciar Entrenamiento**: arranca el cronómetro. Al terminar, presioná **✓ Finalizar y guardar entrenamiento**. Se guarda en tu historial, sumás **50 XP**, avanza tu racha y el progreso de tus retos, y se publica en Actividad. Si desbloqueás un logro, te avisa.'),
    ...img(C('web_10_entrenamiento_en_curso'), 560, 'Entrenamiento en curso'),
    ...img(C('web_11_entrenamiento_guardado'), 560, 'Entrenamiento guardado'),
    H2('5.3 Registrar running'),
    P('En el panel **Registrar running** presioná **+ Nueva salida**, cargá distancia (km) y duración (min) y presioná **Guardar**. Los km se suman a los retos de distancia.'),
    ...img(C('web_12_running'), 560, 'Registrar una salida'),
    H2('5.4 Rutinas guardadas'),
    P('En **Rutinas guardadas** presioná **Usar →** para cargar una rutina como entrenamiento de hoy. Las rutinas que importás del Coach aparecen acá.'),
    H1('6. Retos'),
    P('Los retos tienen cuatro pestañas: **Activos** (en los que participás), **Grupales** (disponibles), **🔥 Actividad** (feed de la comunidad) y **Completados**.'),
    ...img(C('web_14_retos_activos'), 560, 'Retos activos'),
    P('**Ver ranking** muestra las 5 primeras posiciones. Tu fila aparece resaltada.'),
    ...img(C('web_15_retos_ranking'), 560, 'Ranking de un reto'),
    P('En **Grupales** presioná **Unirme** para sumarte. Para salir, presioná **Unido ✓**.'),
    ...img(C('web_17_reto_unirse'), 560, 'Unirse a un reto'),
    P('En **Actividad** ves los logros y novedades de otros atletas. Con **❤️ Felicitar** les das un like; presionando otra vez lo quitás.'),
    ...img(C('web_19_actividad_like'), 560, 'Actividad de la comunidad'),
    ...img(C('web_20_retos_completados'), 560, 'Retos completados'),
    H1('7. Coach IA'),
    P('El Coach es un entrenador virtual con inteligencia artificial (Claude). Conoce tu nivel y tus últimos entrenamientos. Escribile qué querés entrenar y cuánto tiempo tenés, o elegí una sugerencia.'),
    ...img(C('web_21_coach'), 560, 'Chat con el Coach'),
    P('Si te propone una rutina, aparece en una tarjeta con ejercicios, series, repeticiones y peso. Presioná **Importar al log de hoy** para pasarla a Entrenar. También queda en Rutinas guardadas.'),
    ...img(C('web_22_coach_rutina'), 560, 'Rutina propuesta'),
    ...img(C('web_23_coach_importada'), 560, 'Rutina importada'),
    P('Arriba a la derecha del chat se indica el modo: **⚡ Claude API** (IA conectada) o **Modo demo** (respuestas generadas por reglas cuando el servidor no tiene la IA configurada).'),
    H1('8. Perfil y configuración'),
    P('**Perfil** muestra tus datos, estadísticas, nivel y progreso de XP, todos los logros (los bloqueados en gris) y el historial.'),
    ...img(C('web_25_perfil'), 560, 'Perfil'),
    P('En **Configuración** (o **✏️ Editar perfil**) podés cambiar nombre, apellido, ciudad, bio y nivel. Presioná **Guardar cambios**.'),
    ...img(C('web_26_configuracion'), 520, 'Configuración'),
    H1('9. Cerrar sesión'),
    P('Presioná **← Cerrar sesión** abajo del menú lateral.'),
    H1('10. Preguntas frecuentes'),
    tabla(['Problema', 'Solución'], [
      ['"No se pudo conectar con el servidor"', 'El backend no está corriendo o no hay conexión. Volvé a intentar en unos segundos.'],
      ['"Sesión vencida"', 'Pasaron más de 7 días. Iniciá sesión de nuevo.'],
      ['No puedo iniciar el entrenamiento', 'Agregá al menos un ejercicio.'],
      ['El Coach dice "Modo demo"', 'El servidor no tiene configurada la clave de la Claude API; igual arma rutinas según tu historial.'],
    ], [2, 4]),
  ]
  await generar('GoTrain_Manual_de_Usuario_Web', 'Manual de Usuario — Web', 'Aplicación web GoTrain', cuerpo)
}

async function manualApp() {
  const cuerpo = [
    H1('1. Introducción'),
    P('Este manual explica cómo instalar y usar la **app GoTrain para Android**. La app usa la misma cuenta y los mismos datos que la versión web.'),
    H2('Requisitos'),
    bullets(['Celular Android 7.0 o superior (procesador de 64 bits, arm64).', 'Conexión a internet.', 'Unos 80 MB libres.']),
    H1('2. Instalación del APK'),
    ...pasos([
      'Descargá el archivo **GoTrain.apk** desde el enlace de la entrega (sección Releases del repositorio).',
      'Abrí el archivo descargado. Si Android lo pide, permití **Instalar apps de origen desconocido** para el navegador o el administrador de archivos.',
      'Presioná **Instalar** y después **Abrir**.',
    ]),
    P('**Servidor:** la app se conecta al backend de GoTrain que corre en una PC de la misma red WiFi. La primera vez, tocá **Servidor: … · ⚙️ cambiar** en la pantalla de login y escribí la IP de la PC (por ejemplo 192.168.1.9). Después tocá **Guardar servidor**; la app la recuerda para las próximas veces.'),
    H1('3. Inicio de sesión y registro'),
    P('Ingresá email y contraseña y tocá **Iniciar Sesión →**, o usá **Entrar con la cuenta demo**. Si falta un dato, se marca el campo con el error. Para crear una cuenta tocá **Registrate gratis**.'),
    imgPar(C('app_01_login'), C('app_02_login_validacion'), 'Login', 'Validación de campos'),
    tabla(['Usuario de prueba', 'Contraseña'], [['santiago@gotrain.com', 'gotrain123']], [1, 1]),
    H1('4. Navegación'),
    P('Abajo de la pantalla hay cuatro pestañas: **🏆 Retos**, **💪 Entrenar**, **🤖 Coach** y **👤 Perfil**. Tu avatar arriba a la derecha también lleva al perfil.'),
    H1('5. Retos'),
    P('Arriba elegís **Activos**, **Grupales**, **🔥 Actividad** o **Completados**. Cada reto muestra el progreso con una barra. Tocá **Ranking** para ver las primeras posiciones y **Unirme** para sumarte. Deslizá hacia abajo para actualizar.'),
    imgPar(C('app_04_retos_activos'), C('app_05_retos_ranking'), 'Retos activos', 'Ranking'),
    imgPar(C('app_06_retos_grupales'), C('app_07_actividad'), 'Retos grupales', 'Actividad: tocá ❤️ para felicitar'),
    H1('6. Entrenar'),
    P('Muestra el entrenamiento de hoy con ejercicios, series, duración y volumen. Tocá **+ Agregar ejercicio**, escribí el nombre, elegí el grupo muscular y completá series, repeticiones y kg. Con la ✕ quitás un ejercicio.'),
    imgPar(C('app_09_entrenar'), C('app_10_agregar_ejercicio'), 'Entrenamiento del día', 'Agregar ejercicio'),
    P('Tocá **▶ Iniciar Entrenamiento** para arrancar el cronómetro y **✓ Finalizar y guardar** al terminar. Sumás 50 XP, avanza tu racha y tus retos.'),
    imgPar(C('app_11_entrenamiento_en_curso'), C('app_12_entrenamiento_guardado'), 'Entrenamiento en curso', 'Entrenamiento guardado'),
    P('Más abajo están las **Rutinas guardadas** (tocá una para cargarla) y **Running → Registrar una salida** para cargar km y minutos.'),
    H1('7. Coach IA'),
    P('Escribí qué querés entrenar o tocá una sugerencia. El Coach responde según tu historial y, si corresponde, propone una rutina. Tocá **Importar al log de hoy** para pasarla a Entrenar.'),
    imgPar(C('app_14_coach_rutina'), C('app_15_coach_importada'), 'Rutina propuesta', 'Rutina importada'),
    H1('8. Perfil'),
    P('Muestra tus estadísticas, nivel, XP, logros (los bloqueados en gris) e historial. Con **✏️ Editar perfil** cambiás nombre, apellido y bio. Al final está **← Cerrar sesión**.'),
    imgPar(C('app_16_perfil'), C('app_17_editar_perfil'), 'Perfil', 'Editar perfil'),
    H1('9. Preguntas frecuentes'),
    tabla(['Problema', 'Solución'], [
      ['"No se pudo conectar con el servidor"', 'Verificá que el backend esté corriendo, que el celular esté en la misma WiFi, que la IP sea la de la PC y que el firewall de Windows permita el puerto 5000.'],
      ['Android no deja instalar el APK', 'Habilitá "Instalar apps desconocidas" para la app desde la que abrís el archivo.'],
      ['"Sesión vencida"', 'Iniciá sesión de nuevo.'],
      ['El Coach dice "Demo"', 'El servidor no tiene configurada la IA; igual arma rutinas según tu historial.'],
    ], [2, 4]),
  ]
  await generar('GoTrain_Manual_de_Usuario_APK', 'Manual de Usuario — App Mobile (APK)', 'App GoTrain para Android', cuerpo)
}

;(async () => {
  fs.mkdirSync(path.resolve(__dirname, '../documentos'), { recursive: true })
  const solo = process.argv.slice(2)
  const todos = { casosDeUso, casosDePrueba, requisitosFuncionales, requisitosNoFuncionales, uml, der, arquitectura, componentes, gantt, manualWeb, manualApp }
  for (const [k, fn] of Object.entries(todos)) if (!solo.length || solo.includes(k)) await fn()
})().catch((e) => { console.error(e); process.exit(1) })
