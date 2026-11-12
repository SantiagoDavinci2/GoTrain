@echo off
cd /d "%~dp0backend"
if not exist .venv (
  echo Creando entorno virtual e instalando dependencias...
  python -m venv .venv
  .venv\Scripts\pip install -r requirements.txt
)
if not exist instance\gotrain.db if not exist gotrain.db .venv\Scripts\python seed.py
.venv\Scripts\python app.py
pause
