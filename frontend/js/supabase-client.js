/*
 * Aldijos — ponte para o Supabase.
 *
 * Fase 1 da migração: só os EVENTOS vêm de uma base de dados partilhada
 * (Postgres/Supabase), para resolverem o problema relatado — eventos
 * publicados só apareciam na máquina/navegador que os criou. O resto da
 * plataforma (utilizadores, atividades, submissões, notas) continua, por
 * agora, em localStorage — ver ADR-007 em docs/10_decisoes_tecnicas.md.
 *
 * db.events (dentro de store.js) passa a ser uma CACHE local alimentada por
 * esta ponte: publicHome()/publishedEvents()/svc.eventsAll() continuam a
 * ler dessa cache sem precisar de saber de onde os dados vêm.
 */
(function () {
  if (!window.supabase || !window.SUPABASE_URL) { console.error('Supabase não está configurado.'); return; }
  const supa = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);

  function mapEvent(r) {
    return {
      id: String(r.id), title: r.title, category: r.category || 'Evento', description: r.description || '',
      date: r.date, dateEnd: r.date_end || '', time: r.time || '', timeNote: '', place: r.place || '',
      audience: r.audience || 'Toda a comunidade escolar', courseId: r.course_id || null,
      image: r.image_url || '', published: r.published,
    };
  }

  async function fetchEvents(all) {
    let q = supa.from('events').select('*').order('date');
    if (!all) q = q.eq('published', true);
    const { data, error } = await q;
    if (error) throw error;
    return data.map(mapEvent);
  }

  async function refreshCache() {
    const staff = App.user && (App.user.role === 'ADMIN' || App.user.role === 'PROFESSOR');
    const list = await fetchEvents(!!staff);
    App.store.setEvents(list);
  }

  async function saveEvent(data) {
    const payload = {
      title: data.title, category: data.category || 'Evento', description: data.description || '',
      date: data.date, date_end: data.dateEnd || null, time: data.time || null, place: data.place || '',
      audience: data.audience || 'Toda a comunidade escolar', course_id: data.courseId || null,
      image_url: data.image || '', published: data.published !== false,
    };
    const q = data.id ? supa.from('events').update(payload).eq('id', data.id) : supa.from('events').insert(payload);
    const { error } = await q;
    if (error) throw error;
    await refreshCache();
  }

  async function toggleEvent(id) {
    const { data, error } = await supa.from('events').select('published').eq('id', id).single();
    if (error) throw error;
    const { error: err2 } = await supa.from('events').update({ published: !data.published }).eq('id', id);
    if (err2) throw err2;
    await refreshCache();
  }

  async function deleteEvent(id) {
    const { error } = await supa.from('events').delete().eq('id', id);
    if (error) throw error;
    await refreshCache();
  }

  let channel = null;
  function subscribeRealtime() {
    if (channel) return;
    channel = supa.channel('events-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => { refreshCache().catch(err => console.error(err)); })
      .subscribe();
  }

  /*
   * Catálogo público + as 5 estatísticas da homepage ("Aldijos em números") —
   * vêm agora do Supabase (cursos, módulos, atividades publicadas, contas
   * registadas, submissões corrigidas), em vez do localStorage de cada
   * browser, e atualizam-se sozinhas via Realtime.
   */
  async function fetchPublicCourses() {
    const [{ data: courses, error: cErr }, { data: modules, error: mErr }] = await Promise.all([
      supa.from('courses').select('*').order('id'),
      supa.from('modules').select('id, course_id, name').order('id'),
    ]);
    if (cErr) throw cErr; if (mErr) throw mErr;
    return courses.map(c => ({
      id: String(c.id), name: c.name, area: c.area, short: c.short, description: c.description, years: c.years, photo: c.photo,
      modules: modules.filter(m => m.course_id === c.id).map(m => m.name),
    }));
  }

  async function fetchPublicStats() {
    const { data, error } = await supa.rpc('get_public_stats').single();
    if (error) throw error;
    return { cursos: data.cursos, atividades: data.atividades, alunos: data.alunos, professores: data.professores, concluidas: data.concluidas };
  }

  async function refreshPublicHome() {
    const [courses, stats] = await Promise.all([fetchPublicCourses(), fetchPublicStats()]);
    App.store.setPublicHomeLive(courses, stats);
  }

  let homeChannel = null;
  function subscribeHomeRealtime() {
    if (homeChannel) return;
    homeChannel = supa.channel('public-home-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => refreshPublicHome().catch(e => console.error(e)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => refreshPublicHome().catch(e => console.error(e)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => refreshPublicHome().catch(e => console.error(e)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refreshPublicHome().catch(e => console.error(e)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => refreshPublicHome().catch(e => console.error(e)))
      .subscribe();
  }

  /*
   * Autenticação — mantém-se o login local (store.js, PBKDF2, continua a
   * mandar em toda a lógica de negócio ainda local: atividades, turmas,
   * notas, etc.), mas agora também se abre, com o MESMO email/password, uma
   * sessão real no Supabase Auth — é essa sessão que dá a auth.uid() usada
   * pelas políticas de segurança (is_admin(), por exemplo). Se a conta ainda
   * não existir no Supabase (primeiro login), cria-se aqui mesmo, com o
   * papel por omissão ALUNO — só muda para ADMIN/PROFESSOR com uma instrução
   * SQL pontual (ver docs/10_decisoes_tecnicas.md).
   */
  // Admin cria uma conta para outra pessoa (professor/aluno/admin). signUp()
  // troca a sessão ativa para a conta nova — por isso guardamos a sessão do
  // admin antes e repomo-la a seguir, sem precisar da palavra-passe dele outra vez.
  async function createUserAccount(email, password, name, role) {
    const { data: { session: adminSession } } = await supa.auth.getSession();
    const { data, error } = await supa.auth.signUp({ email, password, options: { data: { name } } });
    if (error) { console.error(error); if (window.toast) toast(error.message || 'Não foi possível criar a conta.', 'error'); return null; }
    if (adminSession) await supa.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token });
    if (role && role !== 'ALUNO') await supa.from('profiles').update({ role }).eq('id', data.user.id);
    await refreshMirror();
    return data.user.id;
  }

  async function ensureSession(email, password) {
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (!error) return;
    const { error: signUpError } = await supa.auth.signUp({ email, password });
    if (signUpError) throw signUpError;
  }
  async function endSession() { await supa.auth.signOut(); }

  /*
   * Espelho completo (fase 4): o documento local `db` passa a ser alimentado
   * inteiramente pelo Supabase depois de autenticar — turmas, módulos,
   * atividades (com perguntas/opções), submissões (com respostas/ficheiros)
   * e utilizadores. Toda a lógica de apresentação (teacher.js/student.js/
   * admin.js) continua exatamente igual, porque só lê de `db`.
   */
  function mapQuestion(q) {
    return {
      id: String(q.id), type: q.type, statement: q.statement, points: q.points,
      options: q.type === 'MC' ? (q.question_options || []).slice().sort((a, b) => a.position - b.position).map(o => ({ id: String(o.id), text: o.text, correct: o.correct })) : undefined,
      correctBool: q.correct_bool,
    };
  }
  function mapActivity(a) {
    return {
      id: String(a.id), teacherId: a.teacher_id, moduleId: String(a.module_id), classId: String(a.class_id),
      title: a.title, description: a.description || '', deadline: a.deadline, status: a.status,
      createdAt: a.created_at, publishedAt: a.published_at,
      questions: (a.questions || []).slice().sort((x, y) => x.position - y.position).map(mapQuestion),
    };
  }
  function mapSubmission(s) {
    return {
      id: String(s.id), activityId: String(s.activity_id), studentId: s.student_id, status: s.status,
      submittedAt: s.submitted_at, autoScore: s.auto_score, finalScore: s.final_score,
      gradedBy: s.graded_by, gradedAt: s.graded_at, feedback: s.feedback || '',
      answers: (s.answers || []).map(a => ({ questionId: String(a.question_id), optionId: a.option_id ? String(a.option_id) : null, bool: a.bool_value, text: a.text_value, isCorrect: a.is_correct, score: a.score })),
      files: (s.submission_files || []).map(f => ({ id: String(f.id), name: f.name, size: f.size, dataUrl: f.file_url, uploadedAt: f.uploaded_at })),
    };
  }

  async function buildMirror() {
    const [
      { data: profiles, error: pErr }, { data: courses, error: cErr }, { data: classes, error: clErr },
      { data: modules, error: mErr }, { data: enrollments, error: eErr }, { data: teaching, error: tErr },
      { data: activities, error: aErr }, { data: submissions, error: sErr },
    ] = await Promise.all([
      supa.from('profiles').select('*'),
      supa.from('courses').select('*').order('id'),
      supa.from('classes').select('*').order('id'),
      supa.from('modules').select('*').order('id'),
      supa.from('enrollments').select('*'),
      supa.from('teaching').select('*'),
      supa.from('activities').select('*, questions(*, question_options(*))').order('id'),
      supa.from('submissions').select('*, answers(*), submission_files(*)').order('id'),
    ]);
    for (const e of [pErr, cErr, clErr, mErr, eErr, tErr, aErr, sErr]) if (e) throw e;

    return {
      users: profiles.map(p => ({ id: p.id, name: p.name, email: p.email || '', role: p.role, active: p.active, passwordHash: '', createdAt: p.created_at })),
      courses: courses.map(c => ({ id: String(c.id), name: c.name, area: c.area, short: c.short, description: c.description, years: c.years, photo: c.photo })),
      classes: classes.map(c => ({ id: String(c.id), courseId: String(c.course_id), name: c.name, year: c.year })),
      modules: modules.map(m => ({ id: String(m.id), courseId: String(m.course_id), name: m.name, hours: m.hours })),
      enrollments: enrollments.map(e => ({ studentId: e.student_id, classId: String(e.class_id) })),
      teaching: teaching.map(t => ({ teacherId: t.teacher_id, moduleId: String(t.module_id), classId: String(t.class_id) })),
      activities: activities.map(mapActivity),
      submissions: submissions.map(mapSubmission),
    };
  }

  async function refreshMirror() {
    const mirror = await buildMirror();
    App.store.replaceDb(mirror);
  }

  let mirrorChannel = null;
  function subscribeMirrorRealtime() {
    if (mirrorChannel) return;
    const tables = ['profiles', 'courses', 'classes', 'modules', 'enrollments', 'teaching', 'activities', 'questions', 'question_options', 'submissions', 'answers', 'submission_files'];
    let ch = supa.channel('mirror-sync');
    tables.forEach(t => { ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => refreshMirror().catch(e => console.error(e))); });
    mirrorChannel = ch.subscribe();
  }

  window.Supa = {
    client: supa, refreshCache, saveEvent, toggleEvent, deleteEvent, subscribeRealtime, ensureSession, endSession,
    refreshPublicHome, subscribeHomeRealtime, refreshMirror, subscribeMirrorRealtime, createUserAccount,
  };
})();
