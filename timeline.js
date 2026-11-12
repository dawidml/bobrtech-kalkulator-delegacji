
(function () {
  var D = window.TIMELINE, E = D.entries, filter = 'all';
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function when(t) { return (t || '').slice(0, 19).replace('T', ' ') + ' UTC'; }
  function keyOf(e) { return e.kind === 'prompt' ? 'p' + e.id : 'c' + e.commit.hash.slice(0, 7); }
  function visible() { return E.filter(function (e) { return filter === 'all' || e.agent === filter; }); }
  var sub = document.getElementById('sub');
  sub.textContent = 'Projekt: ' + D.project + ' · stan z ' + when(D.state) + ' · eksport lokalnej historii (.git), bez komunikatów aplikacji i ścieżek';
  if (D.repo_url) { var a = el('a', 'link', 'Repozytorium na GitHub →'); a.href = D.repo_url; document.getElementById('links').appendChild(a); }
  var fl = document.getElementById('filters');
  ['all'].concat(Object.keys(D.counts)).forEach(function (k) {
    var b = el('button', k === filter ? 'on' : '', k === 'all' ? 'Wszystko (' + E.length + ')' : k + ' (' + D.counts[k] + ')');
    b.onclick = function () { filter = k; Array.prototype.forEach.call(fl.children, function (x) { x.className = ''; }); b.className = 'on'; render(); };
    fl.appendChild(b);
  });
  function render() {
    var list = document.getElementById('list'); list.textContent = '';
    var cur = location.hash.slice(1), vis = visible();
    var sel = vis.filter(function (e) { return keyOf(e) === cur; })[0] || vis[0];
    vis.forEach(function (e) {
      var a = el('a', 'entry' + (e === sel ? ' selected' : '')); a.href = '#' + keyOf(e);
      a.appendChild(el('span', 'tag ' + e.agent, e.agent));
      a.appendChild(el('small', null, '  ' + (e.kind === 'prompt' ? '#' + e.id + ' · ' : '') + when(e.time)));
      a.appendChild(el('strong', null, (e.prompt.split('\n')[0] || '(bez tekstu)')));
      var st = e.status === 'committed' ? 'done' : (e.status === 'aborted' || e.status === 'conflict' ? 'bad' : 'none');
      a.appendChild(el('small', st, e.status + (e.files != null ? ' · ' + e.files + ' plików' : '')));
      list.appendChild(a);
    });
    var p = document.getElementById('panel'); p.textContent = '';
    if (!sel) { p.appendChild(el('h2', null, 'Brak wpisów')); return; }
    p.appendChild(el('h2', null, sel.kind === 'prompt' ? 'Prompt #' + sel.id : 'Commit bez promptu'));
    var m = el('div', 'meta'); m.appendChild(el('span', 'tag ' + sel.agent, sel.agent)); m.appendChild(el('small', null, when(sel.time)));
    m.appendChild(el('small', null, 'Stan: ' + sel.status)); if (sel.files != null) m.appendChild(el('small', null, 'Pliki: ' + sel.files));
    p.appendChild(m);
    p.appendChild(el('h3', null, sel.kind === 'prompt' ? 'Treść promptu' : 'Opis commita'));
    p.appendChild(el('pre', null, sel.prompt));
    if (sel.related) {
      var rl = el('p', 'muted', 'Turę uruchomiła aplikacja po zakończeniu pracy w tle. Zmiany dotyczą polecenia ');
      var ra = el('a', 'link', '#' + sel.related); ra.href = '#p' + sel.related; rl.appendChild(ra);
      rl.appendChild(document.createTextNode(' z tej samej sesji.')); p.appendChild(rl);
    }
    if (sel.commit) {
      var c = sel.commit, info = el('p', 'muted');
      info.appendChild(document.createTextNode('Commit: '));
      if (D.repo_url) { var cl = el('a', 'link', c.hash.slice(0, 7) + ' na GitHub'); cl.href = D.repo_url + '/commit/' + c.hash; info.appendChild(cl); }
      else info.appendChild(document.createTextNode(c.hash.slice(0, 7)));
      info.appendChild(document.createTextNode(' · ' + c.author + ' · ' + c.subject));
      p.appendChild(info);
      p.appendChild(el('h3', null, 'Zmiany w plikach (Git diff)'));
      var pre = el('pre', 'diff');
      c.diff.split('\n').forEach(function (line, i) {
        var cls = line[0] === '+' && line.slice(0, 3) !== '+++' ? 'add' : (line[0] === '-' && line.slice(0, 3) !== '---' ? 'del' : '');
        pre.appendChild(el('span', cls, line)); pre.appendChild(document.createTextNode('\n'));
      });
      p.appendChild(pre);
      if (c.truncated) p.appendChild(el('p', 'muted', 'Diff skrócony. Pełna wersja: link do commita powyżej.'));
    } else {
      p.appendChild(el('p', 'muted', 'Brak commita dla tego promptu (bez zmian w plikach, tura przerwana albo komunikat aplikacji).'));
    }
  }
  window.addEventListener('hashchange', render); render();
})();
