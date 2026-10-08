/* Aldijos — página inicial pública */
const upcoming = e => (e.dateEnd || e.date) >= todayISO();
const evImage = (e, courses) => e.image || ((courses.find(c => c.id === e.courseId) || {}).photo) || '';

function eventCardHtml(e, courses, i) {
  const { d, m } = parseISO(e.date); const img = evImage(e, courses);
  return `<article class="ev-card reveal" style="--d:${i * 70}ms">
    <div class="ev-media">${photoOrMark(img, e.title)}
      <div class="ev-date" aria-label="${esc(fmtData(e.date))}"><b>${d}</b><small>${MESES_CURTO[m - 1]}</small></div></div>
    <div class="ev-body">
      <div class="ev-cat">${esc(e.category)}</div>
      <h3 class="ev-title">${esc(e.title)}</h3>
      <p class="ev-desc">${esc(e.description)}</p>
      <div class="ev-meta"><span>${e.dateEnd ? esc(fmtEvento(e)) : esc(e.time || e.timeNote || 'Dia inteiro')}</span><span>${esc(e.place || 'Online')}</span></div>
      <button class="btn ev-btn" data-action="open-event" data-id="${e.id}" aria-label="Ver detalhes: ${esc(e.title)}">Ver detalhes ${arrow}</button>
    </div></article>`;
}
function eventsForTab(events, tab) {
  const up = events.filter(upcoming).sort((a, b) => a.date.localeCompare(b.date));
  return tab === 'proximos' ? up.slice(0, 3) : up.filter(e => e.courseId === tab).slice(0, 6);
}
function eventsAreaHtml(home) {
  const list = eventsForTab(home.events, App.homeTab);
  return list.length ? `<div class="ev-grid">${list.map((e, i) => eventCardHtml(e, home.courses, i)).join('')}</div>` : emptyBox('Não existem eventos programados.', App.homeTab === 'proximos' ? '' : 'Volta em breve para ver as novidades deste ramo.');
}
const tabsHtml = home => [['proximos', 'Próximos'], ...home.courses.map(c => [c.id, shortCourse(c.name)])]
  .map(([id, label]) => `<button class="tab ${App.homeTab === id ? 'active' : ''}" data-action="home-tab" data-tab="${id}" role="tab" aria-selected="${App.homeTab === id}">${esc(label)}</button>`).join('');
const markText = name => initials(name.replace(/^Técnico (da Área da |de |da |do )?/, ''));
const photoOrMark = (src, name) => src ? `<img src="${esc(asset(src))}" alt="" decoding="async" data-mark="${esc(markText(name))}"${focusStyle(src)}>` : `<div class="ph-none" aria-hidden="true">${esc(markText(name))}</div>`;
const courseCardHtml = (c, i) => `<button class="course-card reveal" style="--d:${i * 50}ms" data-action="open-curso" data-id="${c.id}" aria-label="Ver curso ${esc(c.name)}">
  <div class="ph">${photoOrMark(c.photo, c.name)}</div>
  <div class="cb"><span class="course-area">${esc(c.area)}</span><span class="course-name">${esc(c.name)}</span><span class="course-short">${esc(c.short)}</span><span class="course-more">Ver curso ${arrow}</span></div></button>`;
const STAT_DEFS = [['cursos', 'Cursos'], ['atividades', 'Atividades publicadas'], ['alunos', 'Alunos registados'], ['professores', 'Professores ativos'], ['concluidas', 'Atividades concluídas']];
const statsHtml = st => STAT_DEFS.map(([k, l], i) => `<div class="stat reveal" data-stat="${k}" style="--d:${i * 80}ms"><div class="n" data-count="${st[k]}" data-v="0">0</div><div class="l">${l}</div></div>`).join('');

function renderHome() {
  const home = App.store.publicHome();
  const links = [['quem-somos', 'Quem somos'], ['como-funciona', 'Como funciona'], ['cursos', 'Cursos'], ['eventos', 'Eventos'], ['numeros', 'Números']];
  return `
  <button class="skip" data-action="scroll" data-target="quem-somos">Saltar para o conteúdo</button>
  <header class="home-top"><div class="home-top-in">
    <div class="brand"><img src="${asset('img/logo-marca.png')}" alt=""><span>ALDIJOS</span></div>
    <nav class="home-links" aria-label="Secções da página">${links.map(([id, l]) => `<button data-action="scroll" data-target="${id}">${l}</button>`).join('')}</nav>
    <button class="btn btn-primary home-enter" data-action="go-login">Entrar ${arrow}</button>
  </div></header>

  ${heroHtml('home-hero')}

  <main>
  <section class="sec" id="quem-somos" aria-labelledby="t-quem"><div class="wrap">
    <div class="sec-head reveal"><div class="sec-eyebrow">Quem somos</div>
      <h2 class="sec-title" id="t-quem">Uma plataforma para organizar as atividades da escola, do enunciado ao feedback</h2>
      <p class="sec-lead">A Aldijos apoia o ensino profissional e o ensino secundário: o professor publica, o aluno responde e o resultado fica registado, tudo num só sítio.</p></div>
    <div class="facts">
      <div class="fact reveal" style="--d:0ms"><h3>O que é</h3><p>Uma plataforma web onde as atividades pedagógicas são publicadas, realizadas, submetidas, corrigidas e avaliadas.</p></div>
      <div class="fact reveal" style="--d:80ms"><h3>Para quem é</h3><p>Para toda a comunidade escolar. Cada pessoa entra com a sua conta e só vê o que é do seu perfil.</p>
        <div class="roles"><span>Alunos</span><span>Professores</span><span>Administração</span></div></div>
      <div class="fact reveal" style="--d:160ms"><h3>O que resolve</h3><p>Fichas, trabalhos e notas deixam de estar espalhados por vários meios: prazos, resultados e feedback ficam centralizados.</p></div>
      <div class="fact reveal" style="--d:240ms"><h3>Quem a faz</h3><p>Um projeto académico da equipa Aldijos: Aldir, José e Dinis. O nome nasce da junção dos três.</p></div>
    </div>
  </div></section>

  <section class="sec" id="como-funciona" aria-labelledby="t-como"><div class="wrap">
    <div class="sec-head reveal"><div class="sec-eyebrow">Como funciona</div><h2 class="sec-title" id="t-como">Quatro passos, sem precisarem de estar online ao mesmo tempo</h2></div>
    <div class="steps">
      <div class="step reveal" style="--d:0ms"><div class="n">1</div><h3>O professor publica</h3><p>Cria as perguntas e define o prazo.</p></div>
      <div class="step reveal" style="--d:100ms"><div class="n">2</div><h3>O aluno responde</h3><p>Responde e anexa ficheiros a qualquer momento, dentro do prazo definido.</p></div>
      <div class="step reveal" style="--d:200ms"><div class="n">3</div><h3>A correção</h3><p>Automática nas perguntas objetivas; manual nas abertas.</p></div>
      <div class="step reveal" style="--d:300ms"><div class="n">4</div><h3>O resultado</h3><p>Nota e feedback ficam registados e visíveis ao aluno.</p></div>
    </div>
  </div></section>

  <section class="sec" id="cursos" aria-labelledby="t-cursos"><div class="wrap">
    <div class="sec-flex sec-head reveal" style="max-width:none;"><div style="max-width:60ch;"><div class="sec-eyebrow">Formação profissional</div><h2 class="sec-title" id="t-cursos">Cursos em destaque</h2></div>
      <div class="rail-btns"><button class="rail-btn" data-action="rail" data-dir="-1" aria-label="Cursos anteriores">‹</button><button class="rail-btn" data-action="rail" data-dir="1" aria-label="Cursos seguintes">›</button></div></div>
    <div class="rail" id="courses-rail" tabindex="0" aria-label="Lista de cursos">${home.courses.map(courseCardHtml).join('')}</div>
  </div></section>

  <section class="sec" id="eventos" aria-labelledby="t-eventos"><div class="wrap">
    <div class="sec-head reveal"><div class="sec-eyebrow">Vida escolar</div><h2 class="sec-title" id="t-eventos">Eventos por ramo</h2></div>
    <div class="tabs reveal" id="ev-tabs" role="tablist" aria-label="Ramos">${tabsHtml(home)}</div>
    <div id="ev-area" aria-live="polite">${eventsAreaHtml(home)}</div>
  </div></section>

  <section class="sec" id="numeros" aria-labelledby="t-num"><div class="wrap">
    <div class="sec-head reveal"><div class="sec-eyebrow">Aldijos em números</div><h2 class="sec-title" id="t-num">O que já acontece na plataforma</h2></div>
    <div class="stats" id="stats">${statsHtml(home.stats)}</div>
    <div class="live reveal"><i></i>Atualizado em tempo real</div>
  </div></section>
  </main>

  ${footerHtml()}`;
}

function afterHome() {
  const root = $('#root');
  App.homeSig = homeSig();
  initReveal(root); initCounters(root); startHero();
}
const homeSig = () => { const h = App.store.publicHome(); return { courses: JSON.stringify(h.courses), events: JSON.stringify(h.events), stats: JSON.stringify(h.stats) }; };

/* Atualização em tempo real: só mexe no que mudou (números animam de valor antigo → novo) */
function refreshHome() {
  if (App.screen !== 'home' || !$('#stats')) return;
  const home = App.store.publicHome(), sig = homeSig(), old = App.homeSig || {};
  if (sig.stats !== old.stats) {
    STAT_DEFS.forEach(([k]) => {
      const box = $(`[data-stat="${k}"]`), n = $('.n', box); if (!n) return;
      const prev = +n.dataset.v || 0, next = home.stats[k];
      n.dataset.count = next;
      if (n.dataset.started !== '1' && !n.dataset.v) return;
      if (prev !== next) { animateCount(n, next, prev); box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump'); }
    });
  }
  if (sig.courses !== old.courses) { $('#courses-rail').innerHTML = home.courses.map(courseCardHtml).join(''); $$('#courses-rail .reveal').forEach(e => e.classList.add('in')); $('#ev-tabs').innerHTML = tabsHtml(home); }
  if (sig.events !== old.events || sig.courses !== old.courses) { $('#ev-area').innerHTML = eventsAreaHtml(home); $$('#ev-area .reveal').forEach(e => e.classList.add('in')); }
  App.homeSig = sig;
}

ACTIONS['home-tab'] = el => {
  App.homeTab = el.dataset.tab; const home = App.store.publicHome();
  $$('#ev-tabs .tab').forEach(t => { const on = t.dataset.tab === App.homeTab; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
  $('#ev-area').innerHTML = eventsAreaHtml(home); $$('#ev-area .reveal').forEach((e, i) => setTimeout(() => e.classList.add('in'), 30 + i * 60));
};
ACTIONS.rail = el => { const r = $('#courses-rail'); r.scrollBy({ left: +el.dataset.dir * Math.min(600, r.clientWidth * 0.85), behavior: prefersReducedMotion() ? 'auto' : 'smooth' }); };
ACTIONS.scroll = el => {
  const t = document.getElementById(el.dataset.target); if (!t) return;
  t.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
};

/* ---------- modais públicos ---------- */
function openCurso(id) {
  const c = App.store.publicHome().courses.find(x => x.id === id); if (!c) return;
  openModal(`${c.photo ? `<img class="m-photo" src="${esc(asset(c.photo))}" alt="${esc(c.name)}"${focusStyle(c.photo)}>` : ''}
    <div class="modal-body"><div class="course-area">${esc(c.area)}</div><h2 id="modal-title">${esc(c.name)}</h2>
    <p style="margin:0 0 14px; color:var(--text-muted);">${esc(c.description)}</p>
    <div class="label" style="margin-bottom:4px;">Duração</div><p style="margin:0 0 12px;">${c.years} anos (curso profissional)</p>
    <div class="label" style="margin-bottom:4px;">Módulos</div><div>${c.modules.map(m => `<span class="chip-inline">${esc(m)}</span>`).join('')}</div>
    <p class="helper" style="margin-top:14px;">Para consultar turmas e atividades, entra na plataforma.</p>
    <div class="modal-actions"><button class="btn btn-primary" data-action="go-login">Entrar ${arrow}</button><button class="btn" data-action="close-modal">Fechar</button></div></div>`);
}
function openEvent(id) {
  const home = App.store.publicHome(); const e = App.store.publishedEvents().find(x => x.id === id); if (!e) return;
  const img = evImage(e, home.courses), course = home.courses.find(c => c.id === e.courseId);
  openModal(`${img ? `<img class="m-photo" src="${esc(asset(img))}" alt="${esc(e.title)}"${focusStyle(img)}>` : ''}
    <div class="modal-body"><div class="ev-cat">${esc(e.category)}</div><h2 id="modal-title">${esc(e.title)}</h2>
    <p style="margin:0 0 14px; color:var(--text-muted);">${esc(e.description)}</p>
    <div class="ev-meta" style="flex-direction:column; gap:6px; font-size:13.4px;">
      <span><b>Data:</b> ${esc(fmtQuando(e))}</span><span><b>Local:</b> ${esc(e.place || 'Online')}</span>
      <span><b>Público-alvo:</b> ${esc(e.audience)}</span><span><b>Ramo:</b> ${esc(course ? course.name : 'Toda a escola')}</span></div>
    <div class="modal-actions"><button class="btn" data-action="close-modal">Fechar</button></div></div>`);
}
ACTIONS['open-curso'] = el => openCurso(el.dataset.id);
ACTIONS['open-event'] = el => openEvent(el.dataset.id);
ACTIONS['close-modal'] = () => closeModal();
