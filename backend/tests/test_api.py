"""Casos de prueba automatizados de la API de GoTrain.

Cada test corresponde a un caso de prueba (CP-xx) del documento de Casos de Prueba.
Usa la base PostgreSQL "gotrain_test", así no toca los datos de la demo.

Ejecutar desde la carpeta backend:
    .venv\\Scripts\\python -m unittest discover -s tests -v
"""
import json
import os
import sys
import unittest
from datetime import date, timedelta
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
os.environ.pop("DATABASE_URL", None)
os.environ["DB_NAME"] = os.getenv("DB_NAME", "gotrain") + "_test"  # base PostgreSQL aparte (la crea crear_base.py)
os.environ["ANTHROPIC_API_KEY"] = ""  # el coach se prueba en modo demo (sin costo ni red)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import seed  # noqa: E402
from app import app  # noqa: E402

RESULTADOS = {}


def cp(codigo):
    """Decorador: registra el resultado del caso de prueba para el informe."""
    def deco(fn):
        def wrapper(self):
            try:
                fn(self)
                RESULTADOS[codigo] = "Aprobado"
            except Exception:
                RESULTADOS[codigo] = "Fallido"
                raise
        wrapper.__name__ = fn.__name__
        wrapper.__doc__ = f"{codigo}: {fn.__doc__}"
        return wrapper
    return deco


class GoTrainAPITest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed.run()

    def setUp(self):
        self.c = app.test_client()
        r = self.c.post("/api/auth/login", json={"email": "santiago@gotrain.com", "password": "gotrain123"})
        self.H = {"Authorization": "Bearer " + r.get_json()["token"]}

    def nuevo_usuario(self, email):
        r = self.c.post("/api/auth/register", json={"nombre": "Prueba", "email": email, "password": "secreta1"})
        return {"Authorization": "Bearer " + r.get_json()["token"]}

    # ---------------------------------------------------------------- CU-01 / CU-02
    @cp("CP-01")
    def test_01_registro_ok(self):
        """Registro con datos válidos"""
        r = self.c.post("/api/auth/register", json={"nombre": "Ana", "email": "ana.nueva@test.com", "password": "123456"})
        self.assertEqual(r.status_code, 201)
        self.assertIn("token", r.get_json())

    @cp("CP-02")
    def test_02_registro_email_duplicado(self):
        """Registro con email ya existente"""
        r = self.c.post("/api/auth/register", json={"nombre": "X", "email": "santiago@gotrain.com", "password": "123456"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("Ya existe", r.get_json()["error"])

    @cp("CP-03")
    def test_03_registro_password_corta(self):
        """Registro con contraseña de menos de 6 caracteres"""
        r = self.c.post("/api/auth/register", json={"nombre": "X", "email": "corta@test.com", "password": "123"})
        self.assertEqual(r.status_code, 400)

    @cp("CP-04")
    def test_04_login_ok(self):
        """Login con credenciales válidas"""
        r = self.c.post("/api/auth/login", json={"email": "santiago@gotrain.com", "password": "gotrain123"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["user"]["nombre"], "Santiago")

    @cp("CP-05")
    def test_05_login_password_incorrecta(self):
        """Login con contraseña incorrecta"""
        r = self.c.post("/api/auth/login", json={"email": "santiago@gotrain.com", "password": "mala"})
        self.assertEqual(r.status_code, 401)

    @cp("CP-06")
    def test_06_sin_token(self):
        """Acceso a un recurso protegido sin token"""
        self.assertEqual(self.c.get("/api/dashboard").status_code, 401)

    @cp("CP-07")
    def test_07_token_invalido(self):
        """Acceso con token alterado o vencido"""
        r = self.c.get("/api/dashboard", headers={"Authorization": "Bearer abc.def.ghi"})
        self.assertEqual(r.status_code, 401)

    # ---------------------------------------------------------------- CU-03
    @cp("CP-08")
    def test_08_editar_perfil(self):
        """Edición de perfil con datos válidos"""
        r = self.c.put("/api/me", headers=self.H, json={"bio": "Nueva bio", "ciudad": "Azul, BA"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["bio"], "Nueva bio")

    @cp("CP-09")
    def test_09_editar_perfil_nombre_vacio(self):
        """Edición de perfil dejando el nombre vacío"""
        H = self.nuevo_usuario("vacio@test.com")
        self.assertEqual(self.c.put("/api/me", headers=H, json={"nombre": "  "}).status_code, 400)

    # ---------------------------------------------------------------- CU-04
    @cp("CP-10")
    def test_10_agregar_ejercicio(self):
        """Agregar ejercicio al entrenamiento del día"""
        H = self.nuevo_usuario("ej@test.com")
        w = self.c.get("/api/workouts/today", headers=H).get_json()
        r = self.c.post(f"/api/workouts/{w['id']}/exercises", headers=H,
                        json={"nombre": "Sentadilla", "grupo": "Piernas", "series": 4, "reps": 10, "peso_kg": 50})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.get_json()["volumen_kg"], 2000)

    @cp("CP-11")
    def test_11_agregar_ejercicio_sin_nombre(self):
        """Agregar ejercicio sin nombre"""
        w = self.c.get("/api/workouts/today", headers=self.H).get_json()
        self.assertEqual(self.c.post(f"/api/workouts/{w['id']}/exercises", headers=self.H, json={"nombre": ""}).status_code, 400)

    @cp("CP-12")
    def test_12_agregar_ejercicio_valores_invalidos(self):
        """Agregar ejercicio con series/peso no numéricos"""
        w = self.c.get("/api/workouts/today", headers=self.H).get_json()
        r = self.c.post(f"/api/workouts/{w['id']}/exercises", headers=self.H, json={"nombre": "X", "series": "muchas"})
        self.assertEqual(r.status_code, 400)

    @cp("CP-13")
    def test_13_eliminar_ejercicio(self):
        """Quitar un ejercicio del entrenamiento planificado"""
        H = self.nuevo_usuario("del@test.com")
        w = self.c.get("/api/workouts/today", headers=H).get_json()
        w = self.c.post(f"/api/workouts/{w['id']}/exercises", headers=H, json={"nombre": "Curl"}).get_json()
        r = self.c.delete(f"/api/exercises/{w['ejercicios'][0]['id']}", headers=H)
        self.assertEqual(r.get_json()["ejercicios"], [])

    @cp("CP-14")
    def test_14_iniciar_sin_ejercicios(self):
        """Iniciar entrenamiento sin ejercicios cargados"""
        H = self.nuevo_usuario("vacio2@test.com")
        w = self.c.get("/api/workouts/today", headers=H).get_json()
        self.assertEqual(self.c.post(f"/api/workouts/{w['id']}/start", headers=H).status_code, 400)

    @cp("CP-15")
    def test_15_finalizar_entrenamiento(self):
        """Finalizar entrenamiento: historial, XP y actividad"""
        H = self.nuevo_usuario("fin@test.com")
        w = self.c.get("/api/workouts/today", headers=H).get_json()
        self.c.post(f"/api/workouts/{w['id']}/exercises", headers=H, json={"nombre": "Press", "peso_kg": 40})
        self.c.post(f"/api/workouts/{w['id']}/start", headers=H)
        r = self.c.post(f"/api/workouts/{w['id']}/finish", headers=H, json={"duracion_min": 45}).get_json()
        self.assertEqual(r["xp_ganada"], 50)
        self.assertEqual(r["stats"]["entrenamientos"], 1)
        self.assertEqual(r["stats"]["racha"], 1)
        hist = self.c.get("/api/workouts", headers=H).get_json()
        self.assertEqual(hist[0]["duracion_min"], 45)
        feed = self.c.get("/api/activity", headers=H).get_json()
        self.assertTrue(any(a["usuario"] == "Vos" and a["texto"].startswith("terminó") for a in feed))

    @cp("CP-16")
    def test_16_finalizar_actualiza_reto_volumen(self):
        """El volumen entrenado suma al reto de volumen"""
        antes = next(c for c in self.c.get("/api/challenges?tab=activos", headers=self.H).get_json() if c["metrica"] == "volumen")
        w = self.c.get("/api/workouts/today", headers=self.H).get_json()
        self.c.post(f"/api/workouts/{w['id']}/finish", headers=self.H, json={"duracion_min": 50})
        despues = next(c for c in self.c.get("/api/challenges?tab=activos", headers=self.H).get_json() if c["id"] == antes["id"])
        self.assertAlmostEqual(despues["progreso"] - antes["progreso"], w["volumen_kg"], delta=1)

    # ---------------------------------------------------------------- CU-05
    @cp("CP-17")
    def test_17_running_suma_km(self):
        """Registrar running suma km al reto de distancia"""
        km = lambda: next(c for c in self.c.get("/api/challenges?tab=grupales", headers=self.H).get_json() if c["metrica"] == "km")["progreso"]
        antes = km()
        r = self.c.post("/api/workouts/running", headers=self.H, json={"distancia_km": 5.5, "duracion_min": 30})
        self.assertEqual(r.status_code, 201)
        self.assertAlmostEqual(km() - antes, 5.5)

    @cp("CP-18")
    def test_18_running_invalido(self):
        """Registrar running con distancia 0"""
        r = self.c.post("/api/workouts/running", headers=self.H, json={"distancia_km": 0, "duracion_min": 30})
        self.assertEqual(r.status_code, 400)

    # ---------------------------------------------------------------- CU-07 / CU-08 / CU-12
    @cp("CP-19")
    def test_19_completar_reto(self):
        """Completar un reto genera actividad y logro"""
        H = self.nuevo_usuario("reto@test.com")
        reto = next(c for c in self.c.get("/api/challenges?tab=grupales", headers=H).get_json() if c["metrica"] == "km")
        self.c.post(f"/api/challenges/{reto['id']}/join", headers=H)
        r = self.c.post("/api/workouts/running", headers=H, json={"distancia_km": reto["meta"], "duracion_min": 600}).get_json()
        self.assertIn("1er Reto", r["badges_nuevos"])
        comp = self.c.get("/api/challenges?tab=completados", headers=H).get_json()
        self.assertTrue(any(c["id"] == reto["id"] for c in comp))

    @cp("CP-20")
    def test_20_unirse_reto(self):
        """Unirse a un reto grupal"""
        H = self.nuevo_usuario("unir@test.com")
        reto = self.c.get("/api/challenges?tab=grupales", headers=H).get_json()[0]
        r = self.c.post(f"/api/challenges/{reto['id']}/join", headers=H).get_json()
        self.assertTrue(r["unido"])
        self.assertEqual(r["participantes"], reto["participantes"] + 1)

    @cp("CP-21")
    def test_21_unirse_dos_veces(self):
        """Unirse a un reto en el que ya participa"""
        reto = self.c.get("/api/challenges?tab=activos", headers=self.H).get_json()[0]
        self.assertEqual(self.c.post(f"/api/challenges/{reto['id']}/join", headers=self.H).status_code, 400)

    @cp("CP-22")
    def test_22_salir_reto(self):
        """Salir de un reto"""
        H = self.nuevo_usuario("salir@test.com")
        reto = self.c.get("/api/challenges?tab=grupales", headers=H).get_json()[0]
        self.c.post(f"/api/challenges/{reto['id']}/join", headers=H)
        self.assertFalse(self.c.delete(f"/api/challenges/{reto['id']}/join", headers=H).get_json()["unido"])

    @cp("CP-23")
    def test_23_ranking(self):
        """El ranking del reto está ordenado por progreso"""
        reto = next(c for c in self.c.get("/api/challenges?tab=grupales", headers=self.H).get_json() if c["metrica"] == "km")
        prog = [r["progreso"] for r in reto["ranking"]]
        self.assertEqual(prog, sorted(prog, reverse=True))

    # ---------------------------------------------------------------- CU-09
    @cp("CP-24")
    def test_24_like_actividad(self):
        """Dar y quitar 'Felicitar' a una actividad"""
        a = self.c.get("/api/activity", headers=self.H).get_json()[0]
        r1 = self.c.post(f"/api/activity/{a['id']}/like", headers=self.H).get_json()
        r2 = self.c.post(f"/api/activity/{a['id']}/like", headers=self.H).get_json()
        self.assertEqual((r1["likes"], r1["liked"]), (a["likes"] + 1, True))
        self.assertEqual((r2["likes"], r2["liked"]), (a["likes"], False))

    # ---------------------------------------------------------------- CU-10 / CU-11 / CU-06
    @cp("CP-25")
    def test_25_coach_rutina(self):
        """Pedir una rutina al Coach IA"""
        r = self.c.post("/api/coach/messages", headers=self.H, json={"contenido": "Quiero entrenar piernas, tengo 60 min"}).get_json()
        rutina = r["respuesta"]["rutina"]
        self.assertIsNotNone(rutina)
        self.assertGreaterEqual(len(rutina["ejercicios"]), 3)

    @cp("CP-26")
    def test_26_coach_mensaje_vacio(self):
        """Enviar un mensaje vacío al Coach"""
        self.assertEqual(self.c.post("/api/coach/messages", headers=self.H, json={"contenido": "  "}).status_code, 400)

    @cp("CP-27")
    def test_27_importar_rutina(self):
        """Importar la rutina del Coach al entrenamiento de hoy"""
        r = self.c.post("/api/coach/messages", headers=self.H, json={"contenido": "rutina de espalda"}).get_json()
        w = self.c.post(f"/api/coach/messages/{r['respuesta']['id']}/import", headers=self.H).get_json()
        self.assertEqual(w["nombre"], r["respuesta"]["rutina"]["nombre"])
        self.assertEqual(len(w["ejercicios"]), len(r["respuesta"]["rutina"]["ejercicios"]))
        nombres = [x["nombre"] for x in self.c.get("/api/routines", headers=self.H).get_json()]
        self.assertIn(w["nombre"], nombres)

    @cp("CP-28")
    def test_28_importar_sin_rutina(self):
        """Importar un mensaje que no tiene rutina"""
        r = self.c.post("/api/coach/messages", headers=self.H, json={"contenido": "hola"}).get_json()
        self.assertIsNone(r["respuesta"]["rutina"])
        self.assertEqual(self.c.post(f"/api/coach/messages/{r['respuesta']['id']}/import", headers=self.H).status_code, 400)

    @cp("CP-29")
    def test_29_usar_rutina_guardada(self):
        """Cargar una rutina guardada como entrenamiento del día"""
        rut = self.c.get("/api/routines", headers=self.H).get_json()[0]
        w = self.c.post(f"/api/routines/{rut['id']}/use", headers=self.H).get_json()
        self.assertEqual(w["nombre"], rut["nombre"])

    # ---------------------------------------------------------------- CU-12 / CU-13
    @cp("CP-30")
    def test_30_racha_y_logros(self):
        """Cálculo de racha y logros desbloqueados"""
        p = self.c.get("/api/profile", headers=self.H).get_json()
        self.assertGreaterEqual(p["stats"]["racha"], 21)
        desbloq = {b["codigo"] for b in p["badges"] if b["desbloqueado"]}
        self.assertTrue({"racha_7", "racha_21"} <= desbloq)

    @cp("CP-31")
    def test_31_busqueda(self):
        """Búsqueda de entrenamientos y usuarios"""
        r = self.c.get("/api/search?q=Leg", headers=self.H).get_json()
        self.assertTrue(r["entrenamientos"])
        r = self.c.get("/api/search?q=Mar", headers=self.H).get_json()
        self.assertTrue(any("María" in u["nombre"] for u in r["usuarios"]))

    @cp("CP-32")
    def test_32_recurso_ajeno(self):
        """Intentar borrar un ejercicio de otro usuario"""
        w = self.c.get("/api/workouts/today", headers=self.H).get_json()
        otro = self.nuevo_usuario("intruso@test.com")
        self.assertEqual(self.c.delete(f"/api/exercises/{w['ejercicios'][0]['id']}", headers=otro).status_code, 404)

    # ---------------------------------------------------------------- CU-14 Crear reto
    def reto_valido(self, **cambios):
        hoy = date.today()
        datos = {"titulo": "50 km en dos semanas", "descripcion": "Corré 50 km", "tipo": "grupal", "metrica": "km",
                 "meta": 50, "fecha_inicio": hoy.isoformat(), "fecha_fin": (hoy + timedelta(days=14)).isoformat()}
        datos.update(cambios)
        return datos

    @cp("CP-41")
    def test_41_crear_reto_grupal(self):
        """Crear un reto grupal: el creador queda unido y se publica en la actividad"""
        H = self.nuevo_usuario("creador@test.com")
        r = self.c.post("/api/challenges", headers=H, json=self.reto_valido())
        self.assertEqual(r.status_code, 201)
        reto = r.get_json()
        self.assertTrue(reto["unido"])
        self.assertEqual((reto["unidad"], reto["creador"], reto["participantes"]), ("km", "Vos", 1))
        otro = self.nuevo_usuario("ve.reto@test.com")
        self.assertTrue(any(c["id"] == reto["id"] for c in self.c.get("/api/challenges?tab=grupales", headers=otro).get_json()))
        self.assertTrue(any("50 km en dos semanas" in a["texto"] for a in self.c.get("/api/activity", headers=otro).get_json()))

    @cp("CP-42")
    def test_42_crear_reto_invalido(self):
        """Crear un reto con datos inválidos"""
        hoy = date.today()
        for cambios in ({"titulo": "ab"}, {"meta": 0}, {"meta": "mucho"}, {"metrica": "pasos"}, {"tipo": "secreto"},
                        {"fecha_fin": hoy.isoformat()}, {"fecha_inicio": (hoy - timedelta(days=1)).isoformat()},
                        {"fecha_fin": "31/12/2026"}):
            r = self.c.post("/api/challenges", headers=self.H, json=self.reto_valido(**cambios))
            self.assertEqual(r.status_code, 400, cambios)
            self.assertIn("error", r.get_json())

    @cp("CP-43")
    def test_43_reto_individual_privado(self):
        """Un reto individual solo lo ve quien lo creó"""
        H = self.nuevo_usuario("individual@test.com")
        reto = self.c.post("/api/challenges", headers=H, json=self.reto_valido(tipo="individual", titulo="Mi reto")).get_json()
        self.assertTrue(any(c["id"] == reto["id"] for c in self.c.get("/api/challenges?tab=activos", headers=H).get_json()))
        otro = self.nuevo_usuario("no.ve@test.com")
        self.assertFalse(any(c["id"] == reto["id"] for c in self.c.get("/api/challenges?tab=grupales", headers=otro).get_json()))

    @cp("CP-44")
    def test_44_progreso_reto_creado(self):
        """El progreso de un reto creado se actualiza al entrenar y se completa"""
        H = self.nuevo_usuario("progreso@test.com")
        reto = self.c.post("/api/challenges", headers=H, json=self.reto_valido(metrica="entrenos", meta=2)).get_json()
        for _ in range(2):
            self.c.post("/api/workouts/running", headers=H, json={"distancia_km": 5, "duracion_min": 30})
        comp = self.c.get("/api/challenges?tab=completados", headers=H).get_json()
        self.assertTrue(any(c["id"] == reto["id"] for c in comp))

    @cp("CP-45")
    def test_45_crear_reto_sin_sesion(self):
        """Crear un reto sin iniciar sesión"""
        self.assertEqual(self.c.post("/api/challenges", json=self.reto_valido()).status_code, 401)

    @classmethod
    def tearDownClass(cls):
        out = Path(__file__).with_name("resultados.json")
        out.write_text(json.dumps(dict(sorted(RESULTADOS.items())), ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    unittest.main(verbosity=2)
