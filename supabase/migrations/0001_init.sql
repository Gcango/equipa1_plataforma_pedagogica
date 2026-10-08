-- Aldijos — esquema inicial Postgres/Supabase
-- Espelha fielmente as entidades e regras já implementadas em public/js/store.js
-- (ver ADR-007 em docs/10_decisoes_tecnicas.md para o contexto da migração).

-- =========================================================================
-- Perfis (auth.users é gerido pelo Supabase Auth; esta tabela guarda os
-- campos próprios da aplicação: nome, papel, estado)
-- =========================================================================
create type user_role as enum ('ALUNO', 'PROFESSOR', 'ADMIN');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 80),
  role user_role not null default 'ALUNO',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- Estrutura académica
-- =========================================================================
create table courses (
  id bigint generated always as identity primary key,
  name text not null unique,
  area text not null,
  short text default '',
  description text default '',
  years int not null default 3,
  photo text default ''
);

create table classes (
  id bigint generated always as identity primary key,
  course_id bigint not null references courses(id) on delete restrict,
  name text not null unique,
  year text not null
);

create table modules (
  id bigint generated always as identity primary key,
  course_id bigint not null references courses(id) on delete restrict,
  name text not null,
  hours int not null check (hours between 1 and 400)
);

create table enrollments (
  student_id uuid not null references profiles(id) on delete cascade,
  class_id bigint not null references classes(id) on delete cascade,
  primary key (student_id) -- um aluno só pode estar numa turma de cada vez (mesma regra do store.js)
);

create table teaching (
  teacher_id uuid not null references profiles(id) on delete cascade,
  module_id bigint not null references modules(id) on delete cascade,
  class_id bigint not null references classes(id) on delete cascade,
  primary key (teacher_id, module_id, class_id)
);

-- =========================================================================
-- Atividades, perguntas e opções
-- =========================================================================
create type activity_status as enum ('RASCUNHO', 'PUBLICADA');
create type question_type as enum ('MC', 'VF', 'CURTA', 'ABERTA');

create table activities (
  id bigint generated always as identity primary key,
  teacher_id uuid not null references profiles(id) on delete restrict,
  module_id bigint not null references modules(id) on delete restrict,
  class_id bigint not null references classes(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 120),
  description text default '',
  deadline date not null,
  status activity_status not null default 'RASCUNHO',
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table questions (
  id bigint generated always as identity primary key,
  activity_id bigint not null references activities(id) on delete cascade,
  type question_type not null,
  statement text not null,
  points int not null default 1,
  correct_bool boolean, -- só para VF
  position int not null default 0
);

create table question_options (
  id bigint generated always as identity primary key,
  question_id bigint not null references questions(id) on delete cascade,
  text text not null,
  correct boolean not null default false,
  position int not null default 0
);

-- =========================================================================
-- Submissões, respostas e ficheiros (ficheiros vão para Supabase Storage;
-- aqui guarda-se apenas o caminho/URL, nunca o base64 — ver secção Storage)
-- =========================================================================
create type submission_status as enum ('EM_CURSO', 'SUBMETIDA', 'CORRIGIDA');

create table submissions (
  id bigint generated always as identity primary key,
  activity_id bigint not null references activities(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  status submission_status not null default 'EM_CURSO',
  submitted_at timestamptz,
  auto_score numeric(4,1),
  final_score numeric(4,1),
  graded_by uuid references profiles(id),
  graded_at timestamptz,
  feedback text default '',
  unique (activity_id, student_id)
);

create table answers (
  id bigint generated always as identity primary key,
  submission_id bigint not null references submissions(id) on delete cascade,
  question_id bigint not null references questions(id) on delete cascade,
  option_id bigint references question_options(id),
  bool_value boolean,
  text_value text,
  is_correct boolean,
  score numeric(4,1),
  unique (submission_id, question_id)
);

create table submission_files (
  id bigint generated always as identity primary key,
  submission_id bigint not null references submissions(id) on delete cascade,
  name text not null,
  size int not null,
  file_url text not null, -- caminho no bucket Storage "submissions"
  uploaded_at timestamptz not null default now()
);

-- =========================================================================
-- Eventos (o bug relatado: tinham de ficar visíveis para todos, em qualquer
-- dispositivo — por isso vêm para aqui em vez de localStorage)
-- =========================================================================
create table events (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 3 and 120),
  category text default 'Evento',
  description text default '',
  date date not null,
  date_end date,
  time text,
  place text default '',
  audience text default 'Toda a comunidade escolar',
  course_id bigint references courses(id),
  image_url text default '', -- caminho no bucket Storage "events", ou img/ estático
  published boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_published_date_idx on events (published, date);

-- =========================================================================
-- Gatilho: cria a linha em profiles automaticamente quando alguém se regista
-- via Supabase Auth (substitui o registo manual feito em store.js)
-- =========================================================================
create function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Utilizador'), 'ALUNO');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
