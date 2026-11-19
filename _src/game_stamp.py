"""गेम के JS मॉड्यूल पर वर्ज़न की मुहर (import map) — हर बार गेम बदलने के बाद, commit से पहले चलाओ:
    python3 _src/game_stamp.py

क्यों: GitHub Pages हर फ़ाइल 10 मिनट cache करने देता है। नया गेम डालते ही किसी फ़ोन में आधी फ़ाइलें नई
और आधी पुरानी आ जाती थीं → "error" / गेम अटकना। अब game/index.html में import map है जो हर मॉड्यूल को
उसकी सामग्री के hash वाले पते (world.js?v=ab12cd34) पर भेजता है — फ़ाइल बदली तो पता बदला, पुराना cache काम नहीं आता।
<script type="module" src="js/main.js"> वैसा ही रहता है (CrazyGames वाला build उसी लाइन को ढूँढता है).
"""
import hashlib, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'game'
html_p = ROOT / 'index.html'
imports = {}
for f in sorted((ROOT / 'js').glob('*.js')):
    h = hashlib.sha1(f.read_bytes()).hexdigest()[:8]
    imports['./js/' + f.name] = './js/' + f.name + '?v=' + h
ver = hashlib.sha1(''.join(sorted(imports.values())).encode()).hexdigest()[:7]  # पूरे गेम का एक संस्करण-नाम (सेटिंग्स में दिखता है)
block = '<!--vmap--><meta name="rr-ver" content="' + ver + '"><script type="importmap">' + json.dumps({'imports': imports}, separators=(',', ':')) + '</script><!--/vmap-->'
html = html_p.read_text(encoding='utf-8')
if '<!--vmap-->' in html:
    html = re.sub(r'<!--vmap-->.*?<!--/vmap-->', lambda m: block, html, flags=re.S)
else:
    tag = '<script type="module" src="js/main.js"></script>'
    assert tag in html, 'main.js script tag not found'
    html = html.replace(tag, block + '\n' + tag)
html_p.write_text(html, encoding='utf-8')
print('stamped', len(imports), 'modules, version', ver)
