/* TownyElections Reborn — interaction layer.
   Everything here is progressive enhancement: the page is complete without JS. */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------------------------------------------------------------- nav */

  var nav = $("#site-nav");
  var menuBtn = $(".menu-btn");

  function closeMenu() {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  if (nav && menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        closeMenu();
        menuBtn.focus();
      }
    });
  }

  /* ---------------------------------------------------------- scrollspy */

  var navLinks = $$('.site-nav a[href^="#"]');
  var idToLink = {};
  navLinks.forEach(function (a) { idToLink[a.getAttribute("href").slice(1)] = a; });

  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
        var a = idToLink[en.target.id];
        if (a) a.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-35% 0px -55% 0px" });

    ["story", "features", "night", "commands", "setup"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });

    /* reveal on scroll */
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          revealObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });

    $$(".reveal").forEach(function (el) {
      if (reduced.matches) el.classList.add("is-in");
      else revealObs.observe(el);
    });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------------------------------------------------------- copy buttons */

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    ta.remove();
    return ok;
  }

  $$(".cmd").forEach(function (btn) {
    /* hint chips only inside tables; inline commands in prose stay clean */
    var inTable = !!btn.closest(".tablewrap");
    var hint = null;
    if (inTable) {
      hint = document.createElement("span");
      hint.className = "cmd-hint";
      hint.textContent = "copy";
      btn.appendChild(hint);
    }
    btn.addEventListener("click", function () {
      copyText(btn.getAttribute("data-copy") || btn.textContent.trim()).then(function (ok) {
        if (!hint) return;
        hint.textContent = ok ? "copied" : "failed";
        hint.classList.toggle("is-ok", ok);
        setTimeout(function () {
          hint.textContent = "copy";
          hint.classList.remove("is-ok");
        }, 1600);
      });
    });
  });

  var snipBtn = $(".copy-snip");
  if (snipBtn) {
    snipBtn.addEventListener("click", function () {
      copyText(snipBtn.getAttribute("data-copy") || "").then(function (ok) {
        snipBtn.textContent = ok ? "copied" : "failed";
        setTimeout(function () { snipBtn.textContent = "copy"; }, 1600);
      });
    });
  }

  /* ---------------------------------------------------------- the ballot */

  var ballot = $(".ballot");

  if (ballot) {
    var modeBtns = $$(".mode", ballot);
    var candBtns = $$(".cand", ballot);
    var resultEl = $("[data-result-text]", ballot);
    var resultRow = resultEl.closest(".b-result");
    var countedStamp = $("[data-counted]", ballot);
    var castBtn = $("[data-cast]", ballot);
    var clearBtn = $("[data-clear]", ballot);

    var mode = "plurality";
    var pick = null;          /* plurality: single name */
    var ranking = [];         /* ranked: names in preference order */
    var approvals = [];       /* approval: names approved */
    var countedTimer = null;

    function setResult(text, ok) {
      resultEl.textContent = text || "";
      resultRow.classList.toggle("is-err", ok === false);
    }

    function renderMarks() {
      candBtns.forEach(function (btn) {
        var name = btn.getAttribute("data-name");
        var rank = $(".mark-rank", btn);
        var marked = null;
        var rankNo = "";

        if (mode === "plurality" && pick === name) marked = "x";
        if (mode === "ranked") {
          var idx = ranking.indexOf(name);
          if (idx > -1) { marked = "rank"; rankNo = String(idx + 1); }
        }
        if (mode === "approval" && approvals.indexOf(name) > -1) marked = "check";

        if (marked) btn.setAttribute("data-mark", marked);
        else btn.removeAttribute("data-mark");
        if (marked === "rank") rank.textContent = rankNo;
        btn.setAttribute("aria-pressed", marked ? "true" : "false");
      });
    }

    modeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        mode = btn.getAttribute("data-mode");
        modeBtns.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        setResult("");
        renderMarks();
      });
    });

    candBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-name");
        if (mode === "plurality") {
          pick = (pick === name) ? null : name;
        } else if (mode === "ranked") {
          var idx = ranking.indexOf(name);
          if (idx > -1) ranking.splice(idx, 1);
          else ranking.push(name);
        } else {
          var i = approvals.indexOf(name);
          if (i > -1) approvals.splice(i, 1);
          else approvals.push(name);
        }
        setResult("");
        renderMarks();
      });
    });

    castBtn.addEventListener("click", function () {
      var msg;
      if (mode === "plurality") {
        if (!pick) return setResult("mark one candidate first", false);
        msg = "recorded for " + pick + " \u2014 /election vote " + pick;
      } else if (mode === "ranked") {
        if (ranking.length < 2) return setResult("rank at least two candidates", false);
        msg = "ranked " + ranking.join(", ") + " \u2014 /election vote " + ranking.join(" ");
      } else {
        if (approvals.length === 0) return setResult("approve at least one candidate", false);
        msg = "approved " + approvals.join(", ") + " \u2014 /election vote " + approvals.join(" ");
      }
      setResult(msg);
      countedStamp.hidden = false;
      countedStamp.classList.remove("is-pop");
      void countedStamp.offsetWidth; /* restart the stamp animation */
      countedStamp.classList.add("is-pop");
      clearTimeout(countedTimer);
      countedTimer = setTimeout(function () { countedStamp.hidden = true; }, 2600);
    });

    clearBtn.addEventListener("click", function () {
      pick = null;
      ranking = [];
      approvals = [];
      setResult("");
      renderMarks();
    });

    renderMarks();
  }

  /* ---------------------------------------------------------- election night */

  var board = $("[data-board]");

  if (board) {
    var boss = $("[data-boss]", board);
    var live = $("[data-board-live]", board);
    var runBtn = $("[data-night-run]", board);
    var skipBtn = $("[data-night-skip]", board);
    var replayBtn = $("[data-night-replay]", board);
    var roundEls = $$(".round", board);
    var winnerEl = $("[data-winner]", board);
    var tallyEls = $$(".tally", board);

    /* element lookup by data-cand key */
    var T = {};
    tallyEls.forEach(function (t) { T[t.getAttribute("data-cand")] = t; });

    function fillOf(t) { return $(".t-fill", t); }
    function countOf(t) { return $(".t-count", t); }
    function setTally(key, v, n) {
      if (!T[key]) return;
      fillOf(T[key]).style.setProperty("--v", String(v));
      countOf(T[key]).textContent = String(n);
    }
    function setBoss(v) { boss.style.transform = "scaleX(" + v + ")"; }
    function announce(msg) { if (live) live.textContent = msg; }

    var FINAL_R1 = [["rowan", 0.222, 2], ["mira", 0.333, 3], ["alex", 0.444, 4]];
    var FINAL_R2 = [["mira2", 0.556, 5], ["alex2", 0.444, 4]];

    function resetShow() {
      roundEls.forEach(function (r) { r.classList.remove("is-in"); });
      tallyEls.forEach(function (t) {
        t.classList.remove("is-in");
        t.classList.remove("is-elim");
        fillOf(t).style.setProperty("--v", "0");
        countOf(t).textContent = "0";
      });
      winnerEl.classList.remove("is-in", "crowned");
      setBoss(0);
    }

    function finishShow() {
      resetShow();
      FINAL_R1.forEach(function (row) { setTally(row[0], row[1], row[2]); });
      FINAL_R2.forEach(function (row) { setTally(row[0], row[1], row[2]); });
      T.rowan2.classList.add("is-elim");
      roundEls.forEach(function (r) { r.classList.add("is-in"); });
      tallyEls.forEach(function (t) { t.classList.add("is-in"); });
      winnerEl.classList.add("is-in", "crowned");
      setBoss(1);
      announce("Mira wins the runoff with 5 of 9 ballots and becomes mayor-elect of Oakvale.");
      runBtn.hidden = true;
      skipBtn.hidden = true;
      replayBtn.hidden = false;
    }

    var token = 0;

    function sleep(ms) {
      return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    function play() {
      var my = ++token;
      var base = reduced.matches ? 60 : 500;

      resetShow();
      runBtn.hidden = true;
      skipBtn.hidden = false;
      replayBtn.hidden = true;
      announce("Election night begins for Oakvale. 9 ballots were cast.");

      var chain = Promise.resolve();

      function step(delayMult, fn) {
        chain = chain.then(function () { return sleep(base * delayMult); }).then(function () {
          if (my === token) fn();
        });
      }

      step(1.2, function () { setBoss(0.15); });
      step(0.8, function () {
        roundEls[0].classList.add("is-in");
        announce("Round 1. Counting first preferences.");
      });
      step(0.7, function () {
        T.rowan.classList.add("is-in");
        setTally("rowan", 0.222, 2);
        setBoss(0.3);
        announce("Round 1. Rowan has 2 votes.");
      });
      step(0.7, function () {
        T.mira.classList.add("is-in");
        setTally("mira", 0.333, 3);
        setBoss(0.45);
        announce("Round 1. Mira has 3 votes.");
      });
      step(0.7, function () {
        T.alex.classList.add("is-in");
        setTally("alex", 0.444, 4);
        setBoss(0.6);
        announce("Round 1. Alex has 4 votes.");
      });
      step(1, function () {
        T.rowan.classList.add("is-elim");
        setBoss(0.72);
        announce("Rowan is eliminated. Ballots transfer to next preferences.");
      });
      step(1.1, function () {
        roundEls[1].classList.add("is-in");
        T.rowan2.classList.add("is-in", "is-elim");
        setBoss(0.85);
        announce("Round 2. Counting the transferred ballots.");
      });
      step(0.8, function () {
        T.mira2.classList.add("is-in");
        setTally("mira2", 0.556, 5);
        announce("Round 2. Mira has 5 votes.");
      });
      step(0.7, function () {
        T.alex2.classList.add("is-in");
        setTally("alex2", 0.444, 4);
        setBoss(0.95);
        announce("Round 2. Alex has 4 votes.");
      });
      step(1.1, function () {
        winnerEl.classList.add("is-in");
        announce("Mira reaches a majority.");
      });
      step(0.6, function () {
        winnerEl.classList.add("crowned");
        setBoss(1);
      });
      step(1, function () {
        if (my === token) finishShow();
      });
    }

    runBtn.addEventListener("click", play);
    replayBtn.addEventListener("click", play);
    skipBtn.addEventListener("click", function () {
      token++;
      finishShow();
    });
  }

  /* ------------------------------------------------ 3D tilt (hero ballot) */

  var heroGrid = $(".hero-grid");
  var ballotCard = $(".ballot");

  if (heroGrid && ballotCard &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !reduced.matches) {
    var REST_TX = 4;    /* resting tilt, degrees, matches the CSS defaults */
    var REST_TY = -6;
    var MAX_TILT = 5;   /* how far the pointer can push it */

    function setTilt(tx, ty) {
      ballotCard.style.setProperty("--tx", tx.toFixed(2) + "deg");
      ballotCard.style.setProperty("--ty", ty.toFixed(2) + "deg");
    }

    heroGrid.addEventListener("pointermove", function (e) {
      var r = ballotCard.getBoundingClientRect();
      /* pointer position around the card, clamped so far moves plateau */
      var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      dx = Math.max(-1.5, Math.min(1.5, dx));
      dy = Math.max(-1.5, Math.min(1.5, dy));
      /* the corner under the pointer leans toward the viewer */
      setTilt(REST_TX + dy * MAX_TILT, REST_TY - dx * MAX_TILT);
    });

    heroGrid.addEventListener("pointerleave", function () {
      setTilt(REST_TX, REST_TY);
    });
  }
})();
