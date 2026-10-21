#!/usr/bin/env python3
"""Rebuild Lab 04 and the lab workspace without the original PowerPoint decks."""
from pathlib import Path
from lab04 import render_lab04

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[1] / 'src' / 'md102'


def replace_between(source, start, end, content):
    assert source.count(start) == source.count(end) == 1, 'Missing or duplicate build markers'
    before, rest = source.split(start, 1)
    _, after = rest.split(end, 1)
    return before + start + '\n' + content + '\n' + end + after


page = SITE / 'index.html'
js = SITE / 'app.js'
html = replace_between(page.read_text(), '<!-- lab04:start -->', '<!-- lab04:end -->', render_lab04())
html = replace_between(html, '/* lab-workspace:start */', '/* lab-workspace:end */', (HERE / 'lab_workspace.css').read_text().rstrip())
app = replace_between(js.read_text(), '// lab-workspace:start', '// lab-workspace:end', (HERE / 'lab_workspace.js').read_text().rstrip())
page.write_text(html)
js.write_text(app)
print('Lab 04 and lab workspace rebuilt in src/md102/')
