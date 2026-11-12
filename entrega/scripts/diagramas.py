"""Genera los diagramas (PNG) con Mermaid, renderizados en Chromium headless."""
from playwright.sync_api import sync_playwright
from comun import ENTREGA

OUT = ENTREGA / "diagramas"

DIAGRAMAS = {
"casos_de_uso": """
flowchart LR
  V((👤 Visitante))
  U((🏋️ Usuario<br/>registrado))
  IA[[🤖 Claude API<br/>sistema externo]]
  subgraph S[Sistema GoTrain]
    direction TB
    CU01([CU-01 Registrarse])
    CU02([CU-02 Iniciar sesión])
    CU03([CU-03 Gestionar perfil])
    CU04([CU-04 Registrar entrenamiento])
    CU05([CU-05 Registrar running])
    CU06([CU-06 Usar rutina guardada])
    CU07([CU-07 Unirse / salir de reto])
    CU08([CU-08 Ver ranking de reto])
    CU09([CU-09 Ver actividad y felicitar])
    CU10([CU-10 Consultar al Coach IA])
    CU11([CU-11 Importar rutina del Coach])
    CU12([CU-12 Ver logros y nivel])
    CU13([CU-13 Buscar entrenamientos y usuarios])
  end
  V --> CU01
  V --> CU02
  U --> CU03 & CU04 & CU05 & CU06 & CU07 & CU08 & CU09 & CU10 & CU12 & CU13
  CU10 -. include .-> IA
  CU11 -. extend .-> CU10
  CU04 -. include: actualiza retos y logros .-> CU12
""",
"uml_clases": """
classDiagram
  direction LR
  class Usuario {
    +int id
    +str nombre
    +str apellido
    +str email
    -str password_hash
    +str bio
    +str ciudad
    +str nivel_atleta
    +int xp
    +int seguidores
    +int siguiendo
    +nivel() int
    +iniciales() str
    +set_password(pw)
    +check_password(pw) bool
  }
  class Entrenamiento {
    +int id
    +str nombre
    +str tipo
    +date fecha
    +str estado
    +int duracion_min
    +float distancia_km
    +datetime iniciado
    +volumen_kg() int
    +total_series() int
  }
  class Ejercicio {
    +int id
    +str nombre
    +str grupo
    +int series
    +int reps
    +float peso_kg
    +str icono
    +int orden
  }
  class Rutina {
    +int id
    +str nombre
    +str descripcion
    +JSON ejercicios
  }
  class Reto {
    +int id
    +str titulo
    +str tipo
    +str metrica
    +float meta
    +str unidad
    +date fecha_inicio
    +date fecha_fin
  }
  class ParticipacionReto {
    +float progreso
    +bool completado
    +datetime unido
  }
  class Actividad {
    +int id
    +str texto
    +str icono
    +int likes
    +datetime fecha
  }
  class LikeActividad
  class Logro {
    +str codigo
    +str icono
    +str label
    +datetime fecha
  }
  class MensajeCoach {
    +int id
    +str rol
    +str contenido
    +JSON rutina
    +bool importada
    +datetime fecha
  }
  class CoachIA {
    <<servicio>>
    +responder(usuario, historial, conversacion, texto)
    -responder_claude()
    -responder_demo()
  }
  Usuario "1" --> "0..*" Entrenamiento : registra
  Entrenamiento "1" *-- "0..*" Ejercicio : contiene
  Usuario "1" --> "0..*" Rutina : guarda
  Usuario "1" --> "0..*" ParticipacionReto
  Reto "1" *-- "0..*" ParticipacionReto
  Usuario "1" --> "0..*" Actividad : publica
  Actividad "1" *-- "0..*" LikeActividad
  Usuario "1" --> "0..*" LikeActividad : da
  Usuario "1" --> "0..*" Logro : desbloquea
  Usuario "1" --> "0..*" MensajeCoach : conversa
  CoachIA ..> MensajeCoach : genera
  CoachIA ..> Entrenamiento : lee historial
""",
"der": """
erDiagram
  usuarios ||--o{ entrenamientos : registra
  entrenamientos ||--o{ ejercicios : contiene
  usuarios ||--o{ rutinas : guarda
  usuarios ||--o{ retos_participantes : participa
  retos ||--o{ retos_participantes : tiene
  usuarios ||--o{ actividad : publica
  actividad ||--o{ actividad_likes : recibe
  usuarios ||--o{ actividad_likes : da
  usuarios ||--o{ logros : desbloquea
  usuarios ||--o{ coach_mensajes : conversa
  usuarios {
    int id PK
    varchar nombre
    varchar apellido
    varchar email UK
    varchar password_hash
    varchar bio
    varchar ciudad
    varchar nivel_atleta
    int xp
    int seguidores
    int siguiendo
    datetime creado
  }
  entrenamientos {
    int id PK
    int user_id FK
    varchar nombre
    varchar tipo
    date fecha
    varchar estado
    int duracion_min
    float distancia_km
    datetime iniciado
  }
  ejercicios {
    int id PK
    int workout_id FK
    varchar nombre
    varchar grupo
    int series
    int reps
    float peso_kg
    varchar icono
    int orden
  }
  rutinas {
    int id PK
    int user_id FK
    varchar nombre
    varchar descripcion
    json ejercicios
  }
  retos {
    int id PK
    varchar titulo
    varchar descripcion
    varchar tipo
    varchar icono
    varchar metrica
    float meta
    varchar unidad
    date fecha_inicio
    date fecha_fin
  }
  retos_participantes {
    int id PK
    int challenge_id FK
    int user_id FK
    float progreso
    boolean completado
    datetime unido
  }
  actividad {
    int id PK
    int user_id FK
    varchar texto
    varchar icono
    int likes
    datetime fecha
  }
  actividad_likes {
    int id PK
    int activity_id FK
    int user_id FK
  }
  logros {
    int id PK
    int user_id FK
    varchar codigo
    varchar icono
    varchar label
    datetime fecha
  }
  coach_mensajes {
    int id PK
    int user_id FK
    varchar rol
    text contenido
    json rutina
    boolean importada
    datetime fecha
  }
""",
"arquitectura": """
flowchart TB
  subgraph C[Capa de presentación]
    W[🖥️ Aplicación Web<br/>React 18 + Vite<br/>React Router]
    M[📱 App Mobile Android<br/>React Native + Expo<br/>APK]
  end
  subgraph A[Capa de aplicación]
    API[🔌 API REST Flask 3<br/>JSON sobre HTTP<br/>Autenticación JWT]
    N[⚙️ Lógica de negocio<br/>Entrenamientos · Retos · Gamificación · Actividad]
    CO[🤖 Servicio Coach IA<br/>coach.py]
    ORM[🗂️ SQLAlchemy ORM<br/>models.py]
  end
  subgraph D[Capa de datos]
    DB[(🐘 PostgreSQL<br/>SQLite en desarrollo)]
  end
  EXT[☁️ Claude API<br/>Anthropic]
  W -- HTTP/JSON + Bearer token --> API
  M -- HTTP/JSON + Bearer token --> API
  API --> N
  N --> ORM
  N --> CO
  CO -- HTTPS · salida estructurada JSON --> EXT
  ORM --> DB
""",
"secuencia_coach": """
sequenceDiagram
  actor U as Usuario
  participant C as Cliente (Web / App)
  participant A as API Flask
  participant DB as Base de datos
  participant IA as Claude API
  U->>C: Escribe "quiero pecho y tríceps"
  C->>A: POST /api/coach/messages (JWT)
  A->>DB: Lee historial y conversación
  A->>IA: messages.create (contexto + esquema JSON)
  alt Claude disponible
    IA-->>A: {mensaje, rutina}
  else Sin API key o error
    A->>A: Coach modo demo (reglas)
  end
  A->>DB: Guarda mensajes
  A-->>C: Respuesta + rutina
  U->>C: "Importar al log de hoy"
  C->>A: POST /api/coach/messages/{id}/import
  A->>DB: Carga ejercicios en el entrenamiento planificado
  A-->>C: Entrenamiento de hoy actualizado
""",
"componentes": """
flowchart TB
  subgraph WEB[«componente» App Web]
    direction TB
    WR[App.jsx<br/>Router + AuthContext]
    WP[Páginas<br/>Landing · Auth · Inicio · Entrenar<br/>Retos · Coach · Perfil · Configuración]
    WA[api.js<br/>Cliente HTTP]
    WR --> WP --> WA
  end
  subgraph MOB[«componente» App Mobile]
    direction TB
    MR[App.js<br/>Navegación por pestañas]
    MS[Screens<br/>Login · Retos · Entrenar · Coach · Perfil]
    MA[api.js<br/>Cliente HTTP + AsyncStorage]
    MR --> MS --> MA
  end
  subgraph BE[«componente» GoTrain API]
    direction TB
    AU[Auth<br/>/api/auth/*]
    EN[Entrenamientos<br/>/api/workouts · /exercises · /routines]
    RE[Retos y Actividad<br/>/api/challenges · /activity]
    PE[Perfil y Dashboard<br/>/api/me · /profile · /dashboard · /search]
    CC[Coach IA<br/>/api/coach/*]
    GA[Gamificación<br/>XP · racha · logros]
    MO[Modelos ORM]
    EN --> GA
    EN --> RE
    AU & EN & RE & PE & CC --> MO
  end
  IAPI([«interfaz» REST /api])
  DBC[(«componente» Base de datos)]
  CL([«externo» Claude API])
  WA -- usa --> IAPI
  MA -- usa --> IAPI
  IAPI --- AU & EN & RE & PE & CC
  MO --> DBC
  CC --> CL
""",
"gantt": """
gantt
  title GoTrain — Planificación del proyecto (Seminario Final 2026)
  dateFormat YYYY-MM-DD
  axisFormat %d/%m
  section 1. Análisis
  Relevamiento y propuesta          :done, a1, 2026-08-03, 10d
  Requisitos funcionales y no func. :done, a2, after a1, 7d
  Historias de usuario              :done, a3, after a1, 7d
  Casos de uso                      :done, a4, after a2, 7d
  section 2. Diseño
  UML de clases y DER               :done, d1, 2026-08-31, 7d
  Arquitectura y componentes        :done, d2, after d1, 5d
  Prototipo web y mobile            :done, d3, 2026-09-07, 14d
  Entrega Parcial 1                 :milestone, done, m1, 2026-09-24, 0d
  section 3. Modelo de negocio
  Trabajo de campo y encuestas      :done, n1, 2026-10-01, 14d
  Modelo de negocio y defensa       :done, n2, after n1, 12d
  section 4. Desarrollo
  Backend API Flask + BD            :done, c1, 2026-10-27, 8d
  Coach IA (Claude API)             :done, c2, after c1, 3d
  Aplicación web React              :done, c3, 2026-11-02, 8d
  App mobile React Native           :done, c4, 2026-11-05, 7d
  section 5. Pruebas y entrega
  Casos de prueba y testing         :active, t1, 2026-11-09, 5d
  Manuales de usuario y videos      :active, t2, 2026-11-10, 4d
  Compilación APK y publicación     :t3, 2026-11-11, 3d
  Entrega final                     :milestone, m2, 2026-11-16, 0d
""",
}

HTML = """<!doctype html><html><head><meta charset="utf-8">
<style>body{margin:0;background:#fff;font-family:'Segoe UI',Arial} #d{display:inline-block;padding:24px} #d svg{max-width:none !important}</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script></head>
<body><div id="d"><pre class="mermaid">%s</pre></div>
<script>mermaid.initialize({startOnLoad:false, theme:'base', fontFamily:'Segoe UI, Arial',
 themeVariables:{primaryColor:'#fde8ec', primaryBorderColor:'#e94560', primaryTextColor:'#1a1a2e', lineColor:'#555',
  secondaryColor:'#eef0fb', tertiaryColor:'#f7f7fb', fontSize:'15px', doneTaskBkgColor:'#f4a3b1', doneTaskBorderColor:'#c0392b', activeTaskBkgColor:'#ffd6dd', activeTaskBorderColor:'#e94560', taskBkgColor:'#cfd4f5', taskBorderColor:'#4a55a2', critBkgColor:'#e94560', sectionBkgColor:'#fbeef1', altSectionBkgColor:'#ffffff', gridColor:'#ddd', todayLineColor:'#e94560', taskTextColor:'#1a1a2e', taskTextDarkColor:'#1a1a2e', taskTextOutsideColor:'#1a1a2e'},
 gantt:{barHeight:28, barGap:6, fontSize:15, sectionFontSize:16, leftPadding:200, rightPadding:40, useWidth:1300, topPadding:60, useMaxWidth:false},
 er:{fontSize:14, useMaxWidth:false}, flowchart:{htmlLabels:true, curve:'basis', useMaxWidth:false}, class:{useMaxWidth:false}, sequence:{useMaxWidth:false}});
mermaid.run().then(()=>{document.querySelectorAll('#d svg').forEach(s=>{const v=s.viewBox.baseVal; if(s.getAttribute('width')==='100%%'){s.setAttribute('width',v.width); s.setAttribute('height',v.height);}}); document.body.dataset.ok=1}).catch(e=>{document.body.dataset.err=e.message});</script></body></html>"""

if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        p = b.new_page(viewport={"width": 1600, "height": 1000}, device_scale_factor=2)
        for nombre, codigo in DIAGRAMAS.items():
            p.set_content(HTML % codigo.replace("<", "&lt;").replace(">", "&gt;"))
            p.wait_for_function("document.body.dataset.ok || document.body.dataset.err", timeout=30000)
            err = p.evaluate("document.body.dataset.err")
            if err:
                print("ERROR", nombre, err); continue
            p.locator("#d").screenshot(path=str(OUT / f"{nombre}.png"))
            print("ok", nombre)
        b.close()
