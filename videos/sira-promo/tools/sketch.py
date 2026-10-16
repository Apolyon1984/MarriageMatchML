"""Génère les esquisses statiques (passe d'esquisses) des 6 plans SIRA.

Chaque plan est une sous-composition HyperFrames 1080x1920, posée à son
moment clé, sans animation. Les volumes isométriques sont calculés ici et
écrits en SVG statique (rendu déterministe).
"""

import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
W, H = 1080, 1920

CREAM = "#F5F2ED"
INK = "#0F172A"
BLUE = "#2563EB"
BLUE_D = "#1D4ED8"
BLUE_L = "#93C5FD"
BLUE_XL = "#DBEAFE"
SLATE = "#475569"
GREY = "#CBD5E1"
GREY_L = "#E2E8F0"
WHITE = "#FFFFFF"

C30, S30 = math.cos(math.radians(30)), math.sin(math.radians(30))


def shade(hex_color, f):
    """Éclaircit (f > 0) ou assombrit (f < 0) une couleur."""
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    if f >= 0:
        r, g, b = (round(c + (255 - c) * f) for c in (r, g, b))
    else:
        r, g, b = (round(c * (1 + f)) for c in (r, g, b))
    return f"#{r:02X}{g:02X}{b:02X}"


class Iso:
    def __init__(self, ox, oy, s):
        self.ox, self.oy, self.s = ox, oy, s
        self.parts = []

    def p(self, x, y, z):
        return (self.ox + (x - y) * C30 * self.s, self.oy + (x + y) * S30 * self.s - z * self.s)

    def poly(self, pts, fill, stroke=None):
        d = " ".join(f"{a:.1f},{b:.1f}" for a, b in pts)
        st = f' stroke="{stroke}" stroke-width="2" stroke-linejoin="round"' if stroke else ""
        self.parts.append(f'<polygon points="{d}" fill="{fill}"{st}/>')

    def box(self, x, y, z, dx, dy, dz, color, top=None):
        p = self.p
        self.poly([p(x, y + dy, z), p(x + dx, y + dy, z), p(x + dx, y + dy, z + dz), p(x, y + dy, z + dz)], shade(color, -0.18))
        self.poly([p(x + dx, y, z), p(x + dx, y + dy, z), p(x + dx, y + dy, z + dz), p(x + dx, y, z + dz)], shade(color, -0.35))
        self.poly([p(x, y, z + dz), p(x + dx, y, z + dz), p(x + dx, y + dy, z + dz), p(x, y + dy, z + dz)], top or shade(color, 0.12))

    def book_stack(self, x, y, z, n, palette, w=1.6, d=1.1, t=0.32):
        for i in range(n):
            c = palette[i % len(palette)]
            off = 0.12 * ((i * 7) % 3 - 1)
            self.box(x + off, y - off, z + i * t, w, d, t * 0.92, c, top=shade(c, 0.25))
            # tranche de pages
            self.poly([self.p(x + off + w, y - off + 0.08, z + i * t + 0.05), self.p(x + off + w, y - off + d - 0.08, z + i * t + 0.05),
                       self.p(x + off + w, y - off + d - 0.08, z + i * t + t * 0.8), self.p(x + off + w, y - off + 0.08, z + i * t + t * 0.8)], WHITE)
        return z + n * t

    def person(self, x, y, z, body=INK):
        self.box(x, y, z, 0.7, 0.5, 1.3, body)
        hx, hy = self.p(x + 0.35, y + 0.25, z + 1.75)
        r = 0.33 * self.s
        self.parts.append(f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{r:.1f}" fill="#8B5E3C"/>')

    def svg(self):
        return "\n".join(self.parts)


def frame_html(comp_id, body_html, extra_css=""):
    return f"""<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <template>
      <style>
        #root {{ position: absolute; inset: 0; width: {W}px; height: {H}px; overflow: hidden; font-family: 'Open Sans', sans-serif; color: {INK}; }}
        #root .bg {{ position: absolute; inset: 0; background: {CREAM}; }}
        #root .layer {{ position: absolute; inset: 0; }}
        #root svg.art {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; }}
        #root .eyebrow {{ position: absolute; left: 0; right: 0; text-align: center; font: 600 26px/1 'Open Sans', sans-serif; letter-spacing: 0.16em; text-transform: uppercase; color: {BLUE}; }}
        #root .pill {{ display: inline-block; padding: 14px 28px; border-radius: 100px; background: rgba(37,99,235,0.08); border: 2px solid rgba(37,99,235,0.2); }}
        #root .h1 {{ position: absolute; left: 70px; right: 70px; text-align: center; font: 700 88px/1.08 'Playfair Display', serif; letter-spacing: -0.02em; color: {INK}; }}
        #root .h1 em {{ font-style: italic; font-weight: 400; color: {BLUE}; }}
        #root .card {{ position: absolute; background: {WHITE}; border: 2px solid rgba(37,99,235,0.2); border-radius: 14px; }}
        #root .line {{ height: 18px; border-radius: 9px; background: {GREY_L}; margin-top: 18px; }}
        {extra_css}
      </style>
      <div id="root" data-composition-id="{comp_id}" data-width="{W}" data-height="{H}">
        <div class="bg clip" data-start="0" data-duration="__DUR__"></div>
        <div class="layer clip" data-start="0" data-duration="__DUR__">
{body_html}
        </div>
      </div>
      <script>
        window.__timelines = window.__timelines || {{}};
        window.__timelines["{comp_id}"] = gsap.timeline({{ paused: true }});
      </script>
    </template>
  </body>
</html>
"""


def svg_wrap(inner):
    return f'<svg class="art" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">{inner}</svg>'


# ── Plan 1 : enseveli sous les textes ────────────────────────────────────────
def f01():
    iso = Iso(540, 1120, 74)
    books = [INK, SLATE, GREY, WHITE, BLUE_D, INK, GREY]
    # sol
    iso.poly([iso.p(-3.2, -3.2, 0), iso.p(3.6, -3.2, 0), iso.p(3.6, 3.6, 0), iso.p(-3.2, 3.6, 0)], shade(CREAM, -0.06))
    # piles arrière
    iso.book_stack(-2.8, -2.6, 0, 10, books)
    iso.book_stack(-0.6, -2.9, 0, 12, books[2:] + books[:2])
    iso.book_stack(1.6, -2.7, 0, 9, books[4:] + books[:4])
    iso.book_stack(-3.0, -0.4, 0, 8, books[1:] + books[:1])
    # bureau et juriste
    iso.box(-0.6, 0.2, 0, 2.6, 1.6, 0.9, shade(SLATE, -0.1))
    iso.person(0.3, 1.9, 0)
    # dossiers sur le bureau
    iso.book_stack(-0.4, 0.3, 0.9, 6, [WHITE, GREY, BLUE_D])
    iso.book_stack(1.0, 0.4, 0.9, 8, [GREY, WHITE, INK])
    # piles avant
    iso.book_stack(2.3, 0.6, 0, 9, books)
    iso.book_stack(2.2, 2.4, 0, 6, books[3:] + books[:3])
    iso.book_stack(-2.6, 2.0, 0, 5, books[5:] + books[:5])
    # feuilles volantes
    for (x, y, z) in [(-1.6, 1.0, 3.2), (1.8, -0.6, 4.0), (0.2, -1.2, 4.6)]:
        iso.poly([iso.p(x, y, z), iso.p(x + 0.7, y, z), iso.p(x + 0.7, y + 0.5, z), iso.p(x, y + 0.5, z)], WHITE, stroke=GREY)
    body = f"""
          {svg_wrap(iso.svg())}
          <div class="eyebrow" style="top:262px"><span class="pill">Le quotidien du juriste</span></div>
          <div class="h1" style="top:350px">Des heures à chercher<br/><em>le bon article ?</em></div>
          <div class="card" style="left:690px;top:1340px;width:300px;padding:22px 26px;">
            <div style="font:600 22px/1 'Open Sans';color:{SLATE};letter-spacing:.08em;text-transform:uppercase">Recherche</div>
            <div style="font:700 64px/1.1 'Open Sans';color:{INK};margin-top:10px">3 h 47</div>
          </div>"""
    return frame_html("f01-enseveli", body)


# ── Plan 2 : SIRA range tout ─────────────────────────────────────────────────
def f02():
    iso = Iso(540, 1330, 58)
    iso.poly([iso.p(-4, -4, 0), iso.p(4.4, -4, 0), iso.p(4.4, 4.4, 0), iso.p(-4, 4.4, 0)], shade(CREAM, -0.06))
    heights = [[2.2, 1.4, 3.0, 1.8], [1.2, 3.6, 2.0, 2.6], [2.8, 1.6, 4.2, 1.4], [1.6, 2.4, 1.8, 3.2]]
    cols = [INK, BLUE, WHITE, BLUE_D]
    for i in range(4):
        for j in range(4):
            iso.box(-3.6 + i * 2.0, -3.6 + j * 2.0, 0, 1.4, 1.4, heights[i][j], cols[(i + j) % 4])
    body = f"""
          {svg_wrap(iso.svg())}
          <img src="assets/logo_sira.png" style="position:absolute;left:300px;top:250px;width:480px;" alt="SIRA" />
          <div class="card" style="left:90px;top:500px;width:900px;padding:30px 36px;">
            <div style="font:600 22px/1 'Open Sans';color:{BLUE};letter-spacing:.12em;text-transform:uppercase">Votre question</div>
            <div style="font:400 40px/1.3 'Playfair Display';color:{INK};margin-top:14px">Quelles sont les conditions de validité d'un contrat&nbsp;?</div>
          </div>
          <div class="card" style="left:90px;top:745px;width:900px;padding:30px 36px;background:{INK};border-color:{INK};">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="font:600 22px/1 'Open Sans';color:{BLUE_L};letter-spacing:.12em;text-transform:uppercase">Réponse SIRA</div>
              <div style="font:700 24px/1 'Open Sans';color:{WHITE};background:{BLUE};padding:10px 20px;border-radius:100px">en 3 s</div>
            </div>
            <div class="line" style="width:92%;background:#334155"></div>
            <div class="line" style="width:80%;background:#334155"></div>
            <div class="line" style="width:64%;background:#334155"></div>
          </div>"""
    return frame_html("f02-sira-range", body)


# ── Plan 3 : la ville du droit en chiffres ───────────────────────────────────
def f03():
    iso = Iso(540, 1260, 70)
    iso.poly([iso.p(-4.6, -2.2, 0), iso.p(5.0, -2.2, 0), iso.p(5.0, 3.0, 0), iso.p(-4.6, 3.0, 0)], shade(CREAM, -0.06))
    # trois quartiers : domaines, textes de loi, jurisprudences
    for k, (x, base_h, col) in enumerate([(-4.2, 1.6, INK), (-0.8, 3.0, BLUE), (2.6, 2.4, INK)]):
        for a in range(2):
            for b in range(2):
                h = base_h * (1.0 + 0.35 * ((a + 2 * b + k) % 3))
                iso.box(x + a * 1.1, -1.6 + b * 1.1 + k * 0.6, 0, 0.9, 0.9, h, col if (a + b) % 2 == 0 else shade(col, 0.3))
    stats = [("20+", "domaines du droit", INK, 0.45), ("5 000+", "textes de loi", BLUE, 1.0), ("5 000+", "jurisprudences", INK, 0.45)]
    rows = "".join(
        f"""<div style="display:flex;align-items:baseline;gap:22px;opacity:{o};margin-top:18px">
              <div style="font:700 104px/1 'Open Sans';color:{c};letter-spacing:-0.02em">{n}</div>
              <div style="font:400 40px/1.1 'Playfair Display';color:{INK}">{label}</div>
            </div>"""
        for n, label, c, o in stats)
    body = f"""
          {svg_wrap(iso.svg())}
          <div class="eyebrow" style="top:262px"><span class="pill">La base SIRA</span></div>
          <div style="position:absolute;left:110px;top:360px;">{rows}</div>"""
    return frame_html("f03-ville-chiffres", body)


# ── Plan 4 : des sources citées ──────────────────────────────────────────────
def f04():
    iso = Iso(540, 1370, 70)
    iso.book_stack(-1.2, -0.6, 0, 6, [INK, BLUE_D, WHITE, SLATE], w=2.4, d=1.6, t=0.36)
    chips = ["Acte uniforme OHADA", "Code pénal du Mali", "Arrêt de la Cour suprême"]
    chip_html = "".join(
        f"""<div style="display:flex;align-items:center;gap:16px;margin-top:20px;padding:16px 22px;border-radius:100px;background:rgba(37,99,235,0.08);border:2px solid rgba(37,99,235,0.2)">
              <div style="width:40px;height:40px;border-radius:50%;background:{BLUE};color:{WHITE};font:700 26px/40px 'Open Sans';text-align:center">✓</div>
              <div style="font:600 30px/1 'Open Sans';color:{INK}">{c}</div>
            </div>"""
        for c in chips)
    body = f"""
          {svg_wrap(iso.svg())}
          <div class="h1" style="top:290px">Des sources fiables,<br/><em>toujours citées.</em></div>
          <div class="card" style="left:110px;top:560px;width:860px;padding:34px 40px;">
            <div style="font:600 22px/1 'Open Sans';color:{BLUE};letter-spacing:.12em;text-transform:uppercase">Réponse SIRA</div>
            <div class="line" style="width:94%"></div>
            <div class="line" style="width:86%"></div>
            <div class="line" style="width:58%"></div>
            <div style="font:600 22px/1 'Open Sans';color:{SLATE};letter-spacing:.12em;text-transform:uppercase;margin-top:34px">Sources</div>
            {chip_html}
          </div>"""
    return frame_html("f04-sources", body)


# ── Plan 5 : formule Pro ─────────────────────────────────────────────────────
def f05():
    iso = Iso(300, 1140, 46)
    iso.box(-2.6, -2.6, 0, 5.2, 5.2, 0.6, GREY)
    iso2 = Iso(780, 1140, 46)
    iso2.box(-2.6, -2.6, 0, 5.2, 5.2, 0.6, BLUE)
    iso.parts += iso2.parts

    def card(left, title, price, unit, dark, badge=""):
        bg, fg, sub = (BLUE, WHITE, BLUE_XL) if dark else (WHITE, INK, SLATE)
        b = (f'<div style="margin-top:26px;display:inline-block;font:700 22px/1 \'Open Sans\';color:{BLUE};background:{WHITE};padding:12px 18px;border-radius:100px">{badge}</div>' if badge else "")
        return f"""<div class="card" style="left:{left}px;top:580px;width:420px;height:460px;padding:44px 36px;background:{bg};border-color:{bg if dark else 'rgba(37,99,235,0.2)'}">
              <div style="font:600 24px/1 'Open Sans';color:{sub};letter-spacing:.12em;text-transform:uppercase">{title}</div>
              <div style="font:700 96px/1 'Open Sans';color:{fg};margin-top:44px;letter-spacing:-0.03em">{price}</div>
              <div style="font:600 32px/1 'Open Sans';color:{sub};margin-top:16px">{unit}</div>
              {b}
            </div>"""

    body = f"""
          {svg_wrap(iso.svg())}
          <div class="eyebrow" style="top:262px"><span class="pill">Formule Pro</span></div>
          <div class="h1" style="top:350px;font-size:72px">Un prix clair.</div>
          {card(90, "Mensuel", "25 000", "FCFA / mois", False)}
          {card(570, "Annuel", "200 000", "FCFA / an", True, "100 000 FCFA d'économie")}"""
    return frame_html("f05-formule-pro", body)


# ── Plan 6 : le droit, en un instant ─────────────────────────────────────────
def f06():
    rings = "".join(f'<circle cx="540" cy="760" r="{r}" fill="none" stroke="{BLUE}" stroke-opacity="{0.10 - i * 0.02:.2f}" stroke-width="2"/>' for i, r in enumerate([300, 400, 500, 600]))
    iso = Iso(540, 1330, 70)
    body = f"""
          {svg_wrap(rings + iso.svg())}
          <img src="assets/logo_sira.png" style="position:absolute;left:190px;top:560px;width:700px;" alt="SIRA" />
          <div class="h1" style="top:900px;font-size:80px">Le droit,<br/><em>en un instant.</em></div>
          <div style="position:absolute;left:0;right:0;top:1120px;text-align:center;font:600 40px/1 'Open Sans';color:{SLATE}">siramali.com</div>
          <div style="position:absolute;left:340px;top:1190px;width:400px;padding:28px 0;text-align:center;border-radius:100px;background:{INK};color:{WHITE};font:700 34px/1 'Open Sans'">S'abonner</div>"""
    return frame_html("f06-cta", body)


FRAMES = [
    ("01-enseveli", "f01-enseveli", f01, 0.0, 4.0),
    ("02-sira-range", "f02-sira-range", f02, 4.0, 6.2),
    ("03-ville-chiffres", "f03-ville-chiffres", f03, 10.2, 7.2),
    ("04-sources", "f04-sources", f04, 17.4, 3.2),
    ("05-formule-pro", "f05-formule-pro", f05, 20.6, 6.0),
    ("06-cta", "f06-cta", f06, 26.6, 5.4),
]


def main():
    out = ROOT / "compositions" / "frames"
    out.mkdir(parents=True, exist_ok=True)
    mounts = []
    for i, (name, cid, fn, start, dur) in enumerate(FRAMES):
        (out / f"{name}.html").write_text(fn().replace("__DUR__", f"{dur}"), encoding="utf-8")
        mounts.append(
            f'      <div id="el-{cid}" class="clip" data-composition-id="{cid}" data-composition-src="compositions/frames/{name}.html" '
            f'data-start="{start}" data-duration="{dur}" data-track-index="1" data-width="{W}" data-height="{H}"></div>')
    total = round(FRAMES[-1][3] + FRAMES[-1][4], 2)
    fonts = (ROOT / "assets" / "fonts" / "fonts.css").read_text(encoding="utf-8")
    index = f"""<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      {fonts}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: {W}px; height: {H}px; overflow: hidden; background: {CREAM}; }}
      #root {{ position: relative; width: {W}px; height: {H}px; background: {CREAM}; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="{W}" data-height="{H}">
{chr(10).join(mounts)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""
    (ROOT / "index.html").write_text(index, encoding="utf-8")
    print("ok", total, "s")


if __name__ == "__main__":
    main()
