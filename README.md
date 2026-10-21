# tuurh-home

Dit repository bevat uitsluitend de homepage op `https://tuurh.be/`.

De publieke URL's worden over afzonderlijke projecten verdeeld:

| URL | Project |
| --- | --- |
| `https://tuurh.be/` | `tuurh-home` |
| `https://tuurh.be/me` | `tuurh-site` |
| `https://tuurh.be/rbac` | `RBAC rights M365` |
| `https://tuurh.be/blog` | `tuurh-blog` |
| `https://tuurh.be/ms102` | `tuurh-ms102` |

`tuurh-site` is dus geen oudere versie van deze website, maar de afzonderlijke
site die onder `/me` wordt aangeboden. De routing gebeurt via de
`tuurh-router` Cloudflare Worker.

## Lokaal bouwen

```powershell
npm run build
```

De deploybare statische output verschijnt in `dist/`.

Voor een lokale preview:

```powershell
npm run preview
```

## Azure Static Web Apps

- App location: `/`
- Output location: `dist`
- Build command: `npm run build`

De paden worden in productie door de afzonderlijke `tuurh-router` Cloudflare
Worker naar de juiste Azure Static Web App gestuurd.

## MD-102 leeromgeving

De Nederlandstalige cursus staat op `/md102/` en wordt samen met de homepage gepubliceerd. De bron is `../md102/docs/index.html`; het inline script is voor de bestaande Content Security Policy afgesplitst naar `src/md102/app.js`. Neem bij cursusupdates beide bestanden opnieuw over. Het cursuswachtwoord wordt via het bestaande cursuskanaal gedeeld.

### Labs en compacte navigatie

De leeromgeving toont het gekozen overzicht, leerpad, de geselecteerde module of de praktijklabs. Zoeken doorzoekt alle theorie en labonderdelen en opent ook ingeklapte resultaten. Lab 03 en Lab 04 hebben een eigen werkplan, voortgang en hervatknop. Oefeningen en uitvoerstappen klappen open; één oefening en één stap per lab blijven tegelijk open. Bestaande stap-ID’s en de opslagsleutel van Lab 03 zijn behouden. Het wissen van een lab raakt andere labs of de theorievoortgang niet.

Lab 04 bevat de aangeleverde beveiligingsopdracht met zes oefeningen en 28 afvinkbare onderdelen. Bewerk de inhoud in `scripts/md102/lab04.py` en de werkruimte in `scripts/md102/lab_workspace.js` en `.css`. Bouw deze onderdelen opnieuw met:

```bash
python3 scripts/md102/update.py
npm run build
```

De updater werkt zonder de oorspronkelijke PowerPoint-decks. De configuratiewaarden in Lab 04 volgen de aangeleverde labtekst; deze toevoeging is geen herziening van de Microsoft-productinstellingen.
