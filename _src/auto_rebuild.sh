#!/usr/bin/env bash
# रोज़ रात अपने-आप: दुकान की दाम-लिस्ट (mb-sweets/catalog.js) से वेबसाइट दोबारा बनाओ।
# कुछ बदला हो तभी commit — वरना कुछ नहीं। चलता है: .github/workflows/rebuild.yml से।
# Safety: catalog ख़राब हो तो रुक जाओ; कोई पेज मिटे या CNAME बने तो रुक जाओ (बिलिंग ऐप का पता नहीं बदलना)।
set -euo pipefail
cd "$(dirname "$0")/.."
CAT="${MB_CATALOG:-}"
if [ -z "$CAT" ]; then
  CAT="$(mktemp --suffix=.js)"
  curl -fsSL --retry 3 --retry-delay 5 "https://raw.githubusercontent.com/mbsweets/mb-sweets/main/catalog.js?t=$(date +%s)" -o "$CAT"
fi
VER="$(node -e "global.window={};require(process.argv[1]);var c=window.MB_CATALOG;if(!c||!Array.isArray(c.items)||c.items.length<10||!c.shop){process.exit(3)}process.stdout.write(String(c.version||''))" "$CAT")" \
  || { echo "::error::catalog.js पढ़ा नहीं गया — वेबसाइट जैसी है वैसी रहेगी"; exit 1; }
export TZ=Asia/Kolkata PYTHONDONTWRITEBYTECODE=1 MB_OUT="$PWD" MB_CATALOG="$CAT"
python3 _src/build.py
[ -e CNAME ] && { echo "::error::CNAME बन गया — रोक दिया"; exit 1; }
if git status --porcelain | grep -q '^ *D'; then echo "::error::कोई फ़ाइल मिट रही थी — रोक दिया"; git status --porcelain; exit 1; fi
out() { echo "$1" >> "${GITHUB_OUTPUT:-/dev/null}"; }
if [ -z "$(git status --porcelain -- . ':(exclude)sitemap.xml')" ]; then
  git checkout -- sitemap.xml 2>/dev/null || true
  echo "कोई बदलाव नहीं — दाम वही हैं"
  # GitHub 60 दिन तक कोई commit न हो तो रोज़ का काम बंद कर देता है — 45 दिन होते ही एक छोटा निशान commit
  last="$(git log -1 --format=%ct)"; age=$(( ($(date +%s) - last) / 86400 ))
  if [ "$age" -ge 45 ]; then
    date +%F > .github/keepalive.txt
    git add .github/keepalive.txt
    git commit -q -m "Keepalive: रोज़ रात वाला अपने-आप अपडेट चालू रखने के लिए ($age दिन से कोई commit नहीं)"
    out "pushed=yes"
  else
    out "pushed=no"
  fi
  exit 0
fi
git add -A
git commit -q -m "Website: अपने-आप अपडेट — दुकान सेटिंग के नए दाम/स्टॉक (catalog v$VER)"
git show --stat --format='%s' HEAD | head -20
out "pushed=yes"
