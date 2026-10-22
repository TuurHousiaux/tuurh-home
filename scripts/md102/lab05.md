# Lab 05: Automatiseren en operationeel beheren

## Situatie

Je bent Jordan Chen, Modern Endpoint Administrator bij Contoso Healthcare. De Intune-omgeving is ondertussen opgebouwd: toestellen zijn ingeschreven, applicaties zijn uitgerold en beveiligingspolicies zijn geconfigureerd.

In deze lab automatiseer je beheertaken met Microsoft Graph PowerShell, implementeer je Remediations, werk je de gedelegeerde Pharmacy Helpdesk-rol af, onderzoek je auditlogs en gebruik je de ingebouwde Intune-rapporten.

## Wat wordt van je verwacht?

Na deze lab kan je:

- Microsoft Graph PowerShell installeren en gebruiken;
- een app registration configureren voor unattended automation;
- Intune-objecten opvragen en beheren via Microsoft Graph;
- een compliance policy via Graph maken en toewijzen;
- detection- en remediation scripts maken en implementeren;
- een remediation eerst aan een pilootgroep en daarna breder uitrollen;
- Intune RBAC, scope groups en scope tags combineren;
- controleren wat een gedelegeerde administrator werkelijk kan zien en uitvoeren;
- wijzigingen reconstrueren via Intune- en Entra-auditlogs;
- ingebouwde Intune-rapporten genereren en exporteren;
- tenant- en connectorstatus opvolgen.

## Vereisten

- Lab 01, Lab 02, Lab 03 en Lab 04 zijn voltooid.
- Je hebt Global Administrator-rechten.
- SEA-DEV1 is ingeschreven in Intune.
- De groepen dyn-Windows-Devices en sg-Intune-Pilot-Users bestaan.
- De custom role Pharmacy Helpdesk en scope tag Pharmacy bestaan.
- De gebruiker Lee Gu bestaat.
- Pharmacy is toegepast op de relevante objecten uit de vorige labs.

## Oefening 1: Automatiseren met Microsoft Graph PowerShell

### Situatie

Microsoft Graph biedt programmatische toegang tot Microsoft 365 en Intune. Je registreert een toepassing voor unattended automation, maakt verbinding met application permissions en voert beheeracties uit met PowerShell en de Graph API.

### Deel 1: Microsoft Graph PowerShell SDK installeren

Open Windows Terminal als administrator op SEA-DEV1 en installeer de Microsoft Graph-modules:

```powershell
Install-Module Microsoft.Graph -Scope AllUsers -Force
Install-Module Microsoft.Graph.Beta -Scope AllUsers -Force
```

Bevestig indien nodig dat je modules uit de repository wilt installeren.

Controleer de installatie:

```powershell
Get-Module -Name Microsoft.Graph.* -ListAvailable
```

De uitvoer moet meerdere Microsoft.Graph-modules tonen, waaronder Microsoft.Graph.Authentication.

### Deel 2: Een app registration maken

Locatie:
Microsoft Entra admin center → Entra ID → App registrations

Maak een app registration met:

- Name: Intune Automation App
- Supported account types: Single tenant only - Contoso
- Redirect URI: leeg

Noteer na de registratie:

- Application (client) ID
- Directory (tenant) ID

Je hebt beide waarden nodig voor de authenticatie.

### Deel 3: API permissions toevoegen

Locatie:
Intune Automation App → API permissions → Add a permission → Microsoft Graph → Application permissions

Voeg toe:

- DeviceManagementManagedDevices.Read.All
- DeviceManagementRBAC.Read.All
- DeviceManagementConfiguration.ReadWrite.All
- DeviceManagementApps.ReadWrite.All
- Group.Read.All

Verleen daarna admin consent voor Contoso. Controleer dat alle permissions als toegestaan worden weergegeven.

### Deel 4: Een client secret maken

Locatie:
Intune Automation App → Certificates & secrets → Client secrets

Maak een client secret met:

- Description: Automation secret for PowerShell scripts
- Expires: 6 maanden of 12 maanden, afhankelijk van het geldende beleid

Kopieer onmiddellijk de secret VALUE. Niet de Secret ID. De waarde wordt maar één keer getoond.

Bewaar secrets in productie niet in een script of tekstbestand. Gebruik daarvoor bijvoorbeeld Azure Key Vault. In deze lab gebruik je de secret tijdelijk om application authentication te oefenen.

### Deel 5: Authenticeren met application credentials

Maak de werkmap:

```powershell
New-Item -Path "C:\LabScripts" -ItemType Directory -Force
```

Maak C:\LabScripts\Connect-GraphApp.ps1 met onderstaande inhoud. Vervang de drie placeholders door je eigen waarden.

```powershell
$tenantId = "<Your Tenant ID>"
$clientId = "<Your Application (client) ID>"
$clientSecret = "<Your Client Secret>"

$secureSecret = ConvertTo-SecureString $clientSecret -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($clientId, $secureSecret)

Connect-MgGraph -TenantId $tenantId -ClientSecretCredential $credential
Get-MgContext
```

Voer het script uit:

```powershell
Set-Location C:\LabScripts
.\Connect-GraphApp.ps1
```

Controleer in Get-MgContext:

- TenantId komt overeen met je tenant.
- AuthType is AppOnly.
- De vereiste application permissions zijn beschikbaar.

### Deel 6: Managed devices en Pharmacy-objecten opvragen

Vraag alle beheerde toestellen op:

```powershell
Get-MgDeviceManagementManagedDevice |
    Select-Object DeviceName, OperatingSystem, ComplianceState, LastSyncDateTime
```

Vraag alleen Windows-toestellen op:

```powershell
Get-MgDeviceManagementManagedDevice -Filter "operatingSystem eq 'Windows'" |
    Select-Object DeviceName, OperatingSystem
```

Vraag niet-conforme toestellen op:

```powershell
Get-MgDeviceManagementManagedDevice -Filter "complianceState eq 'noncompliant'" |
    Select-Object DeviceName, ComplianceState
```

Zoek daarna de numerieke ID van de Pharmacy scope tag:

```powershell
$pharmacyTag = Get-MgBetaDeviceManagementRoleScopeTag -Filter "displayName eq 'Pharmacy'"

if ($pharmacyTag) {
    Write-Output "Pharmacy scope tag ID: $($pharmacyTag.Id)"
}
else {
    Write-Output "Pharmacy scope tag not found"
}
```

Toon klassieke device configuration profiles met de Pharmacy scope tag:

```powershell
Get-MgBetaDeviceManagementDeviceConfiguration -All |
    Where-Object { $_.RoleScopeTagIds -contains $pharmacyTag.Id } |
    Select-Object DisplayName, Id
```

Toon Settings Catalog-policies met de Pharmacy scope tag:

```powershell
Get-MgBetaDeviceManagementConfigurationPolicy -All |
    Where-Object { $_.RoleScopeTagIds -contains $pharmacyTag.Id } |
    Select-Object Name, Id
```

Toon compliance policies met de Pharmacy scope tag:

```powershell
Get-MgBetaDeviceManagementDeviceCompliancePolicy -All |
    Where-Object { $_.RoleScopeTagIds -contains $pharmacyTag.Id } |
    Select-Object DisplayName, Id
```

Vergelijk de resultaten met de objecten die je in de vorige labs met Pharmacy hebt getagd.

### Deel 7: Een compliance policy maken via Graph

Maak de JSON-payload:

```powershell
$compliancePolicyJson = @"
{
  "@odata.type": "#microsoft.graph.windows10CompliancePolicy",
  "displayName": "Graph API - Windows Compliance Policy",
  "description": "Compliance policy created via Microsoft Graph PowerShell",
  "passwordRequired": true,
  "passwordBlockSimple": true,
  "passwordMinimumLength": 8,
  "passwordRequiredType": "alphanumeric",
  "osMinimumVersion": "10.0.19041",
  "bitLockerEnabled": true,
  "secureBootEnabled": true,
  "codeIntegrityEnabled": true,
  "storageRequireEncryption": true,
  "scheduledActionsForRule": [
    {
      "ruleName": "PasswordRequired",
      "scheduledActionConfigurations": [
        {
          "actionType": "block",
          "gracePeriodHours": 0,
          "notificationTemplateId": "",
          "notificationMessageCCList": []
        }
      ]
    }
  ]
}
"@
```

De scheduledActionsForRule-sectie is verplicht. De compliance policy moet precies één block action bevatten.

Maak de policy:

```powershell
Invoke-MgGraphRequest `
    -Method POST `
    -Uri "https://graph.microsoft.com/v1.0/deviceManagement/deviceCompliancePolicies" `
    -Body $compliancePolicyJson `
    -ContentType "application/json"
```

Controleer het resultaat:

```powershell
Get-MgDeviceManagementDeviceCompliancePolicy |
    Where-Object { $_.DisplayName -eq "Graph API - Windows Compliance Policy" } |
    Select-Object DisplayName, Description, Id
```

### Deel 8: De compliance policy toewijzen

Zoek de policy-ID:

```powershell
$policy = Get-MgDeviceManagementDeviceCompliancePolicy |
    Where-Object { $_.DisplayName -eq "Graph API - Windows Compliance Policy" }

$policyId = $policy.Id
```

Zoek de groep-ID:

```powershell
$group = Get-MgGroup -Filter "displayName eq 'dyn-Windows-Devices'"
$groupId = $group.Id
```

Maak de assignment payload:

```powershell
$assignmentJson = @"
{
  "assignments": [
    {
      "target": {
        "@odata.type": "#microsoft.graph.groupAssignmentTarget",
        "groupId": "$groupId"
      }
    }
  ]
}
"@
```

Wijs de policy toe via de /assign action:

```powershell
Invoke-MgGraphRequest `
    -Method POST `
    -Uri "https://graph.microsoft.com/v1.0/deviceManagement/deviceCompliancePolicies/$policyId/assign" `
    -Body $assignmentJson `
    -ContentType "application/json"
```

Controleer in Intune:

Devices → Manage devices → Compliance → Graph API - Windows Compliance Policy → Properties

Bevestig dat dyn-Windows-Devices aan de policy is toegewezen.

## Oefening 2: Remediations implementeren

### Situatie

Remediations detecteren en herstellen terugkerende problemen automatisch. Je maakt een detectiescript en een herstelscript voor verouderde bestanden in de Windows Update-cache. Je rolt de remediation eerst uit naar de pilootgroep en pas daarna naar de bredere omgeving.

### Deel 1: Detection- en remediation scripts maken

Maak de map:

```powershell
New-Item -Path "C:\LabScripts\Remediations" -ItemType Directory -Force
```

Maak Detect-StaleWindowsUpdateCache.ps1:

```powershell
# Detection script: Check for Windows Update cache files older than 30 days
$updateCachePath = "C:\Windows\SoftwareDistribution\Download"

$oldFiles = Get-ChildItem -Path $updateCachePath -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }

if ($oldFiles.Count -gt 0) {
    Write-Output "Found $($oldFiles.Count) stale Windows Update cache files"
    exit 1
}
else {
    Write-Output "Windows Update cache is clean"
    exit 0
}
```

Maak Remediate-StaleWindowsUpdateCache.ps1:

```powershell
# Remediation script: Clear stale Windows Update cache files
$updateCachePath = "C:\Windows\SoftwareDistribution\Download"

try {
    Stop-Service -Name wuauserv -Force -ErrorAction SilentlyContinue

    Get-ChildItem -Path $updateCachePath -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
        Remove-Item -Force -ErrorAction SilentlyContinue

    Start-Service -Name wuauserv -ErrorAction SilentlyContinue
    Write-Output "Stale Windows Update cache cleared"
    exit 0
}
catch {
    Write-Error "Failed to clear Windows Update cache: $_"
    exit 1
}
```

De detectielogica gebruikt:

- exit 0: probleem niet gevonden;
- exit 1: probleem gevonden.

De remediation gebruikt:

- exit 0: herstel gelukt;
- exit 1: herstel mislukt.

### Deel 2: De remediation uploaden

Locatie:
Devices → Manage devices → Scripts and remediations → Remediations

Maak een package met:

- Name: Remediation - Clear Stale Windows Update Cache
- Description: Detects and removes Windows Update cache files older than 30 days
- Detection script file: Detect-StaleWindowsUpdateCache.ps1
- Remediation script file: Remediate-StaleWindowsUpdateCache.ps1
- Run this script using the logged on credentials: No
- Enforce script signature check: No
- Run script in 64-bit PowerShell: Yes

Wijs de remediation eerst toe aan:

- sg-Intune-Pilot-Users

### Deel 3: De uitvoering controleren

Locatie:
Remediation - Clear Stale Windows Update Cache → Device status

Controleer:

- Detection status
- Remediation status
- Last check-in

De detectiestatus toont of het probleem werd vastgesteld. De remediationstatus toont of het herstel succesvol werd uitgevoerd.

Onderzoek fouten voordat je de assignment uitbreidt. Controleer bij onverwachte resultaten ook de scriptoutput en de gebruikte exit codes.

### Deel 4: Uitbreiden van pilot naar fleet

Wanneer de detectie geen onverwachte resultaten oplevert en de remediation correct werkt, breid je de assignment uit.

Locatie:
Remediation - Clear Stale Windows Update Cache → Properties → Assignments

Voeg toe:

- dyn-Windows-Devices

Behoud sg-Intune-Pilot-Users. Voeg geen uitgesloten gebruikersgroep toe aan de assignment van de toestelgroep.

## Oefening 3: Pharmacy Helpdesk delegatie controleren

### Situatie

In Lab 01 maakte je de custom role Pharmacy Helpdesk en de scope tag Pharmacy. In de volgende labs heb je Pharmacy toegepast op configuratie-, compliance-, applicatie- en endpoint security-objecten.

Je wijst de rol nu toe aan Lee Gu en controleert end-to-end welke objecten en acties voor deze gedelegeerde administrator beschikbaar zijn.

### Deel 1: De custom role en scope tag controleren

Locatie:
Tenant administration → Roles → All roles → Pharmacy Helpdesk

Controleer de permissions:

Device compliance policies, Device configurations, Endpoint Protection Reports, Managed apps, Mobile apps en Security baselines:

- Read: Yes
- Create: No
- Update: No
- Delete: No
- Assign: No

Managed devices:

- Update: Yes
- Set primary user: Yes
- Read: Yes
- Delete: No
- Wipe: No

Overige permissions:

- Organization → Read: Yes
- Roles → Read: Yes
- Remote Help app → Take full control: Yes
- Remote Help app → View screen: Yes
- Remote assistance connectors → Read: Yes
- Remote tasks → Offer remote assistance: Yes
- Remote tasks → Collect diagnostics: Yes
- Remote tasks → Reboot now: Yes
- Remote tasks → Sync devices: Yes

Controleer bij de role properties dat Pharmacy als scope tag is opgenomen.

Controleer daarna:
Tenant administration → Roles → Scope tags → Pharmacy

Bekijk de naam, omschrijving en toegewezen groepen.

### Deel 2: Pharmacy-objecten inventariseren

Controleer welke objecten uit de vorige labs Pharmacy dragen.

Devices → Manage devices → Configuration:

- Settings Catalog- en Device Restrictions-profielen uit Lab 02
- eventueel het behouden cameraprofiel

Devices → Manage devices → Compliance:

- Compliance - Windows Security Baseline

Apps → All apps:

- de oudere en nieuwste 7-Zip Win32-apps uit Lab 03

Endpoint security:

- Security Baseline - Defender for Endpoint
- Antivirus - Defender Configuration
- ASR - Block (Pilot)
- BitLocker - Full Disk Encryption

Als een verwacht object de scope tag niet bevat, voeg je Pharmacy toe via de properties van dat object.

### Deel 3: De rol toewijzen aan Lee Gu

Intune gebruikt security groups voor Admin Groups en Scope Groups.

Maak een security group:

- Group type: Security
- Group name: sg-Pharmacy-Helpdesk-Admins
- Membership type: Assigned
- Member: Lee Gu

Locatie voor de role assignment:
Tenant administration → Roles → All roles → Pharmacy Helpdesk → Assignments

Maak de assignment:

- Assignment name: Pharmacy Helpdesk - Lee Gu
- Description: Grants Lee Gu Pharmacy-scoped helpdesk access
- Admin Groups: sg-Pharmacy-Helpdesk-Admins
- Scope Groups: dyn-Windows-Devices
- Scope Tags: Pharmacy

De uiteindelijke toegang is het snijpunt van:

- de permissions in de custom role;
- de toestellen in de Scope Groups;
- de objecten die de gekozen Scope Tags dragen.

### Deel 4: Delegatie testen als Lee Gu

Open een InPrivate- of Incognito-venster en meld je in Intune aan als Lee Gu.

Controleer:

Devices → Manage devices → Configuration

- Alleen Pharmacy-getagde configuratieprofielen zijn zichtbaar.
- Default-only profielen horen niet zichtbaar te zijn.

Devices → Manage devices → Compliance

- Compliance - Windows Security Baseline is zichtbaar.
- Niet-getagde compliance policies horen niet zichtbaar te zijn.

Apps → All apps

- De Pharmacy-getagde 7-Zip-apps zijn zichtbaar.
- Microsoft To Do, Microsoft 365 Apps en Google Chrome horen niet zichtbaar te zijn wanneer ze alleen Default gebruiken.

Endpoint security

- Alleen Pharmacy-getagde baselines en policies zijn zichtbaar.

Open Antivirus - Defender Configuration en controleer dat Lee Gu de policy kan lezen, maar niet kan bewerken. De role geeft Read, maar geen Create, Update, Delete of Assign.

Controleer Remote Help alleen voor zover de huidige tenantconfiguratie dat toestaat. De volledige Remote Help-oefening volgt in Lab 06.

Meld Lee Gu af en keer terug naar de Global Administrator-sessie.

## Oefening 4: Auditlogs en operationele gezondheid

### Situatie

Auditlogs beantwoorden de vraag wie wat heeft gewijzigd, wanneer dat gebeurde en op welk object. Je gebruikt zowel de Intune-auditlog als de Entra-auditlog.

### Deel 1: Intune-auditlogs onderzoeken

Locatie:
Tenant administration → Audit logs

Onderzoek recente beheeracties en bekijk per relevante gebeurtenis:

- Activity
- Activity Status
- Date
- Initiated by (Actor)
- Target
- Modified Properties

Gebruik filters op activiteit en datum om de resultaten te beperken.

### Deel 2: Auditlogs exporteren

Exporteer de Intune-auditlog naar CSV en open het bestand in Excel.

Controleer minstens:

- Date
- Activity
- Initiated By
- Target
- Category

### Deel 3: Diagnostic settings verkennen

Locatie:
Tenant administration → Diagnostics settings

Bekijk de beschikbare logcategorie AuditLogs.

Configureer niets wanneer er geen Azure subscription en Log Analytics workspace beschikbaar zijn.

De gebruikelijke workflow is:

1. Maak een Log Analytics workspace in Azure.
2. Maak in Intune een diagnostic setting.
3. Routeer AuditLogs naar de workspace.
4. Gebruik KQL in Azure Monitor voor analyse en langere retentie.

### Deel 4: Wijzigingen uit de labreeks reconstrueren

Zoek in de Intune-auditlog naar gebeurtenissen uit de laatste zeven dagen.

Onderzoek:

1. Pharmacy Helpdesk custom role
   - Activity: Create RoleDefinition
   - Bekijk de toegekende permissions in Modified Properties.
2. Compliance - Windows Security Baseline
   - Activity: Create DeviceCompliancePolicy
   - Controleer actor en target.
3. Pharmacy Helpdesk - Lee Gu assignment
   - Activity: Create DeviceAndAppManagementRoleAssignment
   - Controleer Pharmacy en dyn-Windows-Devices in Modified Properties.
4. Verwijdering van WIN - Camera - Enabled (Pilot)
   - Activity: Delete DeviceManagementConfigurationPolicy
   - Bekijk de laatst bekende toestand in Modified Properties.

Gebruik daarna de afzonderlijke Entra-auditlog:

Microsoft Entra admin center → Monitoring & health → Audit logs

Filter:

- Service: Conditional Access
- Date: Last 7 days

Zoek:

- Policy: CA - Require compliant device (Pharmacy pilot)
- Activity: Add Conditional Access policy

Bekijk Modified Properties. De waarde enabledForReportingButNotEnforced betekent dat de policy in Report-only staat.

Gebruik de Intune-auditlog voor Intune-beheeracties. Gebruik de Entra-auditlog voor Conditional Access en directory-operaties.

## Oefening 5: Ingebouwde rapporten gebruiken

### Deel 1: Device compliance report

Locatie:
Reports → Device compliance → Reports → Noncompliant devices and settings

Genereer het rapport en controleer:

- Device name
- Noncompliant setting
- Setting compliance state
- Primary User principal name
- Operating system
- Last check-in

Filter indien nuttig op Windows en exporteer het rapport. Het ZIP-bestand bevat de CSV-export.

### Deel 2: Device configuration report

Locatie:
Reports → Device configuration

Genereer het rapport en bekijk in Top 5 configuration policy status:

- Policy name
- Policy type
- Successful devices
- Devices with errors
- Devices with conflicts

Voor detailinformatie open je het relevante configuratieprofiel via:
Devices → Manage devices → Configuration → <policy> → View report

### Deel 3: Tenant status controleren

Locatie:
Tenant administration → Tenant status

Controleer:

- Tenant details
- Aantal ingeschreven toestellen
- Licensed users
- Intune licenses
- Connector status
- Microsoft Defender for Endpoint-status
- Microsoft Tunnel-status
- Service health
- Message center

Open actieve incidents of advisories wanneer die aanwezig zijn. Bekijk in Message center welke wijzigingen of nieuwe functies voor Intune zijn aangekondigd.

## Eindresultaat

In deze lab heb je:

- Microsoft Graph PowerShell geïnstalleerd;
- een app registration voor unattended Graph automation gemaakt;
- application permissions en een client secret geconfigureerd;
- app-only authentication uitgevoerd;
- managed devices en Pharmacy-getagde policies via Graph opgevraagd;
- een compliance policy via Graph gemaakt en toegewezen;
- detection- en remediation scripts gemaakt;
- een remediation eerst aan de pilootgroep en daarna aan de bredere omgeving toegewezen;
- de Pharmacy Helpdesk-role aan Lee Gu toegewezen;
- gecontroleerd hoe permissions, scope groups en scope tags samen de uiteindelijke toegang bepalen;
- de gedelegeerde toegang als Lee Gu getest;
- Intune- en Entra-auditlogs onderzocht;
- wijzigingen uit eerdere labs gereconstrueerd;
- compliance- en configuratierapporten geëxporteerd;
- tenant-, connector- en servicestatus gecontroleerd.
