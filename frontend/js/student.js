/* Aldijos — área do aluno (e página de eventos partilhada por todos os perfis) */
const crumb = (items, current) => `<div class="breadcrumb">${items.map(([label, page, data]) => `<button data-action="nav" data-page="${page}"${data ? Object.entries(data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('') : ''}>${esc(label)}</button>`).join(' / ')} / ${esc(current)}</div>`;
const noticeSection = () => `<div class="section-title">Avisos</div><div class="list">${noticesHtml(App.svc.notifications())}</div>`;
const actRow = a => {
  const key = a.state.key, target = a.state.subId ? `data-page="resultado" data-id="${a.state.subId}"` : `data-page="atividade" data-id="${a.id}"`;
  return `<div class="list-row"><div class="row-main"><div class="row-title"><button data-action="nav" ${target}>${esc(a.title)}</button></div>
    <div class="row-sub">${esc(a.moduleName)} · ${esc(a.teacherName)} · prazo ${esc(fmtData(a.deadline))} · ${a.questionCount} pergunta${a.questionCount === 1 ? '' : 's'}</div></div>${statusText(key, a.state.score)}</div>`;
};

PAGES.ALUNO.dashboard = () => {
  const d = App.svc.dashboard();
  if (!d.className) return `<div class="page-head"><div><h1>Olá, ${esc(firstName(App.user.name))}</h1><p>Bem-vindo(a) à Aldijos.</p></div></div>
    ${emptyBox('Ainda não estás associado(a) a uma turma.', 'Pede à administração para te associar; depois vais ver aqui os módulos e as atividades.')}${noticeSection()}`;
  return `<div class="page-head"><div><h1>Olá, ${esc(firstName(App.user.name))}</h1><p>${esc(d.courseName)} · Turma ${esc(d.className)}</p></div></div>
  <div class="stat-row">
    <div><div class="n">${d.moduleCount}</div><div class="l">Módulos</div></div><div><div class="n">${d.pendentes.length}</div><div class="l">Pendentes</div></div>
    <div><div class="n">${d.submetidas}</div><div class="l">Por corrigir</div></div><div><div class="n">${d.corrigidas}</div><div class="l">Corrigidas</div></div>
    <div><div class="n">${d.media == null ? '—' : d.media}</div><div class="l">Média (0–20)</div></div></div>
  ${noticeSection()}
  <div class="section-title">Próximas atividades</div>
  ${d.pendentes.length ? `<div class="list">${d.pendentes.map(actRow).join('')}</div>` : emptyBox('Não tens submissões pendentes.')}
  <div class="section-title">Os teus módulos</div>
  <div class="tag-row">${d.modules.map(m => `<button class="tag-box" data-action="nav" data-page="atividades" data-module="${m.id}">${esc(m.name)}</button>`).join('')}</div>`;
};
PAGES.ALUNO.modulos = () => {
  const m = App.svc.modules();
  if (!m.className) return `<div class="page-head"><div><h1>Módulos</h1></div></div>${emptyBox('Ainda não estás associado(a) a uma turma.', 'A administração tem de te associar a uma turma.')}`;
  return `<div class="page-head"><div><h1>Módulos</h1><p>${esc(m.courseName)} · Turma ${esc(m.className)}</p></div></div>
  <div class="list">${m.modules.map(x => `<div class="list-row"><div class="row-main"><div class="row-title"><button data-action="nav" data-page="atividades" data-module="${x.id}">${esc(x.name)}</button></div>
    <div class="row-sub">${x.hours}h · ${x.teacherName ? 'Prof. ' + esc(x.teacherName) : 'Sem professor associado'} · ${x.total} atividade${x.total === 1 ? '' : 's'}</div></div>
    ${x.pendentes ? `<div class="row-side">${x.pendentes} pendente${x.pendentes === 1 ? '' : 's'}</div>` : ''}</div>`).join('')}</div>`;
};
PAGES.ALUNO.atividades = p => {
  if (p.moduleId) {
    const r = App.svc.moduleActivities(p.moduleId);
    return `${crumb([['Módulos', 'modulos']], r.module.name)}<div class="page-head"><div><h1>${esc(r.module.name)}</h1></div></div>
      ${r.activities.length ? `<div class="list">${r.activities.map(actRow).join('')}</div>` : emptyBox('Ainda não existem atividades publicadas.')}`;
  }
  const all = App.svc.allActivities();
  return `<div class="page-head"><div><h1>Atividades</h1><p>Todas as atividades publicadas para a tua turma.</p></div></div>
    ${all.length ? `<div class="list">${all.map(actRow).join('')}</div>` : emptyBox('Ainda não existem atividades publicadas.')}`;
};

/* ---------- realizar uma atividade ---------- */
function collectAnswers(a) {
  const out = {};
  a.questions.forEach(q => {
    if (q.type === 'MC') { const c = $(`input[name="q_${q.id}"]:checked`); if (c) out[q.id] = c.value; }
    else if (q.type === 'VF') { const c = $(`input[name="q_${q.id}"]:checked`); if (c) out[q.id] = c.value === 'true'; }
    else { const el = $(`[data-qid="${q.id}"]`); if (el && el.value) out[q.id] = el.value; }
  });
  return out;
}
function questionInput(q, saved, disabled) {
  const dis = disabled ? ' disabled' : '';
  if (q.type === 'MC') return q.options.map(o => `<label class="option-row" style="cursor:pointer;"><input type="radio" name="q_${q.id}" value="${o.id}" ${saved === o.id ? 'checked' : ''}${dis}><span>${esc(o.text)}</span></label>`).join('');
  if (q.type === 'VF') return `<div class="vf-toggle"><label><input type="radio" name="q_${q.id}" value="true" ${saved === true ? 'checked' : ''}${dis}> Verdadeiro</label><label><input type="radio" name="q_${q.id}" value="false" ${saved === false ? 'checked' : ''}${dis}> Falso</label></div>`;
  if (q.type === 'CURTA') return `<input type="text" data-qid="${q.id}" maxlength="300" placeholder="Resposta curta" value="${esc(saved || '')}" aria-label="Resposta à pergunta"${dis}>`;
  return `<textarea data-qid="${q.id}" maxlength="4000" placeholder="Escreve a tua resposta…" aria-label="Resposta à pergunta"${dis}>${esc(saved || '')}</textarea><div class="helper">Resposta aberta: é avaliada pelo professor.</div>`;
}
PAGES.ALUNO.atividade = p => {
  const a = App.svc.activity(p.id), saved = App.answers[a.id] || {};
  const meta = `<div class="stat-row" style="margin:14px 0 18px; gap:26px;">
    <div><div class="l">Módulo</div><b>${esc(a.moduleName)}</b></div><div><div class="l">Professor</div><b>${esc(a.teacherName)}</b></div>
    <div><div class="l">Prazo</div><b>${esc(fmtData(a.deadline))}</b></div><div><div class="l">Perguntas</div><b>${a.questionCount}</b></div><div><div class="l">Estado</div>${statusText(a.state.key, a.state.score)}</div></div>`;
  const head = `${crumb([['Atividades', 'atividades']], a.title)}<div class="page-head"><div><h1>${esc(a.title)}</h1>${a.description ? `<p>${esc(a.description)}</p>` : ''}</div></div>${meta}`;
  if (a.state.subId) return `${head}<div class="box"><b>Já submeteste esta atividade.</b><p class="helper">Consulta o resultado e o feedback do professor.</p><button class="btn btn-primary" data-action="nav" data-page="resultado" data-id="${a.state.subId}">Ver resultado ${arrow}</button></div>`;
  if (!a.canSubmit) return `${head}${emptyBox('O prazo desta atividade terminou.', 'Já não é possível submeter respostas.')}`;
  return `${head}<div class="box">
    ${a.questions.map((q, i) => `<div style="margin-bottom:22px;"><div class="q-text">${i + 1}. ${esc(q.statement)}</div>${questionInput(q, saved[q.id])}</div>`).join('')}
    <div class="divider"></div>
    <div class="label" style="margin-bottom:6px;">Anexar ficheiros (opcional)</div>
    ${a.files.map(f => `<div class="file-row"><span>${esc(f.name)}</span><span class="cell-sub">${fmtSize(f.size)}</span><button class="btn-text danger" data-action="file-remove" data-id="${a.id}" data-file="${f.id}">Remover</button></div>`).join('')}
    <input type="file" id="file-pick" data-action="file-pick" data-id="${a.id}" accept=".pdf,.png,.jpg,.jpeg,.txt,.docx,.zip" aria-label="Anexar ficheiro">
    <div class="helper">PDF, PNG, JPG, TXT, DOCX ou ZIP · até 3 ficheiros · máximo 300 KB cada (limite desta demonstração).</div>
    <div class="divider"></div>
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
      <span class="helper">${Object.keys(saved).length}/${a.questionCount} perguntas respondidas</span>
      <button class="btn btn-primary" data-action="submit-ask" data-id="${a.id}">Submeter atividade</button></div></div>`;
};
ACTIONS['file-pick'] = safe(async el => {
  const file = el.files && el.files[0]; if (!file) return;
  const a = App.svc.activity(el.dataset.id); App.answers[a.id] = collectAnswers(a);
  if (file.size > Aldijos.limits.MAX_FILE_BYTES) { el.value = ''; return toast(`Ficheiro demasiado grande (máximo ${Aldijos.limits.MAX_FILE_BYTES / 1024} KB nesta demonstração).`, 'error'); }
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!['pdf', 'png', 'jpg', 'jpeg', 'txt', 'docx', 'zip'].includes(ext)) { el.value = ''; return toast('Tipo de ficheiro não permitido.', 'error'); }
  const { data: subId, error: subErr } = await Supa.client.rpc('ensure_submission', { p_activity_id: a.id });
  if (subErr) { toast(subErr.message, 'error'); return; }
  const path = `${subId}/${Date.now()}-${file.name}`;
  const { error: upErr } = await Supa.client.storage.from('submissions').upload(path, file);
  if (upErr) { toast(upErr.message, 'error'); return; }
  const { error } = await Supa.client.from('submission_files').insert({ submission_id: subId, name: file.name, size: file.size, file_url: path });
  if (error) { toast(error.message, 'error'); return; }
  await Supa.refreshMirror(); toast('Ficheiro anexado.'); renderMain();
});
ACTIONS['file-remove'] = safe(async el => {
  const a = App.svc.activity(el.dataset.id); App.answers[a.id] = collectAnswers(a);
  const { error } = await Supa.client.from('submission_files').delete().eq('id', el.dataset.file);
  if (error) { toast(error.message, 'error'); return; }
  await Supa.refreshMirror(); renderMain();
});
ACTIONS['submit-ask'] = safe(async el => {
  const a = App.svc.activity(el.dataset.id), ans = collectAnswers(a); App.answers[a.id] = ans;
  const blank = a.questionCount - Object.keys(ans).length;
  openModal(`<div class="modal-body"><h2 id="modal-title">Submeter "${esc(a.title)}"?</h2>
    <p style="color:var(--text-muted);">${blank ? `Tens ${blank} pergunta${blank === 1 ? '' : 's'} sem resposta. ` : ''}Depois de submeteres, já não podes alterar as respostas.</p>
    <div class="modal-actions"><button class="btn btn-primary" data-action="submit-go" data-id="${a.id}">Sim, submeter</button><button class="btn" data-action="close-modal">Voltar</button></div></div>`, { plain: true });
});
ACTIONS['submit-go'] = safe(async el => {
  const id = el.dataset.id; const answers = App.answers[id] || {};
  const { data, error } = await Supa.client.rpc('submit_activity', { p_activity_id: id, p_answers: answers }).single();
  if (error) { toast(error.message || 'Não foi possível submeter.', 'error'); closeModal(); return; }
  delete App.answers[id]; closeModal();
  await Supa.refreshMirror();
  toast(data.out_status === 'CORRIGIDA' ? 'Submetida e corrigida automaticamente.' : 'Submetida. O professor vai avaliar as respostas abertas.');
  go('resultado', { id: data.out_submission_id });
});

/* ---------- resultados ---------- */
function itemsHtml(d, forTeacher) {
  return d.items.map(({ question: q, answer: a }) => {
    let mark = 'wait', sym = '…', body = '';
    if (q.type === 'MC') {
      const chosen = q.options.find(o => o.id === a.optionId), right = q.options.find(o => o.correct);
      mark = a.isCorrect ? 'ok' : 'no'; sym = a.isCorrect ? '✓' : '✗';
      body = `${forTeacher ? 'Resposta do aluno' : 'A tua resposta'}: <b>${esc(chosen ? chosen.text : '— sem resposta —')}</b>${a.isCorrect ? '' : ` · Correta: <b>${esc(right.text)}</b>`}`;
    } else if (q.type === 'VF') {
      mark = a.isCorrect ? 'ok' : 'no'; sym = a.isCorrect ? '✓' : '✗';
      body = `${forTeacher ? 'Resposta do aluno' : 'A tua resposta'}: <b>${a.bool == null ? '— sem resposta —' : a.bool ? 'Verdadeiro' : 'Falso'}</b>${a.isCorrect ? '' : ` · Correta: <b>${q.correctBool ? 'Verdadeiro' : 'Falso'}</b>`}`;
    } else {
      const graded = a.score !== null;
      mark = graded ? 'ok' : 'wait'; sym = graded ? '✓' : '…';
      body = `${forTeacher ? 'Resposta do aluno' : 'A tua resposta'}: <b>${esc(a.text || '— sem resposta —')}</b><br>${graded ? `Pontuação: <b>${a.score}/${q.points}</b>` : '<span class="status-text"><span class="dot dot-warning"></span>Pendente de correção do professor</span>'}`;
    }
    return `<div class="review-row"><div class="review-mark ${mark}">${sym}</div><div><div class="review-q">${esc(q.statement)}</div><div class="review-a">${body}</div></div></div>`;
  }).join('');
}
const filesHtml = d => d.files.length ? `<div class="section-title">Ficheiros submetidos</div>${d.files.map(f => `<div class="file-row"><span>${esc(f.name)}</span><span class="cell-sub">${fmtSize(f.size)}</span><button class="btn-text" data-action="file-download" data-sub="${d.id}" data-file="${f.id}">Descarregar</button></div>`).join('')}` : '';
ACTIONS['file-download'] = safe(async el => {
  const sub = App.store._db().submissions.find(s => s.id === el.dataset.sub);
  const f = sub && sub.files.find(x => x.id === el.dataset.file); if (!f) return;
  const { data, error } = await Supa.client.storage.from('submissions').download(f.dataUrl);
  if (error) { toast(error.message, 'error'); return; }
  const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
});
PAGES.ALUNO.resultado = p => {
  const d = App.svc.submissionDetail(p.id), done = d.status === 'CORRIGIDA';
  return `${crumb([['Resultados', 'resultados']], d.activity.title)}
  <div class="page-head"><div><h1>${esc(d.activity.title)}</h1><p>${esc(d.activity.moduleName)} · submetida em ${esc(fmtDataHora(d.submittedAt))}</p></div></div>
  <div class="box" style="margin:16px 0; display:flex; align-items:center; gap:22px; flex-wrap:wrap;">
    <div class="score-big">${done ? d.finalScore : d.autoScore}</div>
    <div><div style="font-weight:800; font-size:14.5px;">${done ? 'Classificação final (0–20)' : 'Nota provisória (0–20)'}</div>
      <div class="helper" style="margin-top:2px;">${done ? `${esc(d.gradedBy)}${d.gradedAt ? ' · ' + esc(fmtDataHora(d.gradedAt)) : ''}` : 'Falta a avaliação do professor às respostas curtas/abertas.'}</div></div></div>
  ${d.feedback ? `<div class="box" style="margin-bottom:16px;"><div class="label" style="margin-bottom:4px;">Feedback do professor</div><p style="margin:0;">${esc(d.feedback)}</p></div>` : ''}
  <div class="box">${itemsHtml(d, false)}</div>${filesHtml(d)}`;
};
PAGES.ALUNO.resultados = () => {
  const r = App.svc.results();
  return `<div class="page-head"><div><h1>Resultados</h1><p>Classificações e feedback das tuas submissões.</p></div></div>
  ${r.length ? `<div class="list">${r.map(x => `<div class="list-row"><div class="row-main"><div class="row-title"><button data-action="nav" data-page="resultado" data-id="${x.submissionId}">${esc(x.title)}</button></div>
    <div class="row-sub">${esc(x.moduleName)} · ${esc(fmtDataHora(x.submittedAt))}${x.feedback ? ` · “${esc(x.feedback.slice(0, 90))}${x.feedback.length > 90 ? '…' : ''}”` : ''}</div></div>
    <div class="row-side" style="font-weight:800; color:var(--text);">${x.score != null ? x.score + '/20' : 'Por corrigir'}</div></div>`).join('')}</div>` : emptyBox('Ainda não foram atribuídas classificações.', 'Quando submeteres atividades, os resultados aparecem aqui.')}`;
};

/* ---------- eventos (todos os perfis autenticados) ---------- */
const eventsPage = () => {
  const l = App.svc.events().filter(upcoming);
  return `<div class="page-head"><div><h1>Eventos</h1><p>Eventos publicados pela administração.</p></div></div>
  ${l.length ? `<div class="list">${l.map(e => `<div class="list-row"><div class="row-main"><div class="row-title"><button data-action="open-event" data-id="${e.id}">${esc(e.title)}</button></div>
    <div class="row-sub">${esc(e.category)} · ${esc(fmtQuando(e))} · ${esc(e.place || 'Online')}</div></div></div>`).join('')}</div>` : emptyBox('Não existem eventos programados.')}`;
};
PAGES.ALUNO.eventos = eventsPage; PAGES.PROFESSOR.eventos = eventsPage;
