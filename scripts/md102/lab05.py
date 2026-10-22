"""Render the supplied Lab 05 source in the existing lab workbook structure."""
from html import escape
from pathlib import Path
import re


def render_blocks(source):
    """Render paragraphs, headings, nested lists and literal PowerShell blocks."""
    lines = source.strip().splitlines()
    out = []
    index = 0
    item_pattern = re.compile(r'^( *)(?:- |\d+\. )(.*)$')

    def render_list(index, indent):
        ordered = not lines[index].lstrip().startswith('- ')
        tag = 'ol' if ordered else 'ul'
        result = [f'<{tag}>']
        while index < len(lines):
            match = item_pattern.match(lines[index])
            if not match or len(match[1]) != indent:
                break
            result.append('<li>' + escape(match[2]))
            index += 1
            if index < len(lines):
                child = item_pattern.match(lines[index])
                if child and len(child[1]) > indent:
                    nested, index = render_list(index, len(child[1]))
                    result.append(nested)
            result.append('</li>')
        result.append(f'</{tag}>')
        return ''.join(result), index

    while index < len(lines):
        line = lines[index]
        if not line.strip():
            index += 1
        elif line.startswith('```'):
            code = []
            index += 1
            while index < len(lines) and not lines[index].startswith('```'):
                code.append(lines[index])
                index += 1
            assert index < len(lines), 'Unclosed code fence'
            out.append('<pre><code class="language-powershell">' + escape('\n'.join(code)) + '</code></pre>')
            index += 1
        elif line.startswith('## '):
            out.append('<h4>' + escape(line[3:]) + '</h4>')
            index += 1
        elif line.startswith('### '):
            out.append('<h5>' + escape(line[4:]) + '</h5>')
            index += 1
        elif item_pattern.match(line):
            rendered, index = render_list(index, len(item_pattern.match(line)[1]))
            out.append(rendered)
        else:
            paragraph = [line]
            index += 1
            while index < len(lines) and lines[index].strip() and not lines[index].startswith(('```', '## ' , '### ')) and not item_pattern.match(lines[index]):
                paragraph.append(lines[index])
                index += 1
            if paragraph[0] == 'Locatie:':
                out.append('<p class="lab-route"><strong>Locatie</strong><br>' + escape(' '.join(paragraph[1:])) + '</p>')
            else:
                out.append('<p>' + escape(' '.join(paragraph)) + '</p>')
    return '\n'.join(out)


def render_lab05():
    source = Path(__file__).with_suffix('.md').read_text()
    preparation, exercises = source.split('## Oefening 1: ', 1)
    exercise_source, outcome = ('## Oefening 1: ' + exercises).split('## Eindresultaat\n', 1)
    exercise_sections = re.split(r'^## Oefening \d+: ', exercise_source, flags=re.M)[1:]
    assert len(exercise_sections) == 5
    out = ['<article class="lab-card lab-guide" id="lab-lp5-05" data-lab-guide="05" aria-labelledby="lab05-title"><header><span class="lab-path">Learning Path 5</span> <span class="lab-number">Lab 05</span><h3 id="lab05-title" tabindex="-1">Automatiseren en operationeel beheren</h3><div class="lab-meta"><span>5 oefeningen</span><span>Contoso Healthcare</span><span>Automatisering en operationeel beheer</span></div></header>']
    out.append('<details class="disclosure lab-preparation"><summary>Voor je start: situatie, leerdoelen en vereisten</summary><div class="disclosure-content">')
    out.append(render_blocks(preparation.split('\n', 1)[1]))
    out.append('</div></details>')
    for number, section in enumerate(exercise_sections, 1):
        title, body = section.split('\n', 1)
        chunks = re.split(r'^### Deel \d+: ', body, flags=re.M)
        out.append(f'<section class="lab-exercise" id="lab-lp5-05-oefening-{number}" data-lab-exercise="{number}" aria-labelledby="lab05-exercise-{number}-title"><span class="lab-number">Oefening {number:02}</span><h3 id="lab05-exercise-{number}-title" tabindex="-1">{escape(title)}</h3>')
        out.append('<div class="lab-context">' + render_blocks(chunks[0]) + '</div>')
        for step, chunk in enumerate(chunks[1:], 1):
            step_title, content = chunk.split('\n', 1)
            sid = f'lab05-e{number}-step-{step:02}'
            out.append(f'<article class="lab-action" id="{sid}" data-lab-action="{sid}"><header class="lab-action-header"><span class="lab-step-number" aria-hidden="true">{step:02}</span><h4 id="{sid}-title"><span class="lab-action-type">Uitvoeren</span>Deel {step}: {escape(step_title)}</h4><label class="lab-step-toggle"><input type="checkbox" data-lab-step="{sid}" aria-labelledby="{sid}-title {sid}-label"><span id="{sid}-label">Afgerond</span></label></header><div class="lab-action-body">')
            out.append(render_blocks(content))
            out.append('</div></article>')
        out.append('</section>')
    out.append('<details class="disclosure keypoints lab-outcome" id="lab05-eindresultaat"><summary>Eindresultaat · Wat je hebt gerealiseerd</summary><div class="disclosure-content">')
    out.append(render_blocks(outcome))
    out.append('</div></details></article>')
    return '\n'.join(out)
