"""API REST de GoTrain (Flask). La consumen la página web (React) y la app mobile (React Native)."""
import os
from datetime import date, datetime, timedelta
from functools import wraps

import jwt
from dotenv import load_dotenv
from flask import Flask, jsonify, request, g
from flask_cors import CORS

load_dotenv()

from models import (db, User, Workout, Exercise, SavedRoutine, Challenge, ChallengeParticipant,  # noqa: E402
                    Activity, ActivityLike, Badge, CoachMessage)
import coach  # noqa: E402

app = Flask(__name__)


def url_base_de_datos():
    """PostgreSQL. Usa DATABASE_URL si está definida; si no, la arma con DB_USER, DB_PASSWORD, etc. del .env."""
    if os.getenv("DATABASE_URL"):
        return os.environ["DATABASE_URL"]
    from urllib.parse import quote_plus
    usuario = quote_plus(os.getenv("DB_USER", "postgres"))
    clave = quote_plus(os.getenv("DB_PASSWORD", ""))
    return (f"postgresql+psycopg://{usuario}:{clave}@{os.getenv('DB_HOST', 'localhost')}:"
            f"{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'gotrain')}")


_db_url = url_base_de_datos()
if _db_url.startswith(("postgres://", "postgresql://")):  # formato que dan Render / Heroku
    _db_url = "postgresql+psycopg://" + _db_url.split("://", 1)[1]
app.config["SQLALCHEMY_DATABASE_URI"] = _db_url
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "gotrain-dev-secret")
app.json.ensure_ascii = False
CORS(app)
db.init_app(app)

XP_POR_ENTRENO = 50

BADGES = [
    ("racha_7", "🔥", "Racha 7 días"),
    ("racha_21", "🔥", "Racha 21 días"),
    ("entrenos_10", "🎯", "10 entrenos"),
    ("entrenos_50", "💯", "50 entrenos"),
    ("entrenos_100", "🏅", "100 entrenos"),
    ("primer_reto", "🏆", "1er Reto"),
    ("nivel_5", "⚡", "Nivel 5"),
    ("nivel_10", "🥇", "Nivel 10"),
]


# ------------------------------------------------------------------ helpers
def error(msg, code=400):
    return jsonify({"error": msg}), code


def crear_token(user):
    payload = {"sub": str(user.id), "exp": datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")


def login_requerido(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return error("No autenticado", 401)
        try:
            data = jwt.decode(auth[7:], app.config["SECRET_KEY"], algorithms=["HS256"])
        except jwt.PyJWTError:
            return error("Sesión vencida, iniciá sesión de nuevo", 401)
        g.user = db.session.get(User, int(data["sub"]))
        if not g.user:
            return error("Usuario inexistente", 401)
        return f(*args, **kwargs)
    return wrapper


def completados(user):
    return (Workout.query.filter_by(user_id=user.id, estado="completado")
            .order_by(Workout.fecha.desc(), Workout.id.desc()))


def calcular_racha(user):
    """Días consecutivos con al menos un entrenamiento, terminando hoy o ayer."""
    fechas = {w.fecha for w in completados(user)}
    dia = date.today()
    if dia not in fechas:
        dia -= timedelta(days=1)
    racha = 0
    while dia in fechas:
        racha += 1
        dia -= timedelta(days=1)
    return racha


def estadisticas(user):
    total = completados(user).count()
    return {"entrenamientos": total, "racha": calcular_racha(user), "seguidores": user.seguidores,
            "siguiendo": user.siguiendo, "nivel": user.nivel, "xp": user.xp}


def otorgar_badges(user):
    s = estadisticas(user)
    tiene = {b.codigo for b in Badge.query.filter_by(user_id=user.id)}
    reto_ok = ChallengeParticipant.query.filter_by(user_id=user.id, completado=True).count() > 0
    reglas = {
        "racha_7": s["racha"] >= 7, "racha_21": s["racha"] >= 21,
        "entrenos_10": s["entrenamientos"] >= 10, "entrenos_50": s["entrenamientos"] >= 50,
        "entrenos_100": s["entrenamientos"] >= 100, "primer_reto": reto_ok,
        "nivel_5": user.nivel >= 5, "nivel_10": user.nivel >= 10,
    }
    nuevos = []
    for codigo, icono, label in BADGES:
        if reglas[codigo] and codigo not in tiene:
            db.session.add(Badge(user_id=user.id, codigo=codigo, icono=icono, label=label))
            nuevos.append(label)
    return nuevos


def lista_badges(user):
    tiene = {b.codigo for b in Badge.query.filter_by(user_id=user.id)}
    return [{"codigo": c, "icono": i, "label": l, "desbloqueado": c in tiene} for c, i, l in BADGES]


def challenge_dict(ch, user):
    part = next((p for p in ch.participantes if p.user_id == user.id), None)
    hoy = date.today()
    if ch.fecha_inicio > hoy:
        estado_txt = f"Empieza el {ch.fecha_inicio.strftime('%d/%m')}"
    else:
        dias = (ch.fecha_fin - hoy).days
        estado_txt = "Terminado" if dias < 0 else ("Termina hoy" if dias == 0 else f"Termina en {dias} días")
    ranking = sorted(ch.participantes, key=lambda p: -p.progreso)
    return {
        "id": ch.id, "titulo": ch.titulo, "descripcion": ch.descripcion, "tipo": ch.tipo,
        "icono": ch.icono, "metrica": ch.metrica, "meta": ch.meta, "unidad": ch.unidad,
        "participantes": len(ch.participantes), "estado_txt": estado_txt,
        "empezo": ch.fecha_inicio <= hoy, "unido": part is not None,
        "progreso": round(part.progreso, 1) if part else 0,
        "completado": bool(part and part.completado),
        "porcentaje": min(100, round(100 * (part.progreso if part else 0) / ch.meta)),
        "ranking": [{"nombre": f"{p.user.nombre} {p.user.apellido[:1]}.", "progreso": round(p.progreso, 1),
                     "yo": p.user_id == user.id} for p in ranking[:5]],
    }


def actualizar_retos(user, workout):
    hoy = date.today()
    racha = calcular_racha(user)
    for p in ChallengeParticipant.query.filter_by(user_id=user.id, completado=False):
        ch = p.challenge
        if not (ch.fecha_inicio <= hoy <= ch.fecha_fin):
            continue
        if ch.metrica == "km":
            p.progreso += workout.distancia_km or 0
        elif ch.metrica == "entrenos":
            p.progreso += 1
        elif ch.metrica == "volumen":
            p.progreso += workout.volumen_kg
        elif ch.metrica == "dias":
            p.progreso = racha
        if p.progreso >= ch.meta:
            p.completado = True
            db.session.add(Activity(user_id=user.id, icono="🏆",
                                    texto=f'completó el reto "{ch.titulo}" 🎉'))


def plan_de_hoy(user):
    w = Workout.query.filter_by(user_id=user.id, estado="planificado").order_by(Workout.id.desc()).first()
    if not w:
        w = Workout(user_id=user.id, nombre="Entrenamiento libre", fecha=date.today())
        db.session.add(w)
        db.session.commit()
    return w


def cargar_ejercicios(workout, nombre, ejercicios):
    workout.nombre = nombre
    workout.fecha = date.today()
    workout.iniciado = None
    for e in list(workout.ejercicios):
        db.session.delete(e)
    for i, e in enumerate(ejercicios):
        db.session.add(Exercise(workout=workout, orden=i, nombre=e["nombre"], grupo=e.get("grupo", ""),
                                series=int(e.get("series", 3)), reps=int(e.get("reps", 10)),
                                peso_kg=float(e.get("peso_kg", 0)), icono=e.get("icono", "🏋️")))


# --------------------------------------------------------------------- auth
@app.post("/api/auth/register")
def register():
    d = request.get_json() or {}
    nombre, email, pw = (d.get("nombre") or "").strip(), (d.get("email") or "").strip().lower(), d.get("password") or ""
    if not nombre or "@" not in email:
        return error("Completá nombre y un email válido")
    if len(pw) < 6:
        return error("La contraseña debe tener al menos 6 caracteres")
    if User.query.filter_by(email=email).first():
        return error("Ya existe una cuenta con ese email")
    u = User(nombre=nombre, apellido=(d.get("apellido") or "").strip(), email=email,
             nivel_atleta=d.get("nivel_atleta") or "principiante")
    u.set_password(pw)
    db.session.add(u)
    db.session.flush()
    db.session.add(CoachMessage(user_id=u.id, rol="coach", contenido=(
        f"¡Hola {nombre}! 💪 Soy tu Coach GoTrain AI. Contame qué querés entrenar hoy y cuánto tiempo "
        "tenés, y te armo una rutina a medida.")))
    db.session.commit()
    return jsonify({"token": crear_token(u), "user": u.to_dict()}), 201


@app.post("/api/auth/login")
def login():
    d = request.get_json() or {}
    u = User.query.filter_by(email=(d.get("email") or "").strip().lower()).first()
    if not u or not u.check_password(d.get("password") or ""):
        return error("Email o contraseña incorrectos", 401)
    return jsonify({"token": crear_token(u), "user": u.to_dict()})


# ------------------------------------------------------------ perfil / home
@app.get("/api/me")
@login_requerido
def me():
    return jsonify({**g.user.to_dict(), "stats": estadisticas(g.user)})


@app.put("/api/me")
@login_requerido
def editar_perfil():
    d = request.get_json() or {}
    for campo in ("nombre", "apellido", "bio", "ciudad", "nivel_atleta"):
        if campo in d and d[campo] is not None:
            setattr(g.user, campo, str(d[campo]).strip()[:200])
    if not g.user.nombre:
        return error("El nombre no puede quedar vacío")
    db.session.commit()
    return jsonify(g.user.to_dict())


@app.get("/api/profile")
@login_requerido
def perfil():
    u = g.user
    return jsonify({"user": u.to_dict(), "stats": estadisticas(u), "badges": lista_badges(u),
                    "historial": [w.to_dict() for w in completados(u).limit(10)]})


@app.get("/api/dashboard")
@login_requerido
def dashboard():
    u = g.user
    hoy = date.today()
    activos = [p.challenge for p in ChallengeParticipant.query.filter_by(user_id=u.id, completado=False)
               if p.challenge.fecha_inicio <= hoy <= p.challenge.fecha_fin]
    proximo = challenge_dict(sorted(activos, key=lambda c: c.fecha_fin)[0], u) if activos else None
    sugerencia = (CoachMessage.query.filter(CoachMessage.user_id == u.id, CoachMessage.rutina.isnot(None))
                  .order_by(CoachMessage.id.desc()).first())
    return jsonify({
        "user": u.to_dict(), "stats": estadisticas(u),
        "historial": [w.to_dict() for w in completados(u).limit(5)],
        "badges": [b for b in lista_badges(u) if b["desbloqueado"]],
        "proximo_reto": proximo,
        "sugerencia_coach": sugerencia.to_dict() if sugerencia else None,
    })


@app.get("/api/search")
@login_requerido
def buscar():
    q = (request.args.get("q") or "").strip()
    if len(q) < 2:
        return jsonify({"entrenamientos": [], "usuarios": []})
    like = f"%{q}%"
    ws = completados(g.user).filter(Workout.nombre.ilike(like)).limit(8)
    us = User.query.filter((User.nombre.ilike(like)) | (User.apellido.ilike(like))).limit(8)
    return jsonify({"entrenamientos": [w.to_dict() for w in ws],
                    "usuarios": [{"id": x.id, "nombre": f"{x.nombre} {x.apellido}", "iniciales": x.iniciales,
                                  "nivel": x.nivel} for x in us]})


# ------------------------------------------------------------ entrenamiento
@app.get("/api/workouts")
@login_requerido
def historial():
    return jsonify([w.to_dict() for w in completados(g.user).limit(50)])


@app.get("/api/workouts/today")
@login_requerido
def hoy():
    return jsonify(plan_de_hoy(g.user).to_dict())


@app.post("/api/workouts/<int:wid>/exercises")
@login_requerido
def agregar_ejercicio(wid):
    w = Workout.query.filter_by(id=wid, user_id=g.user.id, estado="planificado").first_or_404()
    d = request.get_json() or {}
    if not (d.get("nombre") or "").strip():
        return error("Indicá el nombre del ejercicio")
    try:
        e = Exercise(workout=w, orden=len(w.ejercicios), nombre=d["nombre"].strip(), grupo=d.get("grupo", ""),
                     series=max(1, int(d.get("series", 3))), reps=max(1, int(d.get("reps", 10))),
                     peso_kg=max(0.0, float(d.get("peso_kg") or 0)), icono=d.get("icono") or "🏋️")
    except (TypeError, ValueError):
        return error("Series, repeticiones y peso deben ser números")
    db.session.add(e)
    db.session.commit()
    return jsonify(w.to_dict()), 201


@app.put("/api/exercises/<int:eid>")
@login_requerido
def editar_ejercicio(eid):
    e = Exercise.query.join(Workout).filter(Exercise.id == eid, Workout.user_id == g.user.id).first_or_404()
    d = request.get_json() or {}
    try:
        for campo, conv in (("series", int), ("reps", int), ("peso_kg", float)):
            if campo in d:
                setattr(e, campo, max(0, conv(d[campo])))
    except (TypeError, ValueError):
        return error("Valores inválidos")
    db.session.commit()
    return jsonify(e.workout.to_dict())


@app.delete("/api/exercises/<int:eid>")
@login_requerido
def borrar_ejercicio(eid):
    e = Exercise.query.join(Workout).filter(Exercise.id == eid, Workout.user_id == g.user.id).first_or_404()
    w = e.workout
    db.session.delete(e)
    db.session.commit()
    return jsonify(w.to_dict())


@app.post("/api/workouts/<int:wid>/start")
@login_requerido
def iniciar(wid):
    w = Workout.query.filter_by(id=wid, user_id=g.user.id, estado="planificado").first_or_404()
    if not w.ejercicios:
        return error("Agregá al menos un ejercicio antes de empezar")
    w.iniciado = datetime.utcnow()
    db.session.commit()
    return jsonify(w.to_dict())


def _cerrar(w, user):
    w.estado = "completado"
    w.fecha = date.today()
    user.xp += XP_POR_ENTRENO
    db.session.flush()
    resumen = f"{w.distancia_km:g} km" if w.tipo == "running" else f"{w.volumen_kg:,} kg".replace(",", ".")
    db.session.add(Activity(user_id=user.id, icono="💪", texto=f'terminó "{w.nombre}" — {resumen}'))
    actualizar_retos(user, w)
    db.session.flush()
    return otorgar_badges(user)


@app.post("/api/workouts/<int:wid>/finish")
@login_requerido
def finalizar(wid):
    w = Workout.query.filter_by(id=wid, user_id=g.user.id, estado="planificado").first_or_404()
    if not w.ejercicios:
        return error("El entrenamiento no tiene ejercicios")
    d = request.get_json() or {}
    if d.get("duracion_min"):
        w.duracion_min = int(d["duracion_min"])
    elif w.iniciado:
        w.duracion_min = max(1, round((datetime.utcnow() - w.iniciado).total_seconds() / 60))
    nuevos = _cerrar(w, g.user)
    db.session.commit()
    return jsonify({"workout": w.to_dict(), "xp_ganada": XP_POR_ENTRENO, "badges_nuevos": nuevos,
                    "stats": estadisticas(g.user)})


@app.post("/api/workouts/running")
@login_requerido
def registrar_running():
    d = request.get_json() or {}
    try:
        km, minutos = float(d.get("distancia_km")), int(d.get("duracion_min"))
    except (TypeError, ValueError):
        return error("Indicá distancia (km) y duración (min)")
    if km <= 0 or minutos <= 0:
        return error("Distancia y duración deben ser mayores a 0")
    w = Workout(user_id=g.user.id, nombre=f"Running {km:g}km", tipo="running", distancia_km=km,
                duracion_min=minutos)
    db.session.add(w)
    nuevos = _cerrar(w, g.user)
    db.session.commit()
    return jsonify({"workout": w.to_dict(), "xp_ganada": XP_POR_ENTRENO, "badges_nuevos": nuevos,
                    "stats": estadisticas(g.user)}), 201


@app.get("/api/routines")
@login_requerido
def rutinas():
    return jsonify([r.to_dict() for r in SavedRoutine.query.filter_by(user_id=g.user.id)
                    .order_by(SavedRoutine.id.desc())])


@app.post("/api/routines/<int:rid>/use")
@login_requerido
def usar_rutina(rid):
    r = SavedRoutine.query.filter_by(id=rid, user_id=g.user.id).first_or_404()
    w = plan_de_hoy(g.user)
    cargar_ejercicios(w, r.nombre, r.ejercicios)
    db.session.commit()
    return jsonify(w.to_dict())


# -------------------------------------------------------------------- retos
@app.get("/api/challenges")
@login_requerido
def retos():
    tab = request.args.get("tab", "activos")
    u, hoy = g.user, date.today()
    out = []
    for ch in Challenge.query.order_by(Challenge.fecha_fin):
        c = challenge_dict(ch, u)
        if tab == "activos" and c["unido"] and not c["completado"] and ch.fecha_fin >= hoy:
            out.append(c)
        elif tab == "grupales" and ch.tipo == "grupal" and ch.fecha_fin >= hoy:
            out.append(c)
        elif tab == "completados" and c["completado"]:
            out.append(c)
    return jsonify(out)


@app.post("/api/challenges/<int:cid>/join")
@login_requerido
def unirse(cid):
    ch = db.get_or_404(Challenge, cid)
    if any(p.user_id == g.user.id for p in ch.participantes):
        return error("Ya estás en este reto")
    db.session.add(ChallengeParticipant(challenge=ch, user_id=g.user.id))
    db.session.add(Activity(user_id=g.user.id, icono="🎉",
                            texto=f'se unió a "{ch.titulo}" — ¡ya son {len(ch.participantes) + 1} participantes!'))
    db.session.commit()
    return jsonify(challenge_dict(ch, g.user))


@app.delete("/api/challenges/<int:cid>/join")
@login_requerido
def abandonar(cid):
    p = ChallengeParticipant.query.filter_by(challenge_id=cid, user_id=g.user.id).first_or_404()
    ch = p.challenge
    db.session.delete(p)
    db.session.commit()
    return jsonify(challenge_dict(ch, g.user))


@app.get("/api/activity")
@login_requerido
def actividad():
    mis_likes = {l.activity_id for l in ActivityLike.query.filter_by(user_id=g.user.id)}
    items = Activity.query.order_by(Activity.fecha.desc()).limit(30)
    return jsonify([{"id": a.id, "icono": a.icono, "texto": a.texto, "likes": a.likes,
                     "liked": a.id in mis_likes, "fecha": a.fecha.isoformat() + "Z",
                     "usuario": "Vos" if a.user_id == g.user.id else f"{a.user.nombre} {a.user.apellido}".strip()}
                    for a in items])


@app.post("/api/activity/<int:aid>/like")
@login_requerido
def like(aid):
    a = db.get_or_404(Activity, aid)
    existente = ActivityLike.query.filter_by(activity_id=aid, user_id=g.user.id).first()
    if existente:
        db.session.delete(existente)
        a.likes = max(0, a.likes - 1)
    else:
        db.session.add(ActivityLike(activity_id=aid, user_id=g.user.id))
        a.likes += 1
    db.session.commit()
    return jsonify({"id": a.id, "likes": a.likes, "liked": not existente})


# ----------------------------------------------------------------- coach IA
@app.get("/api/coach/messages")
@login_requerido
def coach_mensajes():
    msgs = CoachMessage.query.filter_by(user_id=g.user.id).order_by(CoachMessage.id)
    return jsonify({"mensajes": [m.to_dict() for m in msgs],
                    "modo": "claude" if os.getenv("ANTHROPIC_API_KEY") else "demo"})


@app.post("/api/coach/messages")
@login_requerido
def coach_enviar():
    texto = ((request.get_json() or {}).get("contenido") or "").strip()
    if not texto:
        return error("Escribí un mensaje")
    conversacion = CoachMessage.query.filter_by(user_id=g.user.id).order_by(CoachMessage.id).all()
    historial_w = completados(g.user).limit(10).all()
    msg_user = CoachMessage(user_id=g.user.id, rol="user", contenido=texto[:2000])
    db.session.add(msg_user)
    respuesta, rutina, modo = coach.responder(g.user, historial_w, conversacion, texto)
    msg_coach = CoachMessage(user_id=g.user.id, rol="coach", contenido=respuesta, rutina=rutina)
    db.session.add(msg_coach)
    db.session.commit()
    return jsonify({"enviado": msg_user.to_dict(), "respuesta": msg_coach.to_dict(), "modo": modo})


@app.post("/api/coach/messages/<int:mid>/import")
@login_requerido
def coach_importar(mid):
    m = CoachMessage.query.filter_by(id=mid, user_id=g.user.id).first_or_404()
    if not m.rutina:
        return error("Ese mensaje no tiene rutina")
    w = plan_de_hoy(g.user)
    cargar_ejercicios(w, m.rutina["nombre"], m.rutina["ejercicios"])
    m.importada = True
    if not SavedRoutine.query.filter_by(user_id=g.user.id, nombre=m.rutina["nombre"]).first():
        db.session.add(SavedRoutine(user_id=g.user.id, nombre=m.rutina["nombre"],
                                    descripcion="Sugerida por Coach IA", ejercicios=m.rutina["ejercicios"]))
    db.session.add(CoachMessage(user_id=g.user.id, rol="coach", contenido=(
        "✅ Rutina importada a tu log de hoy. ¡A darle! Recordá descansar entre 90s y 2min entre series pesadas. 🔥")))
    db.session.commit()
    return jsonify(w.to_dict())


@app.errorhandler(404)
def no_encontrado(_):
    return error("No encontrado", 404)


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "db": app.config["SQLALCHEMY_DATABASE_URI"].split(":")[0]})


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    # host 0.0.0.0 para que la app mobile (celular en la misma red WiFi) pueda conectarse
    app.run(host="0.0.0.0", port=5000, debug=True)
