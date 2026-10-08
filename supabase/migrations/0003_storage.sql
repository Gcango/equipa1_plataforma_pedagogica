-- Aldijos — buckets de Storage para ficheiros reais (substituem os base64
-- antes embutidos em localStorage/JSON).
--
-- Convenção de caminhos:
--   bucket "submissions" (privado): "<submission_id>/<nome-do-ficheiro>"
--   bucket "events"      (público): "<event_id>/<nome-do-ficheiro>"

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('submissions', 'submissions', false, 307200),  -- 300 KB, mesmo limite do store.js
  ('events', 'events', true, 2097152)              -- 2 MB para imagens de eventos
on conflict (id) do nothing;

-- ---------- bucket "submissions" (privado) ----------
create policy "submissions bucket: dono envia enquanto em curso" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and exists (
      select 1 from submissions s
      where s.id::text = (storage.foldername(name))[1]
        and s.student_id = auth.uid() and s.status = 'EM_CURSO'
    )
  );

create policy "submissions bucket: dono remove enquanto em curso" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'submissions'
    and exists (
      select 1 from submissions s
      where s.id::text = (storage.foldername(name))[1]
        and s.student_id = auth.uid() and s.status = 'EM_CURSO'
    )
  );

create policy "submissions bucket: dono e professor vêem" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'submissions'
    and exists (
      select 1 from submissions s
      left join activities a on a.id = s.activity_id
      where s.id::text = (storage.foldername(name))[1]
        and (s.student_id = auth.uid() or a.teacher_id = auth.uid() or is_admin())
    )
  );

-- ---------- bucket "events" (público para leitura) ----------
create policy "events bucket: toda a gente vê" on storage.objects
  for select to anon, authenticated using (bucket_id = 'events');

create policy "events bucket: admin escreve" on storage.objects
  for all to authenticated
  using (bucket_id = 'events' and is_admin())
  with check (bucket_id = 'events' and is_admin());
