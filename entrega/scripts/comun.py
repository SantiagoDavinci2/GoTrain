"""Utilidades compartidas por los scripts de capturas y videos."""
import subprocess
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
ENTREGA = RAIZ / "entrega"
BACKEND_PY = RAIZ / "backend" / ".venv" / "Scripts" / "python.exe"
WEB = "http://localhost:5173"
MOBILE = "http://localhost:8081"
DEMO = ("santiago@gotrain.com", "gotrain123")


def reset_datos():
    """Vuelve a cargar los datos de ejemplo (el backend puede seguir corriendo)."""
    subprocess.run([str(BACKEND_PY), "seed.py"], cwd=RAIZ / "backend", check=True,
                   capture_output=True)


def esperar(page, ms=600):
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(ms)
