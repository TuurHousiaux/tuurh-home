#!/usr/bin/env python3
"""Rebuild lab content and separate workbook pages without the PowerPoint decks."""
from pathlib import Path
from lab04 import render_lab04
from lab03_extra import render_lab03_extra

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[1] / 'src' / 'md102'


def replace_between(source, start, end, content):
    assert source.count(start) == source.count(end) == 1, 'Missing or duplicate build markers'
    before, rest = source.split(start, 1)
    _, after = rest.split(end, 1)
    return before + start + '\n' + content + '\n' + end + after


page = SITE / 'index.html'
js = SITE / 'app.js'
html = page.read_text()
if '<!-- lab03-extra:start -->' not in html:
    marker='<section class="keypoints lab-outcome" id="lab03-eindresultaat">'
    assert html.count(marker)==1
    html=html.replace(marker,'<!-- lab03-extra:start --><!-- lab03-extra:end -->'+marker)
html = replace_between(html, '<!-- lab03-extra:start -->', '<!-- lab03-extra:end -->', render_lab03_extra())
html = replace_between(html, '<!-- lab04:start -->', '<!-- lab04:end -->', render_lab04())
html = html.replace('>03 · Applicaties beheren</a>', '>Lab 03 · Applicaties beheren</a>')
html = html.replace('Kies Lab 03 of Lab 04. Open een oefening en vervolgens het onderdeel waaraan je werkt. Je voortgang wordt per lab bewaard.', 'Kies je lab en volg het werkboek pagina voor pagina. Voer de opdrachten uit in je eigen omgeving en ga onderaan verder naar de volgende stap.')
html = replace_between(html, '/* lab-workspace:start */', '/* lab-workspace:end */', (HERE / 'lab_workspace.css').read_text().rstrip())
app = replace_between(js.read_text(), '// lab-workspace:start', '// lab-workspace:end', (HERE / 'lab_workspace.js').read_text().rstrip())
# Each lab has its own address; the workbook selects the matching lab on load.
html = html.replace('href="#lab-lp3-03" data-lab-select=', 'href="/md102/lab-03/" data-lab-select=')
html = html.replace('href="#lab-lp4-04" data-lab-select=', 'href="/md102/lab-04/" data-lab-select=')
html = html.replace('class="nav-lab" href="#lab-lp3-03"', 'class="nav-lab" href="/md102/lab-03/"')
html = html.replace('class="nav-lab" href="#lab-lp4-04"', 'class="nav-lab" href="/md102/lab-04/"')
html = html.replace('Lab 03 · 7 oefeningen</span>', 'Lab 03 · 7 oefeningen + 3 extra</span>')
page.write_text(html)
for number, title in [('03', 'Applicaties beheren'), ('04', 'Toestellen beveiligen')]:
    directory=SITE / ('lab-' + number)
    directory.mkdir(exist_ok=True)
    standalone=html.replace('<title>MD-102 Leeromgeving | BoostMeUp</title>', '<title>Lab ' + number + ' · ' + title + ' | MD-102</title>')
    (directory / 'index.html').write_text(standalone)
js.write_text(app)
print('Lab content and independent workbook pages rebuilt in src/md102/')
