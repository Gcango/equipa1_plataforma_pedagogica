-- Garante (cria se preciso) a submissão "em curso" do aluno para uma
-- atividade, para poder anexar ficheiros antes de submeter definitivamente.
create function ensure_submission(p_activity_id bigint)
returns bigint
language plpgsql security definer as $$
declare
  v_id bigint;
  v_activity activities%rowtype;
begin
  select * into v_activity from activities where id = p_activity_id;
  if v_activity.id is null or v_activity.status <> 'PUBLICADA' or not is_enrolled_in(v_activity.class_id) then
    raise exception 'Atividade não encontrada ou indisponível.';
  end if;
  select id into v_id from submissions where activity_id = p_activity_id and student_id = auth.uid();
  if v_id is null then
    insert into submissions (activity_id, student_id, status) values (p_activity_id, auth.uid(), 'EM_CURSO') returning id into v_id;
  end if;
  return v_id;
end;
$$;
grant execute on function ensure_submission(bigint) to authenticated;
