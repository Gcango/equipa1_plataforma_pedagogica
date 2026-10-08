/* Aldijos — núcleo da interface: estado, utilitários, modais, destaque e animações */
const App = { store: null, user: null, svc: null, screen: 'home', page: 'dashboard', params: {}, draft: null, answers: {}, evImg: null, hero: { i: 0, timer: null }, homeTab: 'proximos', confirm: null, supaReady: false };
const ACTIONS = {};   // data-action -> função
const FORMS = {};     // data-form   -> função
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* no ficheiro único (dist/) as imagens vêm incorporadas em ASSETS; em desenvolvimento usa-se o caminho normal */
const asset = p => (typeof ASSETS !== 'undefined' && ASSETS[p]) || p;
const prefersReducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- datas (português europeu) ---------- */
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const parseISO = iso => { const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number); return { y, m, d }; };
const fmtData = iso => { if (!iso) return '—'; const { y, m, d } = parseISO(iso); return `${d} de ${MESES[m - 1]} de ${y}`; };
const fmtCurta = iso => { const { m, d } = parseISO(iso); return `${d} ${MESES_CURTO[m - 1]}`; };
const fmtDataHora = iso => { if (!iso) return '—'; const dt = new Date(iso); const p = n => String(n).padStart(2, '0'); return `${dt.getDate()} ${MESES_CURTO[dt.getMonth()]} ${dt.getFullYear()}, ${p(dt.getHours())}:${p(dt.getMinutes())}`; };
function fmtEvento(e) {
  if (!e.dateEnd) return fmtData(e.date);
  const a = parseISO(e.date), b = parseISO(e.dateEnd);
  return a.m === b.m ? `${a.d} a ${b.d} de ${MESES[a.m - 1]} de ${a.y}` : `${fmtData(e.date)} a ${fmtData(e.dateEnd)}`;
}
const fmtQuando = e => fmtEvento(e) + (e.time ? ' · ' + e.time : (e.timeNote ? ' · ' + e.timeNote : ''));
const fmtSize = n => n < 1024 ? n + ' B' : Math.round(n / 1024) + ' KB';
const initials = name => name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const firstName = name => name.replace(/^(Prof\.ª?|Dr\.ª?)\s+/, '').split(' ')[0];
const todayISO = () => { const d = new Date(); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const shortCourse = name => name.replace(/^Técnico (da Área da |de |da |do )?/, '');

/* ---------- enquadramento das fotografias (rostos sempre visíveis) ---------- */
const FOCUS = {
  'img/equipa/equipa-1.jpg': '50% 42%', 'img/equipa/equipa-2.jpg': '50% 12%', 'img/equipa/equipa-3.jpg': '50% 30%', 'img/equipa/equipa-4.jpg': '50% 45%',
};
const focusStyle = src => { const f = FOCUS[src] || (String(src).startsWith('img/eventos/') ? '50% 38%' : ''); return f ? ` style="object-position:${f}"` : ''; };

/* ---------- avisos rápidos ---------- */
let toastTimer = null;
function toast(msg, tone) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.className = 'toast show' + (tone === 'error' ? ' error' : '');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), tone === 'error' ? 4200 : 2600);
}
function safe(fn) {
  return async function (...a) {
    try { return await fn.apply(this, a); }
    catch (e) { if (e && e.name === 'AppError') toast(e.message, 'error'); else { console.error(e); toast('Ocorreu um erro inesperado. Tenta novamente.', 'error'); } }
  };
}

/* ---------- modais ---------- */
function openModal(html, opts) {
  const m = $('#modal-root'); App.modalOpener = document.activeElement;
  m.innerHTML = `<div class="modal-back"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
    <button class="modal-x ${opts && opts.plain ? 'plain' : ''}" data-action="close-modal" aria-label="Fechar">×</button>${html}</div></div>`;
  document.body.style.overflow = 'hidden';
  const box = $('.modal', m); if (box) box.focus();
}
function closeModal() {
  const m = $('#modal-root'); if (!m || !m.innerHTML) return; m.innerHTML = ''; document.body.style.overflow = '';
  if (App.modalOpener && document.contains(App.modalOpener)) App.modalOpener.focus();
  App.modalOpener = null;
}
const modalOpen = () => !!($('#modal-root') && $('#modal-root').innerHTML);

/* ---------- pequenos blocos de marcação ---------- */
const arrow = '<span class="arrow" aria-hidden="true">→</span>';
function statusText(key, score) {
  const map = {
    pendente: ['warning', 'Pendente'], urgente: ['danger', 'Prazo próximo'], em_atraso: ['muted', 'Prazo terminado'],
    submetida: ['info', 'Submetida — por corrigir'], corrigida: ['success', 'Corrigida' + (score != null ? ` · ${score}/20` : '')],
    RASCUNHO: ['muted', 'Rascunho'], PUBLICADA: ['success', 'Publicada'], ENCERRADA: ['muted', 'Encerrada'],
    sem_submissao: ['muted', 'Sem submissão'], por_corrigir: ['warning', 'Por corrigir'], Ativo: ['success', 'Ativo'], Inativo: ['muted', 'Inativo'],
  };
  const [tone, label] = map[key] || ['muted', key];
  return `<span class="status-text"><span class="dot dot-${tone}"></span>${esc(label)}</span>`;
}
const emptyBox = (title, text) => `<div class="empty"><b>${esc(title)}</b>${text ? esc(text) : ''}</div>`;
const loadingBox = msg => `<div class="loading" role="status"><span class="spinner"></span>${esc(msg || 'A carregar…')}</div>`;
function errorBox(msg) { return `<div class="empty"><b>Não foi possível abrir esta página</b>${esc(msg)}<div style="margin-top:12px;"><button class="btn" data-action="nav" data-page="dashboard">Voltar ao início</button></div></div>`; }
function noticesHtml(list) {
  return list.map(n => `<div class="notice-row"><span class="dot dot-${n.tone === 'danger' ? 'danger' : n.tone === 'success' ? 'success' : n.tone === 'warning' ? 'warning' : n.tone === 'info' ? 'info' : 'muted'}"></span><span>${esc(n.text)}</span></div>`).join('');
}

/* ---------- destaque com fotografias: só etiqueta e pontos ---------- */
const HERO_SLIDES = [
  { src: 'img/equipa/equipa-2.jpg', tag: 'Projeto Aldijos', pos: '50% 12%', alt: 'Três elementos da equipa Aldijos lado a lado numa sala de informática' },
  { src: 'img/equipa/equipa-1.jpg', tag: 'Desenvolvimento', pos: '50% 42%', alt: 'Três elementos da equipa a trabalhar em portáteis à mesma mesa' },
  { src: 'img/equipa/equipa-3.jpg', tag: 'Desenvolvimento', pos: '50% 30%', alt: 'Equipa a programar em conjunto numa sala de aula' },
  { src: 'img/equipa/equipa-4.jpg', tag: 'Trabalho de equipa', pos: '50% 45%', alt: 'Dois computadores, um com uma videochamada da equipa e outro com código' },
];
function heroHtml(cls) {
  const i = App.hero.i;
  return `<div class="photo-hero ${cls || ''}" role="group" aria-roledescription="carrossel" aria-label="Fotografias da equipa Aldijos">
    ${HERO_SLIDES.map((s, k) => `<div class="slide-wrap ${k === i ? 'active' : ''}" data-slide="${k}">
      <img class="bg" src="${asset(s.src)}" alt="" aria-hidden="true"><img class="fg" src="${asset(s.src)}" alt="${esc(s.alt)}" style="--pos:${s.pos}"></div>`).join('')}
    <div class="scrim"></div>
    <div class="hero-tag" aria-live="polite"><span>${esc(HERO_SLIDES[i].tag)}</span></div>
    <div class="hero-dots">${HERO_SLIDES.map((s, k) => `<button class="hero-dot ${k === i ? 'active' : ''}" data-action="hero-dot" data-i="${k}" aria-label="Fotografia ${k + 1} de ${HERO_SLIDES.length}: ${esc(s.tag)}" aria-current="${k === i}"></button>`).join('')}</div>
  </div>`;
}
function updateHero() {
  const i = App.hero.i;
  $$('.slide-wrap').forEach(w => w.classList.toggle('active', +w.dataset.slide === i));
  $$('.hero-dot').forEach(d => { const on = +d.dataset.i === i; d.classList.toggle('active', on); d.setAttribute('aria-current', on); });
  $$('.hero-tag').forEach(t => { t.innerHTML = `<span>${esc(HERO_SLIDES[i].tag)}</span>`; });
}
function startHero() {
  stopHero(); if (prefersReducedMotion()) return;
  App.hero.timer = setInterval(() => { App.hero.i = (App.hero.i + 1) % HERO_SLIDES.length; updateHero(); }, 6500);
}
function stopHero() { clearInterval(App.hero.timer); App.hero.timer = null; }
ACTIONS['hero-dot'] = el => { App.hero.i = +el.dataset.i; updateHero(); startHero(); };

/* ---------- animações corporativas: entrada por scroll e contadores ---------- */
let revealObserver = null, countObserver = null;
function initReveal(root) {
  document.documentElement.classList.add('anim');
  const els = $$('.reveal', root);
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach(e => revealObserver.observe(e));
}
function animateCount(el, to, from) {
  const start = from == null ? 0 : from;
  if (prefersReducedMotion() || start === to) { el.textContent = to.toLocaleString('pt-PT'); el.dataset.v = to; return; }
  const t0 = performance.now(), dur = 1300;
  const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(start + (to - start) * e).toLocaleString('pt-PT'); if (p < 1) requestAnimationFrame(step); else el.dataset.v = to; };
  requestAnimationFrame(step);
}
function initCounters(root) {
  const els = $$('[data-count]', root);
  if (countObserver) countObserver.disconnect();
  if (!('IntersectionObserver' in window)) { els.forEach(el => animateCount(el, +el.dataset.count, +el.dataset.count)); return; }
  countObserver = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { const el = en.target; el.dataset.started = '1'; animateCount(el, +el.dataset.count, 0); countObserver.unobserve(el); }
  }), { threshold: 0.4 });
  els.forEach(el => { if (!el.dataset.started) countObserver.observe(el); });
}

/* imagem que falhe a carregar: tenta outra vez uma vez; se continuar a falhar, mostra um cartão com iniciais (nunca uma área em branco) */
document.addEventListener('error', e => {
  const t = e.target; if (!t || t.tagName !== 'IMG' || t.classList.contains('bg')) return;
  if (!t.dataset.retry && !String(t.getAttribute('src')).startsWith('data:')) { t.dataset.retry = '1'; const src = t.getAttribute('src'); t.src = src + (src.includes('?') ? '&' : '?') + 'r=' + Date.now(); return; }
  const box = t.parentElement;
  if (box && (box.classList.contains('ph') || box.classList.contains('ev-media'))) {
    const n = document.createElement('div'); n.className = 'ph-none'; n.setAttribute('aria-hidden', 'true'); n.textContent = t.dataset.mark || ''; t.replaceWith(n);
  } else t.style.visibility = 'hidden';
}, true);
