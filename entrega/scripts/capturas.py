"""Saca las capturas de pantalla de la web y de la app mobile para los manuales.

Requiere backend (5000), web (5173) y Expo web (8081) corriendo.
"""
import sys
from playwright.sync_api import sync_playwright
from comun import ENTREGA, WEB, MOBILE, DEMO, reset_datos, esperar

OUT = ENTREGA / "capturas"


def web(b):
    ctx = b.new_context(viewport={"width": 1366, "height": 768}, device_scale_factor=1, locale="es-AR")
    p = ctx.new_page()
    shot = lambda n, full=False: (esperar(p), p.screenshot(path=str(OUT / f"web_{n}.png"), full_page=full))

    p.goto(WEB); shot("01_landing", True)
    p.goto(WEB + "/registro"); shot("02_registro")
    p.goto(WEB + "/login"); esperar(p)
    p.get_by_role("button", name="Iniciar Sesión →").click(); shot("03_login_validacion")
    p.get_by_placeholder("✉  Email").fill(DEMO[0])
    p.get_by_placeholder("🔒  Contraseña").fill("incorrecta")
    p.get_by_role("button", name="Iniciar Sesión →").click(); shot("04_login_error")
    p.get_by_placeholder("🔒  Contraseña").fill(DEMO[1])
    p.get_by_role("button", name="Iniciar Sesión →").click()
    p.wait_for_url("**/app"); shot("05_inicio", True)

    p.get_by_placeholder("🔍 Buscar entrenamientos, usuarios...").fill("Leg"); shot("06_busqueda")
    p.keyboard.press("Escape"); p.get_by_placeholder("🔍 Buscar entrenamientos, usuarios...").fill("")

    p.goto(WEB + "/app/entrenar"); shot("07_entrenar", True)
    p.get_by_text("+ Agregar ejercicio").click()
    p.get_by_placeholder("Ejercicio").fill("Press Militar")
    p.locator("form select").select_option("Hombros")
    p.get_by_placeholder("Series").fill("4"); p.get_by_placeholder("Reps").fill("10"); p.get_by_placeholder("Kg").fill("40")
    shot("08_agregar_ejercicio")
    p.get_by_role("button", name="Agregar", exact=True).click(); shot("09_ejercicio_agregado", True)
    p.get_by_text("▶ Iniciar Entrenamiento").click(); p.wait_for_timeout(3000); shot("10_entrenamiento_en_curso")
    p.get_by_text("✓ Finalizar y guardar entrenamiento").click(); p.wait_for_timeout(500); shot("11_entrenamiento_guardado")
    p.get_by_text("+ Nueva salida").click()
    p.get_by_placeholder("Distancia (km)").fill("7"); p.get_by_placeholder("Duración (min)").fill("35"); shot("12_running")
    p.get_by_role("button", name="Guardar").click(); p.wait_for_timeout(500); shot("13_running_guardado")

    p.goto(WEB + "/app/retos"); shot("14_retos_activos")
    p.get_by_text("Ver ranking").first.click(); shot("15_retos_ranking")
    p.get_by_role("button", name="Grupales").click(); shot("16_retos_grupales")
    p.locator(".ch-card", has_text="10 entrenos").get_by_text("Unirme").click(); p.wait_for_timeout(400); shot("17_reto_unirse")
    p.get_by_role("button", name="🔥 Actividad").click(); shot("18_actividad")
    p.locator(".act-like").first.click(); shot("19_actividad_like")
    p.get_by_role("button", name="Completados").click(); shot("20_retos_completados")

    p.goto(WEB + "/app/coach"); shot("21_coach")
    p.get_by_text("Tengo 55 minutos, quiero pecho y tríceps").click()
    p.locator(".routine-card").first.wait_for(timeout=60000); shot("22_coach_rutina")
    p.get_by_text("Importar al log de hoy").click(); p.get_by_text("Rutina importada").wait_for(); shot("23_coach_importada")
    p.goto(WEB + "/app/entrenar"); shot("24_entrenar_rutina_importada")

    p.goto(WEB + "/app/perfil"); shot("25_perfil", True)
    p.goto(WEB + "/app/configuracion"); shot("26_configuracion")
    p.get_by_role("button", name="Guardar cambios").click(); p.wait_for_timeout(400); shot("27_perfil_actualizado")
    ctx.close()


def mobile(b):
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, locale="es-AR")
    p = ctx.new_page()
    shot = lambda n: (esperar(p, 900), p.screenshot(path=str(OUT / f"app_{n}.png")))
    t = lambda txt: p.get_by_text(txt, exact=True)

    p.goto(MOBILE); t("Iniciar Sesión →").wait_for(timeout=120000); shot("01_login")
    t("Iniciar Sesión →").click(); shot("02_login_validacion")
    t("Registrate gratis").click(); shot("03_registro")
    t("Iniciá sesión").click()
    p.get_by_placeholder("✉  Email").fill(DEMO[0]); p.get_by_placeholder("🔒  Contraseña").fill(DEMO[1])
    t("Iniciar Sesión →").click(); t("Desafíos individuales y grupales").wait_for(); shot("04_retos_activos")
    t("Ranking").first.click(); shot("05_retos_ranking")
    t("Grupales").click(); shot("06_retos_grupales")
    t("🔥 Actividad").click(); shot("07_actividad")
    t("Completados").click(); shot("08_retos_completados")

    p.get_by_text("Entrenar", exact=True).last.click(); shot("09_entrenar")
    t("+ Agregar ejercicio").click()
    p.get_by_placeholder("Nombre del ejercicio").fill("Press Militar")
    p.get_by_text("🤸 Hombros").click()
    p.get_by_placeholder("Kg").fill("40"); shot("10_agregar_ejercicio")
    t("Agregar").click(); p.wait_for_timeout(500)
    t("▶ Iniciar Entrenamiento").click(); p.wait_for_timeout(2500); shot("11_entrenamiento_en_curso")
    t("✓ Finalizar y guardar").click(); p.wait_for_timeout(400); shot("12_entrenamiento_guardado")

    t("Coach").click(); shot("13_coach")
    t("Tengo 55 min, quiero pecho y tríceps").click()
    t("Importar al log de hoy").wait_for(timeout=60000); shot("14_coach_rutina")
    t("Importar al log de hoy").click(); p.get_by_text("Rutina importada", exact=False).wait_for(); shot("15_coach_importada")

    t("Perfil").click(); shot("16_perfil")
    t("✏️ Editar perfil").click(); shot("17_editar_perfil")
    t("Cancelar").click()
    p.mouse.wheel(0, 2000); shot("18_perfil_historial")
    ctx.close()


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    que = sys.argv[1:] or ["web", "mobile"]
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for parte in que:
            reset_datos()
            {"web": web, "mobile": mobile}[parte](b)
            print("listo:", parte)
        b.close()
    reset_datos()
