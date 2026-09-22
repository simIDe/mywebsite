/* Un halo passe sur les mots-clés de la page, chacun pour son compte.
   Le script se contente de repérer le premier emploi de chaque mot et de
   l'envelopper dans un <span class="kw"> ; l'animation elle-même est en CSS.
   Chaque span reçoit une durée et une phase tirées au sort : les mots ne
   battent donc jamais ensemble et la figure ne se répète pas.
   Sans JavaScript la page reste entière — seule l'animation disparaît. */
(function () {
  var LISTS = {
    en: ["data", "engineer", "PhD", "biomechanics", "movement", "sensors",
         "noise", "artefacts", "messy", "measurement", "processing",
         "research", "question", "analysis", "infrastructure",
         "organisations", "upstream", "systems", "automation", "code",
         "understand", "consultancy", "models", "engineering", "science",
         "Airbus", "Ergosanté", "Saclay", "IOTA", "Cévennes", "co-founder",
         "rules", "practice", "request", "problem", "tool", "solution",
         "process", "measurable", "consequence", "remove", "simplest",
         "standardise", "automate", "decision", "reversible", "uncertainty",
         "reliability", "technology", "manipulation"],

    fr: ["donnée", "données", "thèse", "doctorat", "biomécanique",
         "mouvement", "capteurs", "bruit", "artefacts", "mesure",
         "laboratoire", "recherche", "analyse", "infrastructure",
         "organisation", "organisations", "amont", "systèmes",
         "automatisation", "code", "construire", "comprendre", "modèles",
         "exploitable", "entreprises", "collectivités", "science",
         "missions", "Airbus", "Ergosanté", "Saclay", "IOTA", "Cévennes",
         "cofondateur", "règles", "pratique", "demande", "problème",
         "outil", "solution", "processus", "mesurable", "conséquence",
         "supprimer", "automatiser", "simple", "décision", "réversible",
         "incertitude", "fiabilité"]
  };

  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var root = document.querySelector(".paper");
  if (!root) return;

  var lang = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
  var words = LISTS[lang] || LISTS.en;

  // On laisse tranquilles les titres, les liens et ce qui est déjà animé.
  var SKIP_TAG = /^(A|H1|H2|H3|CAPTION|SCRIPT|STYLE|NAV)$/;
  var SKIP_CLASS = /(^|\s)(ladder|topbar|section__num|fig__label)(\s|$)/;

  // Envelopper un mot dans un conteneur grid ou flex y créerait un élément de
  // plus, qui serait projeté dans la cellule suivante. On laisse ces nœuds.
  var LAYOUT = /^(grid|flex|inline-grid|inline-flex)$/;

  function skipped(node) {
    var parent = node.parentElement;
    if (!parent) return true;
    if (LAYOUT.test(getComputedStyle(parent).display)) return true;
    for (var p = parent; p && p !== root; p = p.parentElement) {
      if (SKIP_TAG.test(p.tagName) || SKIP_CLASS.test(p.className)) return true;
    }
    return false;
  }

  // Bornes unicode : \b est ASCII et couperait mal « donnée » ou « méthode ».
  var pending = [];
  try {
    for (var w = 0; w < words.length; w++) {
      pending.push({
        key: words[w].toLowerCase(),
        re: new RegExp("(?<![\\p{L}\\p{N}])(" + words[w] + ")(?![\\p{L}\\p{N}])", "iu")
      });
    }
  } catch (e) {
    return; // moteur sans lookbehind ni \p{L} : on renonce, la page reste intacte
  }

  var nodes = [];
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  var node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.trim() && !skipped(node)) nodes.push(node);
  }

  function decorate(span) {
    // Durées distinctes : les cycles dérivent et ne se resynchronisent jamais.
    // Un mot ne s'allume qu'une fois par cycle, d'où de longs silences.
    var seconds = 32 + Math.random() * 24;
    span.style.animationDuration = seconds.toFixed(2) + "s";
    // Phase négative : chaque mot démarre déjà entamé, à un point au hasard.
    span.style.animationDelay = "-" + (Math.random() * seconds).toFixed(2) + "s";
  }

  var MAX_PER_NODE = 12;

  nodes.forEach(function (text) {
    var cursor = text;

    for (var n = 0; n < MAX_PER_NODE && cursor && pending.length; n++) {
      // Le mot le plus à gauche d'abord : la découpe se fait de proche en proche.
      var best = null;
      for (var i = 0; i < pending.length; i++) {
        var m = pending[i].re.exec(cursor.nodeValue);
        if (m && (best === null || m.index < best.m.index)) best = { m: m, i: i };
      }
      if (!best) return;

      var hit = cursor.splitText(best.m.index);
      var rest = hit.splitText(best.m[1].length);

      var span = document.createElement("span");
      span.className = "kw";
      span.textContent = hit.nodeValue;
      decorate(span);
      hit.parentNode.replaceChild(span, hit);

      pending.splice(best.i, 1); // un seul halo par mot sur toute la page
      cursor = rest;
    }
  });
})();
