-- profiles não guardava o email (só existe em auth.users, que o cliente não
-- pode listar diretamente). Sem isto, a lista de Utilizadores do Admin fica
-- sem email nenhum, e o "repor palavra-passe" não sabe para onde enviar.
-- Guarda-se aqui uma cópia, preenchida automaticamente a partir de agora.

alter table profiles add column email text;
update profiles set email = u.email from auth.users u where profiles.id = u.id;

create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Utilizador'), 'ALUNO', new.email);
  return new;
end;
$$;
