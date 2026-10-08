-- A homepage pública (incluindo para quem NÃO tem sessão) precisa de:
--  1) ver cursos/módulos (catálogo) — faltava o acesso para "anon";
--  2) ver as 5 estatísticas agregadas, sem expor linhas sensíveis
--     (perguntas/respostas/notas) a quem não está autenticado — daí uma
--     função que devolve só os números, nunca as linhas.

drop policy "courses: ver todos" on courses;
create policy "courses: ver todos" on courses for select to anon, authenticated using (true);

drop policy "modules: ver todos" on modules;
create policy "modules: ver todos" on modules for select to anon, authenticated using (true);

create function get_public_stats()
returns table (cursos bigint, atividades bigint, alunos bigint, professores bigint, concluidas bigint)
language sql security definer stable as $$
  select
    (select count(*) from courses),
    (select count(*) from activities where status = 'PUBLICADA'),
    (select count(*) from profiles where role = 'ALUNO' and active),
    (select count(*) from profiles where role = 'PROFESSOR' and active),
    (select count(*) from submissions where status = 'CORRIGIDA')
$$;
grant execute on function get_public_stats() to anon, authenticated;
