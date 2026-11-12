# GoTrain — Seminario Final · Parcial 2

Implementación en código de los prototipos del Parcial 1 (`GoTrain_Web_Prototipo.html` y `GoTrain_Prototipo.html`).

| Parte | Tecnología | Carpeta |
|---|---|---|
| Backend / API REST | Python + Flask + SQLAlchemy | `backend/` |
| Base de datos | SQLite (por defecto) o PostgreSQL | `backend/gotrain.db` |
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

## Cómo correrlo

Necesitás tres terminales (o hacé doble clic en los `.bat`).

### 1. Backend (primero siempre)

```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python seed.py
.venv\Scripts\python app.py
```

- `seed.py` crea la base con datos de ejemplo. Volvé a correrlo cuando quieras resetear la demo.
- La API queda en `http://localhost:5000`.
- **Cuenta demo:** `santiago@gotrain.com` / `gotrain123`

**Coach con Claude real (opcional):** copiá `.env.example` como `.env` y completá `ANTHROPIC_API_KEY`. Sin la key, el coach responde en "modo demo" (rutinas armadas por reglas a partir de tu historial). En el chat se ve qué modo está activo.

**PostgreSQL (opcional):** creá la base `gotrain` y en `.env` poné
`DATABASE_URL=postgresql+psycopg://postgres:TU_PASSWORD@localhost:5432/gotrain`, después corré `seed.py`.

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
