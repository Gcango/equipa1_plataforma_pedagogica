-- Resolve a ambiguidade de vez: os nomes das colunas de saída (submission_id,
-- status) colidiam com nomes reais de colunas/tabelas usados lá dentro.
-- Em vez de tentar evitar cada ocorrência, renomeiam-se as saídas.

drop function if exists submit_activity(bigint, jsonb);
create function submit_activity(p_activity_id bigint, p_answers jsonb)
returns table (out_submission_id bigint, out_status submission_status)
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

  select id, s.status into v_submission_id, v_existing_status from submissions s
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
    else
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
    auto_score = case when v_total = 0 then 0 else round((coalesce((select sum(a.score) from answers a where a.submission_id = v_submission_id), 0) / v_total) * 20, 1) end,
    status = (case when v_pending then 'SUBMETIDA' else 'CORRIGIDA' end)::submission_status,
    final_score = case when v_pending then null else
      case when v_total = 0 then 0 else round((coalesce((select sum(a.score) from answers a where a.submission_id = v_submission_id), 0) / v_total) * 20, 1) end
    end,
    graded_at = case when v_pending then null else now() end
  where id = v_submission_id;

  return query select v_submission_id, (case when v_pending then 'SUBMETIDA' else 'CORRIGIDA' end)::submission_status;
end;
$$;
grant execute on function submit_activity(bigint, jsonb) to authenticated;

drop function if exists grade_submission(bigint, jsonb, numeric, text);
create function grade_submission(p_submission_id bigint, p_scores jsonb, p_final_score numeric, p_feedback text)
returns table (out_status submission_status, out_final_score numeric)
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

  select count(*), coalesce(sum(a.score), 0), bool_or(a.score is null) into v_total, v_earned, v_pending
    from answers a where a.submission_id = p_submission_id;

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

  return query select 'CORRIGIDA'::submission_status, v_final;
end;
$$;
grant execute on function grade_submission(bigint, jsonb, numeric, text) to authenticated;
