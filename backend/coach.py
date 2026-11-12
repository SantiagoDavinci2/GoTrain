"""Coach Virtual IA (HU-06).

Usa la Claude API para responder y armar rutinas personalizadas a partir del
historial del usuario. Si no hay ANTHROPIC_API_KEY configurada (o la API falla),
responde en "modo demo" con una rutina generada por reglas, para que la app
siempre funcione en la presentación.
"""
import json
import os
import re

import anthropic

SYSTEM_PROMPT = """Sos "Coach GoTrain AI", el entrenador virtual de la app GoTrain.
Hablás en español rioplatense (voseo), con tono cercano, motivador y breve (2 a 4 oraciones).
Usás el historial y el nivel del usuario que te pasamos para personalizar todo.

Cuando el usuario pida una rutina (o tenga sentido proponerle una), armala con 4 a 6 ejercicios
realistas para el tiempo y grupo muscular que pida, con series, repeticiones y peso en kg.
Basate en los pesos que ya viene usando y aumentalos levemente (2-5%) si corresponde.
Para ejercicios con peso corporal usá peso_kg = 0. Elegí un emoji representativo por ejercicio.
Si solo conversa o pregunta algo, respondé sin rutina (incluye_rutina = false, ejercicios vacío).
No des consejos médicos; ante dolor o lesión recomendá consultar a un profesional."""

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "mensaje": {"type": "string"},
        "incluye_rutina": {"type": "boolean"},
        "rutina_nombre": {"type": "string"},
        "ejercicios": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "nombre": {"type": "string"},
                    "grupo": {"type": "string"},
                    "series": {"type": "integer"},
                    "reps": {"type": "integer"},
                    "peso_kg": {"type": "number"},
                    "icono": {"type": "string"},
                },
                "required": ["nombre", "grupo", "series", "reps", "peso_kg", "icono"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["mensaje", "incluye_rutina", "rutina_nombre", "ejercicios"],
    "additionalProperties": False,
}


def _contexto_usuario(user, historial):
    lineas = [f"Usuario: {user.nombre} · nivel {user.nivel_atleta} · {user.ciudad}"]
    for w in historial[:6]:
        ej = ", ".join(f"{e.nombre} {e.series}x{e.reps}@{e.peso_kg:g}kg" for e in w.ejercicios)
        extra = f"{w.distancia_km} km" if w.tipo == "running" else ej
        lineas.append(f"- {w.fecha.isoformat()} {w.nombre} ({w.duracion_min} min): {extra}")
    return "Historial reciente del usuario:\n" + "\n".join(lineas)


def responder(user, historial, conversacion, texto):
    """Devuelve (mensaje, rutina|None, modo) donde modo es 'claude' o 'demo'."""
    if os.getenv("ANTHROPIC_API_KEY"):
        try:
            return _responder_claude(user, historial, conversacion, texto)
        except (anthropic.APIError, json.JSONDecodeError, KeyError) as e:  # red, auth, rate limit, respuesta inválida
            print(f"[coach] Claude API no disponible, uso modo demo: {e}")
    return _responder_demo(user, historial, texto)


def _responder_claude(user, historial, conversacion, texto):
    client = anthropic.Anthropic()
    mensajes = []
    for m in conversacion[-10:]:
        rol = "assistant" if m.rol == "coach" else "user"
        if mensajes and mensajes[-1]["role"] == rol:
            mensajes[-1]["content"] += "\n" + m.contenido
        else:
            mensajes.append({"role": rol, "content": m.contenido})
    if mensajes and mensajes[0]["role"] == "assistant":
        mensajes.insert(0, {"role": "user", "content": "Hola coach"})
    contenido = _contexto_usuario(user, historial) + "\n\nMensaje del usuario: " + texto
    if mensajes and mensajes[-1]["role"] == "user":
        mensajes[-1]["content"] += "\n" + contenido
    else:
        mensajes.append({"role": "user", "content": contenido})

    response = client.beta.messages.create(
        model=os.getenv("CLAUDE_MODEL", "claude-opus-5-5"),
        max_tokens=16000,
        system=SYSTEM_PROMPT,
        messages=mensajes,
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": RESPONSE_SCHEMA}},
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
    )
    if response.stop_reason == "refusal":
        return ("No puedo ayudarte con eso, pero sí con tu entrenamiento. ¿Qué querés trabajar hoy? 💪",
                None, "claude")
    raw = next((b.text for b in response.content if b.type == "text"), "{}")
    data = json.loads(raw)
    rutina = None
    if data.get("incluye_rutina") and data.get("ejercicios"):
        rutina = {"nombre": data.get("rutina_nombre") or "Rutina del Coach", "ejercicios": data["ejercicios"]}
    return data.get("mensaje", ""), rutina, "claude"


# ---------------------------------------------------------------- modo demo
PLANTILLAS = {
    "pecho": ("Push Day — Pecho & Tríceps", [
        ("Press de Banca", "Pecho", 4, 8, 80, "🏋️"),
        ("Press Inclinado Mancuernas", "Pecho Superior", 3, 10, 30, "⬆️"),
        ("Aperturas en Cable", "Pecho", 3, 12, 20, "🦋"),
        ("Fondos en Paralelas", "Tríceps / Pecho", 3, 12, 0, "🔽"),
        ("Extensión Tríceps Polea", "Tríceps", 4, 12, 25, "💡"),
    ]),
    "espalda": ("Pull Day — Espalda & Bíceps", [
        ("Dominadas", "Espalda", 4, 8, 0, "🧗"),
        ("Remo con Barra", "Espalda", 4, 8, 60, "🚣"),
        ("Jalón al Pecho", "Dorsales", 3, 10, 50, "⬇️"),
        ("Curl con Barra", "Bíceps", 3, 10, 30, "💪"),
        ("Curl Martillo", "Bíceps", 3, 12, 14, "🔨"),
    ]),
    "pierna": ("Leg Day — Piernas", [
        ("Sentadilla", "Cuádriceps", 4, 8, 90, "🦵"),
        ("Peso Muerto Rumano", "Isquios", 3, 10, 70, "🏋️"),
        ("Prensa", "Piernas", 3, 12, 160, "🦿"),
        ("Estocadas", "Glúteos", 3, 12, 20, "🚶"),
        ("Gemelos de Pie", "Pantorrillas", 4, 15, 40, "⬆️"),
    ]),
    "full": ("Full Body Rápido", [
        ("Sentadilla Goblet", "Piernas", 3, 12, 24, "🦵"),
        ("Flexiones", "Pecho", 3, 15, 0, "⬇️"),
        ("Remo con Mancuerna", "Espalda", 3, 10, 26, "🚣"),
        ("Plancha (seg)", "Core", 3, 45, 0, "🧱"),
    ]),
}


def _responder_demo(user, historial, texto):
    t = texto.lower()
    clave = None
    if any(k in t for k in ("pecho", "push", "tríceps", "triceps")):
        clave = "pecho"
    elif any(k in t for k in ("espalda", "pull", "bíceps", "biceps", "dorsal")):
        clave = "espalda"
    elif any(k in t for k in ("pierna", "leg", "cuádriceps", "gluteo", "glúteo")):
        clave = "pierna"
    elif any(k in t for k in ("full", "completo", "cuerpo", "rutina", "entren", "arm")):
        clave = "full"

    if not clave:
        if any(k in t for k in ("dolor", "lesión", "lesion", "duele")):
            return ("Si sentís dolor, frená y consultá con un profesional antes de seguir. "
                    "Mientras tanto podemos armar algo suave de movilidad. 🙏", None, "demo")
        hechos = len([w for w in historial if w.estado == "completado"])
        return (f"¡Vamos {user.nombre}! Llevás {hechos} entrenamientos registrados. "
                "Decime qué grupo muscular querés trabajar (pecho, espalda, piernas o full body) "
                "y cuánto tiempo tenés, y te armo la rutina. 💪", None, "demo")

    # Pesos que ya viene usando, con un aumento leve
    ultimos = {}
    for w in historial:
        for e in w.ejercicios:
            ultimos.setdefault(e.nombre.lower(), e.peso_kg)
    nombre, base = PLANTILLAS[clave]
    m = re.search(r"(\d{2,3})\s*min", t)
    if m and int(m.group(1)) < 40:
        base = base[:3]
    ejercicios = []
    for (n, g, s, r, p, ic) in base:
        previo = ultimos.get(n.lower())
        peso = round((previo * 1.025) * 2) / 2 if previo else p
        ejercicios.append({"nombre": n, "grupo": g, "series": s, "reps": r, "peso_kg": peso, "icono": ic})
    msg = (f"¡Perfecto! Basándome en tu nivel {user.nivel_atleta} y tus últimas sesiones, "
           f"te propongo esta rutina. Subí levemente los pesos donde venías cómodo. ¿La importamos al log? 💪")
    return msg, {"nombre": nombre, "ejercicios": ejercicios}, "demo"
