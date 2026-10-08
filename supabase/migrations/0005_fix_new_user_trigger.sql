-- Corrige o gatilho de novo utilizador: faltava fixar o search_path, o que
-- falhava silenciosamente dentro da transação do Supabase Auth ("Database
-- error saving new user").
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Utilizador'), 'ALUNO');
  return new;
end;
$$;
