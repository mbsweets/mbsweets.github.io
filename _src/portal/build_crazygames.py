#!/usr/bin/env python3
"""रसगुल्ला रन — CrazyGames के लिए zip बनाना।

    python3 _src/portal/build_crazygames.py <आउटपुट फ़ोल्डर>          (Basic Launch: विज्ञापन बंद)
    python3 _src/portal/build_crazygames.py <आउटपुट फ़ोल्डर> --ads    (Full Launch: rewarded/midgame चालू)

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
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    out_root = Path(args[0] if args else 'dist').resolve()
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
    # Basic Launch: CrazyGames विज्ञापन बंद रखता है — "विज्ञापन देखकर आगे खेलो" बटन बेकार दिखे तो QA रोकता है। Full Launch के समय `--ads` से build करो
    no_ads = '' if '--ads' in sys.argv else ' window.RR_NO_ADS = true;'
    head = '<meta charset="utf-8">\n<script>window.RR_PORTAL = \'crazygames\';' + no_ads + '</script>\n<script src="' + SDK + '"></script>'
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
    g, n = re.subn(r"window\.open\('https://wa\.me/[^\n]*", '', g)  # WhatsApp शेयर (दौड़ + चुनौती) — पोर्टल पर बंद
    if n < 1:
        raise SystemExit('wa.me वाली लाइन नहीं मिली')
    (out / 'js/game.js').write_text(g, encoding='utf-8')

    # ---- i18n.js: फ़ोटो-कार्ड शेयर के टेक्स्ट से अपनी वेबसाइट का पता हटाओ (पोर्टल पर बाहरी प्रचार मना) ----
    t = (out / 'js/i18n.js').read_text(encoding='utf-8')
    t, n = re.subn(r"(cardShare: '[^']*?)\s*[^'!]*: https://mbsweets\.github\.io/game/'", r"\1'", t)
    if n != 3:
        raise SystemExit(f'cardShare 3 भाषाओं में नहीं मिला ({n})')
    (out / 'js/i18n.js').write_text(t, encoding='utf-8')

    # ---- फ़ोटो-कार्ड (दौड़ का कार्ड + दर्शन पोस्टकार्ड): QR और वेबसाइट का पता नहीं — दुकान का नाम/लोगो रहता है (24 नवंबर) ----
    for rel, pat in (('js/moment.js', r"load\('img/qr_game\.png'\)"), ('js/darshan.js', r"loadImg\('img/qr_game\.png'\)")):
        t = (out / rel).read_text(encoding='utf-8')
        t, n1 = re.subn(pat, 'null', t)
        t, n2 = re.subn(r"'mbsweets\.github\.io/game'", "''", t)
        if n1 != 1 or n2 != 1:
            raise SystemExit(f'{rel}: QR/पता नहीं मिला ({n1}, {n2})')
        (out / rel).write_text(t, encoding='utf-8')

    # ---- जाँच: कोई बाहरी पता बचा तो नहीं ----
    bad = []
    for rel in files:
        if not rel.endswith(('.js', '.html', '.css')) or rel.endswith('three.module.min.js'):
            continue
        t = (out / rel).read_text(encoding='utf-8')
        for m in re.finditer(r'https?://[^\s\'"`)<]+', t):
            u = m.group(0)
            if u.startswith(SDK) or 'xxxx.workers.dev' in u or u.startswith('https://rasgulla-lb.'):  # अपना Cloudflare (सिर्फ़ खिलाड़ी गिनती; पोर्टल पर लीडरबोर्ड/इनाम बंद)
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
