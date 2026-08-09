@echo off
setlocal
set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" (
  echo Inno Setup 6 nao foi encontrado.
  echo Instale-o apenas no computador usado para criar o instalador.
  echo Consulte README.md, secao "Criar o instalador Windows".
  pause
  exit /b 1
)
python tools\gerar-banco-js.py
if errorlevel 1 exit /b 1
"%ISCC%" installer\AventuraMatematica.iss
if errorlevel 1 exit /b 1
echo.
echo Instalador criado em installer\Output\Instalar-Aventura-Matematica.exe
pause
