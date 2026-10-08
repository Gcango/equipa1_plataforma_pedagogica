-- Ajuste: cursos/turmas/módulos ainda não foram migrados para o Supabase
-- (continuam só no armazenamento local, por agora). Por isso "course_id" em
-- events não pode ser uma chave estrangeira real para já — passa a um texto
-- livre que guarda o id do curso local (ex.: "c1"), sem validação cruzada.
-- Quando cursos/turmas forem migrados (fase seguinte), isto volta a ligar-se
-- com uma referência real.
alter table events drop constraint events_course_id_fkey;
alter table events alter column course_id type text using course_id::text;
