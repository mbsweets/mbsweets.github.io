"""CrazyGames अब zip नहीं लेता और मोबाइल से फ़ोल्डर अपलोड नहीं होता — इसलिए पूरा गेम एक ही index.html में।
python3 _src/portal/build_crazygames_single.py <build_crazygames.py वाला खुला फ़ोल्डर> <नई index.html>

  * js/main.js से सारे मॉड्यूल esbuild से एक <script type="module"> में (नाम नहीं बदलते — सिर्फ़ खाली जगह/सिंटैक्स छोटा)
  * img/ models/ fonts/ → data: URI; CSS वाले सीधे, JS वाले एक छोटे नक्शे (window.__RR_A) से:
    fetch('models/..') और <img>.src = 'img/..' उसी नक्शे से खुलते हैं (three.js का TextureLoader भी <img> ही बनाता है)
  * बाहर का कुछ नहीं जुड़ता — सिर्फ़ वही जो पोर्टल वाली बिल्ड में पहले से है (CrazyGames SDK + अपनी गिनती)
"""
import base64, json, mimetypes, os, re, subprocess, sys, tempfile

SRC, OUT = sys.argv[1], sys.argv[2]
ESBUILD = os.environ.get('ESBUILD', '/opt/npm-tools/node_modules/esbuild/bin/esbuild')
MIME = {'.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.bin': 'application/octet-stream'}


def data_uri(rel):
    p = os.path.join(SRC, rel)
    ext = os.path.splitext(p)[1]
    mt = MIME.get(ext) or mimetypes.guess_type(p)[0] or 'application/octet-stream'
    return 'data:%s;base64,%s' % (mt, base64.b64encode(open(p, 'rb').read()).decode())


# 1) JS एक में
with tempfile.TemporaryDirectory() as td:
    out_js = os.path.join(td, 'b.js')
    subprocess.run([ESBUILD, os.path.join(SRC, 'js', 'main.js'), '--bundle', '--format=esm', '--target=es2020',
                    '--minify-whitespace', '--minify-syntax', '--legal-comments=none', '--log-level=warning',
                    '--outfile=' + out_js], check=True)
    js = open(out_js, encoding='utf-8').read()
js = js.replace('</script', '<\\/script')

# 2) JS जिन फ़ाइलों को नाम से माँगता है
assets = {}
for d in ('img', 'models'):
    for f in sorted(os.listdir(os.path.join(SRC, d))):
        rel = d + '/' + f
        if rel in ('img/sky.webp',) or f.endswith('.txt'):
            continue
        assets[rel] = data_uri(rel)

html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()

# 3) CSS: फ़ॉन्ट और आसमान सीधे
html = re.sub(r'url\((fonts/[^)]+)\)', lambda m: 'url(%s)' % data_uri(m.group(1)), html)
n_sky = html.count('url(img/sky.webp)')
html = html.replace('url(img/sky.webp)', 'var(--rr-sky)')
html = html.replace('<style>', '<style>\n:root{--rr-sky:url(%s)}' % data_uri('img/sky.webp'), 1)

# 4) पहले से लिखे <img src="img/..."> / आइकन — नक्शे से, पेज बनते ही
html = re.sub(r'<link rel="icon" href="(img/[^"]+)">', r'<link rel="icon" data-rr-href="\1">', html)
html = re.sub(r'<img src="(img/[^"]+)"', r'<img data-rr-src="\1"', html)

patch = ('<script>(function(){var A=window.__RR_A=%s;'
         'var F=window.fetch;window.fetch=function(u,o){if(typeof u==="string"&&A[u])u=A[u];return F.call(this,u,o)};'
         'var d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,"src");'
         'Object.defineProperty(HTMLImageElement.prototype,"src",{configurable:true,enumerable:d.enumerable,'
         'get:function(){return d.get.call(this)},set:function(v){if(typeof v==="string"&&A[v])v=A[v];d.set.call(this,v)}});'
         'document.addEventListener("DOMContentLoaded",function(){'
         'document.querySelectorAll("[data-rr-src]").forEach(function(e){e.src=e.getAttribute("data-rr-src")});'
         'document.querySelectorAll("[data-rr-href]").forEach(function(e){var k=e.getAttribute("data-rr-href");e.href=A[k]||k});'
         '});})();</script>') % json.dumps(assets, separators=(',', ':'))
# SDK वाली लाइन के ठीक बाद (मॉड्यूल से पहले चलना ज़रूरी)
m = re.search(r'<script src="https://sdk\.crazygames\.com/[^"]+"></script>', html)
assert m, 'SDK script not found'
html = html[:m.end()] + '\n' + patch + html[m.end():]

# 5) मॉड्यूल
old = '<script type="module" src="js/main.js"></script>'
assert old in html
html = re.sub(r'<!--vmap-->.*?<!--/vmap-->\n?', '', html, flags=re.S)  # एक फ़ाइल में सब — वर्ज़न map की ज़रूरत नहीं
html = html.replace(old, '<script type="module">\n' + js + '\n</script>')

# 6) लाइसेंस/श्रेय (CREDITS.md) एक टिप्पणी में
cred = open(os.path.join(SRC, 'CREDITS.md'), encoding='utf-8').read().replace('--', '- -')
html = html.replace('<html lang="en">', '<html lang="en">\n<!--\n' + cred + '\nthree.js: MIT License (c) 2010-2023 three.js authors. Fonts: SIL Open Font License 1.1.\n-->', 1)

# जाँच: कोई पुराना रास्ता छूटा नहीं
left = sorted(set(re.findall(r'["\'(](?:img|models|fonts|js)/[\w.\-]+', html.replace(json.dumps(assets, separators=(',', ':')), ''))))
left = [x for x in left if x[1:] not in assets]
open(OUT, 'w', encoding='utf-8').write(html)
print('तैयार:', OUT, round(os.path.getsize(OUT) / 1e6, 2), 'MB | assets', len(assets), '| sky', n_sky, '| बचे रास्ते:', left)
