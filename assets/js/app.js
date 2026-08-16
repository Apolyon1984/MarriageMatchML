/* SELECT — logique de la démonstration.
   Tout se passe côté navigateur : l'état est conservé dans localStorage,
   aucune donnée ne quitte l'appareil. */

(function () {
  "use strict";

  var DATA = window.SELECT_DATA;
  var portrait = window.SelectPortrait;
  var STORE_KEY = "select.demo.v2";
  var MALI = ["Bamako", "Sikasso", "Ségou", "Mopti", "Kayes"];

  /* ------------------------------------------------------------------ */
  /* État                                                                */
  /* ------------------------------------------------------------------ */

  var defaults = {
    onboarded: false,
    me: {
      name: "Sory",
      age: 28,
      city: "Bamako",
      job: "Ingénieur",
      gender: "homme",
      intention: "mariage",
      values: ["Famille", "Ambition", "Humour"],
      bio: "",
      photos: 0,
      verified: false,
      plan: "essentiel"
    },
    seen: [],
    liked: [],
    matches: [],
    threads: {},
    opened: [],
    filters: { ageMax: 45, city: "", intention: "", verifiedOnly: false, diaspora: true },
    toggles: { blur: false, incognito: false, screenshot: true }
  };

  var state = load();
  var deckPool = [];
  var deckHistory = [];
  var currentProfileId = null;
  var currentChatId = null;

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return clone(defaults);
      var saved = JSON.parse(raw);
      var merged = clone(defaults);
      Object.keys(saved).forEach(function (k) {
        if (k === "me" || k === "filters" || k === "toggles") {
          merged[k] = Object.assign({}, merged[k], saved[k]);
        } else {
          merged[k] = saved[k];
        }
      });
      return merged;
    } catch (e) {
      return clone(defaults);
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      /* mode privé : la démonstration fonctionne sans persistance */
    }
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  /* ------------------------------------------------------------------ */
  /* Utilitaires                                                         */
  /* ------------------------------------------------------------------ */

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function candidates() {
    return state.me.gender === "homme" ? DATA.women : DATA.men;
  }

  function byId(id) {
    var all = DATA.women.concat(DATA.men);
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  function isDiaspora(p) {
    return MALI.indexOf(p.city) === -1;
  }

  function intentionLabel(id) {
    for (var i = 0; i < DATA.intentions.length; i++) {
      if (DATA.intentions[i].id === id) return DATA.intentions[i].label;
    }
    return "";
  }

  function isPremium() {
    return state.me.plan !== "essentiel";
  }

  var verifiedIcon =
    '<svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-label="Profil vérifié">' +
    '<circle cx="10" cy="10" r="8" fill="#2f6d4f" fill-opacity=".14" stroke="#2f6d4f" stroke-width="1.4"/>' +
    '<path d="M6.6 10.2l2.2 2.2 4.6-4.8" stroke="#2f6d4f" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var checkIcon =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none">' +
    '<path d="M3 8.5l3 3 7-7.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var toastTimer;
  function toast(message) {
    var el = $("#toast");
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("is-visible");
    }, 2600);
  }

  /* ------------------------------------------------------------------ */
  /* Navigation entre écrans                                             */
  /* ------------------------------------------------------------------ */

  var TITLES = {
    discover: "Découvrir",
    likes: "Admirateurs",
    messages: "Messages",
    me: "Mon profil"
  };

  function showScreen(name) {
    $$(".screen").forEach(function (s) {
      s.classList.toggle("is-active", s.id === "screen-" + name);
    });

    var chrome = ["discover", "likes", "messages", "me"].indexOf(name) !== -1;
    $("#appHeader").hidden = !chrome;
    $("#appNav").classList.toggle("is-visible", chrome);
    $("#appBody").scrollTop = 0;

    if (chrome) {
      $("#appTitle").textContent = TITLES[name];
      $("#btnFilters").hidden = name !== "discover";
      $$(".tab").forEach(function (t) {
        t.classList.toggle("is-active", t.dataset.screen === name);
      });
    }

    if (name === "likes") renderLikes();
    if (name === "messages") renderMessages();
    if (name === "me") renderMe();
  }

  /* ------------------------------------------------------------------ */
  /* Inscription guidée                                                  */
  /* ------------------------------------------------------------------ */

  var onbStep = 1;
  var ONB_TOTAL = 6;

  function setOnbStep(n) {
    onbStep = Math.min(Math.max(n, 1), ONB_TOTAL);
    $$(".onb__step").forEach(function (el) {
      el.classList.toggle("is-active", Number(el.dataset.step) === onbStep);
    });
    $("#onbProgress").style.width = (onbStep / ONB_TOTAL) * 100 + "%";
    $("#onbCount").textContent = onbStep + "/" + ONB_TOTAL;
  }

  function buildOnboarding() {
    // Villes
    var citySelect = $("#fCity");
    citySelect.innerHTML = DATA.cities
      .map(function (c) {
        return '<option value="' + esc(c) + '">' + esc(c) + "</option>";
      })
      .join("");
    citySelect.value = state.me.city;

    $("#fName").value = state.me.name;
    $("#fAge").value = state.me.age;
    $("#fJob").value = state.me.job;
    $("#fBio").value = state.me.bio;

    // Genre
    $$("#genderChoices .choice").forEach(function (btn) {
      btn.classList.toggle("is-selected", btn.dataset.gender === state.me.gender);
      btn.addEventListener("click", function () {
        state.me.gender = btn.dataset.gender;
        $$("#genderChoices .choice").forEach(function (b) {
          b.classList.toggle("is-selected", b === btn);
        });
      });
    });

    // Intentions
    $("#intentionChoices").innerHTML = DATA.intentions
      .map(function (it) {
        return (
          '<button class="choice" type="button" data-intention="' + it.id + '">' +
          '<span class="choice__radio"></span><span>' +
          '<span class="choice__label">' + esc(it.label) + "</span>" +
          '<span class="choice__desc">' + esc(it.desc) + "</span>" +
          "</span></button>"
        );
      })
      .join("");
    $$("#intentionChoices .choice").forEach(function (btn) {
      btn.classList.toggle("is-selected", btn.dataset.intention === state.me.intention);
      btn.addEventListener("click", function () {
        state.me.intention = btn.dataset.intention;
        $$("#intentionChoices .choice").forEach(function (b) {
          b.classList.toggle("is-selected", b === btn);
        });
      });
    });

    // Valeurs
    $("#valueCloud").innerHTML = DATA.values
      .map(function (v) {
        return '<button class="tag-toggle" type="button" data-value="' + esc(v) + '">' + esc(v) + "</button>";
      })
      .join("");
    $$("#valueCloud .tag-toggle").forEach(function (btn) {
      btn.classList.toggle("is-selected", state.me.values.indexOf(btn.dataset.value) !== -1);
      btn.addEventListener("click", function () {
        var v = btn.dataset.value;
        var i = state.me.values.indexOf(v);
        if (i === -1) state.me.values.push(v);
        else state.me.values.splice(i, 1);
        btn.classList.toggle("is-selected", i === -1);
        updateValueHint();
      });
    });
    updateValueHint();

    // Photos simulées
    $$("#photoSlots .photo-slot").forEach(function (slot, i) {
      slot.addEventListener("click", function () {
        if (slot.classList.contains("is-filled")) return;
        slot.classList.add("is-filled");
        slot.style.backgroundImage = "url('" + portrait(state.me.name || "Moi", "me" + i) + "')";
        state.me.photos = $$("#photoSlots .is-filled").length;
        save();
      });
    });

    $("#onbBack").addEventListener("click", function () {
      if (onbStep === 1) showScreen("welcome");
      else setOnbStep(onbStep - 1);
    });

    $$("[data-next]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!validateStep()) return;
        setOnbStep(onbStep + 1);
      });
    });

    $("#btnVerify").addEventListener("click", function () {
      runVerification($("#verifyVisual"), function () {
        finishOnboarding();
      });
    });

    $("#btnVerify2").addEventListener("click", function () {
      runVerification($("#verifyVisual2"), function () {
        closeModals();
        renderMe();
        renderDeck();
      });
    });
  }

  function updateValueHint() {
    var n = state.me.values.length;
    $("#valueHint").textContent =
      n + (n > 1 ? " sélectionnées" : " sélectionnée") + " sur 3 minimum";
  }

  function validateStep() {
    if (onbStep === 1) {
      var name = $("#fName").value.trim();
      var age = parseInt($("#fAge").value, 10);
      if (!name) {
        toast("Indiquez votre prénom pour continuer.");
        return false;
      }
      if (!age || age < 18 || age > 45) {
        toast("L'âge doit être compris entre 18 et 45 ans.");
        return false;
      }
      state.me.name = name;
      state.me.age = age;
      state.me.city = $("#fCity").value;
      state.me.job = $("#fJob").value.trim() || "—";
    }
    if (onbStep === 4 && state.me.values.length < 3) {
      toast("Choisissez au moins trois valeurs.");
      return false;
    }
    if (onbStep === 5) {
      state.me.bio = $("#fBio").value.trim();
    }
    save();
    return true;
  }

  function runVerification(visual, done) {
    var btns = [$("#btnVerify"), $("#btnVerify2")];
    btns.forEach(function (b) { if (b) b.disabled = true; });
    visual.classList.remove("is-done");
    toast("Analyse du selfie en cours…");

    setTimeout(function () {
      visual.classList.add("is-done");
      visual.innerHTML =
        '<svg width="52" height="52" viewBox="0 0 24 24" fill="none">' +
        '<path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      state.me.verified = true;
      save();
      btns.forEach(function (b) { if (b) b.disabled = false; });
      toast("Identité vérifiée. Badge doré activé.");
      setTimeout(done, 700);
    }, 1600);
  }

  function finishOnboarding() {
    state.onboarded = true;
    seedMatches();
    save();
    buildDeckPool();
    showScreen("discover");
    renderDaily();
    renderDeck();
  }

  /* ------------------------------------------------------------------ */
  /* Choix SELECT (sélection quotidienne)                                */
  /* ------------------------------------------------------------------ */

  function dailyPicks() {
    var limit = state.me.plan === "prestige" ? 15 : 7;
    return candidates()
      .slice()
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, limit);
  }

  function renderDaily() {
    var picks = dailyPicks();
    $("#dailyCounter").textContent = picks.length + " profils";
    $("#dailyList").innerHTML = picks
      .map(function (p) {
        return (
          '<button class="pick" type="button" data-profile="' + p.id + '">' +
          '<span class="pick__media" style="background-image:url(\'' + portrait(p.name, p.id) + "')\"></span>" +
          "<span>" +
          '<span class="pick__name">' + esc(p.name) + ", " + p.age + (p.verified ? verifiedIcon : "") + "</span>" +
          '<span class="pick__meta">' + esc(p.city) + " · " + esc(p.job) + " · " + esc(intentionLabel(p.intention)) + "</span>" +
          '<span class="pick__score">' + checkIcon + p.score + " % d'affinité</span>" +
          '<span class="pick__reason">' + checkIcon + esc(p.reasons[0]) + "</span>" +
          "</span></button>"
        );
      })
      .join("");
  }

  /* ------------------------------------------------------------------ */
  /* Exploration : pile de cartes                                        */
  /* ------------------------------------------------------------------ */

  function buildDeckPool() {
    var f = state.filters;
    deckPool = candidates().filter(function (p) {
      if (state.seen.indexOf(p.id) !== -1) return false;
      if (p.age > f.ageMax) return false;
      if (f.city && p.city !== f.city) return false;
      if (f.intention && p.intention !== f.intention) return false;
      if (f.verifiedOnly && !p.verified) return false;
      if (!f.diaspora && isDiaspora(p)) return false;
      return true;
    });
  }

  function cardMarkup(p) {
    return (
      '<div class="card__media" style="background-image:url(\'' + portrait(p.name, p.id) + "')\"></div>" +
      '<div class="card__shade"></div>' +
      '<div class="card__top">' +
      (p.verified ? '<span class="badge badge--verified">Vérifié</span>' : '<span class="badge">Non vérifié</span>') +
      '<span class="badge badge--premium">' + p.score + " %</span>" +
      "</div>" +
      '<div class="card__stamp card__stamp--like">Intéressé</div>' +
      '<div class="card__stamp card__stamp--nope">Passer</div>' +
      '<div class="card__body">' +
      '<p class="card__name">' + esc(p.name) + ", " + p.age + (p.verified ? verifiedIcon : "") + "</p>" +
      '<p class="card__meta">' + esc(p.city) + (p.area ? " · " + esc(p.area) : "") + " · " + esc(p.job) + "</p>" +
      '<p class="card__bio">' + esc(p.bio) + "</p>" +
      '<div class="card__tags">' +
      '<span class="chip">' + esc(intentionLabel(p.intention)) + "</span>" +
      p.tags.slice(0, 2).map(function (t) { return '<span class="chip">' + esc(t) + "</span>"; }).join("") +
      "</div></div>"
    );
  }

  function renderDeck() {
    var deck = $("#deck");
    $$(".card:not(.is-out)", deck).forEach(function (c) { c.remove(); });

    var visible = deckPool.slice(0, 3);
    $("#deckEmpty").hidden = visible.length > 0;

    for (var d = visible.length - 1; d >= 0; d--) {
      var p = visible[d];
      var card = document.createElement("article");
      card.className = "card";
      card.dataset.profile = p.id;
      card.style.transform = "translateY(" + d * 10 + "px) scale(" + (1 - d * 0.04) + ")";
      card.style.opacity = d === 2 ? "0.6" : "1";
      card.style.zIndex = String(5 - d);
      if (d > 0) card.style.pointerEvents = "none";
      card.innerHTML = cardMarkup(p);
      deck.appendChild(card);
      if (d === 0) enableDrag(card);
    }
  }

  function topCard() {
    var cards = $$("#deck .card:not(.is-out)");
    return cards.length ? cards[cards.length - 1] : null;
  }

  function enableDrag(card) {
    var startX = 0, startY = 0, dx = 0, dy = 0, dragging = false, moved = false;
    var likeStamp = $(".card__stamp--like", card);
    var nopeStamp = $(".card__stamp--nope", card);

    card.addEventListener("pointerdown", function (e) {
      dragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      card.classList.add("is-dragging");
      card.setPointerCapture(e.pointerId);
    });

    card.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;
      card.style.transform =
        "translate(" + dx + "px," + dy * 0.25 + "px) rotate(" + dx / 22 + "deg)";
      likeStamp.style.opacity = dx > 30 ? Math.min(dx / 110, 1) : 0;
      nopeStamp.style.opacity = dx < -30 ? Math.min(-dx / 110, 1) : 0;
    });

    function release() {
      if (!dragging) return;
      dragging = false;
      card.classList.remove("is-dragging");

      if (!moved) {
        openProfile(card.dataset.profile);
        card.style.transform = "";
        return;
      }
      if (Math.abs(dx) > 92) {
        swipe(dx > 0 ? "right" : "left");
      } else {
        card.style.transform = "";
        likeStamp.style.opacity = 0;
        nopeStamp.style.opacity = 0;
      }
      dx = 0;
      dy = 0;
    }

    card.addEventListener("pointerup", release);
    card.addEventListener("pointercancel", release);
  }

  function swipe(direction) {
    var card = topCard();
    if (!card || !deckPool.length) return;

    var profile = deckPool[0];
    var isLike = direction === "right" || direction === "star";

    card.classList.add("is-out");
    card.style.zIndex = "10";
    card.style.transition = "transform .38s var(--ease), opacity .38s var(--ease)";
    var offset = direction === "left" ? -520 : 520;
    var lift = direction === "star" ? -640 : 40;
    card.style.transform =
      direction === "star"
        ? "translateY(" + lift + "px) scale(.9)"
        : "translate(" + offset + "px," + lift + "px) rotate(" + offset / 22 + "deg)";
    card.style.opacity = "0";
    setTimeout(function () { card.remove(); }, 400);

    state.seen.push(profile.id);
    deckHistory.push(profile.id);
    deckPool.shift();

    if (isLike) {
      if (state.liked.indexOf(profile.id) === -1) state.liked.push(profile.id);
      var reciprocal = direction === "star" || profile.score >= 84;
      if (reciprocal) createMatch(profile, direction === "star");
      else toast("Like envoyé à " + profile.name + ".");
    }

    save();
    renderDeck();
  }

  function undo() {
    if (!isPremium()) {
      openModal("#modalPremium");
      toast("Le retour en arrière est réservé au Premium.");
      return;
    }
    var last = deckHistory.pop();
    if (!last) {
      toast("Aucun profil à récupérer.");
      return;
    }
    var i = state.seen.indexOf(last);
    if (i !== -1) state.seen.splice(i, 1);
    var j = state.liked.indexOf(last);
    if (j !== -1) state.liked.splice(j, 1);
    var p = byId(last);
    if (p) deckPool.unshift(p);
    save();
    renderDeck();
    toast("Profil récupéré.");
  }

  /* ------------------------------------------------------------------ */
  /* Matchs et messagerie                                                */
  /* ------------------------------------------------------------------ */

  function seedMatches() {
    if (state.matches.length) return;
    var seeds = state.me.gender === "homme" ? ["w1", "w5"] : ["m2", "m1"];
    seeds.forEach(function (id) {
      state.matches.push(id);
      state.threads[id] = clone(DATA.threads[id] || []);
    });
  }

  function createMatch(profile, viaStar) {
    if (state.matches.indexOf(profile.id) === -1) state.matches.push(profile.id);
    if (!state.threads[profile.id]) {
      state.threads[profile.id] = clone(DATA.threads[profile.id] || []);
    }
    save();

    $("#matchName").textContent = profile.name;
    $("#matchMe").style.backgroundImage = "url('" + portrait(state.me.name, "me0") + "')";
    $("#matchThem").style.backgroundImage = "url('" + portrait(profile.name, profile.id) + "')";
    $("#btnMatchChat").dataset.profile = profile.id;
    openModal("#modalMatch");
    if (viaStar) toast("Coup de cœur envoyé — il a été remarqué.");
    updateBadges();
  }

  function lastMessage(id) {
    var t = state.threads[id];
    return t && t.length ? t[t.length - 1] : null;
  }

  function unreadCount() {
    return state.matches.filter(function (id) {
      var last = lastMessage(id);
      return last && last.from === "them" && state.opened.indexOf(id) === -1;
    }).length;
  }

  function updateBadges() {
    var likes = admirers().length;
    var dot = $("#likesDot");
    dot.textContent = likes;
    dot.hidden = likes === 0;

    var unread = unreadCount();
    var mdot = $("#msgDot");
    mdot.textContent = unread;
    mdot.hidden = unread === 0;
  }

  function renderMessages() {
    var withMessages = state.matches.filter(function (id) { return lastMessage(id); });
    var fresh = state.matches.filter(function (id) { return !lastMessage(id); });

    $("#matchRow").innerHTML = state.matches.length
      ? state.matches
          .map(function (id) {
            var p = byId(id);
            if (!p) return "";
            return (
              '<button class="match-bubble" type="button" data-chat="' + p.id + '">' +
              '<span class="match-bubble__img" style="background-image:url(\'' + portrait(p.name, p.id) + "')\"></span>" +
              esc(p.name) +
              "</button>"
            );
          })
          .join("")
      : '<p class="muted" style="font-size:13px">Vos matchs apparaîtront ici.</p>';

    if (!withMessages.length && !fresh.length) {
      $("#threadList").innerHTML =
        '<div class="empty-state"><h3>Pas encore de conversation</h3>' +
        "<p>Aimez des profils dans l'onglet Découvrir : la messagerie s'ouvre dès que c'est réciproque.</p></div>";
      updateBadges();
      return;
    }

    $("#threadList").innerHTML = state.matches
      .map(function (id) {
        var p = byId(id);
        if (!p) return "";
        var last = lastMessage(id);
        var preview = last
          ? (last.from === "me" ? "Vous : " : "") + last.text
          : "Nouveau match — à vous d'écrire";
        var unread = last && last.from === "them" && state.opened.indexOf(id) === -1;
        return (
          '<button class="thread-item" type="button" data-chat="' + p.id + '">' +
          '<span class="thread-item__img" style="background-image:url(\'' + portrait(p.name, p.id) + "')\"></span>" +
          "<span style=\"min-width:0\">" +
          '<span class="thread-item__name">' + esc(p.name) + (p.verified ? verifiedIcon : "") + "</span>" +
          '<span class="thread-item__last" style="' + (unread ? "color:var(--text);font-weight:600" : "") + '">' +
          esc(preview) + "</span>" +
          "</span>" +
          '<span class="thread-item__time">' + (last ? esc(last.at) : "") + "</span>" +
          "</button>"
        );
      })
      .join("");

    updateBadges();
  }

  function openChat(id) {
    var p = byId(id);
    if (!p) return;
    currentChatId = id;
    if (state.opened.indexOf(id) === -1) state.opened.push(id);
    if (!state.threads[id]) state.threads[id] = clone(DATA.threads[id] || []);
    save();

    $("#chatAvatar").style.backgroundImage = "url('" + portrait(p.name, p.id) + "')";
    $("#chatName").innerHTML = esc(p.name) + (p.verified ? verifiedIcon : "");
    $("#chatStatus").textContent = p.active;
    renderChatLog();

    var chat = $("#chat");
    chat.classList.add("is-open");
    chat.setAttribute("aria-hidden", "false");
    updateBadges();
  }

  function closeChat() {
    var chat = $("#chat");
    chat.classList.remove("is-open");
    chat.setAttribute("aria-hidden", "true");
    currentChatId = null;
    renderMessages();
  }

  function renderChatLog() {
    var log = $("#chatLog");
    var msgs = state.threads[currentChatId] || [];
    log.innerHTML =
      '<div class="chat__notice">Conversation ouverte parce que l\'intérêt est réciproque. ' +
      "Restez courtois : les échanges sont modérés en cas de signalement.</div>" +
      msgs
        .map(function (m) {
          return (
            '<div class="bubble bubble--' + m.from + '">' + esc(m.text) +
            '<span class="bubble__time">' + esc(m.at) + "</span></div>"
          );
        })
        .join("");
    log.scrollTop = log.scrollHeight;
  }

  function nowLabel() {
    var d = new Date();
    return (
      String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0")
    );
  }

  function sendMessage(text) {
    if (!currentChatId || !text.trim()) return;
    state.threads[currentChatId].push({ from: "me", text: text.trim(), at: nowLabel() });
    save();
    renderChatLog();

    var log = $("#chatLog");
    var typing = document.createElement("div");
    typing.className = "typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;

    var idx = (state.threads[currentChatId].length + currentChatId.length) % DATA.replies.length;
    setTimeout(function () {
      typing.remove();
      state.threads[currentChatId].push({
        from: "them",
        text: DATA.replies[idx],
        at: nowLabel()
      });
      save();
      renderChatLog();
    }, 1400);
  }

  /* ------------------------------------------------------------------ */
  /* Admirateurs                                                         */
  /* ------------------------------------------------------------------ */

  function admirers() {
    return candidates()
      .filter(function (p) { return state.matches.indexOf(p.id) === -1; })
      .slice(0, 6);
  }

  function renderLikes() {
    var list = admirers();
    var locked = !isPremium();

    $("#likesGrid").innerHTML = list
      .map(function (p) {
        return (
          '<button class="like-tile' + (locked ? " is-locked" : "") + '" type="button"' +
          ' data-like="' + p.id + '" style="background-image:url(\'' + portrait(p.name, p.id) + "')\">" +
          '<span class="like-tile__blur"></span>' +
          (locked
            ? '<span class="like-tile__lock"><svg width="24" height="24" viewBox="0 0 20 20" fill="none">' +
              '<rect x="4" y="8.5" width="12" height="8.5" rx="2" stroke="currentColor" stroke-width="1.6"/>' +
              '<path d="M7 8.5V6.8a3 3 0 016 0v1.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span>'
            : '<span class="like-tile__label">' + esc(p.name) + ", " + p.age + "</span>") +
          "</button>"
        );
      })
      .join("");

    $("#likesCount").textContent = list.length;
    $("#likesUpsell").hidden = !locked;
    updateBadges();
  }

  /* ------------------------------------------------------------------ */
  /* Fiche profil                                                        */
  /* ------------------------------------------------------------------ */

  function openProfile(id) {
    var p = byId(id);
    if (!p) return;
    currentProfileId = id;

    $("#sheetBody").innerHTML =
      '<div class="profile-hero" style="background-image:url(\'' + portrait(p.name, p.id) + "')\">" +
      (p.verified ? '<span class="badge badge--verified profile-hero__badge">Profil vérifié</span>' : "") +
      "</div>" +
      '<p class="profile-name">' + esc(p.name) + ", " + p.age + (p.verified ? verifiedIcon : "") + "</p>" +
      '<p class="profile-meta">' + esc(p.city) + (p.area ? " · " + esc(p.area) : "") + " · " + esc(p.job) +
      " · " + esc(p.active) + "</p>" +
      '<div class="affinity">' +
      '<div class="affinity__head"><span class="eyebrow">Affinité SELECT</span>' +
      '<span class="affinity__score">' + p.score + " %</span></div><ul>" +
      p.reasons.map(function (r) { return "<li>" + checkIcon + esc(r) + "</li>"; }).join("") +
      "</ul></div>" +
      '<div class="profile-block"><p class="section-label">Intention</p>' +
      '<p>' + esc(intentionLabel(p.intention)) + "</p></div>" +
      '<div class="profile-block"><p class="section-label">Présentation</p><p>' + esc(p.bio) + "</p></div>" +
      '<div class="profile-block"><p class="section-label">Ce qui compte</p>' +
      '<div class="card__tags" style="margin:0">' +
      p.tags.map(function (t) { return '<span class="chip">' + esc(t) + "</span>"; }).join("") +
      "</div></div>" +
      '<div class="profile-block"><p class="section-label">Langues</p>' +
      '<div class="card__tags" style="margin:0">' +
      p.languages.map(function (l) { return '<span class="chip">' + esc(l) + "</span>"; }).join("") +
      "</div></div>" +
      (isDiaspora(p)
        ? '<div class="locked-note" style="margin-bottom:0">' +
          '<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>' +
          '<path d="M2.5 10h15M10 2.5c2 2.4 3 4.9 3 7.5s-1 5.1-3 7.5c-2-2.4-3-4.9-3-7.5s1-5.1 3-7.5z" stroke="currentColor" stroke-width="1.3"/></svg>' +
          "Membre de la diaspora — ouvert à la distance.</div>"
        : "");

    $("#sheet").classList.add("is-open");
    $("#sheet").setAttribute("aria-hidden", "false");
    $("#sheetBackdrop").classList.add("is-open");
  }

  function closeProfile() {
    $("#sheet").classList.remove("is-open");
    $("#sheet").setAttribute("aria-hidden", "true");
    $("#sheetBackdrop").classList.remove("is-open");
    currentProfileId = null;
  }

  /* ------------------------------------------------------------------ */
  /* Mon profil                                                          */
  /* ------------------------------------------------------------------ */

  function renderMe() {
    var me = state.me;
    $("#meAvatar").style.backgroundImage = "url('" + portrait(me.name, "me0") + "')";
    $("#meName").innerHTML = esc(me.name) + ", " + me.age + (me.verified ? verifiedIcon : "");
    $("#meMeta").textContent = me.city + " · " + me.job + " · " + intentionLabel(me.intention);
    $("#statLikes").textContent = admirers().length;
    $("#statMatches").textContent = state.matches.length;
    $("#statViews").textContent = 142 + state.liked.length * 7;
    $("#verifyStatus").textContent = me.verified ? "Vérifié" : "À faire";
    $("#planStatus").textContent =
      me.plan === "essentiel" ? "Essentiel" : me.plan === "premium" ? "Premium" : "Prestige";

    Object.keys(state.toggles).forEach(function (k) {
      var sw = $('[data-switch="' + k + '"]');
      if (sw) sw.classList.toggle("is-on", !!state.toggles[k]);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Fenêtres modales                                                    */
  /* ------------------------------------------------------------------ */

  function openModal(sel) {
    $(sel).classList.add("is-open");
  }

  function closeModals() {
    $$(".modal").forEach(function (m) { m.classList.remove("is-open"); });
  }

  function buildFilters() {
    var sel = $("#filterCity");
    sel.innerHTML =
      '<option value="">Toutes les villes</option>' +
      DATA.cities.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + "</option>"; }).join("");

    sel.value = state.filters.city;
    $("#filterIntention").value = state.filters.intention;
    $("#filterAge").value = state.filters.ageMax;
    $("#filterAgeValue").textContent = "18 – " + state.filters.ageMax + " ans";

    $("#filterAge").addEventListener("input", function (e) {
      $("#filterAgeValue").textContent = "18 – " + e.target.value + " ans";
    });

    $("#btnApplyFilters").addEventListener("click", function () {
      state.filters.ageMax = parseInt($("#filterAge").value, 10);
      state.filters.city = $("#filterCity").value;
      state.filters.intention = $("#filterIntention").value;
      state.filters.verifiedOnly = $('[data-switch="verifiedOnly"]').classList.contains("is-on");
      state.filters.diaspora = $('[data-switch="diaspora"]').classList.contains("is-on");
      save();
      buildDeckPool();
      renderDeck();
      closeModals();
      toast(deckPool.length + " profils correspondent à vos critères.");
    });

    $('[data-switch="verifiedOnly"]').classList.toggle("is-on", state.filters.verifiedOnly);
    $('[data-switch="diaspora"]').classList.toggle("is-on", state.filters.diaspora);
    $("#filtersLocked").hidden = isPremium();
  }

  function subscribe() {
    var chosen = $(".plan-mini.is-selected");
    var plan = chosen ? chosen.dataset.plan : "premium";

    if (plan === "boost") {
      toast("Mise en avant activée pour 30 minutes.");
    } else {
      state.me.plan = plan;
      toast(
        plan === "premium"
          ? "Premium activé — 7 jours offerts."
          : "Prestige activé — 7 jours offerts."
      );
    }
    save();
    closeModals();
    renderLikes();
    renderDaily();
    renderMe();
    $("#filtersLocked").hidden = isPremium();
  }

  /* ------------------------------------------------------------------ */
  /* Événements                                                          */
  /* ------------------------------------------------------------------ */

  function bindEvents() {
    // Navigation
    $$(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () { showScreen(tab.dataset.screen); });
    });

    $("#btnFilters").addEventListener("click", function () { openModal("#modalFilters"); });
    $("#btnPremium").addEventListener("click", function () { openModal("#modalPremium"); });

    // Boutons de la pile
    $$("[data-swipe]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = btn.dataset.swipe;
        if (dir === "undo") undo();
        else swipe(dir);
      });
    });

    $("#btnReshuffle").addEventListener("click", function () {
      state.seen = [];
      deckHistory = [];
      save();
      buildDeckPool();
      renderDeck();
      toast("Profils réinitialisés.");
    });

    // Onglets de découverte
    $$(".segmented button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$(".segmented button").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        $$(".pane").forEach(function (p) {
          p.classList.toggle("is-active", p.id === "pane-" + btn.dataset.pane);
        });
      });
    });

    // Délégation générale
    document.addEventListener("click", function (e) {
      var el;

      if ((el = e.target.closest("[data-action]"))) {
        var action = el.dataset.action;
        if (action === "start-signup") { showScreen("onboarding"); setOnbStep(1); }
        if (action === "quick-demo") { finishOnboarding(); }
        if (action === "finish-onb") { finishOnboarding(); }
        if (action === "open-premium") { openModal("#modalPremium"); }
        if (action === "open-filters") { openModal("#modalFilters"); }
        if (action === "open-verify") { openModal("#modalVerify"); }
        if (action === "toast") { toast(el.dataset.message || "Fonction de démonstration."); }
      }

      if ((el = e.target.closest("[data-profile]")) && el.classList.contains("pick")) {
        openProfile(el.dataset.profile);
      }

      if ((el = e.target.closest("[data-chat]"))) {
        openChat(el.dataset.chat);
      }

      if ((el = e.target.closest("[data-like]"))) {
        if (!isPremium()) { openModal("#modalPremium"); return; }
        openProfile(el.dataset.like);
      }

      if ((el = e.target.closest("[data-toggle]"))) {
        var key = el.dataset.toggle;
        var sw = $('[data-switch="' + key + '"]', el);
        if (!sw) return;
        var on = !sw.classList.contains("is-on");
        sw.classList.toggle("is-on", on);
        if (state.toggles.hasOwnProperty(key)) {
          state.toggles[key] = on;
          save();
        }
      }

      if (e.target.closest("[data-close-modal]")) closeModals();
      if (e.target.classList.contains("modal")) closeModals();

      if ((el = e.target.closest(".plan-mini"))) {
        $$(".plan-mini").forEach(function (b) { b.classList.toggle("is-selected", b === el); });
      }
    });

    // Fiche profil
    $("#sheetBackdrop").addEventListener("click", closeProfile);
    $("#sheetClose").addEventListener("click", closeProfile);
    $$("[data-sheet-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var p = byId(currentProfileId);
        closeProfile();
        if (!p) return;
        if (btn.dataset.sheetAction === "like") {
          if (state.liked.indexOf(p.id) === -1) state.liked.push(p.id);
          if (state.seen.indexOf(p.id) === -1) state.seen.push(p.id);
          save();
          buildDeckPool();
          renderDeck();
          if (p.score >= 84) createMatch(p, false);
          else toast("Like envoyé à " + p.name + ".");
        } else {
          toast("Profil passé.");
        }
      });
    });

    // Messagerie
    $("#chatBack").addEventListener("click", closeChat);
    $("#chatForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("#chatInput");
      sendMessage(input.value);
      input.value = "";
    });
    $("#btnMatchChat").addEventListener("click", function () {
      closeModals();
      showScreen("messages");
      openChat(this.dataset.profile);
    });

    // Abonnement
    $("#btnSubscribe").addEventListener("click", subscribe);

    // Réinitialisation de la démonstration
    $("#btnReset").addEventListener("click", function () {
      try { localStorage.removeItem(STORE_KEY); } catch (err) {}
      location.reload();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeModals();
        closeProfile();
        if ($("#chat").classList.contains("is-open")) closeChat();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Démarrage                                                           */
  /* ------------------------------------------------------------------ */

  function init() {
    buildOnboarding();
    buildFilters();
    bindEvents();

    var flow = new URLSearchParams(location.search).get("flow");

    if (flow === "signup") {
      showScreen("onboarding");
      setOnbStep(1);
    } else if (state.onboarded) {
      seedMatches();
      buildDeckPool();
      renderDaily();
      renderDeck();
      showScreen("discover");
      if (flow === "premium") openModal("#modalPremium");
    } else {
      showScreen("welcome");
    }

    updateBadges();
  }

  init();
})();
