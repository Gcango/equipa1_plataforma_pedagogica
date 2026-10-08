/* Aldijos — entrada (login / criar conta de aluno) */
const PAGES = { ALUNO: {}, PROFESSOR: {}, ADMIN: {} };       // cada perfil só tem as suas páginas
const LIVE_PAGES = { ALUNO: new Set(['dashboard', 'modulos', 'atividades', 'resultados', 'eventos']), PROFESSOR: new Set(['dashboard', 'turmas', 'modulos', 'atividades', 'correcoes', 'desempenho', 'eventos']), ADMIN: new Set(['dashboard', 'utilizadores', 'cursos', 'turmas', 'modulos', 'eventos']) };
const ROLE_LABEL = { ALUNO: 'Aluno', PROFESSOR: 'Professor', ADMIN: 'Administração' };

function renderLogin(mode) {
  const reg = mode === 'register';
  const pw = (Aldijos.DEMO_PASSWORD || '');
  return `<div class="login-page">
    ${heroHtml('login-hero')}
    <div class="login-panel"><div class="login-card">
      <button class="btn-text" data-action="go-home">← Voltar ao início</button>
      <div class="login-logo" style="margin-top:16px;"><img src="${asset('img/logo-marca.png')}" alt=""><span>ALDIJOS</span></div>
      <h1>${reg ? 'Criar conta de aluno' : 'Entrar'}</h1>
      <p class="sub">${reg ? 'Depois de criares a conta, a administração associa-te a uma turma.' : 'Usa a tua conta. Cada perfil abre apenas o seu painel.'}</p>
      <div id="form-error" role="alert"></div>
      ${reg ? `<form data-form="register" novalidate>
        <div class="field"><label for="r-name">Nome completo</label><input id="r-name" type="text" autocomplete="name" required></div>
        <div class="field"><label for="r-email">Email</label><input id="r-email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="r-pass">Palavra-passe</label><input id="r-pass" type="password" autocomplete="new-password" required><div class="helper">Mínimo de 8 caracteres, com letras e números.</div></div>
        <div class="field"><label for="r-pass2">Repetir palavra-passe</label><input id="r-pass2" type="password" autocomplete="new-password" required></div>
        <button class="btn btn-primary btn-block" type="submit">Criar conta</button></form>
        <p class="login-alt">Já tens conta? <button class="btn-text" data-action="go-login">Entrar</button></p>`
      : `<form data-form="login" novalidate>
        <div class="field"><label for="l-email">Email</label><input id="l-email" type="email" autocomplete="username" required></div>
        <div class="field"><label for="l-pass">Palavra-passe</label><input id="l-pass" type="password" autocomplete="current-password" required></div>
        <button class="btn btn-primary btn-block" type="submit">Entrar</button></form>
        <p class="login-alt">Ainda não tens conta? <button class="btn-text" data-action="go-register">Criar conta de aluno</button></p>
        <details class="demo"><summary>Contas de demonstração</summary>
          <table><thead><tr><th>Perfil</th><th>Email</th></tr></thead><tbody>
            <tr><td>Aluno</td><td><code>beatriz.antunes@aldijos.pt</code></td></tr>
            <tr><td>Professor</td><td><code>ricardo.lima@aldijos.pt</code></td></tr>
            <tr><td>Administração</td><td><code>admin@aldijos.pt</code></td></tr></tbody></table>
          <div>Palavra-passe de todas: <code>${esc(pw)}</code></div>
          <div class="helper">Só para demonstração. Os dados ficam guardados neste browser.</div>
          <div style="margin-top:8px;"><button class="btn-text muted" data-action="reset-demo">${App.confirm === 'reset' ? 'Confirmar: apagar tudo e repor' : 'Repor dados de demonstração'}</button></div>
        </details>`}
      <p class="login-legal"><button data-action="policy" data-p="privacidade">Privacidade</button><button data-action="policy" data-p="termos">Termos</button><button data-action="policy" data-p="cookies">Cookies</button></p>
    </div></div></div>`;
}
const showFormError = msg => { const b = $('#form-error'); if (b) b.innerHTML = msg ? `<div class="form-error">${esc(msg)}</div>` : ''; };

function enterApp(user) {
  App.user = user; App.svc = App.store.as(user.id); App.screen = 'app'; App.page = 'dashboard'; App.params = {}; App.draft = null; App.answers = {}; App.confirm = null;
  App.supaReady = true;
  render();
  if (window.Supa) { Supa.refreshCache().catch(e => console.error(e)); Supa.subscribeMirrorRealtime(); }
}
function leaveApp() {
  if (window.Supa) Supa.endSession().catch(e => console.error(e));
  App.user = null; App.svc = null; App.screen = 'home'; App.supaReady = false; closeModal(); render();
  if (window.Supa) Supa.refreshCache().catch(e => console.error(e)); // volta à vista pública (só publicados)
}

// Traduz o email "amigável" do projeto (admin@aldijos.pt, etc.) para o email
// real da conta Supabase — ver supabase/migrations/0007_login_aliases.sql.
async function resolveAuthEmail(typed) {
  const email = String(typed || '').trim().toLowerCase();
  if (!window.Supa) return email;
  const { data } = await Supa.client.from('login_aliases').select('auth_email').eq('friendly_email', email).maybeSingle();
  return data ? data.auth_email : email;
}
async function loadProfileUser(uid, displayEmail) {
  const { data: profile, error } = await Supa.client.from('profiles').select('*').eq('id', uid).single();
  if (error || !profile) throw new Aldijos.AppError('AUTH', 'Não foi possível carregar o perfil desta conta.');
  if (!profile.active) throw new Aldijos.AppError('AUTH', 'Esta conta está desativada.');
  return { id: profile.id, name: profile.name, email: displayEmail, role: profile.role };
}

FORMS.login = async f => {
  const typed = $('#l-email', f).value, pass = $('#l-pass', f).value, btn = $('button[type=submit]', f);
  showFormError('');
  if (!typed.trim() || !pass) return showFormError('Indica o email e a palavra-passe.');
  btn.disabled = true; btn.textContent = 'A verificar…';
  try {
    const authEmail = await resolveAuthEmail(typed);
    const { data, error } = await Supa.client.auth.signInWithPassword({ email: authEmail, password: pass });
    if (error) throw new Aldijos.AppError('AUTH', 'Email ou palavra-passe incorretos.');
    const user = await loadProfileUser(data.user.id, typed.trim().toLowerCase());
    await Supa.refreshMirror();
    enterApp(user);
  }
  catch (e) { btn.disabled = false; btn.textContent = 'Entrar'; showFormError(e.name === 'AppError' ? e.message : 'Não foi possível entrar. Tenta novamente.'); if (e.name !== 'AppError') console.error(e); }
};
FORMS.register = async f => {
  const g = id => $(id, f).value; showFormError('');
  if (g('#r-pass') !== g('#r-pass2')) return showFormError('As palavras-passe não coincidem.');
  const btn = $('button[type=submit]', f); btn.disabled = true; btn.textContent = 'A criar conta…';
  try {
    const email = g('#r-email').trim().toLowerCase();
    const { data, error } = await Supa.client.auth.signUp({ email, password: g('#r-pass'), options: { data: { name: g('#r-name') } } });
    if (error) throw new Aldijos.AppError('INVALID', error.message === 'User already registered' ? 'Já existe uma conta com este email.' : 'Não foi possível criar a conta.');
    await Supa.refreshMirror();
    const user = await loadProfileUser(data.user.id, email);
    enterApp(user); toast('Conta criada. A administração vai associar-te a uma turma.');
  }
  catch (e) { btn.disabled = false; btn.textContent = 'Criar conta'; showFormError(e.name === 'AppError' ? e.message : 'Não foi possível criar a conta.'); }
};

ACTIONS['go-home'] = () => { closeModal(); App.screen = 'home'; render(); };
ACTIONS['go-login'] = () => { closeModal(); App.screen = 'login'; App.loginMode = 'login'; render(); };
ACTIONS['go-register'] = () => { closeModal(); App.screen = 'login'; App.loginMode = 'register'; render(); };
ACTIONS.logout = () => leaveApp();
ACTIONS['reset-demo'] = safe(async () => {
  if (App.confirm !== 'reset') { App.confirm = 'reset'; render(); const d = $('details.demo'); if (d) d.open = true; return; }
  App.confirm = null; await App.store.resetDemo(); toast('Dados de demonstração repostos.'); render();
});
