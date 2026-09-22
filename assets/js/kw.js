/* Un halo traverse les mots-clés de la page, un par un, dans l'ordre du texte.
   Le script se contente d'envelopper le premier emploi de chaque mot dans un
   <span class="kw"> numéroté ; toute l'animation est dans la CSS.
   Sans JavaScript la page reste entière : seule l'animation disparaît. */
(function () {
  var LISTS = {
    en: ["data", "systems", "automation", "infrastructure", "organisations",
         "measurement", "noisy", "process", "problem", "tool", "simplest",
         "remove", "measurable", "reversible", "upstream", "engineering",
         "biomechanics", "sensors", "IOTA", "Cévennes", "method", "build",
         "understand", "uncertainty", "decision", "practice", "rules",
         "consequence", "standardise", "automate"],
    fr: ["donnée", "données", "systèmes", "automatisation", "infrastructure",
         "organisation", "organisations", "mesure", "bruitées", "processus",
         "problème", "outil", "simple", "supprimer", "mesurable", "réversible",
         "amont", "biomécanique", "capteurs", "IOTA", "Cévennes", "méthode",
         "construire", "comprendre", "incertitude", "décision", "pratique",
         "règles", "standardiser", "automatiser"]
  };

  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var root = document.querySelector(".paper");
  if (!root) return;

  var lang = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
  var words = LISTS[lang] || LISTS.en;

  // On laisse tranquilles les titres, les liens et ce qui est déjà animé ou coloré.
  var SKIP_TAG = /^(A|H1|H2|H3|CAPTION|SCRIPT|STYLE|NAV)$/;
  var SKIP_CLASS = /(^|\s)(ladder|topbar|section__num|fig__label)(\s|$)/;

  function skipped(node) {
    for (var p = node.parentElement; p && p !== root; p = p.parentElement) {
      if (SKIP_TAG.test(p.tagName) || SKIP_CLASS.test(p.className)) return true;
    }
    return false;
  }

  function matcher(word) {
    // Bornes unicode : \b est ASCII et couperait mal « donnée » ou « méthode ».
    return new RegExp("(?<![\\p{L}\\p{N}])(" + word + ")(?![\\p{L}\\p{N}])", "iu");
  }

  try {
    matcher("test");
  } catch (e) {
    return; // moteur sans lookbehind ni \p{L} : on renonce, la page reste intacte
  }

  var nodes = [];
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  var node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.trim() && !skipped(node)) nodes.push(node);
  }

  var used = Object.create(null);
  var count = 0;

  nodes.forEach(function (text) {
    for (var w = 0; w < words.length; w++) {
      var key = words[w].toLowerCase();
      if (used[key]) continue;

      var m = matcher(words[w]).exec(text.nodeValue);
      if (!m) continue;

      var hit = text.splitText(m.index);
      hit.splitText(m[1].length);

      var span = document.createElement("span");
      span.className = "kw";
      span.style.setProperty("--i", count++);
      span.textContent = hit.nodeValue;
      hit.parentNode.replaceChild(span, hit);

      used[key] = true;
      return; // un seul mot par nœud : le halo se répartit sur toute la page
    }
  });

  if (count) root.style.setProperty("--kw-count", count);
})();
