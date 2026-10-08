-- Traduz o email "amigável" usado no projeto (admin@aldijos.pt, etc.) para o
-- email real da conta Supabase correspondente — assim o login continua a
-- pedir o mesmo email de sempre, só que agora autentica a sério.
create table login_aliases (
  friendly_email text primary key,
  auth_email text not null
);
alter table login_aliases enable row level security;
create policy "aliases: toda a gente lê" on login_aliases for select to anon, authenticated using (true);
create policy "aliases: admin escreve" on login_aliases for all to authenticated using (is_admin()) with check (is_admin());
