# tuurh-home

Dit repository bevat uitsluitend de homepage op `https://tuurh.be/`.

De publieke URL's worden over afzonderlijke projecten verdeeld:

| URL | Project |
| --- | --- |
| `https://tuurh.be/` | `tuurh-home` |
| `https://tuurh.be/me` | `tuurh-site` |
| `https://tuurh.be/rbac` | `RBAC rights M365` |

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
