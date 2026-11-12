@echo off
cd /d "%~dp0mobile"
if not exist node_modules call npm install
echo Escanea el QR con Expo Go (misma red WiFi) o apreta "w" para abrirla en el navegador.
call npx expo start
pause
