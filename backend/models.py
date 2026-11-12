"""Modelos de datos de GoTrain (SQLAlchemy). Funcionan igual en SQLite y PostgreSQL."""
from datetime import datetime, date

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "usuarios"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(80), nullable=False)
    apellido = db.Column(db.String(80), default="")
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    bio = db.Column(db.String(200), default="")
    ciudad = db.Column(db.String(80), default="")
    nivel_atleta = db.Column(db.String(30), default="principiante")
    xp = db.Column(db.Integer, default=0)
    seguidores = db.Column(db.Integer, default=0)
    siguiendo = db.Column(db.Integer, default=0)
    creado = db.Column(db.DateTime, default=datetime.utcnow)

    workouts = db.relationship("Workout", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, pw):
        self.password_hash = generate_password_hash(pw)

    def check_password(self, pw):
        return check_password_hash(self.password_hash, pw)

    @property
    def iniciales(self):
        return ((self.nombre[:1] or "") + (self.apellido[:1] or "")).upper()

    @property
    def nivel(self):
        return 1 + self.xp // 100

    def to_dict(self):
        return {
            "id": self.id, "nombre": self.nombre, "apellido": self.apellido,
            "email": self.email, "bio": self.bio, "ciudad": self.ciudad,
            "nivel_atleta": self.nivel_atleta, "xp": self.xp, "nivel": self.nivel,
            "seguidores": self.seguidores, "siguiendo": self.siguiendo,
            "iniciales": self.iniciales,
        }


class Workout(db.Model):
    """Una sesión de entrenamiento. estado: 'planificado' (el de hoy) o 'completado'."""
    __tablename__ = "entrenamientos"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    nombre = db.Column(db.String(120), nullable=False)
    tipo = db.Column(db.String(20), default="fuerza")  # fuerza | running
    fecha = db.Column(db.Date, default=date.today)
    estado = db.Column(db.String(20), default="planificado")
    duracion_min = db.Column(db.Integer, default=0)
    distancia_km = db.Column(db.Float, default=0)
    iniciado = db.Column(db.DateTime, nullable=True)

    ejercicios = db.relationship("Exercise", backref="workout", lazy=True,
                                 cascade="all, delete-orphan", order_by="Exercise.orden")

    @property
    def volumen_kg(self):
        return round(sum(e.series * e.reps * (e.peso_kg or 0) for e in self.ejercicios))

    @property
    def total_series(self):
        return sum(e.series for e in self.ejercicios)

    def to_dict(self):
        return {
            "id": self.id, "nombre": self.nombre, "tipo": self.tipo,
            "fecha": self.fecha.isoformat(), "estado": self.estado,
            "duracion_min": self.duracion_min, "distancia_km": self.distancia_km,
            "volumen_kg": self.volumen_kg, "total_series": self.total_series,
            "iniciado": self.iniciado.isoformat() + "Z" if self.iniciado else None,
            "ejercicios": [e.to_dict() for e in self.ejercicios],
        }


class Exercise(db.Model):
    __tablename__ = "ejercicios"
    id = db.Column(db.Integer, primary_key=True)
    workout_id = db.Column(db.Integer, db.ForeignKey("entrenamientos.id"), nullable=False)
    nombre = db.Column(db.String(120), nullable=False)
    grupo = db.Column(db.String(60), default="")
    series = db.Column(db.Integer, default=3)
    reps = db.Column(db.Integer, default=10)
    peso_kg = db.Column(db.Float, default=0)  # 0 = peso corporal
    icono = db.Column(db.String(8), default="🏋️")
    orden = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {"id": self.id, "nombre": self.nombre, "grupo": self.grupo,
                "series": self.series, "reps": self.reps, "peso_kg": self.peso_kg,
                "icono": self.icono}


class SavedRoutine(db.Model):
    __tablename__ = "rutinas"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    nombre = db.Column(db.String(120), nullable=False)
    descripcion = db.Column(db.String(200), default="")
    ejercicios = db.Column(db.JSON, default=list)

    def to_dict(self):
        return {"id": self.id, "nombre": self.nombre, "descripcion": self.descripcion,
                "ejercicios": self.ejercicios}


class Challenge(db.Model):
    __tablename__ = "retos"
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(120), nullable=False)
    descripcion = db.Column(db.String(200), default="")
    tipo = db.Column(db.String(20), default="grupal")  # individual | grupal
    icono = db.Column(db.String(8), default="🏆")
    metrica = db.Column(db.String(20), default="entrenos")  # km | entrenos | volumen | dias
    meta = db.Column(db.Float, nullable=False)
    unidad = db.Column(db.String(20), default="")
    fecha_inicio = db.Column(db.Date, default=date.today)
    fecha_fin = db.Column(db.Date, nullable=False)

    participantes = db.relationship("ChallengeParticipant", backref="challenge", lazy=True,
                                    cascade="all, delete-orphan")


class ChallengeParticipant(db.Model):
    __tablename__ = "retos_participantes"
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey("retos.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    progreso = db.Column(db.Float, default=0)
    completado = db.Column(db.Boolean, default=False)
    unido = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User")


class Activity(db.Model):
    """Feed social de los retos (logros, superaciones, nuevos participantes)."""
    __tablename__ = "actividad"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    texto = db.Column(db.String(250), nullable=False)
    icono = db.Column(db.String(8), default="🔥")
    likes = db.Column(db.Integer, default=0)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User")


class ActivityLike(db.Model):
    __tablename__ = "actividad_likes"
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey("actividad.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)


class Badge(db.Model):
    __tablename__ = "logros"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    codigo = db.Column(db.String(40), nullable=False)
    icono = db.Column(db.String(8))
    label = db.Column(db.String(40))
    fecha = db.Column(db.DateTime, default=datetime.utcnow)


class CoachMessage(db.Model):
    __tablename__ = "coach_mensajes"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    rol = db.Column(db.String(10), nullable=False)  # user | coach
    contenido = db.Column(db.Text, nullable=False)
    rutina = db.Column(db.JSON, nullable=True)  # {"nombre":..., "ejercicios":[...]}
    importada = db.Column(db.Boolean, default=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {"id": self.id, "rol": self.rol, "contenido": self.contenido,
                "rutina": self.rutina, "importada": self.importada,
                "fecha": self.fecha.isoformat() + "Z"}
