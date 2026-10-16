"""Construit les 6 plans animés SIRA à partir des esquisses validées.

Mise en page identique à tools/sketch.py (planche validée) ; ajoute les
entrées GSAP calées sur le minutage mot à mot de la voix (audio_meta.json).
Sortie : compositions/frames/NN-*.html, fragments <template> nus.
"""

import json
import math
import re
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
FONTS = (ROOT / "assets" / "fonts" / "fonts.css").read_text(encoding="utf-8")


def durations():
    sb = (ROOT / "STORYBOARD.md").read_text(encoding="utf-8")
    return [float(x) for x in re.findall(r"^- duration: ([\d.]+)s", sb, re.M)]


def word_times():
    meta = json.loads((ROOT / "audio_meta.json").read_text(encoding="utf-8"))
    return {v["frame"]: [(w["text"], w["start"]) for w in v["words"]] for v in meta["voices"]}


def at(words, text, nth=0):
    """Instant (s, relatif au plan) où la voix prononce `text` (n-ième occurrence)."""
    hits = [s for t, s in words if t.lower().startswith(text.lower())]
    return round(hits[nth], 2)


def shade(hex_color, f):
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

    def open(self, gid):
        self.parts.append(f'<g id="{gid}">')

    def close(self):
        self.parts.append("</g>")

    def poly(self, pts, fill, stroke=None):
        d = " ".join(f"{a:.1f},{b:.1f}" for a, b in pts)
        st = f' stroke="{stroke}" stroke-width="2" stroke-linejoin="round"' if stroke else ""
        self.parts.append(f'<polygon points="{d}" fill="{fill}"{st}/>')

    def box(self, x, y, z, dx, dy, dz, color, top=None):
        p = self.p
        self.poly([p(x, y + dy, z), p(x + dx, y + dy, z), p(x + dx, y + dy, z + dz), p(x, y + dy, z + dz)], shade(color, -0.18))
        self.poly([p(x + dx, y, z), p(x + dx, y + dy, z), p(x + dx, y + dy, z + dz), p(x + dx, y, z + dz)], shade(color, -0.35))
        self.poly([p(x, y, z + dz), p(x + dx, y, z + dz), p(x + dx, y + dy, z + dz), p(x, y + dy, z + dz)], top or shade(color, 0.12))

    def book_stack(self, gid, x, y, z, n, palette, w=1.6, d=1.1, t=0.32):
        """Pile de livres ; chaque livre est un groupe `gid-i` animable."""
        for i in range(n):
            c = palette[i % len(palette)]
            off = 0.12 * ((i * 7) % 3 - 1)
            self.open(f"{gid}-{i}")
            self.box(x + off, y - off, z + i * t, w, d, t * 0.92, c, top=shade(c, 0.25))
            self.poly([self.p(x + off + w, y - off + 0.08, z + i * t + 0.05), self.p(x + off + w, y - off + d - 0.08, z + i * t + 0.05),
                       self.p(x + off + w, y - off + d - 0.08, z + i * t + t * 0.8), self.p(x + off + w, y - off + 0.08, z + i * t + t * 0.8)], WHITE)
            self.close()

    def person(self, x, y, z, body=INK):
        self.box(x, y, z, 0.7, 0.5, 1.3, body)
        hx, hy = self.p(x + 0.35, y + 0.25, z + 1.75)
        self.parts.append(f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{0.33 * self.s:.1f}" fill="#8B5E3C"/>')

    def svg(self):
        return "\n".join(self.parts)


def svg_wrap(inner):
    return f'<svg class="art" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">{inner}</svg>'


def template(cid, dur, body, js, extra_css=""):
    return f"""<template>
  <style>
    {FONTS}
    #root {{ position: absolute; inset: 0; width: {W}px; height: {H}px; overflow: hidden; font-family: 'Open Sans', sans-serif; color: {INK}; }}
    .bg {{ position: absolute; inset: 0; background: {CREAM}; }}
    .layer {{ position: absolute; inset: 0; }}
    svg.art {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; overflow: visible; }}
    .eyebrow {{ position: absolute; left: 0; right: 0; text-align: center; font: 600 26px/1 'Open Sans', sans-serif; letter-spacing: 0.16em; text-transform: uppercase; color: {BLUE}; }}
    .pill {{ display: inline-block; padding: 14px 28px; border-radius: 100px; background: rgba(37,99,235,0.08); border: 2px solid rgba(37,99,235,0.2); }}
    .h1 {{ position: absolute; left: 70px; right: 70px; text-align: center; font: 700 88px/1.08 'Playfair Display', serif; letter-spacing: -0.02em; color: {INK}; }}
    .h1 em {{ font-style: italic; font-weight: 400; color: {BLUE}; display: inline-block; }}
    .h1 .l {{ display: block; }}
    .card {{ position: absolute; background: {WHITE}; border: 2px solid rgba(37,99,235,0.2); border-radius: 14px; }}
    .line {{ height: 18px; border-radius: 9px; background: {GREY_L}; margin-top: 18px; transform-origin: left center; }}
    {extra_css}
  </style>
  <div id="root" data-composition-id="{cid}" data-width="{W}" data-height="{H}">
    <div id="bg-{cid}" class="bg clip" data-start="0" data-duration="{dur}" data-track-index="0"></div>
    <div id="layer-{cid}" class="layer clip" data-start="0" data-duration="{dur}" data-track-index="1">
{body}
    </div>
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
      const R = "[data-composition-id='{cid}'] ";
      const q = (s) => document.querySelectorAll(R + s);
      const fmt = (n) => Math.round(n).toLocaleString("fr-FR").replace(/[\\u202f\\u00a0]/g, "\\u00a0");
{js}
      tl.set({{}}, {{}}, {dur});
      window.__timelines = window.__timelines || {{}};
      window.__timelines["{cid}"] = tl;
    }})();
  </script>
</template>
"""


# ── Plan 1 : enseveli sous les textes ────────────────────────────────────────
def f01(cid, dur, w):
    iso = Iso(540, 1120, 74)
    books = [INK, SLATE, GREY, WHITE, BLUE_D, INK, GREY]
    iso.poly([iso.p(-3.2, -3.2, 0), iso.p(3.6, -3.2, 0), iso.p(3.6, 3.6, 0), iso.p(-3.2, 3.6, 0)], shade(CREAM, -0.06))
    stacks = [("s0", -2.8, -2.6, 0, 10, books), ("s1", -0.6, -2.9, 0, 12, books[2:] + books[:2]),
              ("s2", 1.6, -2.7, 0, 9, books[4:] + books[:4]), ("s3", -3.0, -0.4, 0, 8, books[1:] + books[:1])]
    for gid, x, y, z, n, pal in stacks:
        iso.book_stack(gid, x, y, z, n, pal)
    iso.open("desk")
    iso.box(-0.6, 0.2, 0, 2.6, 1.6, 0.9, shade(SLATE, -0.1))
    iso.person(0.3, 1.9, 0)
    iso.close()
    iso.book_stack("d0", -0.4, 0.3, 0.9, 6, [WHITE, GREY, BLUE_D])
    iso.book_stack("d1", 1.0, 0.4, 0.9, 8, [GREY, WHITE, INK])
    front = [("s4", 2.3, 0.6, 0, 9, books), ("s5", 2.2, 2.4, 0, 6, books[3:] + books[:3]), ("s6", -2.6, 2.0, 0, 5, books[5:] + books[:5])]
    for gid, x, y, z, n, pal in front:
        iso.book_stack(gid, x, y, z, n, pal)
    for k, (x, y, z) in enumerate([(-1.6, 1.0, 3.2), (1.8, -0.6, 4.0), (0.2, -1.2, 4.6)]):
        iso.open(f"sheet{k}")
        iso.poly([iso.p(x, y, z), iso.p(x + 0.7, y, z), iso.p(x + 0.7, y + 0.5, z), iso.p(x, y + 0.5, z)], WHITE, stroke=GREY)
        iso.close()
    body = f"""
      <div id="world">{svg_wrap(iso.svg())}</div>
      <div class="eyebrow" id="eb" style="top:262px"><span class="pill">Le quotidien du juriste</span></div>
      <div class="h1" style="top:350px"><span class="l" id="t1">Des heures à chercher</span><em id="t2">le bon article ?</em></div>
      <div class="card" id="timer" style="left:690px;top:1340px;width:300px;padding:22px 26px;">
        <div style="font:600 22px/1 'Open Sans';color:{SLATE};letter-spacing:.08em;text-transform:uppercase">Recherche</div>
        <div id="clock" style="font:700 64px/1.1 'Open Sans';color:{INK};margin-top:10px">0 h 00</div>
      </div>"""
    t_art = at(w, "article")
    js = f"""
      tl.fromTo(q("#world"), {{ scale: 1.0, transformOrigin: "50% 60%" }}, {{ scale: 1.05, duration: {dur}, ease: "none" }}, 0);
      tl.fromTo(q("#eb"), {{ opacity: 0, y: -16 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }}, 0);
      tl.fromTo(q("#t1"), {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }}, 0.05);
      tl.fromTo(q("#t2"), {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }}, {t_art - 0.1});
      tl.fromTo(q("#desk"), {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, 0);
      // les livres tombent et s'empilent, pile après pile, jusqu'à ensevelir le bureau
      const ids = ["s0","s1","s2","s3","d0","d1","s4","s5","s6"];
      ids.forEach((id, k) => {{
        tl.fromTo(q("g[id^='" + id + "-']"), {{ opacity: 0, y: -140 }},
          {{ opacity: 1, y: 0, duration: 0.42, ease: "bounce.out", stagger: 0.07 }}, 0.1 + k * 0.22);
      }});
      [0, 1, 2].forEach((k) => tl.fromTo(q("#sheet" + k), {{ opacity: 0, y: -60, rotation: -8, transformOrigin: "50% 50%" }},
        {{ opacity: 1, y: 0, rotation: 0, duration: 0.6, ease: "power2.out" }}, 1.2 + k * 0.35));
      tl.fromTo(q("#timer"), {{ opacity: 0, scale: 0.85 }}, {{ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }}, 0.4);
      const clk = {{ m: 0 }};
      tl.to(clk, {{ m: 227, duration: {round(dur - 0.9, 2)}, ease: "power2.in",
        onUpdate: () => {{ const m = Math.round(clk.m); q("#clock")[0].textContent = Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0"); }} }}, 0.5);"""
    return template(cid, dur, body, js)


# ── Plan 2 : SIRA range tout ─────────────────────────────────────────────────
def f02(cid, dur, w):
    iso = Iso(540, 1330, 58)
    iso.poly([iso.p(-4, -4, 0), iso.p(4.4, -4, 0), iso.p(4.4, 4.4, 0), iso.p(-4, 4.4, 0)], shade(CREAM, -0.06))
    heights = [[2.2, 1.4, 3.0, 1.8], [1.2, 3.6, 2.0, 2.6], [2.8, 1.6, 4.2, 1.4], [1.6, 2.4, 1.8, 3.2]]
    cols = [INK, BLUE, WHITE, BLUE_D]
    for i in range(4):
        for j in range(4):
            iso.open(f"b{i}{j}")
            iso.box(-3.6 + i * 2.0, -3.6 + j * 2.0, 0, 1.4, 1.4, heights[i][j], cols[(i + j) % 4])
            iso.close()
    q_text = "Quels sont les délais de garde à vue&nbsp;?"
    chars = "".join(f'<span class="ch">{c}</span>' for c in re.split(r"(&nbsp;|.)", q_text) if c)
    body = f"""
      <div id="world">{svg_wrap(iso.svg())}</div>
      <img id="logo" src="assets/logo_sira.png" style="position:absolute;left:300px;top:250px;width:480px;" alt="SIRA" />
      <div class="card" id="qcard" style="left:90px;top:500px;width:900px;padding:30px 36px;">
        <div style="font:600 22px/1 'Open Sans';color:{BLUE};letter-spacing:.12em;text-transform:uppercase">Votre question</div>
        <div id="qtext" style="font:400 40px/1.3 'Playfair Display';color:{INK};margin-top:14px">{chars}</div>
      </div>
      <div class="card" id="acard" style="left:90px;top:745px;width:900px;padding:30px 36px;background:{INK};border-color:{INK};">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font:600 22px/1 'Open Sans';color:{BLUE_L};letter-spacing:.12em;text-transform:uppercase">Réponse SIRA</div>
          <div id="badge" style="font:700 24px/1 'Open Sans';color:{WHITE};background:{BLUE};padding:10px 20px;border-radius:100px">en 3 s</div>
        </div>
        <div class="line al" style="width:92%;background:#334155"></div>
        <div class="line al" style="width:80%;background:#334155"></div>
        <div class="line al" style="width:64%;background:#334155"></div>
      </div>"""
    t_sira, t_rep, t_sec = at(w, "SIRA"), at(w, "réponse"), at(w, "secondes")
    js = f"""
      tl.fromTo(q("#world"), {{ y: 30 }}, {{ y: 0, duration: {dur}, ease: "none" }}, 0);
      // la ville se range : chaque immeuble monte de sa base, en vague diagonale
      const order = [];
      for (let s = 0; s <= 6; s++) for (let i = 0; i < 4; i++) {{ const j = s - i; if (j >= 0 && j < 4) order.push("#b" + i + j); }}
      order.forEach((id, k) => tl.fromTo(q(id), {{ opacity: 0, y: 70 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }}, 0.05 + k * 0.06));
      tl.fromTo(q("#logo"), {{ opacity: 0, scale: 0.8, transformOrigin: "50% 50%" }}, {{ opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.8)" }}, {max(0.0, t_sira - 0.25)});
      tl.fromTo(q("#qcard"), {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }}, {t_sira + 0.5});
      tl.fromTo(q("#qtext .ch"), {{ opacity: 0 }}, {{ opacity: 1, duration: 0.01, stagger: 0.035 }}, {t_sira + 0.75});
      tl.fromTo(q("#acard"), {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }}, {t_rep - 0.15});
      tl.fromTo(q(".al"), {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.45, ease: "power2.out", stagger: 0.15 }}, {t_rep + 0.2});
      tl.fromTo(q("#badge"), {{ opacity: 0, scale: 0.5 }}, {{ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.5)" }}, {t_sec - 0.1});"""
    return template(cid, dur, body, js)


# ── Plan 3 : la ville du droit en chiffres ───────────────────────────────────
def f03(cid, dur, w):
    iso = Iso(540, 1260, 70)
    iso.poly([iso.p(-4.6, -2.2, 0), iso.p(5.0, -2.2, 0), iso.p(5.0, 3.0, 0), iso.p(-4.6, 3.0, 0)], shade(CREAM, -0.06))
    for k, (x, base_h, col) in enumerate([(-4.2, 1.6, INK), (-0.8, 3.0, BLUE), (2.6, 2.4, INK)]):
        for a in range(2):
            for b in range(2):
                h = base_h * (1.0 + 0.35 * ((a + 2 * b + k) % 3))
                iso.open(f"q{k}-{a}{b}")
                iso.box(x + a * 1.1, -1.6 + b * 1.1 + k * 0.6, 0, 0.9, 0.9, h, col if (a + b) % 2 == 0 else shade(col, 0.3))
                iso.close()
    stats = [("20", "+", "domaines du droit"), ("5000", "+", "textes de loi"), ("5000", "+", "jurisprudences")]
    rows = "".join(
        f"""<div class="row" id="r{k}" style="display:flex;align-items:baseline;gap:22px;margin-top:18px">
              <div class="num" style="font:700 104px/1 'Open Sans';letter-spacing:-0.02em;color:{INK}"><span id="n{k}">0</span>+</div>
              <div style="font:400 40px/1.1 'Playfair Display';color:{INK}">{label}</div>
            </div>"""
        for k, (n, plus, label) in enumerate(stats))
    body = f"""
      <div id="world">{svg_wrap(iso.svg())}</div>
      <div class="eyebrow" id="eb" style="top:262px"><span class="pill">La base SIRA</span></div>
      <div style="position:absolute;left:110px;top:360px;">{rows}</div>"""
    cues = [at(w, "vingt"), at(w, "cinq", 0), at(w, "cinq", 1)]
    js = f"""
      tl.fromTo(q("#world"), {{ x: 40 }}, {{ x: -40, duration: {dur}, ease: "none" }}, 0);
      tl.fromTo(q("#eb"), {{ opacity: 0, y: -16 }}, {{ opacity: 1, y: 0, duration: 0.4 }}, 0);
      const targets = [20, 5000, 5000];
      const cues = {json.dumps(cues)};
      cues.forEach((t, k) => {{
        // le quartier k s'élève, son compteur monte, il passe en bleu puis s'efface au profit du suivant
        tl.fromTo(q("g[id^='q" + k + "-']"), {{ opacity: 0, y: 90 }}, {{ opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 }}, Math.max(0, t - 0.35));
        tl.fromTo(q("#r" + k), {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }}, Math.max(0, t - 0.2));
        tl.fromTo(q("#r" + k + " .num"), {{ color: "{INK}" }}, {{ color: "{BLUE}", duration: 0.2 }}, t);
        const c = {{ v: 0 }};
        tl.to(c, {{ v: targets[k], duration: 1.0, ease: "power2.out", onUpdate: () => {{ q("#n" + k)[0].textContent = fmt(c.v); }} }}, t);
        if (k < 2) tl.to(q("#r" + k), {{ opacity: 0.45, duration: 0.3 }}, cues[k + 1] - 0.2);
        if (k < 2) tl.to(q("#r" + k + " .num"), {{ color: "{INK}", duration: 0.3 }}, cues[k + 1] - 0.2);
      }});"""
    return template(cid, dur, body, js)


# ── Plan 4 : des sources citées ──────────────────────────────────────────────
def f04(cid, dur, w):
    iso = Iso(540, 1450, 64)
    iso.book_stack("bk", -1.2, -0.6, 0, 6, [INK, BLUE_D, WHITE, SLATE], w=2.4, d=1.6, t=0.36)
    chips = [("Code de procédure pénale", "Loi n°2024-028 du 13 décembre 2024"),
             ("Constitution du Mali", "du 22 juillet 2023"),
             ("Code pénal", "Loi n°2024-027 du 13 décembre 2024")]
    chip_html = "".join(
        f"""<div class="chip" style="display:flex;align-items:center;gap:18px;margin-top:18px;padding:16px 24px;border-radius:24px;background:rgba(37,99,235,0.08);border:2px solid rgba(37,99,235,0.2)">
              <div class="tick" style="flex:none;width:40px;height:40px;border-radius:50%;background:{BLUE};color:{WHITE};font:700 26px/40px 'Open Sans';text-align:center">✓</div>
              <div><div style="font:700 29px/1.15 'Open Sans';color:{INK}">{t}</div><div style="font:400 23px/1.3 'Open Sans';color:{SLATE};margin-top:4px">{r}</div></div>
            </div>"""
        for t, r in chips)
    body = f"""
      <div id="world">{svg_wrap(iso.svg())}</div>
      <div class="h1" style="top:290px"><span class="l" id="t1">Des sources fiables,</span><em id="t2">toujours citées.</em></div>
      <div class="card" id="card" style="left:110px;top:560px;width:860px;padding:34px 40px;">
        <div style="font:600 22px/1 'Open Sans';color:{BLUE};letter-spacing:.12em;text-transform:uppercase">Réponse SIRA</div>
        <div class="line al" style="width:94%"></div>
        <div class="line al" style="width:86%"></div>
        <div class="line al" style="width:58%"></div>
        <div style="font:600 22px/1 'Open Sans';color:{SLATE};letter-spacing:.12em;text-transform:uppercase;margin-top:34px">Sources</div>
        {chip_html}
      </div>"""
    t_tj = at(w, "toujours")
    js = f"""
      tl.fromTo(q("#t1"), {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }}, 0);
      tl.fromTo(q("#t2"), {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }}, {t_tj - 0.1});
      tl.fromTo(q("#card"), {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }}, 0.1);
      tl.fromTo(q(".al"), {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.35, ease: "power2.out", stagger: 0.1 }}, 0.3);
      tl.fromTo(q(".chip"), {{ opacity: 0, x: -40 }}, {{ opacity: 1, x: 0, duration: 0.35, ease: "power2.out", stagger: 0.38 }}, 0.65);
      tl.fromTo(q(".tick"), {{ scale: 0 }}, {{ scale: 1, duration: 0.3, ease: "back.out(3)", stagger: 0.38 }}, 0.85);
      tl.fromTo(q("g[id^='bk-']"), {{ opacity: 0, y: -90 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: "bounce.out", stagger: 0.08 }}, 0.2);"""
    return template(cid, dur, body, js)


# ── Plan 5 : formule Pro ─────────────────────────────────────────────────────
def f05(cid, dur, w):
    iso = Iso(300, 1140, 46)
    iso.open("slab0")
    iso.box(-2.6, -2.6, 0, 5.2, 5.2, 0.6, GREY)
    iso.close()
    iso2 = Iso(780, 1140, 46)
    iso2.open("slab1")
    iso2.box(-2.6, -2.6, 0, 5.2, 5.2, 0.6, BLUE)
    iso2.close()
    iso.parts += iso2.parts

    def card(i, left, title, unit, dark, badge=""):
        bg, fg, sub = (BLUE, WHITE, BLUE_XL) if dark else (WHITE, INK, SLATE)
        b = (f'<div id="save" style="margin-top:26px;display:inline-block;font:700 22px/1 \'Open Sans\';color:{BLUE};background:{WHITE};padding:12px 18px;border-radius:100px">{badge}</div>' if badge else "")
        return f"""<div class="card" id="c{i}" style="left:{left}px;top:580px;width:420px;height:460px;padding:44px 36px;background:{bg};border-color:{bg if dark else 'rgba(37,99,235,0.2)'}">
              <div style="font:600 24px/1 'Open Sans';color:{sub};letter-spacing:.12em;text-transform:uppercase">{title}</div>
              <div style="font:700 96px/1 'Open Sans';color:{fg};margin-top:44px;letter-spacing:-0.03em"><span id="p{i}">0</span></div>
              <div style="font:600 32px/1 'Open Sans';color:{sub};margin-top:16px">{unit}</div>
              {b}
            </div>"""

    body = f"""
      {svg_wrap(iso.svg())}
      <div class="eyebrow" id="eb" style="top:262px"><span class="pill">Formule Pro</span></div>
      <div class="h1" id="title" style="top:350px;font-size:72px">Un prix clair.</div>
      {card(0, 90, "Mensuel", "FCFA / mois", False)}
      {card(1, 570, "Annuel", "FCFA / an", True, "100 000 FCFA d'économie")}"""
    t_25, t_200, t_an = at(w, "vingt-cinq"), at(w, "deux"), at(w, "an.")
    js = f"""
      tl.fromTo(q("#eb"), {{ opacity: 0, y: -16 }}, {{ opacity: 1, y: 0, duration: 0.4 }}, 0);
      tl.fromTo(q("#title"), {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }}, 0.15);
      tl.fromTo(q("#slab0"), {{ opacity: 0, y: 60 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }}, {t_25 - 0.45});
      tl.fromTo(q("#c0"), {{ opacity: 0, x: -80, rotationY: 25, transformPerspective: 1200 }}, {{ opacity: 1, x: 0, rotationY: 0, duration: 0.55, ease: "power3.out" }}, {t_25 - 0.35});
      const a = {{ v: 0 }};
      tl.to(a, {{ v: 25000, duration: 0.9, ease: "power2.out", onUpdate: () => {{ q("#p0")[0].textContent = fmt(a.v); }} }}, {t_25});
      tl.fromTo(q("#slab1"), {{ opacity: 0, y: 60 }}, {{ opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }}, {t_200 - 0.45});
      tl.fromTo(q("#c1"), {{ opacity: 0, x: 80, rotationY: -25, transformPerspective: 1200 }}, {{ opacity: 1, x: 0, rotationY: 0, duration: 0.55, ease: "power3.out" }}, {t_200 - 0.35});
      const b = {{ v: 0 }};
      tl.to(b, {{ v: 200000, duration: 0.9, ease: "power2.out", onUpdate: () => {{ q("#p1")[0].textContent = fmt(b.v); }} }}, {t_200});
      tl.fromTo(q("#save"), {{ opacity: 0, scale: 0.4 }}, {{ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.5)" }}, {t_an});"""
    return template(cid, dur, body, js)


# ── Plan 6 : le droit, en un instant ─────────────────────────────────────────
def f06(cid, dur, w):
    rings = "".join(f'<circle class="ring" cx="540" cy="760" r="{r}" fill="none" stroke="{BLUE}" stroke-opacity="{0.10 - i * 0.02:.2f}" stroke-width="2"/>' for i, r in enumerate([300, 400, 500, 600]))
    body = f"""
      {svg_wrap(rings)}
      <img id="logo" src="assets/logo_sira.png" style="position:absolute;left:190px;top:560px;width:700px;" alt="SIRA" />
      <div class="h1" style="top:900px;font-size:80px"><span class="l" id="t1">Le droit,</span><em id="t2">en un instant.</em></div>
      <div id="url" style="position:absolute;left:0;right:0;top:1120px;text-align:center;font:600 40px/1 'Open Sans';color:{SLATE}">siramali.com</div>
      <div id="btn" style="position:absolute;left:340px;top:1190px;width:400px;padding:28px 0;text-align:center;border-radius:100px;background:{INK};color:{WHITE};font:700 34px/1 'Open Sans'">S'abonner</div>"""
    t_dr, t_inst, t_ab, t_url = at(w, "droit"), at(w, "instant"), at(w, "Abonnez"), at(w, "siramali")
    js = f"""
      tl.fromTo(q(".ring"), {{ scale: 0.6, opacity: 0, transformOrigin: "540px 760px" }}, {{ scale: 1, opacity: 1, duration: 1.2, ease: "power2.out", stagger: 0.12 }}, 0);
      tl.fromTo(q("#logo"), {{ opacity: 0, scale: 0.85, transformOrigin: "50% 50%" }}, {{ opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)" }}, 0);
      tl.fromTo(q("#t1"), {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }}, {t_dr - 0.1});
      tl.fromTo(q("#t2"), {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }}, {t_inst - 0.25});
      tl.fromTo(q("#btn"), {{ opacity: 0, scale: 0.7 }}, {{ opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2.2)" }}, {t_ab - 0.05});
      tl.fromTo(q("#url"), {{ opacity: 0, y: 16 }}, {{ opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }}, {t_url - 0.1});
      tl.to(q("#btn"), {{ scale: 1.06, duration: 0.35, ease: "power1.inOut" }}, {round(t_url + 0.9, 2)});
      tl.to(q("#btn"), {{ scale: 1, duration: 0.35, ease: "power1.inOut" }}, {round(t_url + 1.25, 2)});"""
    return template(cid, dur, body, js)


FRAMES = [("01-enseveli", f01), ("02-sira-range", f02), ("03-ville-chiffres", f03),
          ("04-sources", f04), ("05-formule-pro", f05), ("06-cta", f06)]


def main():
    durs = durations()
    words = word_times()
    out = ROOT / "compositions" / "frames"
    out.mkdir(parents=True, exist_ok=True)
    for i, (cid, fn) in enumerate(FRAMES):
        (out / f"{cid}.html").write_text(fn(cid, durs[i], words[i + 1]), encoding="utf-8")
    print("ok", [round(d, 2) for d in durs], round(sum(durs), 2))


if __name__ == "__main__":
    main()
