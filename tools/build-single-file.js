/* Assemble la vitrine et la démonstration en un seul fichier HTML autonome.
   Usage : node tools/build-single-file.js [chemin/de/sortie.html]

   Utile pour partager la maquette par simple lien ou par e-mail : le fichier
   produit ne dépend d'aucune ressource externe. */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const out = process.argv[2] || path.join(ROOT, "select-maquette.html");

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

function bodyOf(file) {
  const html = read(file);
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  if (!m) throw new Error("Corps introuvable dans " + file);
  return m[1];
}

/* Les balises <script src> sont retirées : les sources sont intégrées plus bas. */
const stripScriptTags = (s) => s.replace(/\s*<script src="[^"]*"><\/script>/g, "");

const siteBody = bodyOf("index.html");
const inlineSiteScript = (siteBody.match(/<script>([\s\S]*?)<\/script>/) || [, ""])[1];
const site = stripScriptTags(siteBody).replace(/<script>[\s\S]*?<\/script>/, "");
const app = stripScriptTags(bodyOf("app.html"));

/* Navigation entre les deux pages, qui remplace les liens de fichier. */
const router = `
(function () {
  var site = document.getElementById("pageSite");
  var app = document.getElementById("pageApp");

  function showApp(flow) {
    site.hidden = true;
    app.hidden = false;
    window.scrollTo(0, 0);
    var onWelcome = !!document.querySelector("#screen-welcome.is-active");
    if (flow === "signup" && onWelcome) {
      document.querySelector('[data-action="start-signup"]').click();
    }
    if (flow === "premium") {
      if (onWelcome) document.querySelector('[data-action="quick-demo"]').click();
      document.getElementById("modalPremium").classList.add("is-open");
    }
  }

  function showSite() {
    app.hidden = true;
    site.hidden = false;
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href");
    if (href.indexOf("app.html") === 0) {
      e.preventDefault();
      var q = href.split("?")[1] || "";
      showApp(new URLSearchParams(q).get("flow"));
    } else if (href.indexOf("index.html") === 0) {
      e.preventDefault();
      showSite();
    }
  }, true);
})();`;

const html = `<title>SELECT</title>
<style>
${read("assets/css/base.css")}
${read("assets/css/landing.css")}
${read("assets/css/app.css")}
</style>

<div id="pageSite">${site}</div>

<div id="pageApp" class="app-body" hidden>${app}</div>

<script>${read("assets/js/portrait.js")}</script>
<script>${read("assets/js/data.js")}</script>
<script>${read("assets/js/app.js")}</script>
<script>${inlineSiteScript}</script>
<script>${router}</script>
`;

fs.writeFileSync(out, html);
console.log("Écrit : " + out + " (" + Math.round(html.length / 1024) + " Ko)");
