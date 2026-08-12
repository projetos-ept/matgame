@echo off
setlocal
set "GAME=%~dp0index.html"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" (
  start "Aventura Matematica" "%EDGE%" --app="file:///%GAME:\=/%" --start-maximized
) else (
  start "Aventura Matematica" "%GAME%"
)
endlocal
