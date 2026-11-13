@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
echo ============================================================
echo   GoTrain - Reiniciar datos de la demo
echo ============================================================
echo.
echo Vuelve a cargar los datos de ejemplo con las fechas de HOY:
echo racha de 21 dias, retos en curso, logros e historial.
echo.
echo ATENCION: borra todo lo cargado hasta ahora (entrenamientos,
echo retos creados, mensajes del coach y cuentas registradas).
echo.
choice /C SN /M "Continuar"
if errorlevel 2 (
  echo Cancelado. No se modifico nada.
  pause
  exit /b
)
echo.
.venv\Scripts\python iniciar_postgres.py || (pause & exit /b)
.venv\Scripts\python crear_base.py || (pause & exit /b)
.venv\Scripts\python seed.py || (pause & exit /b)
echo.
echo Listo. Cuenta demo: santiago@gotrain.com / gotrain123
echo Si el backend estaba abierto, no hace falta reiniciarlo.
pause
