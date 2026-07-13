; Nook Windows installer (Inno Setup 6)

#define MyAppName "Nook"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "NookWorks"
#define MyAppURL "https://github.com/sokx6/Nook"
#define MyAppExeName "Nook.exe"

[Setup]
AppId={{3A7F1C8B-2D4E-5F6A-7890-BCDEF0123456}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
ArchitecturesInstallIn64BitMode=x64compatible
ArchitecturesAllowed=x64compatible
PrivilegesRequired=admin
LicenseFile=LICENSE
SetupIconFile=build\nook.ico
OutputDir=installer
OutputBaseFilename={#MyAppName}-{#MyAppVersion}-setup-x64
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
VersionInfoVersion={#MyAppVersion}.0
UninstallDisplayIcon={app}\{#MyAppExeName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional shortcuts:"

[Files]
Source: "frontend\release\Nook-win32-x64\*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{tmp}\OllamaSetup.exe"; Parameters: "/S"; StatusMsg: "Installing Ollama..."; Flags: runhidden waituntilterminated; Check: ShouldInstallOllama

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
var
  DownloadPage: TDownloadWizardPage;

function IsOllamaInstalled: Boolean;
begin
  Result := FileSearch('ollama.exe', GetEnv('PATH')) <> '';
  if not Result then
    Result := RegKeyExists(HKCU,
      'Software\Microsoft\Windows\CurrentVersion\Uninstall\Ollama');
  if not Result then
    Result := RegKeyExists(HKLM,
      'Software\Microsoft\Windows\CurrentVersion\Uninstall\Ollama');
  if not Result then
    Result := FileExists(ExpandConstant(
      '{localappdata}\Programs\Ollama\ollama.exe'));
  if not Result then
    Result := FileExists(ExpandConstant('{autopf}\Ollama\ollama.exe'));
end;

function ShouldInstallOllama: Boolean;
begin
  Result := not IsOllamaInstalled;
end;

procedure InitializeWizard;
begin
  DownloadPage := CreateDownloadPage(
    SetupMessage(msgWizardPreparing), SetupMessage(msgPreparingDesc), nil);
  DownloadPage.ShowBaseNameInsteadOfUrl := True;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  Error: String;
begin
  if (CurPageID = wpReady) and ShouldInstallOllama then begin
    DownloadPage.Clear;
    DownloadPage.Add('https://ollama.com/download/OllamaSetup.exe',
      'OllamaSetup.exe', '');
    DownloadPage.Show;
    try
      try
        DownloadPage.Download;
        Result := True;
      except
        if DownloadPage.AbortedByUser then
          Log('Ollama download aborted by user.')
        else begin
          Error := Format('%s: %s', [DownloadPage.LastBaseNameOrUrl,
            GetExceptionMessage]);
          SuppressibleMsgBox(AddPeriod(Error), mbCriticalError, MB_OK, IDOK);
        end;
        Result := False;
      end;
    finally
      DownloadPage.Hide;
    end;
  end else
    Result := True;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usUninstall then begin
    Exec(ExpandConstant('{cmd}'), '/C taskkill /f /im nook-backend.exe', '',
      SW_HIDE, ewWaitUntilTerminated, ResultCode);
    if MsgBox('Delete chat history and settings?', mbConfirmation, MB_YESNO) = IDYES then
      DelTree(ExpandConstant('{userappdata}\Nook'), True, True, True);
  end;
end;
