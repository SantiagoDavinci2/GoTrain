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

rem Servidor PostgreSQL de GoTrain (puerto 5433). Si existe y no esta corriendo, se inicia.
set "PGBIN=C:\Program Files\PostgreSQL\17\bin"
set "PGDATA=%LOCALAPPDATA%\GoTrain\pgdata"
if exist "%PGDATA%" (
  "%PGBIN%\pg_isready.exe" -h localhost -p 5433 >nul 2>&1 || (
    echo Iniciando PostgreSQL...
    "%PGBIN%\pg_ctl.exe" start -D "%PGDATA%" -o "-p 5433" -l "%LOCALAPPDATA%\GoTrain\postgres.log" -w >nul
  )
)

.venv\Scripts\python crear_base.py || (pause & exit /b)
.venv\Scripts\python seed.py --si-vacia
.venv\Scripts\python app.py
pause
