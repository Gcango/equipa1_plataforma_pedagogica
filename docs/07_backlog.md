# 07 — Backlog

Backlog decomposto a partir de [11_backlog_inicial_sugerido.md](11_backlog_inicial_sugerido.md)
e dos requisitos em [02_requisitos.md](02_requisitos.md). Cada User Story relevante deve
corresponder a uma Issue no GitHub (secção 22/26 do brief).

## Definition of Done

Uma tarefa só é considerada concluída quando:

- [ ] implementada
- [ ] testada
- [ ] revista (code review)
- [ ] documentada quando necessário
- [ ] PR criado
- [ ] PR aprovado
- [ ] merge concluído

## Sprint 0 — Setup (FASE 8)

| ID | Tarefa | Responsável sugerido | Depende de |
|---|---|---|---|
| T00.1 | Setup do projeto Next.js + TypeScript + Tailwind | Membro 1 (Team Lead) | Validação da stack (ADRs) |
| T00.2 | Configuração Prisma + PostgreSQL (schema inicial) | Membro 3 (Backend/DB) | Modelo de dados validado |
| T00.3 | Estrutura de pastas e convenções de código | Membro 1 | T00.1 |
| T00.4 | Configuração GitHub (branches, template de Issue/PR, Kanban) | Membro 1 | — |
| T00.5 | Design system base (tokens de cor, tipografia, componentes base) | Membro 2 (Frontend/UI) | Mockups iniciais |

## Épico: Autenticação (US01)

| ID | Tarefa | Responsável sugerido |
|---|---|---|
| T01.1 | Modelo `User` + hash de password (RNF01) | Membro 3 |
| T01.2 | Endpoint de login + emissão de JWT em cookie httpOnly (RNF03) | Membro 3 |
| T01.3 | Middleware de autorização por role (RNF02) | Membro 3 |
| T01.4 | Página de login (UI) | Membro 2 |
| T01.5 | Redirecionamento pós-login por role para o dashboard correto | Membro 1 |

## Épico: Gestão de utilizadores, cursos, turmas e módulos (US02, US03)

| ID | Tarefa | Responsável sugerido |
|---|---|---|
| T02.1 | CRUD de utilizadores (Admin) — backend | Membro 3 |
| T02.2 | CRUD de utilizadores — UI | Membro 2 |
| T02.3 | CRUD de cursos — backend + UI | Membro 3 / Membro 2 |
| T02.4 | CRUD de turmas — backend + UI | Membro 3 / Membro 2 |
| T02.5 | CRUD de módulos — backend + UI | Membro 3 / Membro 2 |
| T02.6 | Associação Professor ↔ Módulo/Turma | Membro 1 |
| T02.7 | Associação Aluno ↔ Turma | Membro 1 |

## Épico: Atividades e perguntas (US04, US05)

| ID | Tarefa | Responsável sugerido |
|---|---|---|
| T03.1 | Modelo `Activity`/`Question`/`QuestionOption` (Prisma) | Membro 3 |
| T03.2 | Endpoint de criação de atividade (Professor) | Membro 3 |
| T03.3 | UI de criação de atividade + definição de prazo | Membro 2 |
| T03.4 | UI/endpoint de criação de perguntas (escolha múltipla) | Membro 2 / Membro 3 |
| T03.5 | UI/endpoint de criação de perguntas (verdadeiro/falso) | Membro 2 / Membro 3 |
| T03.6 | Publicação de atividade (mudança de estado) | Membro 1 |

## Épico: Perguntas de resposta curta, aberta e submissão de ficheiros (RF22, RF23 — mínimo obrigatório)

| ID | Tarefa | Responsável sugerido |
|---|---|---|
| T03.7 | UI/endpoint de criação de perguntas de resposta curta e resposta aberta | Membro 2 / Membro 3 |
| T03.8 | Integração de File Storage (upload) e campo de submissão de ficheiro na atividade | Membro 3 |

## Épico: Submissão e correção (US06, US07)

| ID | Tarefa | Responsável sugerido |
|---|---|---|
| T04.1 | UI de realização/resposta a atividade (Aluno), incluindo resposta curta/aberta e upload de ficheiro | Membro 2 |
| T04.2 | Endpoint de submissão de respostas (objetivas, curtas/abertas e ficheiro) | Membro 3 |
| T04.3 | Serviço de correção automática determinística das perguntas objetivas (RNF09) | Membro 3 |
| T04.4 | Testes automatizados da correção automática | Membro 3 / Membro 1 |
| T04.5 | Verificação de posse do recurso (aluno só vê as suas submissões — RF21) | Membro 1 |
| T04.6 | UI/endpoint de correção manual de respostas curtas/abertas e ficheiros pelo professor (RF24) | Membro 3 / Membro 2 |

## Épico: Resultados e feedback (US08)

| ID | Tarefa | Responsável sugerido |
|---|---|---|
| T05.1 | UI/endpoint de consulta de submissões pelo Professor | Membro 2 / Membro 3 |
| T05.2 | Validação/ajuste de nota + registo de feedback (Professor) | Membro 3 |
| T05.3 | UI/endpoint de consulta de resultado + feedback (Aluno) | Membro 2 / Membro 3 |
| T05.4 | Dashboard do Aluno (resumo, pendentes, concluídas, prazos) | Membro 2 |
| T05.5 | Dashboard do Professor (turmas, pendentes de correção, desempenho) | Membro 2 |
| T05.6 | Dashboard do Administrador (totais, atalhos de gestão) | Membro 2 |

## Backlog futuro (funcionalidade avançada/opcional — não obrigatória, não iniciar sem validação)

| ID | Tarefa |
|---|---|
| TF.1 | Apoio de IA à correção de respostas abertas (RF25) — decisão final sempre do professor |
| TF.2 | Múltiplas tentativas por atividade (se validado) |

## Divisão por membro (visão geral, não silos — ver secção 28 do brief)

- **Membro 1 (Team Leader):** análise, requisitos, arquitetura, documentação, integração,
  organização GitHub, revisão de código, e desenvolvimento full-stack transversal.
- **Membro 2 (Frontend/UI):** design system, componentes, os três dashboards, formulários,
  responsividade — participa também em integração e revisão.
- **Membro 3 (Backend/DB):** API, base de dados, autenticação/autorização, submissões,
  correção automática, File Storage — participa também em integração e revisão.

Todos os membros devem fazer commits e Pull Requests em todas as áreas ao longo do
projeto, evitando silos de conhecimento.
