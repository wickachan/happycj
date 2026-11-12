"""Package repository-local CJ copies for static js-dos execution."""
import hashlib
import json
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent / 'legacy' / 'CJ'
OUT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / 'www'
OUT.mkdir(parents=True, exist_ok=True)
originals = {p.name: p.read_bytes() for p in SOURCE.iterdir() if p.is_file()}

# normal2x is required: the old web engine corrupts partial frames with none.
config = '''[sdl]
autolock=false
[dosbox]
machine=svga_s3
memsize=16
[render]
frameskip=0
aspect=false
scaler=normal2x
[cpu]
core=auto
cputype=auto
cycles=10000
cycleup=10
cycledown=10
[mixer]
nosound=false
rate=44100
[sblaster]
sbtype=sb16
[dos]
xms=true
ems=true
umb=true
[autoexec]
@echo off
mount c .
c:
cd HAPPYCJ
{command}
'''
for name, command in [('intro', 'OPEN.EXE'), ('direct', 'HPCJ.EXE'), ('prompt', 'echo Type OPEN or HPCJ to start CJ.')]:
    with zipfile.ZipFile(OUT / (name + '.jsdos'), 'w', zipfile.ZIP_DEFLATED) as bundle:
        bundle.writestr('.jsdos/dosbox.conf', config.format(command=command))
        for filename, content in originals.items():
            bundle.writestr('HAPPYCJ/' + filename, content)
        # Original HPCJ has an MZ executable header but no extension. A byte-exact
        # alias allows COMMAND.COM-style executable lookup; original is retained.
        bundle.writestr('HAPPYCJ/HPCJ.EXE', originals['HPCJ'])
shutil.copytree(ROOT / 'vendor', OUT / 'vendor', dirs_exist_ok=True)
for name in ['index.html', 'player.js', 'player.css']:
    shutil.copy2(ROOT / name, OUT / name)
manifest = {
    'source': 'legacy/CJ',
    'original_files': {name: hashlib.sha256(content).hexdigest() for name, content in sorted(originals.items())},
    'alias': {'path':'HAPPYCJ/HPCJ.EXE','same_bytes_as':'HPCJ'},
    'runtime': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT / 'vendor').iterdir()) if p.is_file()},
}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
for name, content in originals.items():
    if (SOURCE / name).read_bytes() != content:
        raise RuntimeError('Source changed during packaging: ' + name)
for asset in ['js-dos.js','js-dos.css','wdosbox.js','wdosbox.wasm','wlibzip.js','wlibzip.wasm']:
    if not (OUT / 'vendor' / asset).is_file():
        raise RuntimeError('Missing runtime asset: ' + asset)
print(f'Built {len(originals)} original files into 3 local bundles. Source bytes unchanged.')
print('Emulator output: ' + str(OUT))
