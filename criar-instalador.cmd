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

rem Nao permita gerar um instalador sem as cinco trilhas esperadas.
for %%F in (
  NinjaForest.ogg
  T_SoldierBlade_Track03.ogg
  Zone1-MG.ogg
  City_Hunter_Level_1.ogg
  salalvl2.ogg
) do (
  if not exist "assets\audio\soundtrack\%%F" (
    echo ERRO: falta assets\audio\soundtrack\%%F
    echo Baixe ou copie todas as cinco trilhas antes de compilar.
    pause
    exit /b 1
  )
)

rem Remove um executavel antigo para ele nao ser confundido com a nova versao.
if exist "installer\Output\Instalar-Aventura-Matematica.exe" del /q "installer\Output\Instalar-Aventura-Matematica.exe"
python tools\gerar-banco-js.py
if errorlevel 1 exit /b 1
"%ISCC%" installer\AventuraMatematica.iss
if errorlevel 1 exit /b 1
if not exist "installer\Output\Instalar-Aventura-Matematica.exe" (
  echo ERRO: o Inno Setup terminou sem criar o instalador esperado.
  exit /b 1
)
echo.
echo Instalador criado em installer\Output\Instalar-Aventura-Matematica.exe
pause
