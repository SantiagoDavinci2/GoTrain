@echo off
cd /d "%~dp0backend"
if not exist .venv (
  echo Creando entorno virtual e instalando dependencias...
  python -m venv .venv
  .venv\Scripts\pip install -r requirements.txt
)
if not exist .env (
  copy .env.example .env >nul
  echo.
  echo Se creo backend\.env: completa los datos de PostgreSQL y volve a ejecutar este archivo.
  pause
  exit /b
)

rem PostgreSQL de GoTrain en segundo plano (cerrar esta ventana no lo apaga)
.venv\Scripts\python iniciar_postgres.py || (pause & exit /b)
.venv\Scripts\python crear_base.py || (pause & exit /b)
.venv\Scripts\python seed.py --si-vacia
.venv\Scripts\python app.py
pause
