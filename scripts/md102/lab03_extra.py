"""Extra oefeningen voor Lab 03, op basis van de aangeleverde opdrachten."""
from html import escape


def render_lab03_extra():
    out=[]
    def raw(html): out.append(html)
    def p(text): raw('<p>'+escape(text)+'</p>')
    def ul(items): raw('<ul>'+''.join('<li>'+escape(item)+'</li>' for item in items)+'</ul>')
    def heading(text): raw('<h5>'+escape(text)+'</h5>')
    def exercise(number,title,situation,goals):
        raw(f'<section class="lab-exercise" id="lab03-extra-oefening-{number}" data-lab-exercise="extra-{number}" data-extra-exercise="{number}"><span class="lab-number">Extra oefening {number}</span><h3>{escape(title)}</h3><div class="lab-context"><strong>Situatie</strong>')
        p(situation);raw('</div><div class="lab-target"><span class="eyebrow">Leerdoel</span>');ul(goals);raw('</div>')
    def part(number,step,title):
        sid=f'lab03-extra{number}-step-{step:02}'
        raw(f'<article class="lab-action" id="{sid}" data-lab-action="{sid}"><header class="lab-action-header"><span class="lab-step-number">{step:02}</span><h4 id="{sid}-title"><span class="lab-action-type">Uitvoeren</span>{escape(title)}</h4><label class="lab-step-toggle"><input type="checkbox" data-lab-step="{sid}" aria-labelledby="{sid}-title"><span>Afgerond</span></label></header><div class="lab-action-body">')
    def endpart(): raw('</div></article>')

    exercise(1,'Firefox als Win32-app implementeren','Contoso Healthcare wil Mozilla Firefox beschikbaar maken voor gebruikers via Microsoft Intune.',['Win32-apps implementeren.','Device Install Status interpreteren.','Zelfstandig deploymentproblemen onderzoeken.','Problemen oplossen zonder stappenplan.'])
    part(1,1,'Firefox publiceren');heading('Opdracht');ul(['Download de MSI-versie van Mozilla Firefox.','Maak een Win32-package.','Publiceer de applicatie als Windows app (Win32).','Gebruik een MSI-gebaseerde detectieregel.','Wijs de applicatie als Required toe aan sg-Intune-Pilot-Users.']);endpart()
    part(1,2,'Installatie en status controleren');heading('Controle op het toestel');ul(['Is Firefox geïnstalleerd?','Kan Firefox worden gestart?','Klopt de geïnstalleerde versie?']);heading('Controle in Intune');raw('<p class="lab-route"><strong>Locatie</strong><br>Apps → All apps → Firefox → Device install status</p>');p('Analyseer de status:');ul(['Installed','Pending','Failed','Not applicable']);endpart()
    part(1,3,'Deploymentproblemen onderzoeken');heading('Probleemoplossing');p('Wanneer de installatie niet correct verloopt:');ul(['controleer de Device Install Status;','controleer de detectieregel;','controleer de assignments;','controleer de requirements;','analyseer eventuele foutmeldingen;','los het probleem op.']);endpart();raw('</section>')

    exercise(2,'Required versus Available','Niet elke applicatie moet automatisch worden geïnstalleerd.',['Het verschil begrijpen tussen automatisch uitrollen en optioneel beschikbaar maken.'])
    part(2,1,'Twee deployments maken');heading('Opdracht');p('Publiceer een extra applicatie vanuit de Enterprise App Catalog.');p('Maak één deployment als Required en een tweede als Available for enrolled devices.');endpart()
    part(2,2,'De deployments vergelijken');heading('Controle');p('Vergelijk:');ul(['de gebruikerservaring;','het gedrag in Company Portal;','de installatiestatus in Intune.']);endpart();raw('</section>')

    exercise(3,'Applicatie verwijderen','Een organisatie stopt met het gebruik van een applicatie.',['Applicaties niet alleen implementeren, maar ook correct verwijderen.'])
    part(3,1,'Een Uninstall assignment configureren');heading('Opdracht');p('Gebruik een bestaande deployment en configureer een Uninstall assignment.');p('Controleer vervolgens wat er gebeurt op het toestel en binnen Intune.');endpart()
    part(3,2,'De verwijdering controleren');heading('Controle');p('Controleer:');ul(['of de applicatie verwijderd wordt;','hoe de status wordt weergegeven in Device Install Status;','welke assignment verantwoordelijk is voor de verwijdering.']);endpart();raw('</section>')
    return '\n'.join(out)
