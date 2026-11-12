"""Inicia en segundo plano el servidor PostgreSQL propio de GoTrain, si existe y no está corriendo.

Corre separado de la ventana del backend: cerrarla (o apretar Ctrl+C) no apaga la base de datos.
Uso:  .venv\\Scripts\\python iniciar_postgres.py
"""
import os
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"))
BIN = Path(os.getenv("PG_BIN", r"C:\Program Files\PostgreSQL\17\bin"))
DATOS = Path(os.getenv("PG_DATA", Path(os.environ.get("LOCALAPPDATA", "")) / "GoTrain" / "pgdata"))
PUERTO = os.getenv("DB_PORT", "5432")


def listo():
    return subprocess.run([str(BIN / "pg_isready.exe"), "-h", "localhost", "-p", PUERTO, "-q"]).returncode == 0


if not DATOS.exists():
    sys.exit(0)  # se usa otro PostgreSQL (por ejemplo, el instalado como servicio)
if listo():
    print(f"PostgreSQL ya está corriendo (puerto {PUERTO}).")
    sys.exit(0)

print(f"Iniciando PostgreSQL (puerto {PUERTO})...")
FLAGS = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW
subprocess.run([str(BIN / "pg_ctl.exe"), "start", "-D", str(DATOS), "-o", f"-p {PUERTO}",
                "-l", str(DATOS.parent / "postgres.log"), "-w"],
               creationflags=FLAGS, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
if not listo():
    sys.exit(f"No se pudo iniciar PostgreSQL. Revisá {DATOS.parent / 'postgres.log'}")
print("PostgreSQL listo.")
