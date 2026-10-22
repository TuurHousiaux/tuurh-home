#!/usr/bin/env python3
"""Rebuild lab content and separate workbook pages without the PowerPoint decks."""
from pathlib import Path
from lab04 import render_lab04
from lab05 import render_lab05
from lab06 import render_lab06
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
if '<!-- lab05:start -->' not in html:
    html = html.replace('<!-- lab04:end -->', '<!-- lab04:end --><!-- lab05:start --><!-- lab05:end -->')
html = replace_between(html, '<!-- lab05:start -->', '<!-- lab05:end -->', render_lab05())
if '<!-- lab06:start -->' not in html:
    html = html.replace('<!-- lab05:end -->', '<!-- lab05:end --><!-- lab06:start --><!-- lab06:end -->')
html = replace_between(html, '<!-- lab06:start -->', '<!-- lab06:end -->', render_lab06())
if 'data-lab-select="lab-lp6-06"' not in html:
    marker = '</nav><div id="lab-cards"'
    assert html.count(marker) == 1
    html = html.replace(marker, '<a href="/md102/lab-06/" data-lab-select="lab-lp6-06"><span class="lab-number">Lab 06 · 5 oefeningen · Laatste lab</span><strong>Mogelijkheden uitbreiden</strong><small data-lab-card-progress>Voortgang laden…</small></a>' + marker)
if 'class="nav-lab" href="/md102/lab-06/"' not in html:
    marker = '<a class="nav-special" href="#bronnen">'
    assert html.count(marker) == 1
    html = html.replace(marker, '<a class="nav-lab" href="/md102/lab-06/">Lab 06 · Mogelijkheden uitbreiden</a>' + marker)

if 'data-lab-select="lab-lp5-05"' not in html:
    marker = '</nav><div id="lab-cards"'
    assert html.count(marker) == 1
    html = html.replace(marker, '<a href="/md102/lab-05/" data-lab-select="lab-lp5-05"><span class="lab-number">Lab 05 · 5 oefeningen</span><strong>Automatiseren en operationeel beheren</strong><small data-lab-card-progress>Voortgang laden…</small></a>' + marker)
if 'class="nav-lab" href="/md102/lab-05/"' not in html:
    marker = '<a class="nav-special" href="#bronnen">'
    assert html.count(marker) == 1
    html = html.replace(marker, '<a class="nav-lab" href="/md102/lab-05/">Lab 05 · Automatiseren en beheren</a>' + marker)
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
for number, title in [('03', 'Applicaties beheren'), ('04', 'Toestellen beveiligen'), ('05', 'Automatiseren en operationeel beheren'), ('06', 'Mogelijkheden uitbreiden')]:
    directory=SITE / ('lab-' + number)
    directory.mkdir(exist_ok=True)
    standalone=html.replace('<title>MD-102 Leeromgeving | BoostMeUp</title>', '<title>Lab ' + number + ' · ' + title + ' | MD-102</title>')
    (directory / 'index.html').write_text(standalone)
js.write_text(app)
print('Lab content and independent workbook pages rebuilt in src/md102/')
