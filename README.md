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

### Labs en zelfstandige oefeningen

Lab 03 staat op `/md102/lab-03/` en Lab 04 op `/md102/lab-04/`. Elk lab heeft een eigen overzicht. Lab 03 bevat zeven basisoefeningen en drie extra oefeningen: Firefox als Win32-app implementeren, Required versus Available en een applicatie verwijderen.

Elke oefening staat volledig op één pagina, met alle opdrachten en controles onder elkaar. Onderaan staan Oefening uitgevoerd en een link naar het laboverzicht. Deelaanduidingen, paginatellers en Vorige/Volgende binnen oefeningen zijn verwijderd. Bestaande instructie-ID’s, links naar voormalige deelpagina’s en opgeslagen bevestigingen blijven geldig.

De cursuszijbalk verdwijnt tijdens het werken. Open als werkvenster opent de huidige pagina in een smal venster met behoud van de cursusaanmelding. Zoeken vindt ook de extra oefeningen.

Bewerk de extra opdrachten in `scripts/md102/lab03_extra.py`, Lab 04 in `scripts/md102/lab04.py` en de werkruimte in `scripts/md102/lab_workspace.js` en `.css`. De updater bouwt ook de afzonderlijke labpagina’s:

```bash
python3 scripts/md102/update.py
npm run build
```

De updater werkt zonder de oorspronkelijke PowerPoint-decks. De configuratiewaarden in Lab 04 volgen de aangeleverde labtekst; deze toevoeging is geen herziening van de Microsoft-productinstellingen.
