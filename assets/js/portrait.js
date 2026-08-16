/* SELECT — portraits de démonstration.
   La maquette n'utilise aucune photo de personne réelle : chaque profil est
   représenté par une composition générée (dégradé + motif inspiré du bogolan
   + monogramme). En production, ce module est remplacé par les photos
   vérifiées des membres, au même format 4/5. */

(function (global) {
  "use strict";

  var PALETTES = [
    ["#2b1a12", "#6b3b21"],
    ["#3a1420", "#7d2c3c"],
    ["#1c2118", "#3f4f30"],
    ["#241c10", "#7a6026"],
    ["#161c2a", "#39476b"],
    ["#2e1c25", "#6e4457"],
    ["#2a2018", "#8a6134"],
    ["#12211f", "#2f5750"]
  ];

  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function initials(name) {
    var parts = String(name || "?").trim().split(/\s+/);
    var out = parts[0] ? parts[0][0] : "?";
    if (parts[1]) out += parts[1][0];
    return out.toUpperCase();
  }

  /* Bandes et losanges façon tissu bogolan, dosés pour rester discrets. */
  function motif(seed) {
    var rows = "";
    var y = 12;
    var step = 26;
    var i = 0;
    while (y < 100) {
      var kind = (seed + i) % 3;
      if (kind === 0) {
        rows +=
          '<path d="M0 ' + y + ' H100" stroke="#f7f2e8" stroke-opacity=".18" stroke-width=".8" stroke-dasharray="3 4"/>';
      } else if (kind === 1) {
        var x = 6;
        while (x < 100) {
          rows +=
            '<path d="M' + x + " " + y + " l4 -4 l4 4 l-4 4 Z" +
            '" fill="#f7f2e8" fill-opacity=".13"/>';
          x += 16;
        }
      } else {
        var cx = 10;
        while (cx < 100) {
          rows +=
            '<circle cx="' + cx + '" cy="' + y + '" r="1.6" fill="#c8a44d" fill-opacity=".3"/>';
          cx += 12;
        }
      }
      y += step;
      i++;
    }
    return rows;
  }

  /* Renvoie une URL de données SVG utilisable en background-image ou <img src>. */
  function portrait(name, seedSource) {
    var seed = hash(String(seedSource || name || "select"));
    var pal = PALETTES[seed % PALETTES.length];
    var id = "g" + seed;

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + pal[1] + '"/>' +
      '<stop offset="1" stop-color="' + pal[0] + '"/>' +
      "</linearGradient>" +
      '<radialGradient id="v' + id + '" cx=".5" cy=".38" r=".78">' +
      '<stop offset="0" stop-color="#000" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity=".45"/>' +
      "</radialGradient>" +
      /* Le bas de l'image s'assombrit pour que le nom reste lisible
         par-dessus, comme sur une vraie photo de profil. */
      '<linearGradient id="b' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset=".45" stop-color="#0e0c0a" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#0e0c0a" stop-opacity=".72"/>' +
      "</linearGradient></defs>" +
      '<rect width="100" height="125" fill="url(#' + id + ')"/>' +
      "<g>" + motif(seed) + "</g>" +
      '<rect width="100" height="125" fill="url(#v' + id + ')"/>' +
      '<rect width="100" height="125" fill="url(#b' + id + ')"/>' +
      '<text x="50" y="72" text-anchor="middle" font-family="Georgia,serif"' +
      ' font-size="34" fill="#f7f2e8" fill-opacity=".9" letter-spacing="1">' +
      initials(name) +
      "</text>" +
      "</svg>";

    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  global.SelectPortrait = portrait;
})(window);
