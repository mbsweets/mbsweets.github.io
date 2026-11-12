#!/usr/bin/env python3
"""रसगुल्ला रन — CrazyGames के लिए zip बनाना।

    python3 _src/portal/build_crazygames.py <आउटपुट फ़ोल्डर>

क्या बदलता है (सिर्फ़ zip वाली कॉपी में, असली game/ फ़ोल्डर वैसा ही रहता है):
  * index.html में window.RR_PORTAL = 'crazygames' और CrazyGames SDK v3 स्क्रिप्ट
  * दुकान/ऑर्डर का लिंक, शेयर बटन, "जल्दिए इनाम" वाली लाइन, og: टैग हटते हैं
    (CrazyGames पर बाहरी लिंक/प्रचार मना है; लीडरबोर्ड पोर्टल पर अपने-आप बंद)
  * game.js से अपनी वेबसाइट के पते हटते हैं
"""
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'game'
SKIP = {'README.md', 'img/og.jpg'}
SDK = 'https://sdk.crazygames.com/crazygames-sdk-v3.js'


def sub1(pat, rep, s, flags=re.S):
    out, n = re.subn(pat, rep, s, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f'पैटर्न नहीं मिला: {pat}')
    return out


def main():
    out_root = Path(sys.argv[1] if len(sys.argv) > 1 else 'dist').resolve()
    out = out_root / 'rasgulla-run-crazygames'
    if out.exists():
        shutil.rmtree(out)
    files = []
    for f in sorted(SRC.rglob('*')):
        rel = f.relative_to(SRC).as_posix()
        if f.is_dir() or rel in SKIP or '__pycache__' in rel or f.name.startswith('.'):
            continue
        dst = out / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, dst)
        files.append(rel)

    # ---- index.html ----
    h = (out / 'index.html').read_text(encoding='utf-8')
    h = re.sub(r'\s*<meta property="og:[^>]*>', '', h)
    h = sub1(r'<title>.*?</title>', '<title>Rasgulla Run</title>', h)
    head = '<meta charset="utf-8">\n<script>window.RR_PORTAL = \'crazygames\';</script>\n<script src="' + SDK + '"></script>'
    h = sub1(r'<meta charset="utf-8">', lambda m: head, h)
    h = sub1(r'<html lang="hi">', '<html lang="en">', h)
    h = sub1(r'\s*<a id="orderLink".*?</a>', '', h)
    h = sub1(r'<button id="btnShare"[^>]*></button>', '', h)
    h = sub1(r'\s*<p class="tiny local"[^>]*></p>', '', h)
    (out / 'index.html').write_text(h, encoding='utf-8')

    # ---- game.js: अपनी वेबसाइट के पते हटाओ ----
    g = (out / 'js/game.js').read_text(encoding='utf-8')
    g = sub1(r"const GAME_URL = '[^']*';", "const GAME_URL = '';", g)
    g = sub1(r"const ORDER_URL = '[^']*';", "const ORDER_URL = '';", g)
    g = sub1(r"window\.open\('https://wa\.me/[^\n]*", '', g)
    (out / 'js/game.js').write_text(g, encoding='utf-8')

    # ---- जाँच: कोई बाहरी पता बचा तो नहीं ----
    bad = []
    for rel in files:
        if not rel.endswith(('.js', '.html', '.css')) or rel.endswith('three.module.min.js'):
            continue
        t = (out / rel).read_text(encoding='utf-8')
        for m in re.finditer(r'https?://[^\s\'"`)<]+', t):
            u = m.group(0)
            if u.startswith(SDK) or 'xxxx.workers.dev' in u:
                continue
            bad.append(f'{rel}: {u}')
    if bad:
        raise SystemExit('बाहरी पते मिले:\n' + '\n'.join(bad))

    # ---- zip (index.html सबसे ऊपर) ----
    z = out_root / 'rasgulla-run-crazygames.zip'
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for f in sorted(out.rglob('*')):
            if f.is_file():
                zf.write(f, f.relative_to(out).as_posix())
    size = sum(f.stat().st_size for f in out.rglob('*') if f.is_file())
    n = sum(1 for f in out.rglob('*') if f.is_file())
    print(f'तैयार: {z}  ({z.stat().st_size / 1e6:.2f} MB zip, {size / 1e6:.2f} MB खुला, {n} फ़ाइलें)')


if __name__ == '__main__':
    main()
