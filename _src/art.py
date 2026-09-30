# Madhubani (Mithila painting) style motifs, drawn for MB Sweets. Plain SVG strings.
INK = '#2A1511'
SINDOOR = '#D1261C'
HALDI = '#F2A91B'
LEAF = '#2E7B47'
PINK = '#D8457F'
CREAM = '#FFF6E3'


def _scales(x0, x1, y, r=6, color=SINDOOR, w=1.6):
    d = ''.join(f'M{x} {y}a{r} {r} 0 0 0 {2*r} 0' for x in range(x0, x1, 2*r))
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>'


def fish(flip=False, uid='f'):
    """One Madhubani fish facing right, in a 220x110 box."""
    body = 'M52 55C80 18 150 14 196 48C200 51 200 59 196 62C150 96 80 92 52 55Z'
    t = ' transform="translate(220 0) scale(-1 1)"' if flip else ''
    scales = ''.join(_scales(66, 150, y) for y in (38, 50, 62, 74))
    return (
        f'<g{t}>'
        f'<clipPath id="{uid}c"><path d="{body}"/></clipPath>'
        # tail with fan lines
        f'<path d="M52 55C40 42 28 30 12 22C21 40 21 70 12 88C28 80 40 68 52 55Z" fill="{LEAF}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
        f'<path d="M48 55L20 32M48 55L17 55M48 55L20 78" stroke="{CREAM}" stroke-width="1.6" stroke-linecap="round"/>'
        # fins
        f'<path d="M98 27C104 10 121 5 134 19C122 18 110 22 104 30Z" fill="{PINK}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<path d="M98 83C104 100 121 105 134 91C122 92 110 88 104 80Z" fill="{PINK}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        # body
        f'<path d="{body}" fill="{HALDI}"/>'
        f'<g clip-path="url(#{uid}c)">{scales}'
        f'<path d="M150 10C139 40 139 70 150 100L180 100L180 10Z" fill="{SINDOOR}"/>'
        f'<path d="M160 10C150 40 150 70 160 100" stroke="{CREAM}" stroke-width="2" fill="none"/>'
        f'<path d="M58 55H150" stroke="{INK}" stroke-width="1.4" stroke-dasharray="2 5" stroke-linecap="round"/>'
        f'</g>'
        f'<path d="{body}" fill="none" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>'
        f'<path d="M150 22C139 44 139 66 150 88" stroke="{INK}" stroke-width="2" fill="none"/>'
        # eye and mouth
        f'<circle cx="178" cy="49" r="8" fill="{CREAM}" stroke="{INK}" stroke-width="2"/>'
        f'<circle cx="180" cy="49" r="3.4" fill="{INK}"/>'
        f'<path d="M198 58Q192 61 187 59" stroke="{INK}" stroke-width="2" fill="none" stroke-linecap="round"/>'
        f'</g>'
    )


_N = [0]


def fish_pair(width=240, cls='', label='मछली का जोड़ा — मिथिला में शुभ'):
    """Two fish facing each other with a lotus bud between — the Mithila symbol of good fortune."""
    _N[0] += 1
    n = _N[0]
    return (
        f'<svg class="{cls}" viewBox="0 0 470 110" width="{width}" role="img" aria-label="{label}">'
        f'<g transform="translate(0 0)">{fish(False, f"fa{n}")}</g>'
        f'<g transform="translate(250 0)">{fish(True, f"fb{n}")}</g>'
        f'<circle cx="235" cy="55" r="9" fill="{SINDOOR}" stroke="{INK}" stroke-width="2"/>'
        f'<circle cx="235" cy="55" r="3" fill="{HALDI}"/>'
        f'<circle cx="235" cy="30" r="3.5" fill="{LEAF}"/><circle cx="235" cy="80" r="3.5" fill="{LEAF}"/>'
        f'</svg>'
    )


def lotus(width=90, cls='', label=''):
    aria = f'role="img" aria-label="{label}"' if label else 'aria-hidden="true"'
    return (
        f'<svg class="{cls}" viewBox="0 0 140 96" width="{width}" {aria}>'
        f'<path d="M70 76C44 80 20 70 6 54C30 50 54 60 70 76Z" fill="{SINDOOR}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<path d="M70 76C96 80 120 70 134 54C110 50 86 60 70 76Z" fill="{SINDOOR}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<path d="M70 74C48 68 30 46 26 24C48 32 64 50 70 74Z" fill="{PINK}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<path d="M70 74C92 68 110 46 114 24C92 32 76 50 70 74Z" fill="{PINK}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<path d="M70 8C86 28 86 54 70 74C54 54 54 28 70 8Z" fill="{HALDI}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<path d="M70 18V66M40 36Q56 50 66 68M100 36Q84 50 74 68" stroke="{INK}" stroke-width="1.3" fill="none" stroke-dasharray="3 3"/>'
        f'<path d="M34 86Q70 98 106 86" stroke="{LEAF}" stroke-width="4" fill="none" stroke-linecap="round"/>'
        f'</svg>'
    )


def sun(width=90, cls=''):
    import math
    rays = []
    for i in range(16):
        a = i * math.pi / 8
        a1, a2 = a - 0.16, a + 0.16
        p = [(60 + 36 * math.cos(a1), 60 + 36 * math.sin(a1)), (60 + 56 * math.cos(a), 60 + 56 * math.sin(a)),
             (60 + 36 * math.cos(a2), 60 + 36 * math.sin(a2))]
        col = SINDOOR if i % 2 else HALDI
        rays.append(f'<path d="M{p[0][0]:.1f} {p[0][1]:.1f}L{p[1][0]:.1f} {p[1][1]:.1f}L{p[2][0]:.1f} {p[2][1]:.1f}Z" fill="{col}" stroke="{INK}" stroke-width="1.5" stroke-linejoin="round"/>')
    return (
        f'<svg class="{cls}" viewBox="0 0 120 120" width="{width}" aria-hidden="true">' + ''.join(rays) +
        f'<circle cx="60" cy="60" r="36" fill="{HALDI}" stroke="{INK}" stroke-width="2.2"/>'
        f'<circle cx="60" cy="60" r="29" fill="none" stroke="{SINDOOR}" stroke-width="1.6" stroke-dasharray="3 4"/>'
        f'<path d="M44 55Q50 50 57 55Q50 59 44 55ZM63 55Q70 50 76 55Q70 59 63 55Z" fill="{CREAM}" stroke="{INK}" stroke-width="1.6"/>'
        f'<circle cx="51" cy="55" r="2" fill="{INK}"/><circle cx="70" cy="55" r="2" fill="{INK}"/>'
        f'<path d="M60 58V67Q58 69 61 69" stroke="{INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
        f'<path d="M52 74Q60 80 68 74" stroke="{SINDOOR}" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
        f'</svg>'
    )


def diya(width=56):
    return (
        f'<svg viewBox="0 0 80 80" width="{width}" aria-hidden="true">'
        f'<path d="M40 8C48 20 50 28 40 36C30 28 32 20 40 8Z" fill="{HALDI}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'<path d="M40 18C43 24 43 28 40 31C37 28 37 24 40 18Z" fill="{SINDOOR}"/>'
        f'<path d="M8 44H72C68 62 56 70 40 70C24 70 12 62 8 44Z" fill="{SINDOOR}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
        f'<path d="M14 52H66" stroke="{CREAM}" stroke-width="2" stroke-dasharray="4 4"/>'
        f'<path d="M30 70L26 76H54L50 70" fill="{HALDI}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
        f'</svg>'
    )


def kadhai(width=56):
    return (
        f'<svg viewBox="0 0 80 80" width="{width}" aria-hidden="true">'
        f'<path d="M26 22C22 16 30 12 26 6M40 20C36 14 44 10 40 4M54 22C50 16 58 12 54 6" stroke="{INK}" stroke-width="2" fill="none" stroke-linecap="round"/>'
        f'<circle cx="30" cy="34" r="7" fill="{CREAM}" stroke="{INK}" stroke-width="2"/><circle cx="46" cy="32" r="7" fill="{CREAM}" stroke="{INK}" stroke-width="2"/><circle cx="38" cy="38" r="7" fill="{CREAM}" stroke="{INK}" stroke-width="2"/>'
        f'<path d="M6 40H74C72 58 58 70 40 70C22 70 8 58 6 40Z" fill="{HALDI}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
        f'<path d="M12 48H68M16 56H64" stroke="{SINDOOR}" stroke-width="2.2"/>'
        f'<path d="M6 40C0 38 0 46 5 46M74 40C80 38 80 46 75 46" stroke="{INK}" stroke-width="2.2" fill="none"/>'
        f'</svg>'
    )


def vegmark(width=56):
    return (
        f'<svg viewBox="0 0 80 80" width="{width}" aria-hidden="true">'
        f'<rect x="14" y="14" width="52" height="52" rx="6" fill="#fff" stroke="#138A43" stroke-width="5"/>'
        f'<circle cx="40" cy="40" r="14" fill="#138A43"/>'
        f'</svg>'
    )


def scooter(width=56):
    return (
        f'<svg viewBox="0 0 80 80" width="{width}" aria-hidden="true">'
        f'<rect x="8" y="22" width="26" height="22" rx="3" fill="{HALDI}" stroke="{INK}" stroke-width="2"/>'
        f'<path d="M8 30H34M21 22V44" stroke="{SINDOOR}" stroke-width="2"/>'
        f'<path d="M34 50H56L62 34H70" stroke="{INK}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
        f'<path d="M12 50C12 44 30 44 34 50Z" fill="{SINDOOR}" stroke="{INK}" stroke-width="2"/>'
        f'<circle cx="20" cy="58" r="8" fill="{CREAM}" stroke="{INK}" stroke-width="3"/><circle cx="62" cy="58" r="8" fill="{CREAM}" stroke="{INK}" stroke-width="3"/>'
        f'</svg>'
    )


def giftbox(width=160):
    return (
        f'<svg viewBox="0 0 160 150" width="{width}" aria-hidden="true">'
        f'<path d="M80 34C66 10 44 12 48 26C52 38 72 36 80 34ZM80 34C94 10 116 12 112 26C108 38 88 36 80 34Z" fill="{PINK}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
        f'<rect x="20" y="36" width="120" height="26" rx="4" fill="{SINDOOR}" stroke="{INK}" stroke-width="2.4"/>'
        f'<rect x="28" y="62" width="104" height="78" rx="4" fill="{HALDI}" stroke="{INK}" stroke-width="2.4"/>'
        f'<rect x="72" y="36" width="16" height="104" fill="{LEAF}" stroke="{INK}" stroke-width="2"/>'
        + _scales(34, 70, 84, 5, SINDOOR, 1.8) + _scales(34, 70, 104, 5, SINDOOR, 1.8) + _scales(92, 128, 84, 5, SINDOOR, 1.8) + _scales(92, 128, 104, 5, SINDOOR, 1.8) +
        f'<path d="M26 48H70M90 48H134" stroke="{CREAM}" stroke-width="2" stroke-dasharray="4 4"/>'
        f'</svg>'
    )


def border_uri():
    """Repeating zig-zag strip (sindoor/haldi triangles between two ink lines) as a CSS data URI."""
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='16' viewBox='0 0 24 16'>"
        f"<rect width='24' height='16' fill='{CREAM}'/>"
        f"<path d='M0 2.5H24M0 13.5H24' stroke='{INK}' stroke-width='1.5'/>"
        f"<path d='M0 3.2L12 12.8L24 3.2Z' fill='{SINDOOR}'/>"
        f"<path d='M-12 12.8L0 3.2L12 12.8ZM12 12.8L24 3.2L36 12.8Z' fill='{HALDI}'/>"
        f"<circle cx='12' cy='5.8' r='1.3' fill='{CREAM}'/>"
        "</svg>"
    )
    return "url(\"data:image/svg+xml," + svg.replace('#', '%23').replace('<', '%3C').replace('>', '%3E') + "\")"


def scales_uri(bg=HALDI, fg=SINDOOR):
    """Madhubani 'bharni' fish-scale fill for frames."""
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='12' viewBox='0 0 16 12'>"
        f"<rect width='16' height='12' fill='{bg}'/>"
        f"<path d='M0 6a4 4 0 0 0 8 0a4 4 0 0 0 8 0M-4 12a4 4 0 0 0 8 0a4 4 0 0 0 8 0a4 4 0 0 0 8 0' fill='none' stroke='{fg}' stroke-width='1.4'/>"
        "</svg>"
    )
    return "url(\"data:image/svg+xml," + svg.replace('#', '%23').replace('<', '%3C').replace('>', '%3E') + "\")"


def vine_uri():
    """Leaf-and-dot vine for dark maroon bands."""
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' width='36' height='18' viewBox='0 0 36 18'>"
        f"<path d='M0 9H36' stroke='{HALDI}' stroke-width='1.4'/>"
        f"<path d='M9 9C12 3 17 2 20 3C18 7 14 9 9 9Z' fill='{LEAF}' stroke='{HALDI}' stroke-width='.8'/>"
        f"<path d='M27 9C24 15 19 16 16 15C18 11 22 9 27 9Z' fill='{LEAF}' stroke='{HALDI}' stroke-width='.8'/>"
        f"<circle cx='3' cy='9' r='1.8' fill='{SINDOOR}'/>"
        "</svg>"
    )
    return "url(\"data:image/svg+xml," + svg.replace('#', '%23').replace('<', '%3C').replace('>', '%3E') + "\")"


def milkcan(width=120):
    """Milk can — calm, for the bulk dairy page."""
    return (
        f'<svg viewBox="0 0 120 150" width="{width}" aria-hidden="true">'
        f'<path d="M42 10H78V22H42Z" fill="{HALDI}" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>'
        f'<path d="M46 22H74L80 40H40Z" fill="{CREAM}" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>'
        f'<path d="M40 40H80C92 46 96 56 96 68V132C96 138 92 142 86 142H34C28 142 24 138 24 132V68C24 56 28 46 40 40Z" fill="#E9EEF0" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>'
        f'<path d="M24 84H96M24 118H96" stroke="{INK}" stroke-width="2"/>'
        f'<rect x="24" y="90" width="72" height="22" fill="{LEAF}"/>'
        f'<path d="M34 101H86" stroke="{CREAM}" stroke-width="2" stroke-dasharray="4 5"/>'
        f'<path d="M24 60C12 60 10 76 24 78M96 60C108 60 110 76 96 78" stroke="{INK}" stroke-width="3" fill="none" stroke-linecap="round"/>'
        f'<path d="M36 52Q38 66 34 76" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>'
        f'</svg>'
    )


def matka(width=110):
    """Clay curd pot (matka) with a cloth tie."""
    return (
        f'<svg viewBox="0 0 120 130" width="{width}" aria-hidden="true">'
        f'<path d="M30 30H90L84 44H36Z" fill="{CREAM}" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>'
        f'<path d="M24 22Q60 8 96 22L90 32Q60 22 30 32Z" fill="#fff" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'
        f'<path d="M36 44C12 56 10 96 32 112C44 121 76 121 88 112C110 96 108 56 84 44Z" fill="#B5582C" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>'
        f'<path d="M20 74Q60 86 100 74" stroke="{HALDI}" stroke-width="4" fill="none"/>'
        f'<path d="M24 88Q60 100 96 88" stroke="{CREAM}" stroke-width="2" fill="none" stroke-dasharray="3 5"/>'
        f'<path d="M34 56Q28 70 32 84" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35"/>'
        f'</svg>'
    )
