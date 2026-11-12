"""Crea en PostgreSQL las bases de GoTrain (la de la app y la de pruebas) si todavía no existen.

Uso:  .venv\\Scripts\\python crear_base.py
Toma usuario, contraseña, host y puerto del archivo .env.
"""
import os
import sys

import psycopg
from dotenv import load_dotenv

load_dotenv()
NOMBRE = os.getenv("DB_NAME", "gotrain")

try:
    conn = psycopg.connect(dbname="postgres", user=os.getenv("DB_USER", "postgres"), password=os.getenv("DB_PASSWORD", ""),
                           host=os.getenv("DB_HOST", "localhost"), port=os.getenv("DB_PORT", "5432"), autocommit=True)
except psycopg.OperationalError as e:
    sys.exit(f"No se pudo conectar a PostgreSQL. Revisá DB_USER / DB_PASSWORD en el .env y que el servicio esté iniciado.\n{e}")

with conn:
    for base in (NOMBRE, f"{NOMBRE}_test"):
        if conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", (base,)).fetchone():
            print(f"La base '{base}' ya existe.")
        else:
            conn.execute(f'CREATE DATABASE "{base}" ENCODING \'UTF8\'')
            print(f"Base '{base}' creada.")
