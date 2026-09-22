/* Aldijos — área do professor */
const round1 = n => Math.round(n * 10) / 10;

PAGES.PROFESSOR.dashboard = () => {
  const d = App.svc.dashboard();
  return `<div class="page-head"><div><h1>Olá, ${esc(firstName(App.user.name))}</h1><p>${d.turmas} turma${d.turmas === 1 ? '' : 's'} · ${d.alunos} aluno${d.alunos === 1 ? '' : 's'} acompanhado${d.alunos === 1 ? '' : 's'}</p></div>
    <button class="btn btn-primary" data-action="nav" data-page="criar">+ Criar atividade</button></div>
  <div class="stat-row">
    <div><div class="n">${d.publicadas}</div><div class="l">Publicadas</div></div><div><div class="n">${d.rascunhos}</div><div class="l">Rascunhos</div></div>
    <div><div class="n">${d.porCorrigir}</div><div class="l">Por corrigir</div></div><div><div class="n">${d.media == null ? '—' : d.media}</div><div class="l">Média das classificações</div></div></div>
  ${noticeSection()}
  <div class="section-title">Submissões recentes</div>
  ${d.recent.length ? `<div class="list">${d.recent.map(s => `<div class="list-row"><div class="row-main"><div class="row-title"><button data-action="nav" data-page="corrigir" data-id="${s.submissionId}">${esc(s.studentName)}</button></div>
    <div class="row-sub">${esc(s.activityTitle)} · ${esc(fmtDataHora(s.submittedAt))}</div></div>${statusText(s.status === 'CORRIGIDA' ? 'corrigida' : 'submetida', s.status === 'CORRIGIDA' ? s.score : null)}</div>`).join('')}</div>` : emptyBox('Ainda não existem submissões.')}`;
};
PAGES.PROFESSOR.turmas = () => {
  const l = App.svc.classes();
  return `<div class="page-head"><div><h1>Turmas</h1><p>As turmas em que lecionas.</p></div></div>
  ${l.length ? `<div class="list">${l.map(c => `<div class="list-row" style="align-items:flex-start;"><div class="row-main"><div class="row-title">${esc(c.name)} · ${esc(c.courseName)}</div>
    <div class="row-sub">${esc(c.modules.join(' · '))}</div>
    <details style="margin-top:6px;"><summary class="helper" style="cursor:pointer;">${c.students.length} aluno${c.students.length === 1 ? '' : 's'}</summary><div style="margin-top:6px; font-size:13px;">${c.students.length ? c.students.map(esc).join(' · ') : 'Sem alunos associados.'}</div></details></div></div>`).join('')}</div>`
    : emptyBox('Ainda não tens turmas atribuídas.', 'A administração tem de te associar a um módulo e a uma turma.')}`;
};
PAGES.PROFESSOR.modulos = () => {
  const l = App.svc.modules();
  return `<div class="page-head"><div><h1>Módulos</h1><p>Módulos que lecionas, por turma.</p></div></div>
  ${l.length ? `<div class="list">${l.map(m => `<div class="list-row"><div class="row-main"><div class="row-title">${esc(m.moduleName)}</div><div class="row-sub">Turma ${esc(m.className)} · ${m.hours}h · ${m.activities} atividade${m.activities === 1 ? '' : 's'}</div></div></div>`).join('')}</div>` : emptyBox('Ainda não tens módulos atribuídos.')}`;
};
PAGES.PROFESSOR.atividades = () => {
  const l = App.svc.activities();
  return `<div class="page-head"><div><h1>Atividades</h1></div><button class="btn btn-primary" data-action="nav" data-page="criar">+ Criar atividade</button></div>
  ${l.length ? `<div class="list">${l.map(a => `<div class="list-row"><div class="row-main"><div class="row-title"><button data-action="nav" data-page="submissoes" data-id="${a.id}">${esc(a.title)}</button></div>
    <div class="row-sub">${esc(a.moduleName)} · Turma ${esc(a.className)} · prazo ${esc(fmtData(a.deadline))} · ${a.questionCount} pergunta${a.questionCount === 1 ? '' : 's'}</div>
    <div class="row-actions" style="margin-top:4px; font-size:12.5px;">
      ${!a.temSubmissoes ? `<button class="btn-text" data-action="nav" data-page="criar" data-id="${a.id}">Editar</button>` : ''}
      ${a.estado === 'RASCUNHO' ? (App.confirm === 'del:' + a.id ? `<button class="btn-text danger" data-action="draft-delete" data-id="${a.id}">Confirmar eliminação</button><button class="btn-text muted" data-action="confirm-clear">Cancelar</button>` : `<button class="btn-text danger" data-action="draft-delete" data-id="${a.id}">Eliminar rascunho</button>`) : ''}</div></div>
    ${a.estado !== 'RASCUNHO' ? `<div class="row-side">${a.submissoes}/${a.total} submissões${a.porCorrigir ? ` · <b>${a.porCorrigir} por corrigir</b>` : ''}</div>` : ''}${statusText(a.estado)}</div>`).join('')}</div>`
    : emptyBox('Ainda não existem atividades publicadas.', 'Cria a primeira atividade para os teus alunos.')}`;
};
ACTIONS['confirm-clear'] = () => { App.confirm = null; renderMain(); };
ACTIONS['draft-delete'] = safe(async el => {
  if (App.confirm !== 'del:' + el.dataset.id) { App.confirm = 'del:' + el.dataset.id; return renderMain(); }
  App.confirm = null; App.svc.deleteDraft(el.dataset.id); toast('Rascunho eliminado.'); renderMain();
});

/* ---------- construtor de atividades ---------- */
const emptyQuestion = type => ({ type, statement: '', options: type === 'MC' ? [{ text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }] : undefined, correctBool: type === 'VF' ? null : undefined });
function newDraft(id) {
  if (id) {
    const e = App.svc.activityForEdit(id);
    return { _for: id, id, locked: e.locked, title: e.title, description: e.description, target: `${e.moduleId}|${e.classId}`, deadline: e.deadline, questions: e.questions.map(q => ({ ...q, options: q.options ? q.options.map(o => ({ ...o })) : undefined })) };
  }
  const d = new Date(); d.setDate(d.getDate() + 7); const p = n => String(n).padStart(2, '0');
  const first = App.svc.modules()[0];
  return { _for: 'new', title: '', description: '', target: first ? `${first.moduleId}|${first.classId}` : '', deadline: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, questions: [emptyQuestion('MC')] };
}
function syncDraft() {
  const d = App.draft; if (!d || !$('#c-title')) return;
  d.title = $('#c-title').value; d.description = $('#c-desc').value; d.target = $('#c-target').value; d.deadline = $('#c-deadline').value;
  d.questions.forEach((q, i) => {
    const s = $(`[data-qs="${i}"]`); if (s) q.statement = s.value;
    if (q.type === 'MC') q.options.forEach((o, j) => { const t = $(`[data-qo="${i}-${j}"]`); if (t) o.text = t.value; });
  });
}
function questionBuilder(q, i) {
  return `<div class="qblock"><div class="qblock-head"><span style="font-weight:800; font-size:13px;">Pergunta ${i + 1}</span>
    <div class="row-actions"><select data-action="q-type" data-i="${i}" style="width:auto; font-size:12px; padding:5px 7px;" aria-label="Tipo da pergunta ${i + 1}">
      ${[['MC', 'Escolha múltipla'], ['VF', 'Verdadeiro/Falso'], ['CURTA', 'Resposta curta'], ['ABERTA', 'Resposta aberta']].map(([v, l]) => `<option value="${v}" ${q.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <button class="btn-text danger" data-action="q-remove" data-i="${i}">Remover</button></div></div>
    <div class="field" style="margin-bottom:10px;"><input type="text" data-qs="${i}" maxlength="500" placeholder="Enunciado da pergunta" value="${esc(q.statement)}" aria-label="Enunciado da pergunta ${i + 1}"></div>
    ${q.type === 'MC' ? q.options.map((o, j) => `<div class="option-row"><input type="radio" name="correct-${i}" data-action="q-correct" data-i="${i}" data-j="${j}" ${o.correct ? 'checked' : ''} aria-label="Opção ${j + 1} é a correta">
        <input type="text" data-qo="${i}-${j}" maxlength="200" value="${esc(o.text)}" placeholder="Opção ${j + 1}" aria-label="Texto da opção ${j + 1}">
        ${q.options.length > 2 ? `<button class="btn-text danger" data-action="q-opt-remove" data-i="${i}" data-j="${j}" aria-label="Remover opção ${j + 1}">×</button>` : ''}</div>`).join('')
        + `<div class="helper">Marca o círculo da opção correta. <button class="btn-text" data-action="q-opt-add" data-i="${i}">+ Adicionar opção</button></div>`
    : q.type === 'VF' ? `<div class="vf-toggle"><label><input type="radio" name="correct-${i}" data-action="q-vf" data-i="${i}" data-v="true" ${q.correctBool === true ? 'checked' : ''}> Verdadeiro</label><label><input type="radio" name="correct-${i}" data-action="q-vf" data-i="${i}" data-v="false" ${q.correctBool === false ? 'checked' : ''}> Falso</label></div><div class="helper">Indica a resposta correta.</div>`
    : `<div class="helper">${q.type === 'CURTA' ? 'Resposta curta' : 'Resposta aberta'}: sem correção automática; é avaliada por ti depois da submissão.</div>`}</div>`;
}
PAGES.PROFESSOR.criar = p => {
  const mods = App.svc.modules();
  if (!mods.length) return `<div class="page-head"><div><h1>Criar atividade</h1></div></div>${emptyBox('Ainda não tens módulos atribuídos.', 'A administração tem de te associar a um módulo e a uma turma.')}`;
  if (!App.draft || App.draft._for !== (p.id || 'new')) App.draft = newDraft(p.id);
  const d = App.draft;
  if (d.locked) return `${crumb([['Atividades', 'atividades']], 'Editar')}${emptyBox('Esta atividade já tem submissões e não pode ser editada.')}`;
  return `${crumb([['Atividades', 'atividades']], d.id ? 'Editar' : 'Criar')}
  <div class="page-head"><div><h1>${d.id ? 'Editar atividade' : 'Criar atividade'}</h1><p>Define o prazo e as perguntas. A resposta correta define a correção automática.</p></div></div>
  <div class="box" style="margin:16px 0;"><div class="grid-2">
    <div class="field"><label for="c-title">Título</label><input id="c-title" type="text" maxlength="120" value="${esc(d.title)}"></div>
    <div class="field"><label for="c-deadline">Prazo</label><input id="c-deadline" type="date" value="${esc(d.deadline)}"></div>
    <div class="field"><label for="c-target">Módulo e turma</label><select id="c-target">${mods.map(m => `<option value="${m.moduleId}|${m.classId}" ${d.target === `${m.moduleId}|${m.classId}` ? 'selected' : ''}>${esc(m.moduleName)} — Turma ${esc(m.className)}</option>`).join('')}</select></div>
    <div class="field"><label for="c-desc">Descrição (opcional)</label><textarea id="c-desc" maxlength="1000" style="min-height:44px;">${esc(d.description)}</textarea></div></div></div>
  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;"><div class="section-title" style="margin:0;">Perguntas (${d.questions.length})</div><button class="btn" data-action="q-add">+ Adicionar pergunta</button></div>
  ${d.questions.length ? d.questions.map(questionBuilder).join('') : emptyBox('Ainda não adicionaste perguntas.')}
  <div class="box" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:space-between;"><span class="helper">Só as atividades publicadas ficam visíveis aos alunos da turma.</span>
    <span class="row-actions"><button class="btn" data-action="draft-save">Guardar rascunho</button><button class="btn btn-primary" data-action="draft-publish">Publicar atividade</button></span></div>`;
};
const draftMut = fn => el => { syncDraft(); fn(App.draft, el); renderMain(); };
ACTIONS['q-add'] = draftMut(d => { d.questions.push(emptyQuestion('MC')); });
ACTIONS['q-remove'] = draftMut((d, el) => { d.questions.splice(+el.dataset.i, 1); });
ACTIONS['q-type'] = draftMut((d, el) => { const i = +el.dataset.i, keep = d.questions[i].statement; d.questions[i] = { ...emptyQuestion(el.value), statement: keep }; });
ACTIONS['q-opt-add'] = draftMut((d, el) => { const q = d.questions[+el.dataset.i]; if (q.options.length < 6) q.options.push({ text: '', correct: false }); });
ACTIONS['q-opt-remove'] = draftMut((d, el) => { const q = d.questions[+el.dataset.i]; q.options.splice(+el.dataset.j, 1); if (!q.options.some(o => o.correct)) q.options.forEach(o => { o.correct = false; }); });
ACTIONS['q-correct'] = el => { syncDraft(); const q = App.draft.questions[+el.dataset.i]; q.options.forEach((o, j) => { o.correct = j === +el.dataset.j; }); };
ACTIONS['q-vf'] = el => { syncDraft(); App.draft.questions[+el.dataset.i].correctBool = el.dataset.v === 'true'; };
const saveDraft = publish => safe(async () => {
  syncDraft(); const d = App.draft; const [moduleId, classId] = (d.target || '').split('|');
  const payload = { id: d.id, title: d.title, description: d.description, moduleId, classId, deadline: d.deadline, questions: d.questions.map(q => ({ type: q.type, statement: q.statement, options: q.options, correctBool: q.correctBool })) };
  App.svc.saveActivity(payload, publish); App.draft = null;
  toast(publish ? 'Atividade publicada. Já está visível para a turma.' : 'Rascunho guardado.'); go('atividades');
});
ACTIONS['draft-save'] = saveDraft(false); ACTIONS['draft-publish'] = saveDraft(true);

/* ---------- submissões e correção ---------- */
PAGES.PROFESSOR.submissoes = p => {
  const r = App.svc.submissions(p.id), a = r.activity;
  return `${crumb([['Atividades', 'atividades']], a.title)}<div class="page-head"><div><h1>${esc(a.title)}</h1><p>${esc(a.moduleName)} · Turma ${esc(a.className)} · prazo ${esc(fmtData(a.deadline))}</p></div></div>
  ${r.rows.length ? `<div class="table-wrap" style="margin-top:16px;"><table><thead><tr><th>Aluno</th><th>Estado</th><th>Nota</th><th>Submetido em</th><th></th></tr></thead><tbody>
    ${r.rows.map(s => `<tr><td>${esc(s.studentName)}</td><td>${statusText(s.key)}</td>
      <td style="font-variant-numeric:tabular-nums;">${s.key === 'corrigida' ? s.finalScore + '/20' : s.autoScore != null ? s.autoScore + '/20 (prov.)' : '—'}</td>
      <td class="cell-sub">${s.submittedAt ? esc(fmtDataHora(s.submittedAt)) : '—'}</td>
      <td>${s.submissionId ? `<button class="btn-text" data-action="nav" data-page="corrigir" data-id="${s.submissionId}">${s.key === 'corrigida' ? 'Rever' : 'Corrigir'}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : emptyBox('Esta turma ainda não tem alunos associados.')}`;
};
PAGES.PROFESSOR.correcoes = () => {
  const c = App.svc.corrections();
  const row = s => `<div class="list-row"><div class="row-main"><div class="row-title"><button data-action="nav" data-page="corrigir" data-id="${s.submissionId}">${esc(s.studentName)}</button></div><div class="row-sub">${esc(s.activityTitle)} · ${esc(fmtDataHora(s.submittedAt))}</div></div>
    ${statusText(s.status === 'CORRIGIDA' ? 'corrigida' : 'submetida', s.status === 'CORRIGIDA' ? s.finalScore : null)}</div>`;
  return `<div class="page-head"><div><h1>Correções</h1><p>Submissões das tuas atividades.</p></div></div>
  <div class="section-title">Por corrigir (${c.pending.length})</div>${c.pending.length ? `<div class="list">${c.pending.map(row).join('')}</div>` : emptyBox('Não tens submissões por corrigir.')}
  <div class="section-title">Já corrigidas</div>${c.done.length ? `<div class="list">${c.done.slice(0, 15).map(row).join('')}</div>` : emptyBox('Ainda não corrigiste nenhuma submissão.')}`;
};
PAGES.PROFESSOR.corrigir = p => {
  const d = App.svc.submissionDetail(p.id);
  const rows = d.items.map(({ question: q, answer: a }) => {
    if (q.type === 'MC' || q.type === 'VF') return itemsHtml({ items: [{ question: q, answer: a }] }, true);
    return `<div class="review-row"><div class="review-mark wait">…</div><div style="flex:1;"><div class="review-q">${esc(q.statement)}</div>
      <div class="review-a">Resposta do aluno: <b>${esc(a.text || '— sem resposta —')}</b></div>
      ${a.text ? `<div style="margin-top:8px; max-width:150px;"><label class="helper" for="sc-${q.id}">Pontos (0 a ${q.points})</label><input id="sc-${q.id}" type="number" min="0" max="${q.points}" step="0.25" data-score="${q.id}" value="${a.score != null ? a.score : ''}"></div>` : '<div class="helper">Sem resposta: 0 pontos.</div>'}</div></div>`;
  }).join('');
  const objectiveEarned = d.items.filter(i => i.question.type === 'MC' || i.question.type === 'VF').reduce((s, i) => s + (i.answer.score || 0), 0);
  return `${crumb([['Correções', 'correcoes']], d.student.name)}<div class="page-head"><div><h1>${esc(d.student.name)}</h1><p>${esc(d.activity.title)} · submetida em ${esc(fmtDataHora(d.submittedAt))}</p></div></div>
  <div class="grid-2" style="margin-top:16px;"><div><div class="box">${rows}</div>${filesHtml(d)}</div>
    <div class="box" data-total="${d.totalPoints}" data-objective="${objectiveEarned}" data-fixed="${d.items.filter(i => (i.question.type === 'CURTA' || i.question.type === 'ABERTA') && !i.answer.text).length * 0}">
      <div class="field"><div class="label">Nota calculada (0–20)</div><div class="score-big" id="calc" style="font-size:28px;">${d.finalScore != null ? d.finalScore : d.autoScore}</div><div class="helper">Soma automática das objetivas e das tuas pontuações.</div></div>
      <div class="field"><label for="final">Nota final (opcional, para ajustar)</label><input id="final" type="number" min="0" max="20" step="0.1" placeholder="Deixa em branco para usar a calculada"></div>
      <div class="field"><label for="fb">Feedback para o aluno</label><textarea id="fb" maxlength="2000" placeholder="Escreve um comentário sobre o desempenho…">${esc(d.feedback)}</textarea></div>
      <button class="btn btn-primary btn-block" data-action="grade-save" data-id="${d.id}">${d.status === 'CORRIGIDA' ? 'Atualizar classificação' : 'Guardar correção'}</button></div></div>`;
};
function updateCalc() {
  const box = $('[data-total]'); if (!box) return;
  const total = +box.dataset.total; let earned = +box.dataset.objective, missing = false;
  $$('[data-score]').forEach(i => { if (i.value === '') missing = true; else earned += Math.max(0, Math.min(+i.max, +i.value)); });
  const c = $('#calc'); if (c) c.textContent = missing ? `${round1((earned / total) * 20)}*` : round1((earned / total) * 20);
}
ACTIONS['score-input'] = () => updateCalc();
ACTIONS['grade-save'] = safe(async el => {
  const scores = {}; $$('[data-score]').forEach(i => { if (i.value !== '') scores[i.dataset.score] = i.value; });
  const fin = $('#final').value; const data = { scores, feedback: $('#fb').value }; if (fin !== '') data.finalScore = fin;
  App.svc.grade(el.dataset.id, data); toast('Classificação guardada. O aluno já pode ver o resultado e o feedback.'); go('correcoes');
});
PAGES.PROFESSOR.desempenho = () => {
  const l = App.svc.performance();
  return `<div class="page-head"><div><h1>Desempenho</h1><p>Média das submissões já corrigidas, por módulo e turma.</p></div></div>
  ${l.length ? `<div class="list">${l.map(x => `<div class="list-row"><div class="row-main"><div class="row-title">${esc(x.moduleName)}</div><div class="row-sub">Turma ${esc(x.className)} · ${x.corrigidas} submiss${x.corrigidas === 1 ? 'ão corrigida' : 'ões corrigidas'}</div></div>
    <div class="row-side" style="font-weight:800; color:var(--text);">${x.media != null ? x.media + '/20' : '—'}</div></div>`).join('')}</div>` : emptyBox('Ainda não tens módulos atribuídos.')}`;
};
