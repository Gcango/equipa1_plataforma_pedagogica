-- Aldijos — políticas de acesso (RLS) + funções auxiliares
-- Espelha as verificações de permissão feitas em store.js: as(userId).<método>()

-- =========================================================================
-- Funções auxiliares (SECURITY DEFINER: contornam RLS só para decidir o
-- papel do utilizador atual, sem expor dados)
-- =========================================================================
create function my_role() returns user_role
language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

create function is_admin() returns boolean
language sql security definer stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'ADMIN' and active)
$$;

create function is_teacher_of(p_module_id bigint, p_class_id bigint) returns boolean
language sql security definer stable as $$
  select exists(select 1 from teaching where teacher_id = auth.uid() and module_id = p_module_id and class_id = p_class_id)
$$;

create function is_enrolled_in(p_class_id bigint) returns boolean
language sql security definer stable as $$
  select exists(select 1 from enrollments where student_id = auth.uid() and class_id = p_class_id)
$$;

alter table profiles enable row level security;
alter table courses enable row level security;
alter table classes enable row level security;
alter table modules enable row level security;
alter table enrollments enable row level security;
alter table teaching enable row level security;
alter table activities enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table submissions enable row level security;
alter table answers enable row level security;
alter table submission_files enable row level security;
alter table events enable row level security;

-- =========================================================================
-- profiles
-- =========================================================================
create policy "profiles: ver todos" on profiles for select to authenticated using (true);
create policy "profiles: editar a própria" on profiles for update to authenticated
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- =========================================================================
-- estrutura académica — leitura livre, escrita só admin
-- =========================================================================
create policy "courses: ver todos" on courses for select to authenticated using (true);
create policy "courses: admin escreve" on courses for all to authenticated using (is_admin()) with check (is_admin());

create policy "classes: ver todos" on classes for select to authenticated using (true);
create policy "classes: admin escreve" on classes for all to authenticated using (is_admin()) with check (is_admin());

create policy "modules: ver todos" on modules for select to authenticated using (true);
create policy "modules: admin escreve" on modules for all to authenticated using (is_admin()) with check (is_admin());

create policy "enrollments: ver todos" on enrollments for select to authenticated using (true);
create policy "enrollments: admin escreve" on enrollments for all to authenticated using (is_admin()) with check (is_admin());

create policy "teaching: ver todos" on teaching for select to authenticated using (true);
create policy "teaching: admin escreve" on teaching for all to authenticated using (is_admin()) with check (is_admin());

-- =========================================================================
-- activities — aluno só vê publicadas da sua turma; professor vê as suas
-- (incl. rascunhos); admin vê tudo
-- =========================================================================
create policy "activities: aluno vê publicadas da turma" on activities for select to authenticated
  using (status = 'PUBLICADA' and is_enrolled_in(class_id));
create policy "activities: professor vê e gere as suas" on activities for all to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid() and is_teacher_of(module_id, class_id));
create policy "activities: admin tudo" on activities for all to authenticated
  using (is_admin()) with check (is_admin());

-- =========================================================================
-- questions / question_options — NUNCA diretamente para alunos (as
-- respostas certas ficam escondidas; o acesso de aluno passa pelas funções
-- get_activity_questions / get_submission_review mais abaixo)
-- =========================================================================
create policy "questions: professor dono" on questions for all to authenticated
  using (exists(select 1 from activities a where a.id = activity_id and a.teacher_id = auth.uid()))
  with check (exists(select 1 from activities a where a.id = activity_id and a.teacher_id = auth.uid()));
create policy "questions: admin tudo" on questions for all to authenticated using (is_admin()) with check (is_admin());

create policy "options: professor dono" on question_options for all to authenticated
  using (exists(select 1 from questions q join activities a on a.id = q.activity_id where q.id = question_id and a.teacher_id = auth.uid()))
  with check (exists(select 1 from questions q join activities a on a.id = q.activity_id where q.id = question_id and a.teacher_id = auth.uid()));
create policy "options: admin tudo" on question_options for all to authenticated using (is_admin()) with check (is_admin());

-- =========================================================================
-- submissions / answers
--
-- IMPORTANTE: um aluno pode LER a sua submissão diretamente, mas NUNCA a
-- pode escrever/alterar por uma UPDATE direta — isso deixaria editar a
-- própria nota. Toda a escrita (submeter, classificar) passa pelas funções
-- submit_activity() / grade_submission() mais abaixo, que replicam as
-- mesmas regras de negócio de applySubmission()/applyGrade() em store.js.
-- =========================================================================
create policy "submissions: aluno vê a sua" on submissions for select to authenticated
  using (student_id = auth.uid());
create policy "submissions: professor da atividade vê" on submissions for select to authenticated
  using (exists(select 1 from activities a where a.id = activity_id and a.teacher_id = auth.uid()));
create policy "submissions: admin tudo" on submissions for all to authenticated using (is_admin()) with check (is_admin());

create policy "answers: dono da submissão vê" on answers for select to authenticated
  using (exists(select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid()));
create policy "answers: professor da atividade vê" on answers for select to authenticated
  using (exists(select 1 from submissions s join activities a on a.id = s.activity_id where s.id = submission_id and a.teacher_id = auth.uid()));
create policy "answers: admin tudo" on answers for all to authenticated using (is_admin()) with check (is_admin());

create policy "files: dono anexa enquanto em curso" on submission_files for insert to authenticated
  with check (exists(select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid() and s.status = 'EM_CURSO'));
create policy "files: dono remove enquanto em curso" on submission_files for delete to authenticated
  using (exists(select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid() and s.status = 'EM_CURSO'));
create policy "files: dono da submissão vê" on submission_files for select to authenticated
  using (exists(select 1 from submissions s where s.id = submission_id and s.student_id = auth.uid()));
create policy "files: professor da atividade vê" on submission_files for select to authenticated
  using (exists(select 1 from submissions s join activities a on a.id = s.activity_id where s.id = submission_id and a.teacher_id = auth.uid()));
create policy "files: admin tudo" on submission_files for all to authenticated using (is_admin()) with check (is_admin());

-- Limites de ficheiro (mesmas regras de store.js: MAX_FILE_BYTES, MAX_FILES,
-- extensões permitidas) aplicados aqui, para não dependerem só do cliente.
create function check_submission_file() returns trigger
language plpgsql as $$
begin
  if new.size > 300 * 1024 then raise exception 'Ficheiro demasiado grande (máximo 300 KB).'; end if;
  if lower(right(new.name, 5)) !~ '\.(pdf|png|jpg|jpeg|txt|docx|zip)$' then
    raise exception 'Tipo de ficheiro não permitido.';
  end if;
  if (select count(*) from submission_files where submission_id = new.submission_id) >= 3 then
    raise exception 'Máximo de 3 ficheiros por atividade.';
  end if;
  return new;
end;
$$;
create trigger submission_files_check before insert on submission_files
  for each row execute procedure check_submission_file();

-- =========================================================================
-- events — públicos vêem só os publicados; staff (professor/admin) vê tudo;
-- só admin escreve. Leitura pública (até não autenticado, para a homepage).
-- =========================================================================
create policy "events: toda a gente vê publicados" on events for select to anon, authenticated
  using (published = true);
create policy "events: staff vê tudo" on events for select to authenticated
  using (my_role() in ('PROFESSOR', 'ADMIN'));
create policy "events: admin escreve" on events for all to authenticated
  using (is_admin()) with check (is_admin());

-- =========================================================================
-- RPCs seguras para perguntas/respostas (o único caminho de um aluno até
-- às perguntas — nunca a tabela diretamente)
-- =========================================================================

-- Perguntas de uma atividade, SEM as respostas certas — para o aluno responder.
create function get_activity_questions(p_activity_id bigint)
returns table (id bigint, type question_type, statement text, options jsonb)
language plpgsql security definer stable as $$
begin
  if not exists (
    select 1 from activities a
    where a.id = p_activity_id and a.status = 'PUBLICADA' and is_enrolled_in(a.class_id)
  ) and not exists (
    select 1 from activities a where a.id = p_activity_id and (a.teacher_id = auth.uid() or is_admin())
  ) then
    raise exception 'Atividade não encontrada ou indisponível.';
  end if;

  return query
    select q.id, q.type, q.statement,
      coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'text', o.text) order by o.position)
                from question_options o where o.question_id = q.id), '[]'::jsonb)
    from questions q where q.activity_id = p_activity_id order by q.position;
end;
$$;
grant execute on function get_activity_questions(bigint) to authenticated;

-- Detalhe de uma submissão já entregue (SUBMETIDA ou CORRIGIDA), COM as
-- respostas certas — só depois de já não ser possível alterar a resposta.
create function get_submission_review(p_submission_id bigint)
returns table (
  question_id bigint, type question_type, statement text, points int,
  options jsonb, correct_bool boolean,
  answer_option_id bigint, answer_bool boolean, answer_text text, is_correct boolean, score numeric
)
language plpgsql security definer stable as $$
declare
  allowed boolean;
begin
  select exists(
    select 1 from submissions s join activities a on a.id = s.activity_id
    where s.id = p_submission_id and s.status <> 'EM_CURSO'
      and (s.student_id = auth.uid() or a.teacher_id = auth.uid() or is_admin())
  ) into allowed;
  if not allowed then raise exception 'Submissão não encontrada.'; end if;

  return query
    select q.id, q.type, q.statement, q.points,
      coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'text', o.text, 'correct', o.correct) order by o.position)
                from question_options o where o.question_id = q.id), '[]'::jsonb),
      q.correct_bool,
      an.option_id, an.bool_value, an.text_value, an.is_correct, an.score
    from submissions s
    join questions q on q.activity_id = s.activity_id
    left join answers an on an.submission_id = s.id and an.question_id = q.id
    where s.id = p_submission_id
    order by q.position;
end;
$$;
grant execute on function get_submission_review(bigint) to authenticated;

-- =========================================================================
-- Submeter uma atividade (equivalente a applySubmission em store.js).
-- p_answers: objeto { "<question_id>": valor }, valor = id da opção (MC),
-- booleano (VF) ou texto (CURTA/ABERTA).
-- =========================================================================
create function submit_activity(p_activity_id bigint, p_answers jsonb)
returns table (submission_id bigint, status submission_status)
language plpgsql security definer as $$
declare
  v_activity activities%rowtype;
  v_submission_id bigint;
  v_existing_status submission_status;
  v_total int := 0;
  v_pending boolean := false;
  v_q record;
  v_raw jsonb;
  v_opt_id bigint;
  v_is_correct boolean;
  v_score numeric;
  v_text text;
begin
  select * into v_activity from activities where id = p_activity_id;
  if v_activity.id is null or v_activity.status <> 'PUBLICADA' or not is_enrolled_in(v_activity.class_id) then
    raise exception 'Atividade não encontrada ou indisponível.';
  end if;
  if v_activity.deadline < current_date then raise exception 'O prazo desta atividade terminou.'; end if;

  select id, status into v_submission_id, v_existing_status from submissions
    where activity_id = p_activity_id and student_id = auth.uid();
  if v_existing_status is not null and v_existing_status <> 'EM_CURSO' then
    raise exception 'Já submeteste esta atividade.';
  end if;
  if v_submission_id is null then
    insert into submissions (activity_id, student_id, status) values (p_activity_id, auth.uid(), 'EM_CURSO') returning id into v_submission_id;
  end if;

  for v_q in select * from questions where activity_id = p_activity_id order by position loop
    v_total := v_total + 1;
    v_raw := p_answers -> v_q.id::text;
    v_opt_id := null; v_is_correct := null; v_score := null; v_text := null;

    if v_q.type = 'MC' then
      v_opt_id := nullif(v_raw #>> '{}', '')::bigint;
      select correct into v_is_correct from question_options where id = v_opt_id and question_id = v_q.id;
      v_is_correct := coalesce(v_is_correct, false);
      v_score := case when v_is_correct then 1 else 0 end;
    elsif v_q.type = 'VF' then
      if jsonb_typeof(v_raw) = 'boolean' then
        v_is_correct := (v_raw)::text::boolean = v_q.correct_bool;
        v_score := case when v_is_correct then 1 else 0 end;
      else
        v_is_correct := false; v_score := 0;
      end if;
    else -- CURTA / ABERTA
      v_text := nullif(trim(both from (v_raw #>> '{}')), '');
      if v_text is not null then v_text := left(v_text, case when v_q.type = 'CURTA' then 300 else 4000 end); end if;
      if v_text is null then v_score := 0; else v_pending := true; end if;
    end if;

    insert into answers (submission_id, question_id, option_id, bool_value, text_value, is_correct, score)
      values (v_submission_id, v_q.id,
        case when v_q.type = 'MC' then v_opt_id end,
        case when v_q.type = 'VF' then (v_raw #>> '{}')::boolean end,
        v_text, v_is_correct, v_score)
    on conflict (submission_id, question_id) do update
      set option_id = excluded.option_id, bool_value = excluded.bool_value,
          text_value = excluded.text_value, is_correct = excluded.is_correct, score = excluded.score;
  end loop;

  update submissions set
    submitted_at = now(),
    auto_score = case when v_total = 0 then 0 else round((coalesce((select sum(score) from answers where submission_id = v_submission_id), 0) / v_total) * 20, 1) end,
    status = case when v_pending then 'SUBMETIDA' else 'CORRIGIDA' end,
    final_score = case when v_pending then null else
      case when v_total = 0 then 0 else round((coalesce((select sum(score) from answers where submission_id = v_submission_id), 0) / v_total) * 20, 1) end
    end,
    graded_at = case when v_pending then null else now() end
  where id = v_submission_id;

  return query select v_submission_id, s.status from submissions s where s.id = v_submission_id;
end;
$$;
grant execute on function submit_activity(bigint, jsonb) to authenticated;

-- =========================================================================
-- Classificar uma submissão (equivalente a applyGrade em store.js).
-- p_scores: objeto { "<question_id>": nota de 0 a 1 } para perguntas
-- CURTA/ABERTA. p_final_score (opcional) sobrepõe a nota final (0-20).
-- =========================================================================
create function grade_submission(p_submission_id bigint, p_scores jsonb, p_final_score numeric, p_feedback text)
returns table (status submission_status, final_score numeric)
language plpgsql security definer as $$
declare
  v_sub submissions%rowtype;
  v_activity activities%rowtype;
  v_total int;
  v_earned numeric;
  v_pending boolean;
  v_final numeric;
  v_key text;
begin
  select * into v_sub from submissions where id = p_submission_id;
  if v_sub.id is null or v_sub.status = 'EM_CURSO' then raise exception 'Submissão não encontrada.'; end if;
  select * into v_activity from activities where id = v_sub.activity_id;
  if v_activity.teacher_id <> auth.uid() and not is_admin() then
    raise exception 'Só o professor da atividade pode classificar esta submissão.';
  end if;

  for v_key in select jsonb_object_keys(coalesce(p_scores, '{}'::jsonb)) loop
    update answers a set score = (p_scores ->> v_key)::numeric, is_correct = null
      from questions q
      where a.question_id = q.id and q.type in ('CURTA','ABERTA')
        and a.submission_id = p_submission_id and a.question_id = v_key::bigint
        and (p_scores ->> v_key)::numeric between 0 and 1;
  end loop;

  select count(*), coalesce(sum(score), 0), bool_or(score is null) into v_total, v_earned, v_pending
    from answers where submission_id = p_submission_id;

  if v_pending and p_final_score is null then
    raise exception 'Falta classificar as respostas curtas/abertas.';
  end if;
  if p_final_score is not null then
    if p_final_score < 0 or p_final_score > 20 then raise exception 'A nota final deve estar entre 0 e 20.'; end if;
    v_final := round(p_final_score, 1);
  else
    v_final := case when v_total = 0 then 0 else round((v_earned / v_total) * 20, 1) end;
  end if;

  update submissions set
    status = 'CORRIGIDA', final_score = v_final, graded_by = auth.uid(), graded_at = now(),
    feedback = left(coalesce(trim(both from p_feedback), ''), 2000)
  where id = p_submission_id;

  return query select s.status, s.final_score from submissions s where s.id = p_submission_id;
end;
$$;
grant execute on function grade_submission(bigint, jsonb, numeric, text) to authenticated;
