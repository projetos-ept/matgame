#define MyAppName "Aventura Matemática"
#define MyAppVersion "1.1.0"
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
Source: "..\*"; DestDir: "{app}"; Excludes: ".git\*,installer\Output\*,.gitkeep"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppLauncher}"; WorkingDir: "{app}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppLauncher}"; WorkingDir: "{app}"

[Run]
Filename: "{app}\{#MyAppLauncher}"; Description: "Abrir {#MyAppName}"; Flags: postinstall nowait skipifsilent
