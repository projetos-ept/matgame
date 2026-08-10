#define MyAppName "Aventura Matemática"
#define MyAppVersion "1.2.0"
#define MyAppPublisher "Projeto Escolar"
#define MyAppLauncher "Abrir Jogo.cmd"

[Setup]
AppId={{4C798141-1DCE-46D8-807C-7C2A47D8DB89}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\AventuraMatematica
DefaultGroupName={#MyAppName}
PrivilegesRequired=lowest
OutputDir=Output
OutputBaseFilename=Instalar-Aventura-Matematica
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName={#MyAppName}
ArchitecturesAllowed=x64compatible

[Files]
; Os MIDI sao excluidos da regra geral e incluidos explicitamente abaixo. Assim,
; uma compilacao nunca depende de o wildcard recursivo reconhecer esses binarios.
Source: "..\*"; DestDir: "{app}"; Excludes: ".git\*,installer\Output\*,.gitkeep,assets\audio\soundtrack\*.mid"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\assets\audio\soundtrack\NinjaForest.mid"; DestDir: "{app}\assets\audio\soundtrack"; Flags: ignoreversion
Source: "..\assets\audio\soundtrack\T_SoldierBlade_Track03.mid"; DestDir: "{app}\assets\audio\soundtrack"; Flags: ignoreversion
Source: "..\assets\audio\soundtrack\Zone1-MG.mid"; DestDir: "{app}\assets\audio\soundtrack"; Flags: ignoreversion
Source: "..\assets\audio\soundtrack\City_Hunter_Level_1.mid"; DestDir: "{app}\assets\audio\soundtrack"; Flags: ignoreversion
Source: "..\assets\audio\soundtrack\salalvl2.mid"; DestDir: "{app}\assets\audio\soundtrack"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppLauncher}"; WorkingDir: "{app}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppLauncher}"; WorkingDir: "{app}"

[Run]
Filename: "{app}\{#MyAppLauncher}"; Description: "Abrir {#MyAppName}"; Flags: postinstall nowait skipifsilent
