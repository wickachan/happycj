"""Build a dependency-free static HappyCJ; source DOS files are read only."""
import hashlib
import json
import re
import shutil
import struct
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'
DATA = DIST / 'data'
DATA.mkdir(parents=True, exist_ok=True)

lessons = json.loads((ROOT / 'research/extracted/lessons.json').read_text())
sets = json.loads((ROOT / 'research/extracted/training-records.json').read_text())
titles = ['將進酒', '水調歌頭']
for i, lesson in enumerate(lessons):
    lesson['id'] = lesson['source'].split('.')[0].lower()
    lesson['title'] = titles[i] if i < len(titles) else re.sub(r'\s+', '', lesson['text'])[:8] + '…'
    lesson['characters'] = len(re.sub(r'\s+', '', lesson['text']))

# Match legacy glyphs against the supplied common-character font. The Big5
# order and row transformation are inferred; candidates are never prerequisites
# for rendering, which uses each original bitmap directly.
font_file = ROOT / 'legacy/CJ/STDFONT.PAT'
font = font_file.read_bytes() if font_file.exists() else b''
font_index = {}
for i in range(len(font) // 30):
    rows = struct.unpack('>15H', font[i*30:(i+1)*30])
    key = struct.pack('>14H', *[(r << 1) & 65535 for r in rows[:14]]).hex()
    index = 3 * 157 + i
    lead, trail = 0xA1 + index // 157, index % 157
    trail = 0x40 + trail if trail < 63 else 0xA1 + trail - 63
    char = bytes([lead, trail]).decode('big5')
    font_index.setdefault(key, []).append(char)
for group in sets:
    for record in group['records']:
        if font:
            record['unicode_candidates'] = font_index.get(record['record_hex'][8:], [])
        else:
            record.setdefault('unicode_candidates', [])

dictionary_file = ROOT / 'vendor/rime-cangjie/cangjie5.base.dict.yaml'
dictionary = []
for line in dictionary_file.read_text().splitlines():
    fields = line.split('\t')
    if len(fields) >= 2 and len(fields[0]) == 1 and re.fullmatch('[a-z]{1,5}', fields[1]):
        dictionary.append(fields[:2])
if len(dictionary) < 10000:
    raise ValueError('Incomplete Cangjie dictionary')
mapped = {char for char, code in dictionary}
missing = sorted({c for lesson in lessons for c in lesson['text'] if not c.isspace() and c not in mapped})
payload = {'lessons': lessons, 'sets': sets, 'dictionary': dictionary,
           'dictionaryVersion': 'Rime Cangjie 5 base', 'unmappedLessonCharacters': missing}
(DATA / 'cj.json').write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')))
for name in ['index.html', 'styles.css', 'app.js', 'engine.js', 'tutorials.js', 'sw.js', 'manifest.webmanifest', 'icon.svg']:
    if (ROOT / 'src' / name).exists():
        shutil.copy2(ROOT / 'src' / name, DIST / name)
vendor_out = DIST / 'licenses/rime-cangjie'
vendor_out.mkdir(parents=True, exist_ok=True)
for file in (ROOT / 'vendor/rime-cangjie').iterdir():
    shutil.copy2(file, vendor_out / file.name)
if (ROOT / 'THIRD_PARTY_NOTICES.md').exists():
    shutil.copy2(ROOT / 'THIRD_PARTY_NOTICES.md', DIST / 'THIRD_PARTY_NOTICES.md')
# One static site includes the native web lessons and the original DOS player.
subprocess.run([sys.executable, str(ROOT / 'emulator/build.py'), str(DIST / 'emulator')], check=True)
# Corresponding readable application and data-conversion sources, for download.
with zipfile.ZipFile(DIST / 'happycj-source.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for directory in ['src', 'vendor', 'tests', 'legacy']:
        for file in sorted((ROOT / directory).rglob('*')):
            if file.is_file():
                archive.write(file, file.relative_to(ROOT))
    for file in sorted((ROOT / 'emulator').rglob('*')):
        if file.is_file() and 'www' not in file.relative_to(ROOT / 'emulator').parts and '__pycache__' not in file.parts:
            archive.write(file, file.relative_to(ROOT))
    for name in ['build.py', 'package.json', 'README.md', 'THIRD_PARTY_NOTICES.md', '.gitignore']:
        if (ROOT / name).exists():
            archive.write(ROOT / name, name)
    for file in (ROOT / 'research/extracted').glob('*.json'):
        archive.write(file, file.relative_to(ROOT))
    archive.write(ROOT / 'research/inspect_cj.py', 'research/inspect_cj.py')
    for file in sorted((ROOT / 'docs').rglob('*')):
        if file.is_file():
            archive.write(file, file.relative_to(ROOT))
version = hashlib.sha256(b''.join(p.read_bytes() for p in sorted(DIST.glob('*.js')))
                         + (DATA / 'cj.json').read_bytes()
                         + (DIST / 'styles.css').read_bytes()).hexdigest()[:12]
sw = DIST / 'sw.js'
sw.write_text(sw.read_text().replace('__BUILD__', version))
print(json.dumps({'lessons': len(lessons), 'training_records': sum(s['count'] for s in sets),
                  'dictionary_entries': len(dictionary), 'unmapped_characters': missing,
                  'data_bytes': (DATA / 'cj.json').stat().st_size, 'version': version}, ensure_ascii=False))
