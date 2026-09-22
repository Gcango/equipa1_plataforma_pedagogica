# 02 — Requisitos

Prioridades: **Alta** (requisito mínimo obrigatório, definido no enunciado oficial),
**Média** (desejável, pode ficar para depois do mínimo obrigatório), **Baixa** (funcionalidade
avançada/opcional, não pedida pelo cliente).

> **Correção (2026-09-18):** RF22/RF23 estavam classificados como "Baixa/fora do MVP" numa
> versão anterior deste documento, baseada num "Prompt Mestre" não oficial. O enunciado
> oficial ("Enunciado do Projeto Integrador") define resposta curta, resposta aberta e
> submissão de ficheiros como suporte **mínimo obrigatório** — foram corrigidos para
> prioridade Alta e passa a existir RF24 para a avaliação manual de respostas curtas/abertas.

## Requisitos Funcionais

| Código | Descrição | Ator | Prioridade | Critérios de aceitação |
|---|---|---|---|---|
| RF01 | O sistema deve permitir que um utilizador inicie sessão com email/username e password. | Todos | Alta | Login válido devolve sessão autenticada; login inválido é rejeitado com mensagem genérica (sem indicar se o email existe). |
| RF02 | O sistema deve distinguir três perfis (roles): Administrador, Professor, Aluno, e mostrar funcionalidades/dashboard de acordo com o perfil. | Todos | Alta | Utilizador só vê e acede às rotas/ações do seu próprio perfil; tentativa de aceder a rotas de outro perfil é bloqueada no backend. |
| RF03 | O Administrador deve poder criar, editar, consultar e desativar utilizadores (Professores e Alunos). | Admin | Alta | Novo utilizador criado fica disponível para login; utilizador desativado não consegue autenticar-se. |
| RF04 | O Administrador deve poder criar e gerir Cursos. | Admin | Alta | CRUD de curso funcional. |
| RF05 | O Administrador deve poder criar e gerir Turmas, associadas a um Curso. | Admin | Alta | CRUD de turma funcional; turma associada a um curso. |
| RF06 | O Administrador deve poder criar e gerir Módulos, associados a um Curso. | Admin | Alta | CRUD de módulo funcional. |
| RF07 | O Administrador deve poder associar Professores a Módulos/Turmas. | Admin | Alta | Associação refletida no dashboard do professor. |
| RF08 | O Administrador deve poder associar Alunos a Turmas. | Admin | Alta | Associação refletida no dashboard do aluno (módulos visíveis). |
| RF09 | O Professor deve poder consultar os módulos e turmas que lhe estão associados. | Professor | Alta | Lista apenas módulos/turmas do próprio professor. |
| RF10 | O Professor deve poder criar uma Atividade associada a um Módulo, com título, descrição e prazo. | Professor | Alta | Atividade criada fica associada ao módulo/turma e ao professor autor. |
| RF11 | O Professor deve poder adicionar perguntas de escolha múltipla a uma atividade, definindo as opções e marcando a(s) opção(ões) correta(s). | Professor | Alta | Pergunta gravada com opções e resposta correta; não é possível gravar sem pelo menos uma opção correta. |
| RF12 | O Professor deve poder adicionar perguntas de verdadeiro/falso a uma atividade, definindo a resposta correta. | Professor | Alta | Pergunta gravada com resposta correta definida. |
| RF13 | O Professor deve poder publicar uma atividade, tornando-a visível para os alunos da turma associada. | Professor | Alta | Atividade só é visível ao aluno depois de publicada. |
| RF14 | O Aluno deve poder consultar os módulos associados às suas turmas. | Aluno | Alta | Lista apenas módulos das turmas em que está inscrito. |
| RF15 | O Aluno deve poder visualizar as atividades publicadas e disponíveis (dentro do prazo) de um módulo. | Aluno | Alta | Lista de atividades disponíveis correta por aluno/turma. |
| RF16 | O Aluno deve poder responder às perguntas de uma atividade e submeter as respostas. | Aluno | Alta | Submissão fica registada com data/hora e associada ao aluno e à atividade. |
| RF17 | O sistema deve corrigir automaticamente, de forma determinística, as perguntas **objetivas** (escolha múltipla e verdadeiro/falso) após a submissão. Perguntas de resposta curta/aberta não são corrigidas automaticamente (ver RF24). | Sistema | Alta | Pontuação calculada coincide sempre com a comparação resposta do aluno vs. resposta correta definida pelo professor. |
| RF18 | O Professor deve poder consultar as submissões de uma atividade e a respetiva pontuação calculada automaticamente. | Professor | Alta | Lista de submissões por atividade, com estado (corrigida/pendente). |
| RF19 | O Professor deve poder validar/ajustar a classificação final de uma submissão e adicionar feedback em texto. | Professor | Alta | Classificação final e feedback ficam associados à submissão e visíveis ao aluno. |
| RF20 | O Aluno deve poder consultar as suas atividades concluídas, respetiva classificação e feedback. | Aluno | Alta | Aluno só vê as suas próprias submissões/notas/feedback. |
| RF21 | Um utilizador nunca deve conseguir aceder a dados de outro utilizador alterando um identificador na URL/pedido (ex.: `submission_id`, `student_id`). | Sistema | Alta | Pedido a recurso de outro utilizador devolve erro de autorização (403), verificado no backend. |
| RF22 | O Professor deve poder adicionar perguntas de **resposta curta** e de **resposta aberta** a uma atividade. | Professor | Alta | Pergunta gravada com enunciado; sem resposta "correta" pré-definida (avaliação é manual — ver RF24). |
| RF23 | O sistema deve suportar **submissão de ficheiros** pelo aluno, com o ficheiro guardado em File Storage e apenas os metadados (nome, url, tipo, tamanho) na base de dados. | Aluno | Alta | Estrutura prevista em [04_arquitetura.md](04_arquitetura.md) e [05_modelo_dados.md](05_modelo_dados.md); ficheiro nunca gravado diretamente na base de dados. |
| RF24 | O Professor deve poder consultar e classificar manualmente as respostas curtas/abertas e as submissões de ficheiro, atribuindo uma nota e feedback. | Professor | Alta | Nota manual do professor é combinada com a nota automática das perguntas objetivas para formar a classificação final da submissão (RF19). |
| RF25 | *(Funcionalidade avançada, opcional — não obrigatória)* O sistema pode oferecer apoio de Inteligência Artificial à correção de respostas abertas (ex.: sugerir feedback ou uma possível classificação). | Sistema | Baixa | A decisão final da nota permanece sempre do professor; a sugestão da IA nunca é aplicada automaticamente sem validação humana. |
| RF26 | O Administrador deve poder criar, editar, ocultar/publicar e eliminar **eventos** (título, categoria, ramo, descrição, data, hora, local, público-alvo, imagem). Os eventos publicados aparecem na página inicial e nos painéis de alunos e professores. | Admin | Média | Evento oculto deixa de ser público; validação de datas e imagem (implementado e testado). |
| RF27 | A página inicial deve mostrar números (cursos, atividades publicadas, alunos, professores, atividades concluídas) **calculados a partir dos dados**, atualizados em tempo real (também entre separadores). | Sistema | Média | Alterar dados (ex.: criar aluno) reflete-se logo nos números (implementado e testado). |
| RF28 | Qualquer pessoa pode criar uma conta de **aluno** (nunca professor/administrador); a administração associa depois o aluno a uma turma. | Aluno | Média | Registo valida email/palavra-passe e impede duplicados. |

## Requisitos Não Funcionais

| Código | Descrição | Categoria | Prioridade | Justificação |
|---|---|---|---|---|
| RNF01 | Passwords nunca são armazenadas em texto simples — devem ser guardadas com hash (ex.: bcrypt/argon2). | Segurança | Alta | Proteção de dados pessoais e boas práticas de segurança (secção 31 do brief). |
| RNF02 | Toda a autorização (verificação de perfil/role e de posse do recurso) é validada no backend, nunca apenas no frontend. | Segurança | Alta | Requisito explícito do brief (secção 14 e 31); o frontend é apenas UX, não é barreira de segurança. |
| RNF03 | As sessões/tokens de autenticação devem ter expiração e ser geridos de forma segura (ex.: cookies `httpOnly`/`secure`, ou JWT com validade curta). | Segurança | Alta | Evita sequestro de sessão e reduz janela de exposição em caso de fuga de token. |
| RNF04 | Todos os inputs recebidos pelo backend devem ser validados (tipo, formato, limites) antes de serem processados ou persistidos. | Segurança | Alta | Previne injeção, dados corrompidos e comportamento inesperado. |
| RNF05 | Mensagens de erro apresentadas ao utilizador não devem expor detalhes internos (stack traces, queries, nomes de tabelas). | Segurança | Alta | Evita fuga de informação que facilite ataques. |
| RNF06 | A interface deve ser responsiva, funcionando em desktop e em ecrãs de tablet/telemóvel para os fluxos principais do aluno. | Usabilidade | Alta | Alunos podem aceder fora do contexto de sala de aula, em diferentes dispositivos. |
| RNF07 | A interface deve seguir um design system consistente (cores, tipografia, componentes) em todos os dashboards. | Usabilidade | Média | Consistência visual e curva de aprendizagem menor para os três perfis. |
| RNF08 | O sistema deve fornecer feedback visual para estados de carregamento, vazio, erro e sucesso em todas as operações relevantes. | Usabilidade | Média | Reduz ambiguidade sobre se uma ação (ex.: submissão) foi ou não concluída com sucesso. |
| RNF09 | A correção automática de perguntas objetivas deve ser determinística e coberta por testes automatizados. | Manutenibilidade / Qualidade | Alta | É a funcionalidade central do MVP; um erro de cálculo de nota compromete a confiança no sistema. |
| RNF10 | O código deve seguir uma estrutura de projeto documentada e um workflow Git com branches, Pull Requests e Code Review (ver secção 24–27 do brief). | Manutenibilidade | Alta | Requisito académico explícito; facilita revisão entre os 3 membros da equipa. |
| RNF11 | O sistema deve garantir integridade referencial dos dados (ex.: não é possível submeter respostas para uma atividade inexistente, nem apagar um módulo com atividades associadas sem tratamento explícito). | Integridade de dados | Alta | Evita estados inconsistentes na base de dados. |
| RNF12 | O sistema deve estar disponível e funcional durante a demonstração/apresentação académica (ambiente de deployment estável, sem dependência de serviços pagos incertos). | Disponibilidade | Média | Requisito prático do contexto académico (secção 39 do brief). |
| RNF13 | O tempo de resposta das operações principais (login, listar atividades, submeter) deve ser percetivelmente rápido (ordem de 1–2s) num ambiente de demonstração normal. | Desempenho | Baixa | Não é uma aplicação de alta escala; o foco é usabilidade percebida, não performance sob carga. |
| RNF14 | Dados pessoais de alunos e professores só devem ser acedidos/expostos a quem tem legitimidade para tal (Admin vê tudo; Professor vê os seus alunos/turmas; Aluno vê só os seus próprios dados). | Proteção de dados | Alta | Consequência direta de RF21 e de boas práticas de proteção de dados pessoais em contexto escolar. |

> Requisitos adicionais poderão ser criados à medida que decisões pendentes (ver
> [01_analise_problema.md](01_analise_problema.md)) forem esclarecidas — não se antecipam
> aqui requisitos que dependam de decisões de negócio ainda não tomadas (ex.: número máximo
> de tentativas, regras de reabertura de prazo).
