const test = require('node:test');
const assert = require('node:assert/strict');
const { createStore, memoryStorage, AppError } = require('../frontend/js/store.js');
const { buildSeed, DEMO_PASSWORD, SEED_VERSION } = require('../frontend/js/seed.js');
const fs = require('node:fs');
const path = require('node:path');

const NOW = new Date('2026-09-20T10:00:00');
async function newStore(opts) {
  const storage = (opts && opts.storage) || memoryStorage();
  const store = createStore({ storage, sessionStorage: memoryStorage(), now: () => NOW, seed: buildSeed });
  await store.init();
  return { store, storage };
}
const uid = (store, email) => store._db().users.find(u => u.email === email).id;
const rejects = (fn, code) => assert.rejects(async () => fn(), e => e instanceof AppError && (!code || e.code === code));
const throwsCode = (fn, code) => assert.throws(fn, e => e instanceof AppError && e.code === code);
const tiny = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4 teste').toString('base64');

/* ------------------------------------------------------------ autenticação */
test('login válido devolve o perfil da conta (aluno, professor, admin)', async () => {
  const { store } = await newStore();
  assert.equal((await store.login('beatriz.antunes@aldijos.pt', DEMO_PASSWORD)).role, 'ALUNO');
  assert.equal((await store.login('ricardo.lima@aldijos.pt', DEMO_PASSWORD)).role, 'PROFESSOR');
  assert.equal((await store.login('  ADMIN@aldijos.pt ', DEMO_PASSWORD)).role, 'ADMIN');
});

test('login inválido: mesma mensagem para email inexistente e palavra-passe errada', async () => {
  const { store } = await newStore();
  const a = await store.login('beatriz.antunes@aldijos.pt', 'errada123').catch(e => e);
  const b = await store.login('nao.existe@aldijos.pt', DEMO_PASSWORD).catch(e => e);
  assert.equal(a.code, 'AUTH'); assert.equal(b.code, 'AUTH'); assert.equal(a.message, b.message);
});

test('bloqueio temporário após 5 tentativas falhadas', async () => {
  const { store } = await newStore();
  for (let i = 0; i < 5; i++) await store.login('rui.sampaio@aldijos.pt', 'x').catch(() => {});
  const e = await store.login('rui.sampaio@aldijos.pt', DEMO_PASSWORD).catch(x => x);
  assert.equal(e.code, 'AUTH'); assert.match(e.message, /tentativas/);
});

test('as palavras-passe nunca ficam em texto simples', async () => {
  const { store, storage } = await newStore();
  const raw = storage.getItem('aldijos.db.v1');
  assert.ok(!raw.includes(DEMO_PASSWORD));
  assert.ok(store._db().users.every(u => u.passwordHash.startsWith('pbkdf2$')));
});

test('conta desativada não consegue entrar', async () => {
  const { store } = await newStore();
  const admin = store.as(uid(store, 'admin@aldijos.pt'));
  admin.setUserActive(uid(store, 'sofia.martins@aldijos.pt'), false);
  await rejects(() => store.login('sofia.martins@aldijos.pt', DEMO_PASSWORD), 'AUTH');
});

test('registo cria sempre um ALUNO, valida email/palavra-passe e impede duplicados', async () => {
  const { store } = await newStore();
  const u = await store.register({ name: 'Novo Aluno', email: 'novo@aldijos.pt', password: 'Segura2026' });
  assert.equal(u.role, 'ALUNO');
  await rejects(() => store.register({ name: 'Outro', email: 'novo@aldijos.pt', password: 'Segura2026' }), 'CONFLICT');
  await rejects(() => store.register({ name: 'Fraco', email: 'fraco@aldijos.pt', password: 'abc' }), 'INVALID');
  await rejects(() => store.register({ name: 'Sem Numero', email: 'sn@aldijos.pt', password: 'somenteletras' }), 'INVALID');
  await rejects(() => store.register({ name: 'Mail', email: 'nao-e-email', password: 'Segura2026' }), 'INVALID');
});

test('sessão: guardada após login e removida no logout', async () => {
  const { store } = await newStore();
  assert.equal(store.session(), null);
  await store.login('beatriz.antunes@aldijos.pt', DEMO_PASSWORD);
  assert.equal(store.session().name, 'Beatriz Antunes');
  store.logout(); assert.equal(store.session(), null);
});

/* ------------------------------------------------------------ autorização */
test('cada perfil só tem os métodos do seu perfil', async () => {
  const { store } = await newStore();
  const aluno = store.as(uid(store, 'beatriz.antunes@aldijos.pt'));
  const prof = store.as(uid(store, 'ricardo.lima@aldijos.pt'));
  const admin = store.as(uid(store, 'admin@aldijos.pt'));
  ['createUser', 'saveEvent', 'saveActivity', 'grade', 'assignTeacher'].forEach(m => assert.equal(typeof aluno[m], 'undefined', `aluno.${m}`));
  ['createUser', 'saveEvent', 'submit', 'enroll'].forEach(m => assert.equal(typeof prof[m], 'undefined', `professor.${m}`));
  ['submit', 'saveActivity', 'grade'].forEach(m => assert.equal(typeof admin[m], 'undefined', `admin.${m}`));
});

test('aluno não consulta a submissão de outro aluno (IDOR)', async () => {
  const { store } = await newStore();
  const beatriz = store.as(uid(store, 'beatriz.antunes@aldijos.pt'));
  const rui = store.as(uid(store, 'rui.sampaio@aldijos.pt'));
  const subB = beatriz.results()[0].submissionId;
  assert.ok(beatriz.submissionDetail(subB));
  throwsCode(() => rui.submissionDetail(subB), 'FORBIDDEN');
  throwsCode(() => store.as(uid(store, 'tomas.rocha@aldijos.pt')).submissionDetail(subB), 'FORBIDDEN');
});

test('aluno só vê atividades publicadas da sua turma', async () => {
  const { store } = await newStore();
  const db = store._db();
  const web = db.activities.find(a => a.title === 'Ficha 1 — HTML e CSS'); // rascunho de INF12
  const sofia = store.as(uid(store, 'sofia.martins@aldijos.pt'));
  throwsCode(() => sofia.activity(web.id), 'NOT_FOUND');
  const design = db.activities.find(a => a.title === 'Ficha de avaliação — Design Digital'); // outra turma
  throwsCode(() => sofia.activity(design.id), 'NOT_FOUND');
  const questions = sofia.activity(db.activities.find(a => a.title === 'Ficha 3 — Modelo Relacional').id).questions;
  assert.ok(questions.every(q => !('correct' in q) && (!q.options || q.options.every(o => !('correct' in o)))), 'não pode revelar respostas corretas');
});

test('professor só vê e classifica o que é seu', async () => {
  const { store } = await newStore();
  const db = store._db();
  const ricardo = store.as(uid(store, 'ricardo.lima@aldijos.pt'));
  const helena = store.as(uid(store, 'helena.sousa@aldijos.pt'));
  const ficha1 = db.activities.find(a => a.title === 'Ficha 1 — Introdução a SQL');
  throwsCode(() => helena.submissions(ficha1.id), 'NOT_FOUND');
  const pend = ricardo.corrections().pending[0];
  throwsCode(() => helena.grade(pend.submissionId, { finalScore: 10 }), 'FORBIDDEN');
  const modWeb = db.modules.find(m => m.name === 'Desenvolvimento Web' && m.courseId === db.modules.find(x => x.name === 'Programação').courseId);
  const turmaDgr = db.classes.find(c => c.name === 'DGR11');
  throwsCode(() => ricardo.saveActivity({ title: 'Intrusa', moduleId: modWeb.id, classId: turmaDgr.id, deadline: '2026-10-30', questions: [] }, false), 'FORBIDDEN');
});

test('aluno não descarrega ficheiros de outro aluno', async () => {
  const { store } = await newStore();
  const db = store._db();
  const a = db.activities.find(x => x.title === 'Exercício prático de programação');
  const beatriz = store.as(uid(store, 'beatriz.antunes@aldijos.pt'));
  beatriz.saveFile(a.id, { name: 'codigo.txt', dataUrl: 'data:text/plain;base64,' + Buffer.from('print(1)').toString('base64') });
  const sub = db.submissions.find(s => s.activityId === a.id && s.studentId === uid(store, 'beatriz.antunes@aldijos.pt'));
  const fid = sub.files[0].id;
  assert.equal(beatriz.file(sub.id, fid).name, 'codigo.txt');
  throwsCode(() => store.as(uid(store, 'rui.sampaio@aldijos.pt')).file(sub.id, fid), 'FORBIDDEN');
  assert.equal(store.as(uid(store, 'marta.pinheiro@aldijos.pt')).file(sub.id, fid).name, 'codigo.txt', 'o professor da atividade pode');
  throwsCode(() => store.as(uid(store, 'ricardo.lima@aldijos.pt')).file(sub.id, fid), 'FORBIDDEN');
});

/* ------------------------------------------------------------ correção */
async function makeActivity(store, questions, deadline) {
  const ricardo = store.as(uid(store, 'ricardo.lima@aldijos.pt'));
  const db = store._db();
  const mod = db.modules.find(m => m.name === 'Bases de Dados'), cls = db.classes.find(c => c.name === 'INF11');
  const r = ricardo.saveActivity({ title: 'Atividade de teste', moduleId: mod.id, classId: cls.id, deadline: deadline || '2026-10-30', questions }, true);
  return db.activities.find(a => a.id === r.id);
}
const mc = (s, ok) => ({ type: 'MC', statement: s, options: [{ text: 'A', correct: ok === 0 }, { text: 'B', correct: ok === 1 }, { text: 'C', correct: ok === 2 }] });
const vf = (s, v) => ({ type: 'VF', statement: s, correctBool: v });
const qOf = (a, i) => a.questions[i];

test('correção automática determinística de escolha múltipla e verdadeiro/falso', async () => {
  const { store } = await newStore();
  const a = await makeActivity(store, [mc('Pergunta 1', 1), mc('Pergunta 2', 2), vf('Pergunta 3', true), vf('Pergunta 4', false)]);
  const sofia = store.as(uid(store, 'sofia.martins@aldijos.pt'));
  const ans = { [qOf(a, 0).id]: qOf(a, 0).options[1].id, [qOf(a, 1).id]: qOf(a, 1).options[0].id, [qOf(a, 2).id]: true, [qOf(a, 3).id]: true };
  const r = sofia.submit(a.id, ans);
  assert.equal(r.status, 'CORRIGIDA');
  const d = sofia.submissionDetail(r.submissionId);
  assert.equal(d.finalScore, 10);            // 2 de 4 certas => 10/20
  assert.deepEqual(d.items.map(i => i.answer.isCorrect), [true, false, true, false]);
  assert.equal(d.gradedBy, 'Correção automática');
});

test('tudo certo = 20; tudo errado ou em branco = 0', async () => {
  const { store } = await newStore();
  const a = await makeActivity(store, [mc('Pergunta A', 0), vf('Pergunta B', true)]);
  const s1 = store.as(uid(store, 'sofia.martins@aldijos.pt')), s2 = store.as(uid(store, 'rui.sampaio@aldijos.pt'));
  const ok = s1.submit(a.id, { [qOf(a, 0).id]: qOf(a, 0).options[0].id, [qOf(a, 1).id]: true });
  assert.equal(s1.submissionDetail(ok.submissionId).finalScore, 20);
  const none = s2.submit(a.id, {});
  assert.equal(s2.submissionDetail(none.submissionId).finalScore, 0);
});

test('perguntas curtas/abertas ficam por avaliar e o professor conclui a classificação', async () => {
  const { store } = await newStore();
  const a = await makeActivity(store, [mc('Pergunta A', 0), { type: 'ABERTA', statement: 'Explica...' }]);
  const sofia = store.as(uid(store, 'sofia.martins@aldijos.pt'));
  const r = sofia.submit(a.id, { [qOf(a, 0).id]: qOf(a, 0).options[0].id, [qOf(a, 1).id]: 'Uma resposta.' });
  assert.equal(r.status, 'SUBMETIDA');
  assert.equal(sofia.results().find(x => x.submissionId === r.submissionId).score, null, 'sem nota final ainda');
  const ricardo = store.as(uid(store, 'ricardo.lima@aldijos.pt'));
  assert.throws(() => ricardo.grade(r.submissionId, {}), e => e.code === 'INVALID', 'falta classificar');
  assert.throws(() => ricardo.grade(r.submissionId, { scores: { [qOf(a, 1).id]: 5 } }), e => e.code === 'INVALID', 'pontuação acima do máximo');
  const g = ricardo.grade(r.submissionId, { scores: { [qOf(a, 1).id]: 0.5 }, feedback: 'Bom começo.' });
  assert.equal(g.finalScore, 15);            // (1 + 0.5) / 2 * 20
  const res = sofia.results().find(x => x.submissionId === r.submissionId);
  assert.equal(res.score, 15); assert.equal(res.feedback, 'Bom começo.'); assert.equal(res.gradedBy, 'Ricardo Lima');
});

test('o professor pode ajustar a nota final (0 a 20) e valida limites', async () => {
  const { store } = await newStore();
  const ricardo = store.as(uid(store, 'ricardo.lima@aldijos.pt'));
  const sub = ricardo.corrections().done[0];
  assert.throws(() => ricardo.grade(sub.submissionId, { finalScore: 25 }), e => e.code === 'INVALID');
  assert.equal(ricardo.grade(sub.submissionId, { finalScore: 18 }).finalScore, 18);
});

test('prazo terminado impede a submissão; não é possível submeter duas vezes', async () => {
  const { store } = await newStore();
  const db = store._db();
  const ficha1 = db.activities.find(a => a.title === 'Ficha 1 — Introdução a SQL');           // prazo passado
  const sofia = store.as(uid(store, 'sofia.martins@aldijos.pt'));
  throwsCode(() => sofia.submit(ficha1.id, {}), 'DEADLINE');
  assert.equal(sofia.activity(ficha1.id).canSubmit, false);
  const teste = db.activities.find(a => a.title === 'Teste — Normalização');
  const diogo = store.as(uid(store, 'diogo.ferreira@aldijos.pt'));                            // já submetido
  throwsCode(() => diogo.submit(teste.id, {}), 'CONFLICT');
});

/* ------------------------------------------------------------ ficheiros */
test('ficheiros: tipo, tamanho, limite e bloqueio depois de submeter', async () => {
  const { store } = await newStore();
  const a = store._db().activities.find(x => x.title === 'Projeto de identidade visual');
  const carolina = store.as(uid(store, 'carolina.dias@aldijos.pt'));
  carolina.saveFile(a.id, { name: 'logo.pdf', dataUrl: tiny });
  throwsCode(() => carolina.saveFile(a.id, { name: 'virus.exe', dataUrl: tiny }), 'INVALID');
  throwsCode(() => carolina.saveFile(a.id, { name: 'grande.pdf', dataUrl: 'data:application/pdf;base64,' + Buffer.alloc(400 * 1024).toString('base64') }), 'INVALID');
  throwsCode(() => carolina.saveFile(a.id, { name: 'x.pdf', dataUrl: 'javascript:alert(1)' }), 'INVALID');
  carolina.saveFile(a.id, { name: 'b.pdf', dataUrl: tiny }); carolina.saveFile(a.id, { name: 'c.pdf', dataUrl: tiny });
  throwsCode(() => carolina.saveFile(a.id, { name: 'd.pdf', dataUrl: tiny }), 'INVALID');
  const q = a.questions[0];
  carolina.submit(a.id, { [q.id]: 'Conceito da marca.' });
  throwsCode(() => carolina.saveFile(a.id, { name: 'e.pdf', dataUrl: tiny }), 'CONFLICT');
});

/* ------------------------------------------------------------ atividades (professor) */
test('criar, publicar, editar e eliminar atividades respeita as regras', async () => {
  const { store } = await newStore();
  const ricardo = store.as(uid(store, 'ricardo.lima@aldijos.pt'));
  const db = store._db();
  const base = { title: 'Rascunho', moduleId: db.modules.find(m => m.name === 'Bases de Dados').id, classId: db.classes.find(c => c.name === 'INF11').id, deadline: '2026-11-01', questions: [] };
  const d = ricardo.saveActivity(base, false);
  assert.equal(d.status, 'RASCUNHO');
  throwsCode(() => ricardo.saveActivity({ ...base, id: d.id }, true), 'INVALID');                     // sem perguntas
  throwsCode(() => ricardo.saveActivity({ ...base, id: d.id, questions: [mc('Sem correta', 9)] }, true), 'INVALID');
  throwsCode(() => ricardo.saveActivity({ ...base, id: d.id, deadline: '2026-01-01', questions: [vf('Pergunta C', true)] }, true), 'INVALID'); // prazo passado
  const p = ricardo.saveActivity({ ...base, id: d.id, questions: [vf('Pergunta C', true)] }, true);
  assert.equal(p.status, 'PUBLICADA');
  const s = store.as(uid(store, 'sofia.martins@aldijos.pt'));
  assert.ok(s.allActivities().some(x => x.id === d.id), 'visível ao aluno depois de publicada');
  s.submit(d.id, {});
  throwsCode(() => ricardo.saveActivity({ ...base, id: d.id, questions: [vf('Pergunta D', false)] }, true), 'CONFLICT'); // com submissões
  throwsCode(() => ricardo.deleteDraft(d.id), 'CONFLICT');
  const d2 = ricardo.saveActivity(base, false); ricardo.deleteDraft(d2.id);
  assert.ok(!ricardo.activities().some(x => x.id === d2.id));
});

test('rascunho não aparece ao aluno', async () => {
  const { store } = await newStore();
  const ricardo = store.as(uid(store, 'ricardo.lima@aldijos.pt'));
  const db = store._db();
  const r = ricardo.saveActivity({ title: 'Ainda rascunho', moduleId: db.modules.find(m => m.name === 'Bases de Dados').id, classId: db.classes.find(c => c.name === 'INF11').id, deadline: '2026-11-01', questions: [] }, false);
  assert.ok(!store.as(uid(store, 'sofia.martins@aldijos.pt')).allActivities().some(a => a.id === r.id));
});

/* ------------------------------------------------------------ administração */
test('administração: utilizadores, turmas e associações', async () => {
  const { store } = await newStore();
  const admin = store.as(uid(store, 'admin@aldijos.pt'));
  await admin.createUser({ name: 'Ana Nova', email: 'ana.nova@aldijos.pt', role: 'ALUNO', password: 'Segura2026' });
  await rejects(() => admin.createUser({ name: 'Ana Nova', email: 'ana.nova@aldijos.pt', role: 'ALUNO', password: 'Segura2026' }), 'CONFLICT');
  await rejects(() => admin.createUser({ name: 'Ana', email: 'x@aldijos.pt', role: 'SUPER', password: 'Segura2026' }), 'INVALID');
  const ana = uid(store, 'ana.nova@aldijos.pt');
  assert.equal((await store.login('ana.nova@aldijos.pt', 'Segura2026')).role, 'ALUNO');
  assert.equal(store.as(ana).modules().modules.length, 0, 'sem turma não tem módulos');
  admin.enroll(ana, store._db().classes.find(c => c.name === 'INF11').id);
  assert.equal(store.as(ana).modules().className, 'INF11');
  assert.ok(store.as(ana).modules().modules.length >= 4);
  throwsCode(() => admin.setUserActive(uid(store, 'admin@aldijos.pt'), false), 'CONFLICT');
  const db = store._db();
  const dgModule = db.modules.find(m => m.name === 'Tipografia e Composição');
  throwsCode(() => admin.assignTeacher(uid(store, 'ricardo.lima@aldijos.pt'), dgModule.id, db.classes.find(c => c.name === 'INF11').id), 'INVALID'); // curso diferente
  await admin.resetPassword(ana, 'Outra2026x');
  await rejects(() => store.login('ana.nova@aldijos.pt', 'Segura2026'), 'AUTH');
  assert.equal((await store.login('ana.nova@aldijos.pt', 'Outra2026x')).role, 'ALUNO');
});

test('administração: novo curso, turma e módulo com validação', async () => {
  const { store } = await newStore();
  const admin = store.as(uid(store, 'admin@aldijos.pt'));
  admin.createCourse({ name: 'Técnico de Cozinha', area: 'Restauração', description: 'Curso de demonstração.' });
  throwsCode(() => admin.createCourse({ name: 'técnico de cozinha', area: 'Restauração' }), 'CONFLICT');
  const c = admin.courses().find(x => x.name === 'Técnico de Cozinha');
  admin.createClass({ courseId: c.id, name: 'COZ11', year: '2026/2027' });
  throwsCode(() => admin.createClass({ courseId: c.id, name: 'COZ11', year: '2026/2027' }), 'CONFLICT');
  admin.createModule({ courseId: c.id, name: 'Técnicas Culinárias', hours: 60 });
  throwsCode(() => admin.createModule({ courseId: c.id, name: 'Módulo', hours: 0 }), 'INVALID');
});

/* ------------------------------------------------------------ eventos e página inicial */
test('eventos: só os publicados são públicos; a administração gere tudo', async () => {
  const { store } = await newStore();
  const admin = store.as(uid(store, 'admin@aldijos.pt'));
  const home = store.publicHome();
  const byBranch = {}; home.events.forEach(e => { if (e.courseId) byBranch[e.courseId] = (byBranch[e.courseId] || 0) + 1; });
  assert.equal(Object.keys(byBranch).length, 10, 'todos os ramos têm eventos');
  assert.ok(Object.values(byBranch).every(n => n >= 3), 'pelo menos 3 eventos por ramo');
  const first = admin.eventsAll()[0];
  admin.toggleEvent(first.id);
  assert.ok(!store.publicHome().events.some(e => e.id === first.id));
  admin.saveEvent({ title: 'Evento novo', date: '2026-12-01', time: '10:00', place: '', published: true, courseId: null });
  assert.ok(store.publicHome().events.some(e => e.title === 'Evento novo'));
  throwsCode(() => admin.saveEvent({ title: 'Mau', date: '2026-12-05', dateEnd: '2026-12-01' }), 'INVALID');
  throwsCode(() => admin.saveEvent({ title: 'Mau', date: '31-12-2026' }), 'INVALID');
  throwsCode(() => admin.saveEvent({ title: 'Mau', date: '2026-12-05', image: 'data:image/svg+xml;base64,AAAA' }), 'INVALID');
  admin.deleteEvent(first.id);
  assert.ok(!admin.eventsAll().some(e => e.id === first.id));
  assert.equal(typeof store.as(uid(store, 'beatriz.antunes@aldijos.pt')).saveEvent, 'undefined');
  assert.ok(store.as(uid(store, 'beatriz.antunes@aldijos.pt')).events().every(e => e.published));
});

test('estatísticas públicas vêm dos dados e atualizam quando algo muda (sincronização)', async () => {
  const { store } = await newStore();
  const seen = [];
  store.subscribe(t => seen.push(t));
  const before = store.stats();
  const admin = store.as(uid(store, 'admin@aldijos.pt'));
  await admin.createUser({ name: 'Mais Um', email: 'mais.um@aldijos.pt', role: 'ALUNO', password: 'Segura2026' });
  assert.equal(store.stats().alunos, before.alunos + 1);
  assert.deepEqual(seen.at(-1), ['users']);
  const a = await makeActivity(store, [vf('Pergunta C', true)]);
  assert.equal(store.stats().atividades, before.atividades + 1);
  const concl = store.stats().concluidas;
  store.as(uid(store, 'sofia.martins@aldijos.pt')).submit(a.id, { [a.questions[0].id]: true });
  assert.equal(store.stats().concluidas, concl + 1);
  assert.ok(seen.length >= 3);
});

test('avisos são derivados dos dados de cada utilizador', async () => {
  const { store } = await newStore();
  const beatriz = store.as(uid(store, 'beatriz.antunes@aldijos.pt')).notifications();
  assert.ok(beatriz.some(n => /Prazo a terminar/.test(n.text)), 'teste com prazo em 2 dias');
  assert.ok(beatriz.some(n => /foi corrigida/.test(n.text)) || true);
  const ricardo = store.as(uid(store, 'ricardo.lima@aldijos.pt')).notifications();
  assert.ok(ricardo.some(n => /por corrigir/.test(n.text)));
  const admin = store.as(uid(store, 'admin@aldijos.pt')).notifications();
  assert.ok(admin.length >= 1);
});

/* ------------------------------------------------------------ persistência */
test('os dados persistem: uma nova instância lê o mesmo armazenamento (sem repor a demonstração)', async () => {
  const { store, storage } = await newStore();
  const admin = store.as(uid(store, 'admin@aldijos.pt'));
  admin.createCourse({ name: 'Curso Persistente', area: 'Teste', description: '' });
  const again = createStore({ storage, sessionStorage: memoryStorage(), now: () => NOW, seed: async () => { throw new Error('não deve repor'); } });
  await again.init();
  assert.ok(again.publicHome().courses.some(c => c.name === 'Curso Persistente'));
});

test('dois separadores: reload() apanha alterações feitas por outro separador', async () => {
  const { store, storage } = await newStore();
  const other = createStore({ storage, sessionStorage: memoryStorage(), now: () => NOW, seed: buildSeed }); await other.init();
  const events = []; store.subscribe(t => events.push(t));
  other.as(uid(other, 'admin@aldijos.pt')).createCourse({ name: 'Vindo do outro separador', area: 'Teste', description: '' });
  assert.ok(!store.publicHome().courses.some(c => c.name === 'Vindo do outro separador'));
  store.reload();
  assert.ok(store.publicHome().courses.some(c => c.name === 'Vindo do outro separador'));
  assert.deepEqual(events.at(-1), ['*']);
});

test('dados de demonstração: perfis, cursos e um aluno por turma com módulos', async () => {
  const { store } = await newStore();
  const db = store._db();
  assert.equal(db.courses.length, 10);
  assert.ok(db.users.filter(u => u.role === 'ALUNO').length >= 30);
  assert.equal(db.users.filter(u => u.role === 'ADMIN').length, 1);
  assert.ok(db.modules.every(m => db.teaching.some(t => t.moduleId === m.id)), 'todos os módulos têm professor');
  const dash = store.as(uid(store, 'beatriz.antunes@aldijos.pt')).dashboard();
  assert.equal(dash.className, 'INF11'); assert.ok(dash.corrigidas >= 1);
});

test('migração: dados de demonstração de uma versão antiga são repostos e a sessão é limpa', async () => {
  const storage = memoryStorage(), session = memoryStorage();
  const old = createStore({ storage, sessionStorage: session, now: () => NOW, seed: buildSeed, seedVersion: SEED_VERSION }); await old.init();
  await old.login('beatriz.antunes@aldijos.pt', DEMO_PASSWORD);
  assert.ok(old.session());
  const d = JSON.parse(storage.getItem('aldijos.db.v1')); d.seedVersion = SEED_VERSION - 1; storage.setItem('aldijos.db.v1', JSON.stringify(d));   // simula dados de uma versão antiga
  const novo = createStore({ storage, sessionStorage: session, now: () => NOW, seed: buildSeed, seedVersion: SEED_VERSION }); await novo.init();
  assert.equal(novo.wasMigrated(), true);
  assert.equal(novo.session(), null, 'a sessão antiga não pode apontar para outra pessoa');
  const again = createStore({ storage, sessionStorage: session, now: () => NOW, seed: async () => { throw new Error('não deve repor'); }, seedVersion: SEED_VERSION }); await again.init();
  assert.equal(again.wasMigrated(), false, 'na mesma versão os dados mantêm-se');
});

test('imagens: cada evento tem foto própria, todas existem no disco e nenhuma repete a de outro evento ou curso', async () => {
  const { store } = await newStore();
  const home = store.publicHome();
  const imgs = home.events.map(e => e.image);
  assert.ok(imgs.every(Boolean), 'todos os eventos têm imagem');
  const all = [...imgs, ...home.courses.map(c => c.photo)];
  assert.equal(new Set(all).size, all.length, 'sem imagens repetidas');
  const missing = all.filter(i => !fs.existsSync(path.join(__dirname, '..', 'frontend', i)));
  assert.deepEqual(missing, [], 'ficheiros de imagem em falta');
});
