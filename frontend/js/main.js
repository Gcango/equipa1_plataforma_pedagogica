/* Aldijos — arranque, navegação e sincronização */
const NAV = {
  ALUNO: [['dashboard', 'Dashboard'], ['modulos', 'Módulos'], ['atividades', 'Atividades'], ['resultados', 'Resultados'], ['eventos', 'Eventos']],
  PROFESSOR: [['dashboard', 'Dashboard'], ['turmas', 'Turmas'], ['modulos', 'Módulos'], ['atividades', 'Atividades'], ['correcoes', 'Correções'], ['desempenho', 'Desempenho'], ['eventos', 'Eventos']],
  ADMIN: [['dashboard', 'Dashboard'], ['utilizadores', 'Utilizadores'], ['cursos', 'Cursos'], ['turmas', 'Turmas'], ['modulos', 'Módulos'], ['eventos', 'Eventos']],
};
const NAV_PARENT = { atividade: 'atividades', resultado: 'resultados', criar: 'atividades', submissoes: 'atividades', corrigir: 'correcoes' };
let lastScreen = null;

function renderShell() {
  const u = App.user;
  return `<div class="app-shell">
    <header class="topbar"><div class="brand"><img src="${asset('img/logo-marca.png')}" alt=""><span>ALDIJOS</span></div>
      <div class="topbar-right">
        <button class="btn btn-sm bell" data-action="open-notices" aria-label="Avisos">Avisos<span class="count" id="bell-count" hidden>0</span></button>
        <div class="user-meta"><b>${esc(u.name)}</b><small>${esc(ROLE_LABEL[u.role])}</small></div><div class="avatar" aria-hidden="true">${esc(initials(u.name))}</div>
        <button class="btn-text" data-action="logout">Sair</button></div></header>
    <div class="body-layout"><nav class="sidebar" aria-label="Menu principal" id="sidebar"></nav><main class="app-main"><div class="container" id="page"></div>${appFooterHtml()}</main></div></div>`;
}
function updateChrome() {
  const active = NAV_PARENT[App.page] || App.page;
  const sb = $('#sidebar'); if (sb) sb.innerHTML = NAV[App.user.role].map(([k, l]) => `<button class="side-link ${active === k ? 'active' : ''}" data-action="nav" data-page="${k}" ${active === k ? 'aria-current="page"' : ''}>${l}</button>`).join('');
  const n = App.svc.notifications().filter(x => x.tone !== 'muted').length, b = $('#bell-count');
  if (b) { b.textContent = n; b.hidden = n === 0; }
}
function renderMain(animate) {
  const host = $('#page'); if (!host || !App.user) return;
  const fn = PAGES[App.user.role][App.page];
  try { host.innerHTML = fn ? fn(App.params || {}) : errorBox('Esta página não existe.'); }
  catch (e) { host.innerHTML = errorBox(e.name === 'AppError' ? e.message : 'Ocorreu um erro inesperado.'); if (e.name !== 'AppError') console.error(e); }
  host.classList.toggle('page-enter', !!animate);
  updateChrome();
}
function go(page, params) {
  App.page = page; App.params = params || {}; App.confirm = null; closeModal(); renderMain(true);
  const m = $('.app-main'); if (m) m.scrollTop = 0;
}
ACTIONS.nav = el => {
  if (el.dataset.page === 'criar' && !el.dataset.id) App.draft = null;
  go(el.dataset.page, { id: el.dataset.id, moduleId: el.dataset.module });
};
ACTIONS['open-notices'] = () => openModal(`<div class="modal-body"><h2 id="modal-title">Avisos</h2><div class="list" style="margin-top:12px;">${noticesHtml(App.svc.notifications())}</div><div class="modal-actions"><button class="btn" data-action="close-modal">Fechar</button></div></div>`, { plain: true });

function render() {
  stopHero();
  const root = $('#root');
  root.className = App.screen === 'home' ? 'is-home' : '';
  if (App.screen === 'home') { root.innerHTML = renderHome(); afterHome(); }
  else if (App.screen === 'login') { root.innerHTML = renderLogin(App.loginMode); startHero(); }
  else { root.innerHTML = renderShell(); renderMain(true); }
  if (lastScreen !== App.screen) { window.scrollTo(0, 0); lastScreen = App.screen; }
}

/* ---------- eventos do utilizador (delegação) ---------- */
const CHANGE_TYPES = 'select, input[type=file], input[type=radio], input[type=checkbox]';
function dispatch(el, ev) {
  const fn = ACTIONS[el.dataset.action]; if (!fn) return;
  try { const r = fn(el, ev); if (r && r.catch) r.catch(err => console.error(err)); } catch (err) { if (err && err.name === 'AppError') toast(err.message, 'error'); else console.error(err); }
}
document.addEventListener('click', e => {
  const back = e.target.classList && e.target.classList.contains('modal-back'); if (back) return closeModal();
  const el = e.target.closest('[data-action]'); if (!el || el.matches(CHANGE_TYPES) || el.matches('input[type=text], textarea')) return;
  dispatch(el, e);
});
document.addEventListener('change', e => { const el = e.target.closest('[data-action]'); if (el && el.matches(CHANGE_TYPES)) dispatch(el, e); });
document.addEventListener('input', e => { if (e.target.matches && e.target.matches('[data-score]')) updateCalc(); });
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
  const fn = FORMS[f.dataset.form]; if (fn) Promise.resolve(fn(f)).catch(err => console.error(err));
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modalOpen()) closeModal(); });

/* ---------- sincronização: qualquer alteração aparece logo (também noutros separadores) ---------- */
let liveTimer = null;
function onStoreChange() { clearTimeout(liveTimer); liveTimer = setTimeout(applyLive, 60); }
function formIsBusy() {
  const a = document.activeElement, inPage = a && $('#page') && $('#page').contains(a) && a.matches('input, textarea, select');
  return inPage || Object.values(adminForms).some(Boolean) || evForm.open || (App.page === 'criar') || (App.page === 'atividade') || (App.page === 'corrigir');
}
function applyLive() {
  if (App.screen === 'home') return refreshHome();
  if (App.screen !== 'app' || !App.user) return;
  if (!App.store.session()) { toast('A tua sessão terminou.', 'error'); return leaveApp(); }
  if (modalOpen()) return updateChrome();
  if (LIVE_PAGES[App.user.role].has(App.page) && !formIsBusy()) renderMain(false); else updateChrome();
}

/* ---------- arranque ---------- */
function pickStorage(kind) {
  try { const s = window[kind]; s.setItem('__aldijos', '1'); s.removeItem('__aldijos'); return { s, ok: true }; }
  catch (e) { return { s: Aldijos.memoryStorage(), ok: false }; }
}
(async function boot() {
  $('#root').innerHTML = loadingBox('A preparar a plataforma…');
  const local = pickStorage('localStorage'), sess = pickStorage('sessionStorage');
  let channel = null; try { channel = new BroadcastChannel('aldijos'); } catch (e) { /* sem canal */ }
  App.persistent = local.ok;
  App.store = Aldijos.createStore({ storage: local.s, sessionStorage: sess.s, seed: Aldijos.buildSeed, seedVersion: Aldijos.SEED_VERSION, channel });
  try { await App.store.init(); } catch (e) { $('#root').innerHTML = errorBox('Não foi possível iniciar a plataforma.'); return console.error(e); }
  App.store.subscribe(onStoreChange);
  if (channel) channel.onmessage = () => App.store.reload();
  window.addEventListener('storage', e => { if (e.key === 'aldijos.db.v1') App.store.reload(); });
  const s = App.store.session();
  if (s) enterApp(s); else render();
  if (App.store.wasMigrated()) toast('Dados de demonstração atualizados para a nova versão.');
  if (!App.persistent) toast('O armazenamento do browser não está disponível: os dados só duram até fechares o separador.', 'error');
})();
