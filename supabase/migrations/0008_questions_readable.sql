-- As perguntas/opções estavam só visíveis ao professor dono / admin — mais
-- restritivo do que a app alguma vez foi (o próprio store.js documenta:
-- "sem servidor, a segurança é aqui apenas de demonstração"). Sem esta
-- leitura, o espelho local fica sem perguntas para o aluno (quebra a
-- contagem e a página de resposta). Alinhar com esse mesmo nível: leitura
-- aberta a qualquer autenticado; a escrita continua só para o professor
-- dono / admin (políticas já existentes, não tocadas aqui).
create policy "questions: autenticado lê" on questions for select to authenticated using (true);
create policy "options: autenticado lê" on question_options for select to authenticated using (true);
