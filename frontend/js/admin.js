/* Aldijos — área da administração */
const optionList = (items, sel) => items.map(([v, l]) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`).join('');
const adminForms = { user: false, course: false, klass: false, module: false };
const toggleForm = k => () => { adminForms[k] = !adminForms[k]; renderMain(); };

PAGES.ADMIN.dashboard = () => {
  const d = App.svc.dashboard();
  return `<div class="page-head"><div><h1>Visão geral</h1><p>Ano letivo 2026/2027</p></div></div>
  <div class="stat-row">
    <div><div class="n">${d.alunos}</div><div class="l">Alunos</div></div><div><div class="n">${d.professores}</div><div class="l">Professores</div></div>
    <div><div class="n">${d.cursos}</div><div class="l">Cursos</div></div><div><div class="n">${d.turmas}</div><div class="l">Turmas</div></div><div><div class="n">${d.modulos}</div><div class="l">Módulos</div></div>
    <div><div class="n">${d.atividades}</div><div class="l">Atividades publicadas</div></div></div>
  ${noticeSection()}
  <div class="section-title">Cursos com mais alunos</div>
  <div class="list">${d.cursosTop.map(c => `<div class="list-row"><div class="row-main"><div class="row-title">${esc(c.name)}</div><div class="row-sub">${c.turmas} turma${c.turmas === 1 ? '' : 's'}</div></div><div class="row-side">${c.alunos} aluno${c.alunos === 1 ? '' : 's'}</div></div>`).join('')}</div>`;
};

/* ---------- utilizadores ---------- */
let userTab = 'ALUNO';
PAGES.ADMIN.utilizadores = () => {
  const rows = App.svc.users(userTab);
  const tabs = [['ALUNO', 'Alunos'], ['PROFESSOR', 'Professores'], ['ADMIN', 'Administração']];
  return `<div class="page-head"><div><h1>Utilizadores</h1></div><button class="btn btn-primary" data-action="form-user">+ Novo utilizador</button></div>
  <div class="role-toggle" style="margin:14px 0 16px;" role="tablist">${tabs.map(([k, l]) => `<button class="${userTab === k ? 'active' : ''}" data-action="user-tab" data-tab="${k}" role="tab" aria-selected="${userTab === k}">${l}</button>`).join('')}</div>
  ${adminForms.user ? `<form class="inline-form" data-form="user" novalidate>
    <div class="field"><label for="u-name">Nome</label><input id="u-name" type="text" required></div><div class="field"><label for="u-email">Email</label><input id="u-email" type="email" required></div>
    <div class="field" style="max-width:150px;"><label for="u-role">Perfil</label><select id="u-role">${optionList([['ALUNO', 'Aluno'], ['PROFESSOR', 'Professor'], ['ADMIN', 'Administração']], userTab)}</select></div>
    <div class="field"><label for="u-pass">Palavra-passe inicial</label><input id="u-pass" type="password" autocomplete="new-password" required></div>
    <button class="btn btn-primary" type="submit">Criar</button><button class="btn" type="button" data-action="form-user">Cancelar</button></form>` : ''}
  ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Nome</th><th>Email</th><th>${userTab === 'ALUNO' ? 'Turma' : userTab === 'PROFESSOR' ? 'Módulos' : ''}</th><th>Estado</th><th></th></tr></thead><tbody>
    ${rows.map(u => `<tr><td>${esc(u.name)}</td><td class="cell-sub">${esc(u.email)}</td>
      <td class="cell-sub">${u.role === 'ALUNO' ? esc(u.className || 'Sem turma') : u.role === 'PROFESSOR' ? esc(u.modules.join(', ') || 'Sem módulos') : ''}</td>
      <td>${statusText(u.active ? 'Ativo' : 'Inativo')}</td>
      <td><div class="row-actions" style="font-size:12.5px;"><button class="btn-text" data-action="user-active" data-id="${u.id}" data-on="${u.active ? 0 : 1}">${u.active ? 'Desativar' : 'Ativar'}</button><button class="btn-text muted" data-action="pw-ask" data-id="${u.id}" data-name="${esc(u.name)}">Repor palavra-passe</button></div></td></tr>`).join('')}</tbody></table></div>` : emptyBox('Não existem utilizadores neste perfil.')}`;
};
ACTIONS['form-user'] = toggleForm('user');
ACTIONS['user-tab'] = el => { userTab = el.dataset.tab; renderMain(); };
ACTIONS['user-active'] = safe(async el => { App.svc.setUserActive(el.dataset.id, el.dataset.on === '1'); toast(el.dataset.on === '1' ? 'Utilizador ativado.' : 'Utilizador desativado.'); renderMain(); });
FORMS.user = safe(async f => {
  await App.svc.createUser({ name: $('#u-name', f).value, email: $('#u-email', f).value, role: $('#u-role', f).value, password: $('#u-pass', f).value });
  adminForms.user = false; toast('Utilizador criado.'); renderMain();
});
ACTIONS['pw-ask'] = el => openModal(`<div class="modal-body"><h2 id="modal-title">Repor palavra-passe</h2><p style="color:var(--text-muted);">Define uma nova palavra-passe para <b>${esc(el.dataset.name)}</b>.</p>
  <form data-form="pw" novalidate><input type="hidden" id="pw-id" value="${esc(el.dataset.id)}"><div class="field"><label for="pw-new">Nova palavra-passe</label><input id="pw-new" type="password" autocomplete="new-password" required><div class="helper">Mínimo de 8 caracteres, com letras e números.</div></div>
  <div class="modal-actions"><button class="btn btn-primary" type="submit">Guardar</button><button class="btn" type="button" data-action="close-modal">Cancelar</button></div></form></div>`, { plain: true });
FORMS.pw = safe(async f => { await App.svc.resetPassword($('#pw-id', f).value, $('#pw-new', f).value); closeModal(); toast('Palavra-passe atualizada.'); });

/* ---------- cursos ---------- */
PAGES.ADMIN.cursos = () => {
  const l = App.svc.courses();
  return `<div class="page-head"><div><h1>Cursos</h1></div><button class="btn btn-primary" data-action="form-course">+ Novo curso</button></div>
  ${adminForms.course ? `<form class="inline-form" data-form="course" style="margin-top:14px;" novalidate>
    <div class="field"><label for="c-name">Nome do curso</label><input id="c-name" type="text" required></div><div class="field"><label for="c-area">Área</label><input id="c-area" type="text" required></div>
    <div class="field" style="flex-basis:100%;"><label for="c-des">Descrição (opcional)</label><input id="c-des" type="text"></div>
    <button class="btn btn-primary" type="submit">Criar</button><button class="btn" type="button" data-action="form-course">Cancelar</button></form>` : ''}
  <div class="list" style="margin-top:14px;">${l.map(c => `<div class="list-row"><div class="row-main"><div class="row-title">${esc(c.name)}</div><div class="row-sub">${esc(c.area)} · ${c.turmas} turma${c.turmas === 1 ? '' : 's'} · ${c.modulos} módulo${c.modulos === 1 ? '' : 's'}</div></div><div class="row-side">${c.alunos} aluno${c.alunos === 1 ? '' : 's'}</div></div>`).join('')}</div>`;
};
ACTIONS['form-course'] = toggleForm('course');
FORMS.course = safe(async f => { App.svc.createCourse({ name: $('#c-name', f).value, area: $('#c-area', f).value, description: $('#c-des', f).value }); adminForms.course = false; toast('Curso criado.'); renderMain(); });

/* ---------- turmas e alunos ---------- */
PAGES.ADMIN.turmas = () => {
  const classes = App.svc.classes(), courses = App.svc.courses(), students = App.svc.users('ALUNO').filter(s => s.active);
  return `<div class="page-head"><div><h1>Turmas</h1><p>Cria turmas e associa alunos.</p></div><button class="btn btn-primary" data-action="form-klass">+ Nova turma</button></div>
  ${adminForms.klass ? `<form class="inline-form" data-form="klass" style="margin-top:14px;" novalidate>
    <div class="field"><label for="k-course">Curso</label><select id="k-course">${optionList(courses.map(c => [c.id, c.name]))}</select></div>
    <div class="field" style="max-width:130px;"><label for="k-name">Turma</label><input id="k-name" type="text" placeholder="ex.: INF13" required></div>
    <div class="field" style="max-width:150px;"><label for="k-year">Ano letivo</label><input id="k-year" type="text" value="2026/2027" required></div>
    <button class="btn btn-primary" type="submit">Criar</button><button class="btn" type="button" data-action="form-klass">Cancelar</button></form>` : ''}
  <form class="inline-form" data-form="enroll" style="margin-top:14px;" novalidate><div class="field"><label for="e-student">Associar aluno</label><select id="e-student">${optionList(students.map(s => [s.id, `${s.name} — ${s.className || 'sem turma'}`]))}</select></div>
    <div class="field" style="max-width:180px;"><label for="e-class">à turma</label><select id="e-class">${optionList(classes.map(c => [c.id, `${c.name} · ${shortCourse(c.courseName)}`]))}</select></div><button class="btn btn-primary" type="submit">Associar</button></form>
  <div class="list">${classes.map(c => `<div class="list-row" style="align-items:flex-start;"><div class="row-main"><div class="row-title">${esc(c.name)} · ${esc(c.courseName)}</div>
    <div class="row-sub">${esc(c.year)} · ${c.students.length} aluno${c.students.length === 1 ? '' : 's'}${c.coordinator ? ' · ' + esc(c.coordinator) : ''}</div>
    <div style="margin-top:6px;">${c.students.length ? c.students.map(s => `<span class="chip-inline">${esc(s.name)}<button data-action="unenroll" data-id="${s.id}" aria-label="Remover ${esc(s.name)} da turma">×</button></span>`).join('') : '<span class="helper">Sem alunos associados.</span>'}</div></div></div>`).join('')}</div>`;
};
ACTIONS['form-klass'] = toggleForm('klass');
FORMS.klass = safe(async f => { App.svc.createClass({ courseId: $('#k-course', f).value, name: $('#k-name', f).value, year: $('#k-year', f).value }); adminForms.klass = false; toast('Turma criada.'); renderMain(); });
FORMS.enroll = safe(async f => { App.svc.enroll($('#e-student', f).value, $('#e-class', f).value); toast('Aluno associado à turma.'); renderMain(); });
ACTIONS.unenroll = safe(async el => { App.svc.unenroll(el.dataset.id); toast('Aluno removido da turma.'); renderMain(); });

/* ---------- módulos e professores ---------- */
const classOptionsFor = moduleId => { const m = App.svc.modules().find(x => x.id === moduleId); return App.svc.classes().filter(c => m && c.courseId === m.courseId).map(c => [c.id, c.name]); };
PAGES.ADMIN.modulos = () => {
  const mods = App.svc.modules(), courses = App.svc.courses(), teachers = App.svc.users('PROFESSOR').filter(t => t.active);
  const firstClasses = mods.length ? classOptionsFor(mods[0].id) : [];
  return `<div class="page-head"><div><h1>Módulos</h1><p>Cria módulos e associa professores a módulo e turma.</p></div><button class="btn btn-primary" data-action="form-module">+ Novo módulo</button></div>
  ${adminForms.module ? `<form class="inline-form" data-form="module" style="margin-top:14px;" novalidate>
    <div class="field"><label for="m-course">Curso</label><select id="m-course">${optionList(courses.map(c => [c.id, c.name]))}</select></div>
    <div class="field"><label for="m-name">Nome do módulo</label><input id="m-name" type="text" required></div>
    <div class="field" style="max-width:110px;"><label for="m-hours">Horas</label><input id="m-hours" type="number" min="1" max="400" value="60"></div>
    <button class="btn btn-primary" type="submit">Criar</button><button class="btn" type="button" data-action="form-module">Cancelar</button></form>` : ''}
  <form class="inline-form" data-form="assign" style="margin-top:14px;" novalidate>
    <div class="field"><label for="a-teacher">Associar professor</label><select id="a-teacher">${optionList(teachers.map(t => [t.id, t.name]))}</select></div>
    <div class="field"><label for="a-module">ao módulo</label><select id="a-module" data-action="assign-module">${optionList(mods.map(m => [m.id, `${m.name} — ${shortCourse(m.courseName)}`]))}</select></div>
    <div class="field" style="max-width:150px;"><label for="a-class">na turma</label><select id="a-class">${optionList(firstClasses)}</select></div><button class="btn btn-primary" type="submit">Associar</button></form>
  <div class="list">${mods.map(m => `<div class="list-row" style="align-items:flex-start;"><div class="row-main"><div class="row-title">${esc(m.name)}</div><div class="row-sub">${esc(m.courseName)} · ${m.hours}h</div>
    <div style="margin-top:6px;">${m.teachers.length ? m.teachers.map(t => `<span class="chip-inline">${esc(t.teacherName)} · ${esc(t.className)}<button data-action="unassign" data-t="${t.teacherId}" data-m="${m.id}" data-c="${t.classId}" aria-label="Remover ${esc(t.teacherName)} de ${esc(m.name)}">×</button></span>`).join('') : '<span class="helper">Sem professor associado.</span>'}</div></div></div>`).join('')}</div>`;
};
ACTIONS['form-module'] = toggleForm('module');
ACTIONS['assign-module'] = el => { const s = $('#a-class'); if (s) s.innerHTML = optionList(classOptionsFor(el.value)); };
FORMS.module = safe(async f => { App.svc.createModule({ courseId: $('#m-course', f).value, name: $('#m-name', f).value, hours: $('#m-hours', f).value }); adminForms.module = false; toast('Módulo criado.'); renderMain(); });
FORMS.assign = safe(async f => { App.svc.assignTeacher($('#a-teacher', f).value, $('#a-module', f).value, $('#a-class', f).value); toast('Professor associado.'); renderMain(); });
ACTIONS.unassign = safe(async el => { App.svc.unassignTeacher(el.dataset.t, el.dataset.m, el.dataset.c); toast('Associação removida.'); renderMain(); });

/* ---------- eventos ---------- */
const evForm = { open: false, editing: null };
PAGES.ADMIN.eventos = () => {
  const list = App.svc.eventsAll(), courses = App.svc.courses();
  const ed = evForm.editing ? list.find(e => e.id === evForm.editing) : null, v = ed || { published: true, courseId: '' };
  const form = evForm.open ? `<form class="box" data-form="event" style="margin:14px 0 20px;" novalidate>
    <div class="section-title" style="margin-top:0;">${ed ? 'Editar evento' : 'Novo evento'}</div>
    <div class="grid-2">
      <div class="field"><label for="ev-title">Título</label><input id="ev-title" type="text" maxlength="120" value="${esc(v.title)}" required></div>
      <div class="field"><label for="ev-course">Ramo</label><select id="ev-course">${optionList([['', 'Toda a escola'], ...courses.map(c => [c.id, c.name])], v.courseId || '')}</select></div>
      <div class="field"><label for="ev-cat">Categoria</label><input id="ev-cat" type="text" maxlength="60" value="${esc(v.category)}" placeholder="ex.: Workshop"></div>
      <div class="field"><label for="ev-aud">Público-alvo</label><input id="ev-aud" type="text" maxlength="120" value="${esc(v.audience)}"></div>
      <div class="field"><label for="ev-date">Data</label><input id="ev-date" type="date" value="${esc(v.date)}" required></div>
      <div class="field"><label for="ev-end">Data de fim (opcional)</label><input id="ev-end" type="date" value="${esc(v.dateEnd)}"></div>
      <div class="field"><label for="ev-time">Hora (opcional)</label><input id="ev-time" type="time" value="${esc(v.time)}"></div>
      <div class="field"><label for="ev-place">Local (vazio = Online)</label><input id="ev-place" type="text" maxlength="100" value="${esc(v.place)}"></div>
      <div class="field" style="grid-column:1/-1;"><label for="ev-desc">Descrição curta</label><textarea id="ev-desc" maxlength="300" style="min-height:50px;">${esc(v.description)}</textarea></div>
      <div class="field"><label for="ev-img">Imagem (opcional, até 300 KB)</label><input id="ev-img" type="file" accept="image/png,image/jpeg,image/webp" data-action="ev-img"><div class="helper" id="ev-img-note">${App.evImg ? 'Nova imagem selecionada.' : (ed && ed.image ? 'A manter a imagem atual.' : 'Sem imagem: usa a foto do ramo.')}</div></div>
      <div class="field" style="justify-content:flex-end;"><label style="display:flex; gap:8px; align-items:center; font-size:13px; color:var(--text);"><input id="ev-pub" type="checkbox" ${v.published ? 'checked' : ''}> Publicado (visível para todos)</label></div></div>
    <div class="row-actions"><button class="btn btn-primary" type="submit">${ed ? 'Guardar alterações' : 'Criar evento'}</button><button class="btn" type="button" data-action="ev-cancel">Cancelar</button></div></form>` : '';
  return `<div class="page-head"><div><h1>Eventos</h1><p>Os eventos publicados aparecem na página inicial e nos painéis de alunos e professores.</p></div><button class="btn btn-primary" data-action="ev-new">+ Novo evento</button></div>
  ${form}${list.length ? `<div class="table-wrap" style="margin-top:14px;"><table><thead><tr><th>Evento</th><th>Data</th><th>Estado</th><th>Ações</th></tr></thead><tbody>
    ${list.map(e => `<tr><td>${esc(e.title)}<div class="cell-sub">${esc(e.courseName)} · ${esc(e.category)}</div></td><td class="cell-sub">${esc(fmtEvento(e))}</td>
      <td>${statusText(e.published ? 'PUBLICADA' : 'RASCUNHO').replace('Rascunho', 'Oculto')}</td>
      <td><div class="row-actions" style="font-size:12.5px;"><button class="btn-text" data-action="ev-edit" data-id="${e.id}">Editar</button><button class="btn-text" data-action="ev-toggle" data-id="${e.id}">${e.published ? 'Ocultar' : 'Publicar'}</button>
      ${App.confirm === 'ev:' + e.id ? `<button class="btn-text danger" data-action="ev-del" data-id="${e.id}">Confirmar eliminação</button><button class="btn-text muted" data-action="confirm-clear">Cancelar</button>` : `<button class="btn-text danger" data-action="ev-del" data-id="${e.id}">Eliminar</button>`}</div></td></tr>`).join('')}</tbody></table></div>`
    : emptyBox('Não existem eventos programados.', 'Cria o primeiro evento.')}`;
};
ACTIONS['ev-new'] = () => { evForm.open = true; evForm.editing = null; App.evImg = null; renderMain(); };
ACTIONS['ev-edit'] = el => { evForm.open = true; evForm.editing = el.dataset.id; App.evImg = null; renderMain(); window.scrollTo(0, 0); const m = $('.app-main'); if (m) m.scrollTop = 0; };
ACTIONS['ev-cancel'] = () => { evForm.open = false; evForm.editing = null; App.evImg = null; renderMain(); };
ACTIONS['ev-toggle'] = safe(async el => { App.svc.toggleEvent(el.dataset.id); toast('Estado do evento atualizado.'); renderMain(); });
ACTIONS['ev-del'] = safe(async el => {
  if (App.confirm !== 'ev:' + el.dataset.id) { App.confirm = 'ev:' + el.dataset.id; return renderMain(); }
  App.confirm = null; App.svc.deleteEvent(el.dataset.id); toast('Evento eliminado.'); renderMain();
});
ACTIONS['ev-img'] = safe(async el => {
  const file = el.files && el.files[0]; if (!file) return;
  if (file.size > Aldijos.limits.MAX_FILE_BYTES) { el.value = ''; return toast(`Imagem demasiado grande (máximo ${Aldijos.limits.MAX_FILE_BYTES / 1024} KB).`, 'error'); }
  App.evImg = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  const n = $('#ev-img-note'); if (n) n.textContent = 'Nova imagem selecionada: ' + file.name;
});
FORMS.event = safe(async f => {
  const g = id => $(id, f), ed = evForm.editing ? App.svc.eventsAll().find(e => e.id === evForm.editing) : null;
  App.svc.saveEvent({ id: evForm.editing || undefined, title: g('#ev-title').value, courseId: g('#ev-course').value || null, category: g('#ev-cat').value, audience: g('#ev-aud').value,
    date: g('#ev-date').value, dateEnd: g('#ev-end').value, time: g('#ev-time').value, place: g('#ev-place').value, description: g('#ev-desc').value,
    image: App.evImg || (ed ? ed.image : ''), published: g('#ev-pub').checked });
  const wasEdit = !!evForm.editing; evForm.open = false; evForm.editing = null; App.evImg = null; toast(wasEdit ? 'Evento atualizado.' : 'Evento criado.'); renderMain();
});
