"""Render the final Intune Suite lab with the shared workbook renderer."""
from pathlib import Path
from lab05 import render_workbook


def render_lab06():
    return render_workbook(Path(__file__).with_suffix('.md').read_text(), '06',
                           'Mogelijkheden uitbreiden',
                           'Laatste lab · Microsoft Intune Suite')
