"""Graba los videos demo (Web y App) recorriendo la aplicación real, con subtítulos.

Requiere backend (5000), web (5173) y Expo web (8081) corriendo.
Salida: entrega/videos/GoTrain_Demo_Web.mp4 y GoTrain_Demo_App.mp4
"""
import shutil
import subprocess
import sys
import imageio_ffmpeg
from playwright.sync_api import sync_playwright
from comun import ENTREGA, WEB, MOBILE, DEMO, reset_datos

OUT = ENTREGA / "videos"
TMP = OUT / "_tmp"
TAM = {"width": 1280, "height": 720}

CAPTION_JS = """
window.__cap = (t) => {
  let d = document.getElementById('__cap');
  if (!d) { d = document.createElement('div'); d.id='__cap';
    d.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99999;background:rgba(10,10,20,.88);'+
    'color:#fff;font:600 19px Segoe UI,Arial;padding:10px 22px;border-radius:12px;border:2px solid #e94560;max-width:80%;text-align:center;'+
    'box-shadow:0 8px 30px rgba(0,0,0,.5);transition:opacity .3s;pointer-events:none';
    document.body.appendChild(d); }
  d.style.opacity = t ? 1 : 0; d.textContent = t || '';
};
"""

PORTADA = """<html><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
background:radial-gradient(circle at 30% 30%,#3a1020,#0b0b14 60%);font-family:Segoe UI,Arial;color:#fff">
<div style="text-align:center"><div style="font-size:84px;font-weight:900;color:#e94560;letter-spacing:4px">GoTrain</div>
<div style="font-size:30px;margin-top:10px">{T}</div>
<div style="font-size:18px;color:#9b9bb0;margin-top:26px">Seminario Final · Analista de Sistemas · Da Vinci · 2026</div></div></body></html>"""

FIN = """<html><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0b14;
font-family:Segoe UI,Arial;color:#fff"><div style="text-align:center"><div style="font-size:60px;font-weight:900;color:#e94560">GoTrain</div>
<div style="font-size:24px;margin-top:14px">Entrená con comunidad, progresá con datos.</div>
<div style="font-size:16px;color:#9b9bb0;margin-top:22px">React · React Native · Flask · PostgreSQL · Claude API</div></div></body></html>"""

MARCO_APP = """<html><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;gap:70px;
background:radial-gradient(circle at 20% 40%,#2a0e1a,#0b0b14 65%);font-family:Segoe UI,Arial;color:#fff">
<div style="width:420px"><div style="font-size:54px;font-weight:900;color:#e94560">GoTrain</div>
<div style="font-size:24px;margin:8px 0 24px">App Mobile · Android</div>
<div id="paso" style="font-size:21px;line-height:1.5;color:#ddd;min-height:130px;border-left:4px solid #e94560;padding-left:16px"></div>
<div style="font-size:14px;color:#777;margin-top:30px">React Native + Expo · API Flask</div></div>
<div style="background:#111;border:4px solid #333;border-radius:42px;padding:14px 10px;box-shadow:0 0 70px rgba(233,69,96,.25)">
<iframe id="app" src="{T}" style="width:360px;height:640px;border:0;border-radius:26px;background:#0f0f1a"></iframe></div>
</body></html>"""


def pausa(p, ms=1300):
    p.wait_for_timeout(ms)


def web(b):
    ctx = b.new_context(viewport=TAM, record_video_dir=str(TMP), record_video_size=TAM, locale="es-AR")
    ctx.add_init_script(CAPTION_JS)
    p = ctx.new_page()
    cap = lambda t, ms=1800: (p.evaluate("t => window.__cap && window.__cap(t)", t), pausa(p, ms))

    p.set_content(PORTADA.replace("{T}", "Demo de la Aplicación Web")); pausa(p, 3500)
    p.goto(WEB); p.wait_for_load_state("networkidle"); cap("Landing page: presentación de GoTrain", 2500)
    p.mouse.wheel(0, 650); cap("Funciones principales de la plataforma", 2500)
    p.get_by_role("link", name="Iniciar sesión").click(); p.wait_for_load_state("networkidle")
    cap("Inicio de sesión con validación en tiempo real (HU-01)")
    p.get_by_role("button", name="Iniciar Sesión →").click(); cap("Los campos obligatorios se validan antes de enviar", 2200)
    p.get_by_placeholder("✉  Email").type(DEMO[0], delay=45)
    p.get_by_placeholder("🔒  Contraseña").type(DEMO[1], delay=70)
    p.get_by_role("button", name="Iniciar Sesión →").click(); p.wait_for_url("**/app")
    cap("Panel de inicio: estadísticas, racha, historial y logros", 3000)
    p.mouse.wheel(0, 500); cap("Próximo desafío y sugerencia del Coach IA", 2500); p.mouse.wheel(0, -500)

    p.locator(".sb-item", has_text="Entrenar").click(); p.wait_for_load_state("networkidle")
    cap("Entrenamiento del día: ejercicios, series, volumen estimado (HU-02)", 2600)
    p.get_by_text("+ Agregar ejercicio").click(); cap("Agregamos un ejercicio nuevo", 1200)
    p.get_by_placeholder("Ejercicio").type("Press Militar", delay=60)
    p.locator("form select").select_option("Hombros")
    p.get_by_placeholder("Kg").type("40", delay=80); pausa(p, 600)
    p.get_by_role("button", name="Agregar", exact=True).click(); cap("El ejercicio se suma y se recalcula el volumen", 2200)
    p.get_by_text("▶ Iniciar Entrenamiento").click(); cap("Al iniciar, corre el cronómetro de la sesión", 3500)
    p.get_by_text("✓ Finalizar y guardar entrenamiento").click(); cap("Se guarda: suma XP, racha y avance en los retos (HU-07)", 3000)

    p.locator(".sb-item", has_text="Retos").click(); p.wait_for_load_state("networkidle")
    cap("Retos individuales y grupales con progreso automático (HU-08)", 2600)
    p.get_by_text("Ver ranking").first.click(); cap("Ranking entre participantes", 2200)
    p.get_by_role("button", name="Grupales").click(); pausa(p, 700)
    p.locator(".ch-card", has_text="10 entrenos").get_by_text("Unirme").click(); cap("Unirse a un reto grupal", 2200)
    p.get_by_role("button", name="🔥 Actividad").click(); cap("Feed de actividad de la comunidad (HU-04)", 2200)
    p.locator(".act-like").first.click(); cap("Felicitar a otro atleta", 1800)

    p.locator(".sb-item", has_text="Coach IA").click(); p.wait_for_load_state("networkidle")
    cap("Coach Virtual con IA (HU-06)", 1800)
    p.get_by_placeholder("Preguntá al coach...").type("Tengo 55 minutos, quiero pecho y tríceps", delay=40)
    p.keyboard.press("Enter"); cap("El coach analiza el historial y arma una rutina personalizada", 1000)
    p.locator(".routine-card").last.wait_for(timeout=60000); pausa(p, 2600)
    p.get_by_text("Importar al log de hoy").last.click(); cap("La rutina se importa directo al entrenamiento de hoy", 2600)
    p.get_by_text("Ir a entrenar →").last.click(); p.wait_for_load_state("networkidle"); cap("Rutina lista para entrenar", 2400)

    p.locator(".sb-item", has_text="Perfil").click(); p.wait_for_load_state("networkidle")
    cap("Perfil: estadísticas, nivel, logros e historial (HU-03)", 2600)
    p.mouse.wheel(0, 500); pausa(p, 1500); p.mouse.wheel(0, -500)
    p.locator(".sb-item", has_text="Configuración").click(); cap("Edición de los datos del perfil", 1600)
    bio = p.locator("textarea"); bio.fill(""); bio.type("Atleta intermedio · Olavarría · ¡A por los 100km!", delay=30)
    p.get_by_role("button", name="Guardar cambios").click(); cap("Cambios guardados", 2000)
    p.get_by_text("← Cerrar sesión").click(); cap("Cierre de sesión", 1800)
    p.set_content(FIN); pausa(p, 3000)
    video = p.video
    ctx.close()
    return video.path()


def app(b):
    ctx = b.new_context(viewport=TAM, record_video_dir=str(TMP), record_video_size=TAM, locale="es-AR")
    p = ctx.new_page()
    p.set_content(PORTADA.replace("{T}", "Demo de la App Mobile (APK)")); pausa(p, 3500)
    p.set_content(MARCO_APP.replace("{T}", MOBILE))
    f = p.frame_locator("#app")
    paso = lambda t, ms=2000: (p.evaluate("t => document.getElementById('paso').textContent = t", t), pausa(p, ms))
    t = lambda txt: f.get_by_text(txt, exact=True)

    t("Iniciar Sesión →").wait_for(timeout=120000)
    paso("Pantalla de inicio de sesión. Valida email y contraseña antes de enviar.", 2500)
    t("Iniciar Sesión →").click(); paso("Si faltan datos, se marcan los campos con error.", 2200)
    f.get_by_placeholder("✉  Email").type(DEMO[0], delay=45)
    f.get_by_placeholder("🔒  Contraseña").type(DEMO[1], delay=70)
    t("Iniciar Sesión →").click(); t("Desafíos individuales y grupales").wait_for()
    paso("Retos activos con el progreso de cada uno.", 2500)
    t("Ranking").first.click(); paso("Ranking del reto entre los participantes.", 2200)
    t("Grupales").click(); paso("Retos grupales disponibles para sumarse.", 2000)
    f.get_by_text("Unirme", exact=True).first.click(); paso("Unirse a un reto con un toque.", 2000)
    t("🔥 Actividad").click(); paso("Feed de actividad: logros y novedades de la comunidad.", 2200)

    f.get_by_text("Entrenar", exact=True).last.click(); paso("Entrenamiento del día con ejercicios, series y volumen.", 2500)
    t("+ Agregar ejercicio").click()
    f.get_by_placeholder("Nombre del ejercicio").type("Press Militar", delay=60)
    f.get_by_text("🤸 Hombros").click(); f.get_by_placeholder("Kg").type("40", delay=80)
    paso("Se carga un ejercicio nuevo: grupo, series, repeticiones y peso.", 1500)
    t("Agregar").click(); pausa(p, 900)
    t("▶ Iniciar Entrenamiento").click(); paso("Cronómetro de la sesión en curso.", 3500)
    t("✓ Finalizar y guardar").click(); paso("Al finalizar se suman XP, racha y progreso de retos.", 2500)

    t("Coach").click(); paso("Coach Virtual con IA.", 1500)
    f.get_by_placeholder("Preguntá al coach...").type("Armame un leg day", delay=50)
    f.get_by_placeholder("Preguntá al coach...").press("Enter")
    paso("El coach arma una rutina según el historial del usuario.", 500)
    t("Importar al log de hoy").last.wait_for(timeout=60000); pausa(p, 2500)
    t("Importar al log de hoy").last.click(); paso("La rutina se importa al entrenamiento de hoy.", 2500)

    t("Perfil").click(); paso("Perfil con estadísticas, nivel y logros desbloqueados.", 2800)
    f.locator("body").hover(); p.mouse.move(640, 400); p.mouse.wheel(0, 900); paso("Historial de entrenamientos recientes.", 2500)
    p.set_content(FIN); pausa(p, 3000)
    video = p.video
    ctx.close()
    return video.path()


def a_mp4(webm, destino):
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(webm), "-c:v", "libx264", "-preset", "slow", "-crf", "20",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(destino)], check=True)


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True); TMP.mkdir(exist_ok=True)
    que = sys.argv[1:] or ["web", "app"]
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for parte in que:
            reset_datos()
            webm = {"web": web, "app": app}[parte](b)
            destino = OUT / f"GoTrain_Demo_{'Web' if parte == 'web' else 'App'}.mp4"
            a_mp4(webm, destino)
            print("listo:", destino)
        b.close()
    shutil.rmtree(TMP, ignore_errors=True)
    reset_datos()
