"""Crea la base de datos y la carga con datos de ejemplo para la demo.

Uso:  python seed.py      (borra y recrea todas las tablas)

Usuario demo:  santiago@gotrain.com  /  gotrain123
"""
from datetime import date, datetime, timedelta

from app import app, otorgar_badges
from models import (db, User, Workout, Exercise, SavedRoutine, Challenge, ChallengeParticipant,
                    Activity, CoachMessage)

HOY = date.today()

PUSH = [("Press de Banca", "Pecho", 4, 8, 80, "🏋️"), ("Press Inclinado Mancuernas", "Pecho Superior", 3, 10, 30, "⬆️"),
        ("Fondos en Paralelas", "Tríceps / Pecho", 3, 12, 0, "🔽"), ("Extensión Tríceps Polea", "Tríceps", 4, 12, 25, "💡"),
        ("Aperturas en Cable", "Pecho", 3, 12, 20, "🦋"), ("Press Francés", "Tríceps", 2, 10, 25, "💪")]
PULL = [("Dominadas", "Espalda", 4, 8, 0, "🧗"), ("Remo con Barra", "Espalda", 4, 8, 60, "🚣"),
        ("Jalón al Pecho", "Dorsales", 3, 10, 50, "⬇️"), ("Curl con Barra", "Bíceps", 3, 10, 30, "💪"),
        ("Curl Martillo", "Bíceps", 3, 12, 14, "🔨")]
LEGS = [("Sentadilla", "Cuádriceps", 4, 8, 90, "🦵"), ("Peso Muerto Rumano", "Isquios", 3, 10, 70, "🏋️"),
        ("Prensa", "Piernas", 3, 12, 160, "🦿"), ("Estocadas", "Glúteos", 3, 12, 20, "🚶"),
        ("Gemelos de Pie", "Pantorrillas", 4, 15, 40, "⬆️"), ("Camilla Femoral", "Isquios", 3, 12, 35, "🦵"),
        ("Abductores", "Glúteos", 3, 15, 45, "🍑")]
ROTACION = [("Push Day — Pecho & Tríceps", PUSH, 55), ("Running", None, 0), ("Pull Day — Espalda & Bíceps", PULL, 58),
            ("Leg Day", LEGS, 68), ("Running", None, 0)]


def ejercicios(w, lista):
    for i, (n, gr, s, r, p, ic) in enumerate(lista):
        db.session.add(Exercise(workout=w, orden=i, nombre=n, grupo=gr, series=s, reps=r, peso_kg=p, icono=ic))


def run():
    with app.app_context():
        db.drop_all()
        db.create_all()

        yo = User(nombre="Santiago", apellido="García", email="santiago@gotrain.com", ciudad="Olavarría, BA",
                  bio="🏋️ Atleta intermedio · Olavarría, BA · Estudiante Da Vinci", nivel_atleta="intermedio",
                  xp=1150, seguidores=89, siguiendo=47)
        yo.set_password("gotrain123")
        otros = []
        for nombre, apellido in [("María", "Rodríguez"), ("José", "López"), ("Tomás", "Fernández"), ("Ana", "Martínez"),
                                 ("Lucía", "Gómez"), ("Bruno", "Díaz"), ("Camila", "Pérez"), ("Julián", "Sosa")]:
            u = User(nombre=nombre, apellido=apellido, email=f"{nombre.lower()}@gotrain.com".replace("í", "i")
                     .replace("á", "a").replace("é", "e").replace("ó", "o").replace("ú", "u"),
                     nivel_atleta="intermedio", xp=600, seguidores=30, siguiendo=40)
            u.set_password("gotrain123")
            otros.append(u)
        db.session.add_all([yo, *otros])
        db.session.flush()

        # Historial: 21 días seguidos de entrenamiento (racha) + algunos más viejos
        dias = list(range(1, 22)) + [24, 26, 28, 31, 33, 35]
        for idx, atras in enumerate(sorted(dias, reverse=True)):
            nombre, lista, dur = ROTACION[idx % len(ROTACION)]
            f = HOY - timedelta(days=atras)
            if lista is None:
                km = [5.0, 8.0, 6.5, 10.0][idx % 4]
                w = Workout(user=yo, nombre=f"Running {km:g}km", tipo="running", fecha=f, estado="completado",
                            distancia_km=km, duracion_min=round(km * 4.9))
                db.session.add(w)
            else:
                w = Workout(user=yo, nombre=nombre, fecha=f, estado="completado", duracion_min=dur)
                db.session.add(w)
                ejercicios(w, lista)

        # Plan de hoy
        hoy = Workout(user=yo, nombre="Push Day — Pecho & Tríceps", fecha=HOY, estado="planificado")
        db.session.add(hoy)
        ejercicios(hoy, PUSH[:4])

        db.session.add(SavedRoutine(user_id=yo.id, nombre="Full Body Rápido", descripcion="30 min · 4 ejercicios",
                                    ejercicios=[{"nombre": n, "grupo": g, "series": s, "reps": r, "peso_kg": p, "icono": i}
                                                for n, g, s, r, p, i in [
                                                    ("Sentadilla Goblet", "Piernas", 3, 12, 24, "🦵"),
                                                    ("Flexiones", "Pecho", 3, 15, 0, "⬇️"),
                                                    ("Remo con Mancuerna", "Espalda", 3, 10, 26, "🚣"),
                                                    ("Plancha (seg)", "Core", 3, 45, 0, "🧱")]]))
        db.session.add(SavedRoutine(user_id=yo.id, nombre="Leg Day", descripcion="68 min · 7 ejercicios",
                                    ejercicios=[{"nombre": n, "grupo": g, "series": s, "reps": r, "peso_kg": p, "icono": i}
                                                for n, g, s, r, p, i in LEGS]))

        # Retos
        maria, jose, tomas, ana = otros[:4]
        km100 = Challenge(titulo="100km del mes", descripcion="Sumá 100 km corriendo antes de fin de mes",
                          tipo="grupal", icono="🏃", metrica="km", meta=100, unidad="km",
                          fecha_inicio=HOY - timedelta(days=24), fecha_fin=HOY + timedelta(days=6))
        duelo = Challenge(titulo="Duelo 1v1 vs. José López", descripcion="Quién levanta más volumen esta semana",
                          tipo="individual", icono="🥇", metrica="volumen", meta=20000, unidad="kg",
                          fecha_inicio=HOY - timedelta(days=3), fecha_fin=HOY + timedelta(days=4))
        ppl = Challenge(titulo="Push-Pull-Legs del mes", descripcion="Completá 12 sesiones PPL en el mes",
                        tipo="grupal", icono="🏆", metrica="entrenos", meta=12, unidad="entrenos",
                        fecha_inicio=HOY + timedelta(days=5), fecha_fin=HOY + timedelta(days=35))
        diez = Challenge(titulo="10 entrenos en 3 semanas", descripcion="Constancia: 10 sesiones de cualquier tipo",
                         tipo="grupal", icono="🎯", metrica="entrenos", meta=10, unidad="entrenos",
                         fecha_inicio=HOY - timedelta(days=2), fecha_fin=HOY + timedelta(days=19))
        racha = Challenge(titulo="21 días de racha", descripcion="Entrená sin cortar la cadena",
                          tipo="individual", icono="💪", metrica="dias", meta=21, unidad="días",
                          fecha_inicio=HOY - timedelta(days=21), fecha_fin=HOY + timedelta(days=9))
        db.session.add_all([km100, duelo, ppl, diez, racha])
        db.session.flush()

        def part(ch, u, prog, done=False):
            db.session.add(ChallengeParticipant(challenge=ch, user=u, progreso=prog, completado=done))

        part(km100, yo, 66)
        for u, p in zip(otros, [100, 48, 81, 12, 55, 37, 70, 29]):
            part(km100, u, p, p >= 100)
        part(duelo, yo, 8200)
        part(duelo, jose, 9700)
        for u in otros[:5]:
            part(ppl, u, 0)
        for u, p in zip(otros[3:], [2, 1, 3, 2, 1]):
            part(diez, u, p)
        part(racha, yo, 21, True)

        # Feed de actividad
        ahora = datetime.utcnow()
        for u, ic, txt, likes, mins in [
            (ana, "🎉", 'se unió a "100km del mes" — ¡ya son 9 participantes!', 3, 300),
            (tomas, "⚡", 'subió al 2do puesto en "100km del mes"', 6, 180),
            (jose, "🔥", "te superó en el Duelo 1v1 — 9.700 kg vs tus 8.200 kg", 2, 60),
            (maria, "🏆", 'completó el reto "100km del mes" 🎉', 18, 23),
        ]:
            db.session.add(Activity(user=u, icono=ic, texto=txt, likes=likes, fecha=ahora - timedelta(minutes=mins)))

        db.session.add(CoachMessage(user_id=yo.id, rol="coach", fecha=ahora - timedelta(minutes=5), contenido=(
            "¡Hola Santiago! 💪 Revisé tu historial de las últimas semanas: venís con una racha de 21 días. "
            "¿Querés que te arme una rutina para hoy basada en tu progreso?")))

        db.session.flush()
        otorgar_badges(yo)
        db.session.commit()
        print("Base de datos creada. Usuario demo: santiago@gotrain.com / gotrain123")


if __name__ == "__main__":
    run()
