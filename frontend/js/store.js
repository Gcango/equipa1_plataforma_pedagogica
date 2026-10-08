/*
 * Aldijos — camada de dados (faz de "base de dados + API" nesta fase).
 *
 * - Persistência: um único documento JSON guardado no armazenamento do browser.
 * - Permissões: TODAS as leituras/escritas passam por store.as(userId).<método>() e são
 *   verificadas aqui (perfil e posse do recurso). A interface nunca toca nos dados diretamente.
 * - Isomórfico: corre no browser e em Node (testes em /tests).
 *
 * Limitação assumida: sem servidor, a segurança é apenas de demonstração — quem abrir as
 * ferramentas de programador do browser consegue ler o armazenamento local.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Aldijos = Object.assign(root.Aldijos || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DB_KEY = 'aldijos.db.v1';
  const SESSION_KEY = 'aldijos.session.v1';
  const PBKDF2_ITER = 50000;
  const SESSION_MS = 8 * 60 * 60 * 1000;
  const MAX_FILE_BYTES = 300 * 1024;
  const MAX_FILES = 3;
  const FILE_EXT = { pdf: 1, png: 1, jpg: 1, jpeg: 1, txt: 1, docx: 1, zip: 1 };
  const IMG_EXT = { png: 1, jpg: 1, jpeg: 1, webp: 1 };
  const QTYPES = ['MC', 'VF', 'CURTA', 'ABERTA'];

  class AppError extends Error {
    constructor(code, message) { super(message); this.code = code; this.name = 'AppError'; }
  }
  const fail = (code, msg) => { throw new AppError(code, msg); };

  /* ---------- utilitários ---------- */
  const pad = n => String(n).padStart(2, '0');
  const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoDate(d); };
  const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
  const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T12:00:00'));
  const isTime = s => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  const round1 = n => Math.round(n * 10) / 10;
  const byId = (arr, id) => arr.find(x => x.id === id);
  const uniq = a => [...new Set(a)];

  function text(v, name, min, max, opts) {
    const s = typeof v === 'string' ? v.trim() : '';
    if (!s && opts && opts.optional) return '';
    if (s.length < min) fail('INVALID', `${name}: mínimo ${min} caracteres.`);
    if (s.length > max) fail('INVALID', `${name}: máximo ${max} caracteres.`);
    return s;
  }
  const validEmail = e => typeof e === 'string' && e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  function validPassword(p) {
    if (typeof p !== 'string' || p.length < 8 || p.length > 72) fail('INVALID', 'A palavra-passe deve ter entre 8 e 72 caracteres.');
    if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) fail('INVALID', 'A palavra-passe deve incluir letras e números.');
  }

  function memoryStorage() {
    const m = new Map();
    return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); } };
  }

  /* ---------- palavras-passe (PBKDF2 via Web Crypto) ---------- */
  const b64 = bytes => { let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); }); return btoa(s); };
  const unb64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
  async function derive(password, salt, iter) {
    const subtle = (globalThis.crypto && globalThis.crypto.subtle);
    if (!subtle) fail('INVALID', 'Este browser não suporta a cifra de palavras-passe (Web Crypto).');
    const key = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
  }
  async function hashPassword(password) {
    const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
    const h = await derive(password, salt, PBKDF2_ITER);
    return `pbkdf2$${PBKDF2_ITER}$${b64(salt)}$${b64(h)}`;
  }
  async function verifyPassword(password, stored) {
    const [alg, iter, salt, hash] = String(stored).split('$');
    if (alg !== 'pbkdf2') return false;
    const h = await derive(password, unb64(salt), Number(iter));
    const expected = unb64(hash);
    let diff = h.length ^ expected.length;
    for (let i = 0; i < h.length; i++) diff |= h[i] ^ (expected[i] || 0);
    return diff === 0;
  }

  /* ---------- núcleo: identificadores e correção ---------- */
  function nextId(db, prefix) { db.seq[prefix] = (db.seq[prefix] || 0) + 1; return prefix + db.seq[prefix]; }

  function normalizeAnswers(activity, input) {
    return activity.questions.map(q => {
      const v = input ? input[q.id] : undefined;
      const a = { questionId: q.id, optionId: null, bool: null, text: null, isCorrect: null, score: null };
      if (q.type === 'MC') {
        const opt = q.options.find(o => o.id === v);
        a.optionId = opt ? opt.id : null;
        a.isCorrect = !!(opt && opt.correct);
        a.score = a.isCorrect ? q.points : 0;
      } else if (q.type === 'VF') {
        a.bool = v === true || v === false ? v : null;
        a.isCorrect = a.bool !== null && a.bool === q.correctBool;
        a.score = a.isCorrect ? q.points : 0;
      } else {
        const t = typeof v === 'string' ? v.trim().slice(0, q.type === 'CURTA' ? 300 : 4000) : '';
        a.text = t || null;
        if (!t) a.score = 0;
      }
      return a;
    });
  }
  function tally(activity, answers) {
    const total = activity.questions.reduce((s, q) => s + q.points, 0);
    const earned = answers.reduce((s, a) => s + (a.score || 0), 0);
    return { total, earned, pending: answers.some(a => a.score === null) };
  }
  const scoreOf = (earned, total) => (total ? round1((earned / total) * 20) : 0);

  function applySubmission(sub, activity, input, atISO) {
    sub.answers = normalizeAnswers(activity, input);
    const t = tally(activity, sub.answers);
    sub.submittedAt = atISO;
    sub.autoScore = scoreOf(t.earned, t.total);
    if (t.pending) { sub.status = 'SUBMETIDA'; sub.finalScore = null; sub.gradedBy = null; sub.gradedAt = null; }
    else { sub.status = 'CORRIGIDA'; sub.finalScore = sub.autoScore; sub.gradedBy = null; sub.gradedAt = atISO; }
    return sub;
  }
  function applyGrade(sub, activity, teacherId, data, atISO) {
    const scores = (data && data.scores) || {};
    sub.answers.forEach(a => {
      const q = byId(activity.questions, a.questionId);
      if (q.type !== 'CURTA' && q.type !== 'ABERTA') return;
      const s = scores[q.id];
      if (s === undefined || s === null || s === '') return;
      const n = Number(s);
      if (!Number.isFinite(n) || n < 0 || n > q.points) fail('INVALID', `Pontuação inválida (0 a ${q.points}).`);
      a.score = n; a.gradedBy = teacherId;
    });
    const t = tally(activity, sub.answers);
    const hasOverride = data && data.finalScore !== undefined && data.finalScore !== null && data.finalScore !== '';
    if (t.pending && !hasOverride) fail('INVALID', 'Falta classificar as respostas curtas/abertas.');
    let final = scoreOf(t.earned, t.total);
    if (hasOverride) {
      const n = Number(data.finalScore);
      if (!Number.isFinite(n) || n < 0 || n > 20) fail('INVALID', 'A nota final deve estar entre 0 e 20.');
      final = round1(n);
    }
    sub.finalScore = final; sub.status = 'CORRIGIDA'; sub.gradedBy = teacherId; sub.gradedAt = atISO;
    sub.feedback = text(data && data.feedback, 'Feedback', 0, 2000, { optional: true });
    return sub;
  }

  /* ---------- validação de atividades ---------- */
  function cleanQuestions(list, forPublish) {
    if (!Array.isArray(list)) fail('INVALID', 'Perguntas inválidas.');
    if (list.length > 40) fail('INVALID', 'Máximo de 40 perguntas por atividade.');
    if (forPublish && list.length < 1) fail('INVALID', 'Adiciona pelo menos uma pergunta antes de publicar.');
    return list.map((q, i) => {
      if (!q || !QTYPES.includes(q.type)) fail('INVALID', `Pergunta ${i + 1}: tipo inválido.`);
      const out = { type: q.type, statement: text(q.statement, `Pergunta ${i + 1}`, forPublish ? 3 : 0, 500), points: 1 };
      if (q.type === 'MC') {
        const opts = (q.options || []).map(o => ({ text: text(o.text, `Pergunta ${i + 1}: opção`, forPublish ? 1 : 0, 200), correct: !!o.correct }));
        if (forPublish) {
          if (opts.length < 2 || opts.length > 6) fail('INVALID', `Pergunta ${i + 1}: indica entre 2 e 6 opções.`);
          if (opts.some(o => !o.text)) fail('INVALID', `Pergunta ${i + 1}: há opções vazias.`);
          if (opts.filter(o => o.correct).length !== 1) fail('INVALID', `Pergunta ${i + 1}: marca exatamente uma opção correta.`);
        }
        out.options = opts;
      } else if (q.type === 'VF') {
        if (forPublish && typeof q.correctBool !== 'boolean') fail('INVALID', `Pergunta ${i + 1}: indica se é verdadeiro ou falso.`);
        out.correctBool = typeof q.correctBool === 'boolean' ? q.correctBool : null;
      }
      return out;
    });
  }

  /* ---------- a loja ---------- */
  function createStore(opts) {
    opts = opts || {};
    const storage = opts.storage || memoryStorage();
    const sessionStorage_ = opts.sessionStorage || memoryStorage();
    const clock = opts.now || (() => new Date());
    const seedFn = opts.seed;
    const channel = opts.channel || null;
    const listeners = new Set();
    const attempts = new Map();
    let db = null;

    const nowISO = () => clock().toISOString();
    const pt = iso => iso.slice(8, 10) + '/' + iso.slice(5, 7);
    const today = () => isoDate(clock());

    function persist() {
      try { storage.setItem(DB_KEY, JSON.stringify(db)); }
      catch (e) { fail('INVALID', 'Sem espaço de armazenamento. Remove ficheiros anexados ou repõe os dados de demonstração.'); }
    }
    function notify(topics) { listeners.forEach(fn => { try { fn(topics); } catch (e) { /* ignora erros de ouvintes */ } }); }
    function commit(topics) {
      persist(); notify(topics);
      if (channel) { try { channel.postMessage({ topics }); } catch (e) { /* sem canal */ } }
    }
    function reload() {
      const raw = storage.getItem(DB_KEY);
      if (!raw) return;
      try { db = JSON.parse(raw); notify(['*']); } catch (e) { /* mantém estado atual */ }
    }
    let migrated = false;
    async function init() {
      const raw = storage.getItem(DB_KEY);
      if (raw) {
        try {
          const d = JSON.parse(raw);
          if (d && d.v === 1) {
            // dados de demonstração criados por uma versão antiga: são repostos (evita imagens/dados desatualizados)
            if (opts.seedVersion !== undefined && d.seedVersion !== opts.seedVersion) { migrated = true; sessionStorage_.removeItem(SESSION_KEY); }
            else db = d;
          }
        } catch (e) { db = null; }
      }
      if (!db) {
        if (!seedFn) fail('INVALID', 'Sem dados iniciais.');
        db = await seedFn({ now: clock(), hashPassword });
        persist();
      }
    }
    async function resetDemo() {
      db = await seedFn({ now: clock(), hashPassword });
      persist(); sessionStorage_.removeItem(SESSION_KEY); notify(['*']);
      if (channel) { try { channel.postMessage({ topics: ['*'] }); } catch (e) { /* sem canal */ } }
    }
    function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

    /* ----- autenticação ----- */
    const pub = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });
    function setSession(u) { sessionStorage_.setItem(SESSION_KEY, JSON.stringify({ userId: u.id, exp: clock().getTime() + SESSION_MS })); }
    function session() {
      const raw = sessionStorage_.getItem(SESSION_KEY);
      if (!raw) return null;
      try {
        const s = JSON.parse(raw);
        const u = byId(db.users, s.userId);
        if (!u || !u.active || s.exp < clock().getTime()) { sessionStorage_.removeItem(SESSION_KEY); return null; }
        return pub(u);
      } catch (e) { return null; }
    }
    function logout() { sessionStorage_.removeItem(SESSION_KEY); }
    async function login(email, password) {
      const key = String(email || '').trim().toLowerCase();
      const rec = attempts.get(key) || { n: 0, until: 0 };
      if (rec.until > clock().getTime()) fail('AUTH', 'Demasiadas tentativas falhadas. Tenta novamente dentro de alguns minutos.');
      const u = db.users.find(x => x.email === key);
      const ok = u ? await verifyPassword(String(password || ''), u.passwordHash) : (await verifyPassword('x', 'pbkdf2$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='), false);
      if (!u || !ok || !u.active) {
        rec.n += 1;
        if (rec.n >= 5) { rec.until = clock().getTime() + 5 * 60 * 1000; rec.n = 0; }
        attempts.set(key, rec);
        fail('AUTH', 'Email ou palavra-passe incorretos.');
      }
      attempts.delete(key); setSession(u); return pub(u);
    }
    async function register(data) {
      const name = text(data && data.name, 'Nome', 3, 80);
      const email = String((data && data.email) || '').trim().toLowerCase();
      if (!validEmail(email)) fail('INVALID', 'Email inválido.');
      validPassword(data && data.password);
      if (db.users.some(u => u.email === email)) fail('CONFLICT', 'Já existe uma conta com este email.');
      const u = { id: nextId(db, 'u'), name, email, role: 'ALUNO', active: true, passwordHash: await hashPassword(data.password), createdAt: nowISO() };
      db.users.push(u); commit(['users']); setSession(u); return pub(u);
    }

    /* ----- acesso ----- */
    const publishedEvents = () => db.events.filter(e => e.published).sort((a, b) => a.date.localeCompare(b.date));
    function stats() {
      return {
        cursos: db.courses.length,
        atividades: db.activities.filter(a => a.status === 'PUBLICADA').length,
        alunos: db.users.filter(u => u.role === 'ALUNO' && u.active).length,
        professores: db.users.filter(u => u.role === 'PROFESSOR' && u.active).length,
        concluidas: db.submissions.filter(s => s.status === 'CORRIGIDA').length,
      };
    }
    function publicHome() {
      return {
        courses: db.coursesLive || db.courses.map(c => ({
          id: c.id, name: c.name, area: c.area, short: c.short, description: c.description, years: c.years, photo: c.photo,
          modules: db.modules.filter(m => m.courseId === c.id).map(m => m.name),
        })),
        events: publishedEvents().map(e => ({ ...e })),
        stats: db.liveStats || stats(),
      };
    }

    function as(userId) {
      const me = byId(db.users, userId);
      if (!me || !me.active) fail('AUTH', 'Sessão inválida.');
      const need = (...roles) => { if (!roles.includes(me.role)) fail('FORBIDDEN', 'Não tens permissão para esta ação.'); };
      const nameOf = id => { const u = byId(db.users, id); return u ? u.name : '—'; };
      const moduleOf = id => byId(db.modules, id);
      const classOf = id => byId(db.classes, id);
      const courseOfClass = c => byId(db.courses, c.courseId);
      const studentClassIds = sid => db.enrollments.filter(e => e.studentId === sid).map(e => e.classId);
      const subOf = (activityId, studentId) => db.submissions.find(s => s.activityId === activityId && s.studentId === studentId);
      const classSize = cid => db.enrollments.filter(e => e.classId === cid).length;
      const teachesIt = (tid, moduleId, classId) => db.teaching.some(t => t.teacherId === tid && t.moduleId === moduleId && t.classId === classId);

      const activityMeta = a => {
        const m = moduleOf(a.moduleId), c = classOf(a.classId);
        return { id: a.id, title: a.title, description: a.description, deadline: a.deadline, moduleId: a.moduleId, moduleName: m ? m.name : '—', classId: a.classId, className: c ? c.name : '—', teacherName: nameOf(a.teacherId), questionCount: a.questions.length };
      };
      const eventOut = e => ({ ...e });

      const svc = {
        me: () => pub(me),
        events() { return publishedEvents().map(eventOut); },

        /* ---------- avisos derivados dos dados (nunca desatualizados) ---------- */
        notifications() {
          const out = []; const t = today(); const push = (tone, msg, at) => out.push({ tone, text: msg, at: at || '' });
          if (me.role === 'ALUNO') {
            const cls = studentClassIds(me.id);
            db.activities.filter(a => a.status === 'PUBLICADA' && cls.includes(a.classId)).forEach(a => {
              const s = subOf(a.id, me.id); const submitted = s && s.status !== 'EM_CURSO';
              const left = daysBetween(t, a.deadline);
              if (!submitted && left >= 0 && left <= 3) push('danger', `Prazo a terminar: ${a.title} (${left === 0 ? 'hoje' : left === 1 ? 'amanhã' : 'em ' + left + ' dias'}).`, a.deadline);
              else if (!submitted && left > 3 && a.publishedAt && daysBetween(a.publishedAt.slice(0, 10), t) <= 7) push('warning', `Foi disponibilizada uma nova atividade: ${a.title}.`, a.publishedAt);
              if (!submitted && left < 0) push('muted', `O prazo terminou sem submissão: ${a.title}.`, a.deadline);
            });
            db.submissions.filter(s => s.studentId === me.id && s.status === 'CORRIGIDA').forEach(s => {
              const a = byId(db.activities, s.activityId);
              if (s.gradedAt && daysBetween(s.gradedAt.slice(0, 10), t) <= 14) {
                push('success', `A tua submissão foi corrigida: ${a.title} (${s.finalScore}/20).`, s.gradedAt);
                if (s.feedback) push('success', `O professor adicionou feedback a ${a.title}.`, s.gradedAt);
              }
            });
            publishedEvents().filter(e => { const d = daysBetween(t, e.date); return d >= 0 && d <= 10; }).slice(0, 2).forEach(e => push('info', `Evento em breve: ${e.title} (${pt(e.date)}).`, e.date));
          } else if (me.role === 'PROFESSOR') {
            const mine = db.activities.filter(a => a.teacherId === me.id);
            const pend = db.submissions.filter(s => s.status === 'SUBMETIDA' && mine.some(a => a.id === s.activityId)).length;
            if (pend) push('warning', `${pend} submiss${pend === 1 ? 'ão' : 'ões'} por corrigir.`);
            mine.filter(a => a.status === 'PUBLICADA').forEach(a => { const left = daysBetween(t, a.deadline); if (left >= 0 && left <= 3) push('danger', `O prazo de "${a.title}" termina ${left === 0 ? 'hoje' : 'em ' + left + ' dia(s)'}.`, a.deadline); });
            const drafts = mine.filter(a => a.status === 'RASCUNHO').length;
            if (drafts) push('muted', `Tens ${drafts} atividade(s) em rascunho por publicar.`);
          } else {
            const semTurma = db.users.filter(u => u.role === 'ALUNO' && u.active && !db.enrollments.some(e => e.studentId === u.id)).length;
            if (semTurma) push('warning', `${semTurma} aluno(s) sem turma associada.`);
            const semProf = db.modules.filter(m => !db.teaching.some(x => x.moduleId === m.id)).length;
            if (semProf) push('warning', `${semProf} módulo(s) sem professor associado.`);
            const inativos = db.users.filter(u => !u.active).length;
            if (inativos) push('muted', `${inativos} utilizador(es) desativado(s).`);
            const semTurmaProf = db.users.filter(u => u.role === 'PROFESSOR' && u.active && !db.teaching.some(x => x.teacherId === u.id)).length;
            if (semTurmaProf) push('muted', `${semTurmaProf} professor(es) sem módulos atribuídos.`);
          }
          if (!out.length) push('muted', 'Sem avisos neste momento.');
          return out;
        },

        /* ---------- ficheiros (partilhado com controlo de acesso) ---------- */
        file(subId, fileId) {
          const s = byId(db.submissions, subId); if (!s) fail('NOT_FOUND', 'Submissão não encontrada.');
          const a = byId(db.activities, s.activityId);
          const allowed = me.role === 'ADMIN' || (me.role === 'ALUNO' && s.studentId === me.id) || (me.role === 'PROFESSOR' && a.teacherId === me.id);
          if (!allowed) fail('FORBIDDEN', 'Não tens permissão para aceder a este ficheiro.');
          const f = s.files.find(x => x.id === fileId); if (!f) fail('NOT_FOUND', 'Ficheiro não encontrado.');
          return { name: f.name, dataUrl: f.dataUrl, size: f.size };
        },
        submissionDetail(subId) {
          const s = byId(db.submissions, subId); if (!s || s.status === 'EM_CURSO') fail('NOT_FOUND', 'Submissão não encontrada.');
          const a = byId(db.activities, s.activityId);
          const allowed = me.role === 'ADMIN' || (me.role === 'ALUNO' && s.studentId === me.id) || (me.role === 'PROFESSOR' && a.teacherId === me.id);
          if (!allowed) fail('FORBIDDEN', 'Não tens permissão para consultar esta submissão.');
          const t = tally(a, s.answers);
          return {
            id: s.id, activity: activityMeta(a), student: { id: s.studentId, name: nameOf(s.studentId) },
            status: s.status, submittedAt: s.submittedAt, autoScore: s.autoScore, finalScore: s.finalScore,
            gradedBy: s.gradedBy ? nameOf(s.gradedBy) : (s.status === 'CORRIGIDA' ? 'Correção automática' : null), gradedAt: s.gradedAt,
            feedback: s.feedback || '', pendingManual: t.pending, totalPoints: t.total,
            files: s.files.map(f => ({ id: f.id, name: f.name, size: f.size })),
            items: a.questions.map(q => {
              const ans = s.answers.find(x => x.questionId === q.id);
              return {
                question: { id: q.id, type: q.type, statement: q.statement, points: q.points, options: q.options ? q.options.map(o => ({ id: o.id, text: o.text, correct: o.correct })) : null, correctBool: q.correctBool },
                answer: { optionId: ans.optionId, bool: ans.bool, text: ans.text, isCorrect: ans.isCorrect, score: ans.score },
              };
            }),
          };
        },
      };

      /* ============================ ALUNO ============================ */
      if (me.role === 'ALUNO') {
        const myClasses = () => studentClassIds(me.id);
        const visible = () => db.activities.filter(a => a.status === 'PUBLICADA' && myClasses().includes(a.classId));
        const stateOf = a => {
          const s = subOf(a.id, me.id); const left = daysBetween(today(), a.deadline);
          if (s && s.status === 'CORRIGIDA') return { key: 'corrigida', score: s.finalScore, subId: s.id };
          if (s && s.status === 'SUBMETIDA') return { key: 'submetida', score: s.autoScore, subId: s.id };
          if (left < 0) return { key: 'em_atraso' };
          return { key: left <= 2 ? 'urgente' : 'pendente' };
        };
        const row = a => ({ ...activityMeta(a), state: stateOf(a) });

        svc.dashboard = function () {
          const acts = visible().map(row);
          const cls = myClasses().map(classOf).filter(Boolean);
          const modules = cls.length ? db.modules.filter(m => m.courseId === cls[0].courseId) : [];
          const course = cls.length ? courseOfClass(cls[0]) : null;
          return {
            className: cls.length ? cls[0].name : null, courseName: course ? course.name : null, moduleCount: modules.length,
            pendentes: acts.filter(a => ['pendente', 'urgente'].includes(a.state.key)).sort((a, b) => a.deadline.localeCompare(b.deadline)),
            emAtraso: acts.filter(a => a.state.key === 'em_atraso').length,
            submetidas: acts.filter(a => a.state.key === 'submetida').length,
            corrigidas: acts.filter(a => a.state.key === 'corrigida').length,
            media: (() => { const g = acts.filter(a => a.state.key === 'corrigida'); return g.length ? round1(g.reduce((s, a) => s + a.state.score, 0) / g.length) : null; })(),
            modules: modules.map(m => ({ id: m.id, name: m.name })),
          };
        };
        svc.modules = function () {
          const cls = myClasses().map(classOf).filter(Boolean); if (!cls.length) return { className: null, modules: [] };
          const acts = visible().map(row);
          return {
            className: cls[0].name, courseName: courseOfClass(cls[0]).name,
            modules: db.modules.filter(m => m.courseId === cls[0].courseId).map(m => {
              const mine = acts.filter(a => a.moduleId === m.id);
              const teacher = db.teaching.find(t => t.moduleId === m.id && t.classId === cls[0].id);
              return { id: m.id, name: m.name, hours: m.hours, teacherName: teacher ? nameOf(teacher.teacherId) : null, total: mine.length, pendentes: mine.filter(a => ['pendente', 'urgente'].includes(a.state.key)).length };
            }),
          };
        };
        svc.moduleActivities = function (moduleId) {
          const m = moduleOf(moduleId); if (!m) fail('NOT_FOUND', 'Módulo não encontrado.');
          const cls = myClasses().map(classOf).filter(Boolean);
          if (!cls.some(c => c.courseId === m.courseId)) fail('FORBIDDEN', 'Este módulo não pertence ao teu curso.');
          return { module: { id: m.id, name: m.name }, activities: visible().filter(a => a.moduleId === moduleId).map(row).sort((a, b) => a.deadline.localeCompare(b.deadline)) };
        };
        svc.allActivities = function () { return visible().map(row).sort((a, b) => a.deadline.localeCompare(b.deadline)); };
        svc.activity = function (id) {
          const a = byId(visible(), id); if (!a) fail('NOT_FOUND', 'Atividade não encontrada ou indisponível.');
          const s = subOf(a.id, me.id);
          return {
            ...activityMeta(a), state: stateOf(a),
            canSubmit: !(s && s.status !== 'EM_CURSO') && daysBetween(today(), a.deadline) >= 0,
            questions: a.questions.map(q => ({ id: q.id, type: q.type, statement: q.statement, options: q.options ? q.options.map(o => ({ id: o.id, text: o.text })) : null })),
            files: s ? s.files.map(f => ({ id: f.id, name: f.name, size: f.size })) : [],
          };
        };
        svc.saveFile = function (activityId, file) {
          const a = byId(visible(), activityId); if (!a) fail('NOT_FOUND', 'Atividade não encontrada.');
          if (daysBetween(today(), a.deadline) < 0) fail('DEADLINE', 'O prazo desta atividade terminou.');
          let s = subOf(a.id, me.id);
          if (s && s.status !== 'EM_CURSO') fail('CONFLICT', 'Já submeteste esta atividade.');
          const name = text(String((file && file.name) || '').replace(/[\\/]/g, '_'), 'Nome do ficheiro', 1, 100);
          const ext = (name.split('.').pop() || '').toLowerCase();
          if (!FILE_EXT[ext]) fail('INVALID', 'Tipo de ficheiro não permitido (pdf, png, jpg, txt, docx ou zip).');
          const m = /^data:[^;,]*;base64,([A-Za-z0-9+/=]+)$/.exec((file && file.dataUrl) || '');
          if (!m) fail('INVALID', 'Ficheiro inválido.');
          const size = Math.floor((m[1].length * 3) / 4) - (m[1].endsWith('==') ? 2 : m[1].endsWith('=') ? 1 : 0);
          if (size > MAX_FILE_BYTES) fail('INVALID', `Ficheiro demasiado grande (máximo ${MAX_FILE_BYTES / 1024} KB nesta demonstração).`);
          if (!s) { s = { id: nextId(db, 's'), activityId: a.id, studentId: me.id, status: 'EM_CURSO', submittedAt: null, answers: [], files: [], autoScore: null, finalScore: null, gradedBy: null, gradedAt: null, feedback: '' }; db.submissions.push(s); }
          if (s.files.length >= MAX_FILES) fail('INVALID', `Máximo de ${MAX_FILES} ficheiros por atividade.`);
          s.files.push({ id: nextId(db, 'f'), name, size, dataUrl: file.dataUrl, uploadedAt: nowISO() });
          commit(['submissions']);
        };
        svc.removeFile = function (activityId, fileId) {
          const s = subOf(activityId, me.id);
          if (!s || s.status !== 'EM_CURSO') fail('CONFLICT', 'Não é possível remover ficheiros depois de submeter.');
          s.files = s.files.filter(f => f.id !== fileId); commit(['submissions']);
        };
        svc.submit = function (activityId, answers) {
          const a = byId(visible(), activityId); if (!a) fail('NOT_FOUND', 'Atividade não encontrada.');
          let s = subOf(a.id, me.id);
          if (s && s.status !== 'EM_CURSO') fail('CONFLICT', 'Já submeteste esta atividade.');
          if (daysBetween(today(), a.deadline) < 0) fail('DEADLINE', 'O prazo desta atividade terminou; já não é possível submeter.');
          if (!s) { s = { id: nextId(db, 's'), activityId: a.id, studentId: me.id, status: 'EM_CURSO', files: [], feedback: '' }; db.submissions.push(s); }
          applySubmission(s, a, answers || {}, nowISO());
          commit(['submissions']); return { submissionId: s.id, status: s.status };
        };
        svc.results = function () {
          return db.submissions.filter(s => s.studentId === me.id && s.status !== 'EM_CURSO').map(s => {
            const a = byId(db.activities, s.activityId);
            return { submissionId: s.id, title: a.title, moduleName: moduleOf(a.moduleId).name, submittedAt: s.submittedAt, status: s.status, score: s.status === 'CORRIGIDA' ? s.finalScore : null, provisional: s.autoScore, feedback: s.feedback || '', gradedBy: s.gradedBy ? nameOf(s.gradedBy) : null };
          }).sort((x, y) => y.submittedAt.localeCompare(x.submittedAt));
        };
      }

      /* ========================== PROFESSOR ========================== */
      if (me.role === 'PROFESSOR') {
        const myActs = () => db.activities.filter(a => a.teacherId === me.id);
        const mineOrFail = id => { const a = byId(myActs(), id); if (!a) fail('NOT_FOUND', 'Atividade não encontrada.'); return a; };
        const subsOf = a => db.submissions.filter(s => s.activityId === a.id && s.status !== 'EM_CURSO');
        const actRow = a => {
          const subs = subsOf(a); const t = today();
          return { ...activityMeta(a), estado: a.status === 'PUBLICADA' && a.deadline < t ? 'ENCERRADA' : a.status, submissoes: subs.length, total: classSize(a.classId), porCorrigir: subs.filter(s => s.status === 'SUBMETIDA').length, temSubmissoes: subs.length > 0 };
        };

        svc.dashboard = function () {
          const acts = myActs().map(actRow);
          const pend = acts.reduce((n, a) => n + a.porCorrigir, 0);
          const turmas = uniq(db.teaching.filter(t => t.teacherId === me.id).map(t => t.classId));
          const alunos = uniq(db.enrollments.filter(e => turmas.includes(e.classId)).map(e => e.studentId)).length;
          const recent = db.submissions.filter(s => s.status !== 'EM_CURSO' && myActs().some(a => a.id === s.activityId)).sort((x, y) => y.submittedAt.localeCompare(x.submittedAt)).slice(0, 5).map(s => ({ submissionId: s.id, studentName: nameOf(s.studentId), activityTitle: byId(db.activities, s.activityId).title, submittedAt: s.submittedAt, status: s.status, score: s.status === 'CORRIGIDA' ? s.finalScore : s.autoScore }));
          const graded = db.submissions.filter(s => s.status === 'CORRIGIDA' && myActs().some(a => a.id === s.activityId));
          return { turmas: turmas.length, alunos, publicadas: acts.filter(a => a.estado === 'PUBLICADA').length, rascunhos: acts.filter(a => a.estado === 'RASCUNHO').length, porCorrigir: pend, media: graded.length ? round1(graded.reduce((s, x) => s + x.finalScore, 0) / graded.length) : null, recent };
        };
        svc.classes = function () {
          return uniq(db.teaching.filter(t => t.teacherId === me.id).map(t => t.classId)).map(cid => {
            const c = classOf(cid);
            return { id: c.id, name: c.name, courseName: courseOfClass(c).name, year: c.year, students: db.enrollments.filter(e => e.classId === cid).map(e => nameOf(e.studentId)).sort(), modules: db.teaching.filter(t => t.teacherId === me.id && t.classId === cid).map(t => moduleOf(t.moduleId).name) };
          });
        };
        svc.modules = function () {
          return db.teaching.filter(t => t.teacherId === me.id).map(t => { const m = moduleOf(t.moduleId), c = classOf(t.classId); return { moduleId: m.id, moduleName: m.name, classId: c.id, className: c.name, hours: m.hours, activities: myActs().filter(a => a.moduleId === m.id && a.classId === c.id).length }; });
        };
        svc.activities = function () { return myActs().map(actRow).sort((a, b) => b.deadline.localeCompare(a.deadline)); };
        svc.activityForEdit = function (id) {
          const a = mineOrFail(id);
          return { id: a.id, title: a.title, description: a.description, moduleId: a.moduleId, classId: a.classId, deadline: a.deadline, status: a.status, locked: subsOf(a).length > 0, questions: a.questions.map(q => ({ type: q.type, statement: q.statement, options: q.options ? q.options.map(o => ({ text: o.text, correct: o.correct })) : undefined, correctBool: q.correctBool })) };
        };
        svc.saveActivity = function (data, publish) {
          if (!data) fail('INVALID', 'Dados em falta.');
          if (!teachesIt(me.id, data.moduleId, data.classId)) fail('FORBIDDEN', 'Não lecionas este módulo nesta turma.');
          const title = text(data.title, 'Título', 3, 120);
          const description = text(data.description, 'Descrição', 0, 1000, { optional: true });
          if (!isDate(data.deadline)) fail('INVALID', 'Indica um prazo válido.');
          if (publish && data.deadline < today()) fail('INVALID', 'O prazo não pode estar no passado.');
          const questions = cleanQuestions(data.questions, !!publish);
          let a;
          if (data.id) {
            a = mineOrFail(data.id);
            if (subsOf(a).length) fail('CONFLICT', 'Esta atividade já tem submissões e não pode ser editada.');
          } else { a = { id: nextId(db, 'a'), teacherId: me.id, status: 'RASCUNHO', createdAt: nowISO(), publishedAt: null, questions: [] }; db.activities.push(a); }
          Object.assign(a, { title, description, moduleId: data.moduleId, classId: data.classId, deadline: data.deadline });
          a.questions = questions.map(q => ({ id: nextId(db, 'q'), ...q, options: q.options ? q.options.map(o => ({ id: nextId(db, 'o'), ...o })) : undefined }));
          if (publish) { a.status = 'PUBLICADA'; a.publishedAt = nowISO(); }
          commit(['activities']); return { id: a.id, status: a.status };
        };
        svc.deleteDraft = function (id) {
          const a = mineOrFail(id); if (a.status !== 'RASCUNHO') fail('CONFLICT', 'Só é possível eliminar rascunhos.');
          db.activities = db.activities.filter(x => x.id !== id); commit(['activities']);
        };
        svc.submissions = function (activityId) {
          const a = mineOrFail(activityId);
          const students = db.enrollments.filter(e => e.classId === a.classId).map(e => byId(db.users, e.studentId)).filter(Boolean);
          return { activity: actRow(a), rows: students.map(u => { const s = subOf(a.id, u.id); const sent = s && s.status !== 'EM_CURSO'; return { studentId: u.id, studentName: u.name, key: sent ? (s.status === 'CORRIGIDA' ? 'corrigida' : 'por_corrigir') : 'sem_submissao', submissionId: sent ? s.id : null, autoScore: sent ? s.autoScore : null, finalScore: sent ? s.finalScore : null, submittedAt: sent ? s.submittedAt : null }; }).sort((x, y) => x.studentName.localeCompare(y.studentName)) };
        };
        svc.corrections = function () {
          const mine = myActs().map(a => a.id);
          const all = db.submissions.filter(s => s.status !== 'EM_CURSO' && mine.includes(s.activityId)).map(s => ({ submissionId: s.id, studentName: nameOf(s.studentId), activityTitle: byId(db.activities, s.activityId).title, submittedAt: s.submittedAt, status: s.status, autoScore: s.autoScore, finalScore: s.finalScore }));
          return { pending: all.filter(s => s.status === 'SUBMETIDA').sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)), done: all.filter(s => s.status === 'CORRIGIDA').sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)) };
        };
        svc.grade = function (subId, data) {
          const s = byId(db.submissions, subId); if (!s || s.status === 'EM_CURSO') fail('NOT_FOUND', 'Submissão não encontrada.');
          const a = byId(db.activities, s.activityId);
          if (a.teacherId !== me.id) fail('FORBIDDEN', 'Só o professor da atividade pode classificar esta submissão.');
          applyGrade(s, a, me.id, data, nowISO()); commit(['submissions']); return { status: s.status, finalScore: s.finalScore };
        };
        svc.performance = function () {
          return db.teaching.filter(t => t.teacherId === me.id).map(t => {
            const acts = myActs().filter(a => a.moduleId === t.moduleId && a.classId === t.classId).map(a => a.id);
            const g = db.submissions.filter(s => s.status === 'CORRIGIDA' && acts.includes(s.activityId));
            return { moduleName: moduleOf(t.moduleId).name, className: classOf(t.classId).name, corrigidas: g.length, media: g.length ? round1(g.reduce((n, s) => n + s.finalScore, 0) / g.length) : null };
          });
        };
      }

      /* ========================== ADMINISTRADOR ========================== */
      if (me.role === 'ADMIN') {
        const userRow = u => {
          const enr = db.enrollments.find(e => e.studentId === u.id);
          return { id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, className: enr ? classOf(enr.classId).name : null, modules: u.role === 'PROFESSOR' ? uniq(db.teaching.filter(t => t.teacherId === u.id).map(t => moduleOf(t.moduleId).name)) : [] };
        };
        svc.dashboard = function () {
          const st = stats();
          return { ...st, turmas: db.classes.length, modulos: db.modules.length, utilizadores: db.users.filter(u => u.active).length, cursosTop: db.courses.map(c => ({ name: c.name, turmas: db.classes.filter(x => x.courseId === c.id).length, alunos: db.enrollments.filter(e => classOf(e.classId).courseId === c.id).length })).sort((a, b) => b.alunos - a.alunos).slice(0, 5) };
        };
        svc.users = function (role) { return db.users.filter(u => !role || u.role === role).map(userRow).sort((a, b) => a.name.localeCompare(b.name)); };
        svc.createUser = async function (data) {
          const name = text(data && data.name, 'Nome', 3, 80);
          const email = String((data && data.email) || '').trim().toLowerCase();
          if (!validEmail(email)) fail('INVALID', 'Email inválido.');
          if (!['ALUNO', 'PROFESSOR', 'ADMIN'].includes(data.role)) fail('INVALID', 'Perfil inválido.');
          validPassword(data.password);
          if (db.users.some(u => u.email === email)) fail('CONFLICT', 'Já existe uma conta com este email.');
          const ph = await hashPassword(data.password);
          db.users.push({ id: nextId(db, 'u'), name, email, role: data.role, active: true, passwordHash: ph, createdAt: nowISO() });
          commit(['users']);
        };
        svc.setUserActive = function (id, active) {
          const u = byId(db.users, id); if (!u) fail('NOT_FOUND', 'Utilizador não encontrado.');
          if (u.id === me.id) fail('CONFLICT', 'Não podes desativar a tua própria conta.');
          u.active = !!active; commit(['users']);
        };
        svc.resetPassword = async function (id, password) {
          const u = byId(db.users, id); if (!u) fail('NOT_FOUND', 'Utilizador não encontrado.');
          validPassword(password); u.passwordHash = await hashPassword(password); commit(['users']);
        };
        svc.courses = function () { return db.courses.map(c => ({ id: c.id, name: c.name, area: c.area, description: c.description, turmas: db.classes.filter(x => x.courseId === c.id).length, modulos: db.modules.filter(m => m.courseId === c.id).length, alunos: db.enrollments.filter(e => classOf(e.classId).courseId === c.id).length })); };
        svc.createCourse = function (data) {
          const name = text(data && data.name, 'Nome do curso', 3, 100);
          if (db.courses.some(c => c.name.toLowerCase() === name.toLowerCase())) fail('CONFLICT', 'Já existe um curso com este nome.');
          const area = text(data.area, 'Área', 3, 80); const description = text(data.description, 'Descrição', 0, 400, { optional: true });
          db.courses.push({ id: nextId(db, 'c'), name, area, short: description.slice(0, 100), description, years: 3, photo: '' });
          commit(['structure']);
        };
        svc.classes = function () {
          return db.classes.map(c => ({ id: c.id, name: c.name, year: c.year, courseId: c.courseId, courseName: courseOfClass(c).name, students: db.enrollments.filter(e => e.classId === c.id).map(e => ({ id: e.studentId, name: nameOf(e.studentId) })), coordinator: (() => { const t = db.teaching.find(x => x.classId === c.id); return t ? nameOf(t.teacherId) : null; })() }));
        };
        svc.createClass = function (data) {
          if (!byId(db.courses, data && data.courseId)) fail('INVALID', 'Curso inválido.');
          const name = text(data.name, 'Nome da turma', 2, 20); const year = text(data.year, 'Ano letivo', 4, 12);
          if (db.classes.some(c => c.name.toLowerCase() === name.toLowerCase())) fail('CONFLICT', 'Já existe uma turma com este nome.');
          db.classes.push({ id: nextId(db, 't'), courseId: data.courseId, name, year }); commit(['structure']);
        };
        svc.modules = function () {
          return db.modules.map(m => ({ id: m.id, name: m.name, hours: m.hours, courseId: m.courseId, courseName: byId(db.courses, m.courseId).name, teachers: db.teaching.filter(t => t.moduleId === m.id).map(t => ({ teacherId: t.teacherId, teacherName: nameOf(t.teacherId), classId: t.classId, className: classOf(t.classId).name })) }));
        };
        svc.createModule = function (data) {
          if (!byId(db.courses, data && data.courseId)) fail('INVALID', 'Curso inválido.');
          const name = text(data.name, 'Nome do módulo', 3, 100); const hours = Number(data.hours);
          if (!Number.isInteger(hours) || hours < 1 || hours > 400) fail('INVALID', 'Horas inválidas (1 a 400).');
          db.modules.push({ id: nextId(db, 'm'), courseId: data.courseId, name, hours }); commit(['structure']);
        };
        svc.enroll = function (studentId, classId) {
          const u = byId(db.users, studentId); if (!u || u.role !== 'ALUNO') fail('INVALID', 'Aluno inválido.');
          if (!classOf(classId)) fail('INVALID', 'Turma inválida.');
          db.enrollments = db.enrollments.filter(e => e.studentId !== studentId);
          db.enrollments.push({ studentId, classId }); commit(['structure']);
        };
        svc.unenroll = function (studentId) { db.enrollments = db.enrollments.filter(e => e.studentId !== studentId); commit(['structure']); };
        svc.assignTeacher = function (teacherId, moduleId, classId) {
          const u = byId(db.users, teacherId); if (!u || u.role !== 'PROFESSOR') fail('INVALID', 'Professor inválido.');
          const m = moduleOf(moduleId), c = classOf(classId); if (!m || !c) fail('INVALID', 'Módulo ou turma inválidos.');
          if (m.courseId !== c.courseId) fail('INVALID', 'O módulo não pertence ao curso desta turma.');
          if (teachesIt(teacherId, moduleId, classId)) fail('CONFLICT', 'Esta associação já existe.');
          db.teaching.push({ teacherId, moduleId, classId }); commit(['structure']);
        };
        svc.unassignTeacher = function (teacherId, moduleId, classId) {
          if (db.activities.some(a => a.teacherId === teacherId && a.moduleId === moduleId && a.classId === classId)) fail('CONFLICT', 'O professor já tem atividades neste módulo/turma.');
          db.teaching = db.teaching.filter(t => !(t.teacherId === teacherId && t.moduleId === moduleId && t.classId === classId)); commit(['structure']);
        };
        svc.eventsAll = function () { return db.events.slice().sort((a, b) => a.date.localeCompare(b.date)).map(e => ({ ...e, courseName: e.courseId ? byId(db.courses, e.courseId).name : 'Toda a escola' })); };
        svc.saveEvent = function (data) {
          if (!data) fail('INVALID', 'Dados em falta.');
          const title = text(data.title, 'Título', 3, 120);
          if (!isDate(data.date)) fail('INVALID', 'Indica uma data válida.');
          if (data.dateEnd && (!isDate(data.dateEnd) || data.dateEnd < data.date)) fail('INVALID', 'A data de fim não pode ser anterior à data de início.');
          if (data.time && !isTime(data.time)) fail('INVALID', 'Hora inválida.');
          if (data.courseId && !byId(db.courses, data.courseId)) fail('INVALID', 'Ramo inválido.');
          let image = typeof data.image === 'string' ? data.image : '';
          if (image.startsWith('data:')) {
            const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image);
            if (!m || Math.floor(m[2].length * 3 / 4) > MAX_FILE_BYTES) fail('INVALID', `Imagem inválida ou acima de ${MAX_FILE_BYTES / 1024} KB.`);
          } else if (image && !/^img\/[\w\-/]+\.(jpg|png|webp)$/.test(image)) image = '';
          const rec = { title, category: text(data.category, 'Categoria', 0, 60, { optional: true }) || 'Evento', description: text(data.description, 'Descrição', 0, 300, { optional: true }), date: data.date, dateEnd: data.dateEnd || '', time: data.time || '', timeNote: '', place: text(data.place, 'Local', 0, 100, { optional: true }), audience: text(data.audience, 'Público-alvo', 0, 120, { optional: true }) || 'Toda a comunidade escolar', courseId: data.courseId || null, image, published: data.published !== false };
          if (data.id) { const e = byId(db.events, data.id); if (!e) fail('NOT_FOUND', 'Evento não encontrado.'); Object.assign(e, rec); }
          else db.events.push({ id: nextId(db, 'e'), ...rec });
          commit(['events']);
        };
        svc.toggleEvent = function (id) { const e = byId(db.events, id); if (!e) fail('NOT_FOUND', 'Evento não encontrado.'); e.published = !e.published; commit(['events']); };
        svc.deleteEvent = function (id) { if (!byId(db.events, id)) fail('NOT_FOUND', 'Evento não encontrado.'); db.events = db.events.filter(e => e.id !== id); commit(['events']); };
      }
      return svc;
    }

    // Substitui a cache local de eventos (usado quando os eventos passam a vir
    // de uma base de dados partilhada — ver public/js/supabase-client.js —
    // para que publicHome()/publishedEvents() continuem a funcionar sem
    // alterações). Não mexe em mais nada do documento.
    function setEvents(events) { db.events = events; commit(['events']); }
    // Substitui os cursos (com módulos já incluídos) e as 5 estatísticas públicas
    // por uma versão vinda do Supabase — mesma ideia do setEvents() acima.
    function setPublicHomeLive(coursesLive, liveStats) { db.coursesLive = coursesLive; db.liveStats = liveStats; commit(['courses', 'stats']); }
    // Substitui TODO o documento local por uma versão vinda do Supabase — usado
    // depois de autenticar a sério (ver public/js/supabase-client.js). Os
    // métodos as(userId)/publicHome()/etc. continuam a funcionar sem alterações,
    // porque continuam só a ler de `db`; só a origem dos dados muda.
    function replaceDb(partial) { Object.assign(db, partial); commit(['*']); }

    return { init, wasMigrated: () => migrated, resetDemo, subscribe, reload, session, login, logout, register, publicHome, stats, as, publishedEvents: () => publishedEvents().map(e => ({ ...e })), setEvents, setPublicHomeLive, replaceDb, _db: () => db };
  }

  return {
    createStore, AppError, memoryStorage,
    core: { nextId, normalizeAnswers, tally, scoreOf, applySubmission, applyGrade, isoDate, addDays, hashPassword, verifyPassword },
    limits: { MAX_FILE_BYTES, MAX_FILES },
  };
});
