# GoTrain — Seminario Final · Parcial 2

Implementación en código de los prototipos del Parcial 1 (`GoTrain_Web_Prototipo.html` y `GoTrain_Prototipo.html`).

| Parte | Tecnología | Carpeta |
|---|---|---|
| Backend / API REST | Python + Flask + SQLAlchemy | `backend/` |
| Base de datos | PostgreSQL 17 (bases `gotrain` y `gotrain_test`) | `backend/models.py` |
| Coach IA | Claude API (Anthropic) — modo demo sin API key | `backend/coach.py` |
| Página web | React + Vite | `web/` |
| App mobile | React Native + Expo | `mobile/` |

Web y mobile consumen **la misma API**, así que lo que hacés en una se ve en la otra.

## Historias de usuario implementadas

- **HU-01 Registro e inicio de sesión**: email/contraseña con validación en tiempo real, tokens JWT, cuenta demo.
- **HU-02 Registro de entrenamiento**: ejercicios con series/reps/peso, cronómetro de sesión, rutinas guardadas, running.
- **HU-03 Perfil**: datos, estadísticas, edición de perfil, historial.
- **HU-04 Actividad social de retos**: feed con likes ("Felicitar").
- **HU-06 Coach virtual IA**: chat que arma rutinas según tu historial y las importa al log de hoy.
- **HU-07 Gamificación**: XP, niveles, racha de días y logros que se desbloquean solos.
- **HU-08 Retos individuales y grupales**: unirse/salir, progreso automático al entrenar y ranking.

## Material de la entrega (carpeta `entrega/`)

| Material | Archivo |
|---|---|
| Manual de usuario APK | [Word](entrega/documentos/GoTrain_Manual_de_Usuario_APK.docx) · [PDF](entrega/documentos/pdf/GoTrain_Manual_de_Usuario_APK.pdf) |
| Manual de usuario Web | [Word](entrega/documentos/GoTrain_Manual_de_Usuario_Web.docx) · [PDF](entrega/documentos/pdf/GoTrain_Manual_de_Usuario_Web.pdf) |
| Casos de uso | [Word](entrega/documentos/GoTrain_Casos_de_Uso.docx) · [PDF](entrega/documentos/pdf/GoTrain_Casos_de_Uso.pdf) |
| Casos de prueba | [Word](entrega/documentos/GoTrain_Casos_de_Prueba.docx) · [PDF](entrega/documentos/pdf/GoTrain_Casos_de_Prueba.pdf) |
| UML | [Word](entrega/documentos/GoTrain_UML.docx) · [PDF](entrega/documentos/pdf/GoTrain_UML.pdf) |
| Requisitos funcionales | [Word](entrega/documentos/GoTrain_Requisitos_Funcionales.docx) · [PDF](entrega/documentos/pdf/GoTrain_Requisitos_Funcionales.pdf) |
| Requisitos no funcionales | [Word](entrega/documentos/GoTrain_Requisitos_No_Funcionales.docx) · [PDF](entrega/documentos/pdf/GoTrain_Requisitos_No_Funcionales.pdf) |
| DER | [Word](entrega/documentos/GoTrain_DER.docx) · [PDF](entrega/documentos/pdf/GoTrain_DER.pdf) |
| Diseño de arquitectura | [Word](entrega/documentos/GoTrain_Diseno_de_Arquitectura.docx) · [PDF](entrega/documentos/pdf/GoTrain_Diseno_de_Arquitectura.pdf) |
| Diagrama de componentes | [Word](entrega/documentos/GoTrain_Diagrama_de_Componentes.docx) · [PDF](entrega/documentos/pdf/GoTrain_Diagrama_de_Componentes.pdf) |
| Gantt | [Word](entrega/documentos/GoTrain_Gantt.docx) · [PDF](entrega/documentos/pdf/GoTrain_Gantt.pdf) |
| Video demo APK | [MP4](entrega/videos/GoTrain_Demo_App.mp4) |
| Video demo Web | [MP4](entrega/videos/GoTrain_Demo_Web.mp4) |
| APK para instalar | [GoTrain.apk](entrega/apk/GoTrain.apk) |

Pruebas automatizadas de la API (32 casos): `cd backend` y `.venv\Scripts\python -m unittest discover -s tests -v`.

## Cómo correrlo

Necesitás tres terminales (o hacé doble clic en los `.bat`).

### 1. Backend (primero siempre)

Necesitás **PostgreSQL 17**. Copiá `backend/.env.example` como `backend/.env` y completá `DB_USER`, `DB_PASSWORD` y `DB_PORT` de tu servidor PostgreSQL.

```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python crear_base.py
.venv\Scripts\python seed.py
.venv\Scripts\python app.py
```

- `crear_base.py` crea las bases `gotrain` (la app) y `gotrain_test` (las pruebas) si no existen.
- `seed.py` carga las tablas con datos de ejemplo. Volvé a correrlo cuando quieras resetear la demo.
- La API queda en `http://localhost:5000`.
- **Cuenta demo:** `santiago@gotrain.com` / `gotrain123`

**Coach con Claude real (opcional):** completá `ANTHROPIC_API_KEY` en el `.env`. Sin la key, el coach responde en "modo demo" (rutinas armadas por reglas a partir de tu historial). En el chat se ve qué modo está activo.


### 2. Página web

```bash
cd web
npm install
npm run dev
```

Abrí `http://localhost:5173`.

### 3. App mobile

```bash
cd mobile
npm install
npx expo start
```

- **En tu celular:** instalá **Expo Go**, conectate a la misma red WiFi que la PC y escaneá el QR. La app detecta sola la IP de la PC. Si no conecta, poné la IP a mano en `mobile/src/api.js` (`IP_MANUAL`) y revisá que el firewall de Windows deje pasar el puerto 5000.
- **En la PC:** apretá `w` en la terminal de Expo para abrirla en el navegador.
- **Emulador Android:** apretá `a`.
