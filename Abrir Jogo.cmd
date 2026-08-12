@echo off
setlocal
set "GAME=%~dp0index.html"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" (
  start "Aventura Matematica" "%EDGE%" --allow-file-access-from-files --autoplay-policy=no-user-gesture-required --app="file:///%GAME:\=/%" --start-maximized
) else (
  start "Aventura Matematica" "%GAME%"
)
endlocal
