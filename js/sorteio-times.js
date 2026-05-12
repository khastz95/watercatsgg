(function () {
  "use strict";

  var ta = document.getElementById("sorteio-nomes");
  var btn = document.getElementById("sorteio-btn");
  var feedback = document.getElementById("sorteio-feedback");
  var wrap = document.getElementById("sorteio-resultados");
  var list1 = document.getElementById("sorteio-time1");
  var list2 = document.getElementById("sorteio-time2");

  if (!ta || !btn || !feedback || !wrap || !list1 || !list2) return;

  function shuffle(arr) {
    var a = arr.slice();
    var i = a.length;
    var j;
    var t;
    while (i > 1) {
      j = Math.floor(Math.random() * i);
      i -= 1;
      t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function parseNames(text) {
    return text
      .split(/\r?\n/)
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s.length > 0;
      });
  }

  function renderList(ul, names) {
    ul.innerHTML = "";
    names.forEach(function (n) {
      var li = document.createElement("li");
      li.textContent = n;
      ul.appendChild(li);
    });
  }

  function setFeedback(text, kind) {
    feedback.textContent = text;
    feedback.classList.remove("sorteio-feedback--erro", "sorteio-feedback--ok");
    if (kind === "erro") feedback.classList.add("sorteio-feedback--erro");
    if (kind === "ok") feedback.classList.add("sorteio-feedback--ok");
  }

  function run() {
    var names = parseNames(ta.value);
    setFeedback("", "");

    if (names.length !== 10) {
      setFeedback("Coloque exatamente 10 nomes (um por linha). Agora há " + names.length + ".", "erro");
      wrap.hidden = true;
      return;
    }

    var seen = {};
    var dup = false;
    names.forEach(function (n) {
      var k = n.toLowerCase();
      if (seen[k]) dup = true;
      seen[k] = true;
    });
    if (dup) {
      setFeedback("Tem nome repetido. Ajusta a lista pra cada um aparecer só uma vez.", "erro");
      wrap.hidden = true;
      return;
    }

    var shuffled = shuffle(names);
    renderList(list1, shuffled.slice(0, 5));
    renderList(list2, shuffled.slice(5, 10));
    wrap.hidden = false;
    setFeedback("Pronto — Time 1 e Time 2 com 5 jogadores cada.", "ok");
    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  btn.addEventListener("click", run);
})();
