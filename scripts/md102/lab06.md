# Lab 06: Mogelijkheden uitbreiden

## Situatie

Je hebt in de vorige labs een volledige Intune-omgeving opgebouwd. In deze laatste lab gebruik je aanvullende mogelijkheden uit de Microsoft Intune Suite. Je configureert Endpoint Privilege Management, implementeert Remote Help, gebruikt Advanced Analytics en Device Query en verkent Windows 365 en Azure Virtual Desktop.

## Wat wordt van je verwacht?

Na deze lab kan je:

- Endpoint Privilege Management activeren op beheerde toestellen;
- automatic, user-confirmed en support-approved elevation rules configureren;
- EPM-regels testen met een standaardgebruiker;
- EPM-rapporten raadplegen;
- Remote Help inschakelen, licentiëren, verpakken en implementeren;
- een Remote Help-sessie starten en de sessielogs controleren;
- gedelegeerde Remote Help-toegang via RBAC en scope tags testen;
- Advanced Analytics-rapporten interpreteren;
- Device Query gebruiken voor live en multi-device KQL-queries;
- vanuit queryresultaten een Microsoft Entra security group maken;
- uitleggen hoe Windows 365 Cloud PCs worden geprovisioneerd en beheerd;
- uitleggen hoe Azure Virtual Desktop-session hosts in Intune worden beheerd.

## Vereisten

- De vorige labs zijn voltooid.
- De Microsoft Intune Suite-trial is actief.
- Je hebt Global Administrator- of Intune Administrator-rechten.
- SEA-DEV1, SEA-DEV2 en SEA-DEV3 zijn beschikbaar.
- sg-Intune-Pilot-Users en dyn-Windows-Devices bestaan.
- Lee Gu heeft de Pharmacy Helpdesk-role uit Lab 05.

## Oefening 1: Endpoint Privilege Management configureren

### Situatie

Endpoint Privilege Management laat standaardgebruikers specifieke toepassingen met verhoogde rechten uitvoeren zonder hen permanent lokale administratorrechten te geven. Je configureert drie soorten elevation rules en test hoe deze zich voor de gebruiker gedragen.

### Deel 1: Controleren of EPM beschikbaar is

Locatie:
Endpoint security → Endpoint Privilege Management

Controleer of de volgende onderdelen beschikbaar zijn:
- Overview
- Reports
- Policies
- Reusable settings
- Elevation requests

Er is geen afzonderlijke tenantbrede knop waarmee je EPM inschakelt. EPM wordt op een toestel geactiveerd via een Windows elevation settings policy waarin Endpoint Privilege Management op Enabled staat.

Wanneer een licentiemelding verschijnt, controleer je of de Microsoft Intune Suite-trial correct geactiveerd is.

### Deel 2: Een elevation settings policy maken

Locatie:
Endpoint security → Endpoint Privilege Management → Policies

Maak een policy met:
- Platform: Windows
- Profile: Windows elevation settings policy

Basics:
- Name: EPM Settings - Default Behavior
- Description: Default EPM settings for the Contoso fleet

Configuration settings:
- Endpoint Privilege Management: Enabled
- Default elevation response: Require user confirmation
- Validation: Business justification
- Send elevation data for reporting: Yes
- Reporting scope: Diagnostic data and managed elevations only

Assignment:
- dyn-Windows-Devices

Deze policy installeert de EPM-agent en bepaalt het standaardgedrag wanneer geen specifiekere elevation rule van toepassing is. Not Configured gedraagt zich als Deny all requests.

### Deel 3: Automatic elevation voor Registry Editor

Locatie:
Endpoint security → Endpoint Privilege Management → Policies

Maak een policy met:
- Platform: Windows
- Profile: Elevation rules policy
- Name: EPM Rules - Automatic Elevation
- Description: Allows Registry Editor to always run elevated

Maak onder Privilege Management een rule met:
- Rule name: Elevate Registry Editor
- Description: Automatically elevates regedit.exe without user prompt
- Elevation type: Automatic
- File name: regedit.exe
- File path: C:\Windows\regedit.exe
- Signature source: Not configured

Bepaal op SEA-DEV1 de SHA256-hash:

```powershell
Get-FileHash -Path "C:\Windows\regedit.exe" -Algorithm SHA256
```

Kopieer de hash naar File hash in de rule.

Assignment:
- sg-Intune-Pilot-Users

### Deel 4: User-confirmed elevation voor MSConfig

Maak een tweede Elevation rules policy:
- Name: EPM Rules - User Confirmed Elevation
- Description: Prompts user to approve elevation for MSConfig

Rule properties:
- Rule name: Elevate MSConfig with User Confirmation
- Elevation type: User confirmed
- Validation: Business justification
- File name: msconfig.exe
- File path: C:\Windows\System32\msconfig.exe
- Signature source: Not configured

Bepaal de SHA256-hash:

```powershell
Get-FileHash -Path "C:\Windows\System32\msconfig.exe" -Algorithm SHA256
```

Gebruik de hash in File hash.

Assignment:
- sg-Intune-Pilot-Users

### Deel 5: Support-approved elevation voor Command Prompt

Maak een derde Elevation rules policy:
- Name: EPM Rules - Support Approved Elevation
- Description: Requires help desk approval for CMD elevation

Rule properties:
- Rule name: Elevate Command Prompt with Support Approval
- Elevation type: Support approved
- File name: cmd.exe
- File path: C:\Windows\System32\cmd.exe
- Signature source: Not configured

Bepaal de SHA256-hash:

```powershell
Get-FileHash -Path "C:\Windows\System32\cmd.exe" -Algorithm SHA256
```

Gebruik de hash in File hash.

Assignment:
- sg-Intune-Pilot-Users

### Deel 6: EPM testen op SEA-DEV3

SEA-DEV3 moet Microsoft Entra joined zijn en gebruikt worden door een standaardgebruiker.

1. Meld je eerst aan met het lokale Admin-account.
2. Ga naar Settings → Accounts → Access work or school → Connect.
3. Kies Join this device to Microsoft Entra ID.
4. Voltooi de join met een account uit de tenant.
5. Meld je daarna aan als Alex Wilber of een andere standaardgebruiker uit de pilootgroep.
6. Synchroniseer het toestel en geef de policies tijd om toe te passen.

Als Run with elevated access niet zichtbaar is, open dan Show more options of gebruik Shift+F10. Controleer daarnaast of de EPM-policies succesvol op het toestel zijn toegepast.

Automatic elevation testen:
- Zoek regedit.
- Open de bestandslocatie.
- Klik met rechts op Registry Editor.
- Kies Run with elevated access.
- Verwacht resultaat: Registry Editor start verhoogd zonder bevestigingsprompt.

User-confirmed elevation testen:
- Zoek msconfig.
- Open de bestandslocatie.
- Klik met rechts op System Configuration.
- Kies Run with elevated access.
- Verwacht resultaat: de gebruiker moet de elevation bevestigen en een business justification invoeren.
- Gebruik bijvoorbeeld: Troubleshooting startup issues.

Support-approved elevation testen:
- Zoek cmd.
- Open de bestandslocatie.
- Klik met rechts op Command Prompt.
- Kies Run with elevated access.
- Voer als justification bijvoorbeeld in: Need elevated command prompt for script execution.
- Verwacht resultaat: de aanvraag wacht op goedkeuring door support.

Controleer bij afwijkend gedrag het EPM-policyrapport voor SEA-DEV3 en synchroniseer het toestel opnieuw.

### Deel 7: EPM-rapporten controleren

Locatie:
Endpoint security → Endpoint Privilege Management → Reports

Bekijk:
- Elevation report
- Managed elevations report
- Elevation report by applications
- Elevation report by publisher
- Elevation report by user

Houd er rekening mee dat nieuwe elevation data vertraagd in de rapporten kan verschijnen.

## Oefening 2: Remote Help implementeren

### Situatie

Remote Help biedt beveiligde en gelogde ondersteuning op afstand. Je schakelt Remote Help in, controleert de licenties, implementeert de client als Win32-app en voert een supportsessie uit.

### Deel 1: Remote Help inschakelen

Locatie:
Tenant administration → Remote Help → Settings

Configureer:
- Enable Remote Help: Enabled
- Allow Remote Help to unenrolled devices: Not allowed
- Disable Chat: No

### Deel 2: Licenties controleren

Locatie:
Microsoft 365 admin center → Users → Active users

Controleer dat Microsoft Intune Suite is toegewezen aan:
- Megan Bowen, helper
- Joni Sherman, sharer
- Lee Gu, Pharmacy Helpdesk

Zowel de helper als de gebruiker die hulp ontvangt heeft een geschikte Remote Help-licentie nodig.

### Deel 3: Remote Help verpakken en implementeren

Download de actuele Remote Help-installer via de officiële Microsoft-downloadlocatie.

Wanneer het .intunewin-package al door de labomgeving wordt geleverd, gebruik je dat package. Anders maak je zelf een package met de Microsoft Win32 Content Prep Tool.

Verplaats de installer naar de bronmap:

```powershell
Move-Item "$env:USERPROFILE\Downloads\remotehelp\*.exe" "C:\LabAssets\Win32-App\Source\remotehelpinstaller.exe"
Get-ChildItem "C:\LabAssets\Win32-App\Source\remotehelpinstaller.exe"
```

Ga naar de map met IntuneWinAppUtil:

```powershell
Set-Location "C:\Program Files\IntuneWinAppUtil"
```

Maak het package:

```powershell
.\IntuneWinAppUtil.exe `
    -c "C:\LabAssets\Win32-App\Source" `
    -s "remotehelpinstaller.exe" `
    -o "C:\LabAssets\Win32-App\Output"
```

Locatie in Intune:
Apps → All apps → Create → Windows app (Win32)

App information:
- Name: Remote Help
- Description: Secure remote assistance app for enrolled devices
- Publisher: Microsoft Corporation

Program:
- Install command: remotehelpinstaller.exe /quiet acceptTerms=1
- Uninstall command: remotehelpinstaller.exe /uninstall /quiet acceptTerms=1
- Install behavior: System

Requirements:
- Check operating system architecture: Yes
- Install on x64-system: geselecteerd
- Minimum operating system: Windows 10 1607

Detection rules:
- Rules format: Manually configure detection rules
- Rule type: File
- Path: C:\Program Files\Remote help
- File or folder: RemoteHelp.exe
- Detection method: File or folder exists
- Associated with a 32-bit app on 64-bit clients: No

Assignment:
- Required: dyn-Windows-Devices

Controleer na synchronisatie of Remote Help op SEA-DEV1 en SEA-DEV2 is geïnstalleerd.

### Deel 4: Een Remote Help-sessie uitvoeren

Helper:
- Toestel: SEA-DEV1
- Gebruiker: Megan Bowen

Sharer:
- Toestel: SEA-DEV2
- Gebruiker: Joni Sherman

Op SEA-DEV1:
1. Start Remote Help.
2. Meld je aan als Megan Bowen.
3. Kies Give help → Get a security code.
4. Noteer de beveiligingscode.

Op SEA-DEV2:
1. Start Remote Help.
2. Meld je aan als Joni Sherman.
3. Voer onder Get Help de code van Megan in.
4. Dien de aanvraag in.

Op SEA-DEV1:
- Kies View screen wanneer Joni klaar is om hulp te ontvangen.

Op SEA-DEV2:
- Controleer wie de helper is.
- Sta de sessie toe.

Test tijdens de sessie:
- View screen
- Chat
- Request control, indien toegestaan
- Session beëindigen

Wanneer Remote Help meldt dat het toestel compliant moet zijn, controleer je eerst de compliance status en de policies uit de vorige labs. Maak geen onnodige uitzonderingen zonder de oorzaak te onderzoeken.

### Deel 5: Remote Help session logs controleren

Locatie:
Tenant administration → Remote Help → Remote Help sessions

Controleer:
- Provider ID
- Recipient ID
- Recipient name
- Device name
- OS
- Session start
- Session end

### Deel 6: Pharmacy Helpdesk-scope testen

Meld je in een InPrivate- of Incognito-venster aan als Lee Gu.

Locatie:
Devices → All devices

Controleer dat Lee Gu alleen toestellen ziet die binnen zijn scope groups en Pharmacy scope vallen.

Selecteer een zichtbaar Pharmacy-toestel en ga naar Remote actions → Begin a remote assistance session.

Controleer dat Lee Gu voor dit toestel een Remote Help-sessie kan starten.

Een toestel buiten zijn scope hoort niet zichtbaar te zijn. De role permissions, scope groups en scope tags bepalen samen waarop Lee Gu Remote Help mag gebruiken.

## Oefening 3: Advanced Analytics en Device Query

### Situatie

Advanced Analytics geeft inzicht in prestaties, afwijkingen en resourcegebruik. Device Query gebruikt KQL om live informatie van één toestel of inventorydata van meerdere toestellen op te vragen zonder eerst een Remote Help-sessie te starten.

Nieuwe tenants kunnen nog onvoldoende data bevatten. Advanced Analytics en multi-device inventory hebben tijd nodig om gegevens te verzamelen.

### Deel 1: Advanced Analytics bekijken

Locatie:
Reports → Analytics → Endpoint analytics

Anomalies:
- Device anomalies
- User anomalies
- Application anomalies

Resource performance:
- CPU performance
- Memory performance
- Disk performance

Battery health, indien relevante toestellen aanwezig zijn:
- Battery capacity degradation
- Charging behavior

Lege dashboards of Insufficient data zijn mogelijk wanneer nog onvoldoende telemetrie beschikbaar is.

### Deel 2: Live Device Query op SEA-DEV1

Locatie:
Devices → Windows → SEA-DEV1 → Monitor → Device query

CPU-informatie:

```kusto
Cpu
| project ProcessorId, Model, Architecture, CpuStatus, CoreCount, LogicalProcessorCount, Manufacturer
```

BitLocker-status:

```kusto
EncryptableVolume
| project VolumeId, WindowsDriveLetter, ProtectionStatus, EncryptionMethod
```

Controleer of de OS-drive PROTECTED toont. Hiermee controleer je de werkelijke toestelstatus en niet alleen of de BitLocker-policy werd toegewezen.

OS-versie:

```kusto
OsVersion
| project OsVersion, BuildVersion, Architecture
```

Noteer de buildversie voor vergelijking met de targetversie uit de feature update-policy.

### Deel 3: Properties catalog voor multi-device query

Wanneer de vereiste properties nog niet centraal worden verzameld, maak je een policy.

Locatie:
Devices → Manage devices → Configuration → Create → New Policy

Configureer:
- Platform: Windows 10 and later
- Profile type: Properties catalog
- Name: Device Query Properties Catalog
- Description: Collects properties required for Device Query labs

Voeg toe:
- CPU
- Encryptable Volume
- Logical Drive
- OS Version

Assignment:
- All devices

Initiële gegevensverzameling kan vertraagd zijn. Een lege query betekent niet automatisch dat de query fout is.

### Deel 4: Multi-device Device Query

Locatie:
Devices → Device query

Niet-versleutelde toestellen zoeken:

```kusto
EncryptableVolume
| where ProtectionStatus != "PROTECTED"
| join LogicalDrive on Device
| distinct Device
```

Wanneer resultaten beschikbaar zijn, gebruik je Add all items to a group en maak je:
- Group name: sg-Devices-Unencrypted
- Description: Devices identified by Device Query as not BitLocker-encrypted

Toestellen zoeken met een build lager dan de fleet target:

```kusto
OsVersion
| where toint(BuildVersion) < 26200
| project Device, OsVersion, BuildVersion
| order by BuildVersion asc
```

Een leeg resultaat betekent dat de bevraagde toestellen op of boven de targetbuild zitten, of dat nog geen inventorydata beschikbaar is. Controleer dus ook de inventory status.

Processorarchitecturen samenvatten:

```kusto
Cpu
| summarize DeviceCount = count() by Architecture
```

Exporteer het resultaat naar CSV. Aggregate resultaten kunnen niet rechtstreeks worden omgezet naar een toestelgroep omdat ze geen afzonderlijke toestellen bevatten.

## Oefening 4: Windows 365 Cloud PC-provisioning verkennen

### Situatie

Windows 365 biedt persoonlijke, cloudgehoste Windows-desktops. Deze oefening is een demonstratie wanneer de vereiste Windows 365-licenties of Azure-resources niet beschikbaar zijn.

### Deel 1: Provisioning policy

Locatie:
Devices → Manage Windows 365 Cloud PCs → Provisioning Cloud PCs

Bekijk de workflow voor Create provisioning policy.

Basics:
- Policy name
- Join type: Microsoft Entra join of Hybrid Microsoft Entra join
- Network: Microsoft-hosted network of Azure network connection

Image:
- Gallery image, bijvoorbeeld Windows 11 Enterprise met Microsoft 365 Apps
- Custom image vanuit Azure Compute Gallery

Configuration:
- License type: Enterprise, Business of Frontline
- Region
- Enable single sign-on

Assignment:
- De provisioning policy wordt toegewezen aan Microsoft Entra groups.
- Gebruikers met een geldige licentie ontvangen op basis van de assignment een Cloud PC.

User experience:
- De gebruiker opent Windows 365 via browser of de Windows App/Remote Desktop-client.
- De Cloud PC verschijnt voor de toegewezen gebruiker.
- Het toestel wordt daarna via Intune beheerd.

### Deel 2: Cloud PC-beheer in Intune

Cloud PCs verschijnen in Devices → All devices als corporate Windows-toestellen die door Intune worden beheerd.

Ze kunnen dezelfde soorten policies ontvangen als fysieke toestellen:
- Configuration profiles
- Compliance policies
- Applications
- Security baselines

Cloud PC-specifieke acties zijn onder andere:
- Restart
- Resize
- Restore
- Reprovision

Bespreek het verschil tussen deze acties. Reprovision maakt het toestel opnieuw op basis van de provisioningconfiguratie en is ingrijpender dan een restart of restore.

## Oefening 5: Azure Virtual Desktop session hosts verkennen

### Situatie

Azure Virtual Desktop gebruikt session hosts voor persoonlijke of multi-session desktops. Deze oefening is een demonstratie wanneer geen Azure Virtual Desktop-omgeving beschikbaar is.

### Deel 1: AVD-architectuur en inschrijving

Belangrijke onderdelen:
- Host pool: verzameling session hosts met een gemeenschappelijke configuratie
- Session hosts: Windows 10 of Windows 11 Enterprise multi-session VM's
- Workspace: de gebruikersinterface waarin desktops en RemoteApps worden gepubliceerd

Intune-inschrijving:
- Session hosts zijn Microsoft Entra joined of Hybrid Microsoft Entra joined.
- Automatic MDM enrollment moet correct geconfigureerd zijn.
- De session hosts schrijven zich tijdens provisioning in bij Intune.

Policy-aandachtspunten:
- User-based policies gelden binnen de gebruikerssessie.
- Device-based policies gelden voor de session host-VM.
- Multi-session policies moeten rekening houden met meerdere gelijktijdige gebruikers.
- FSLogix wordt doorgaans gebruikt voor profielbeheer.

### Deel 2: AVD session hosts in Intune

Locatie:
Devices → All devices

AVD-session hosts worden weergegeven als door Intune beheerde Windows Enterprise multi-session-toestellen.

Ze kunnen ontvangen:
- Configuration profiles
- Compliance policies
- Applications
- Antivirus- en firewallbeleid
- Updatebeleid dat afgestemd is op AVD-maintenance windows

Aandachtspunten:
- Beoordeel BitLocker afzonderlijk voor Azure-VM's; Azure managed disks bieden encryptie at rest en de infrastructuur verschilt van een fysiek toestel.
- Gebruik FSLogix voor gebruikersprofielen in multi-session scenario's.
- Stem updates en herstarts af op de host pool en onderhoudsvensters.
- Test policies eerst op een beperkte set session hosts voordat je ze breed toepast.

## Eindresultaat

In deze lab heb je:
- EPM op Windows-toestellen geactiveerd;
- automatic, user-confirmed en support-approved elevation rules gemaakt;
- SHA256-hashes gebruikt om specifieke bestanden te identificeren;
- elevation scenarios met een standaardgebruiker getest;
- EPM-rapporten bekeken;
- Remote Help ingeschakeld en gelicentieerd;
- Remote Help als Win32-app verpakt en geïmplementeerd;
- een Remote Help-sessie uitgevoerd en de logs gecontroleerd;
- gedelegeerde Remote Help-toegang voor Pharmacy Helpdesk getest;
- Advanced Analytics-rapporten bekeken;
- live en multi-device KQL-queries uitgevoerd;
- een Entra security group gemaakt vanuit Device Query-resultaten;
- de provisioning en het beheer van Windows 365 Cloud PCs verkend;
- de Intune-inschrijving en het beheer van AVD-session hosts verkend.
