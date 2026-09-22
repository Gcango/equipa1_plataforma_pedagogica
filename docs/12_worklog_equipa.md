# 12 — Worklog da Equipa

Registo semanal do trabalho real realizado (não inventar atividades retroativamente —
secção 29 do brief).

## Modelo de entrada semanal

```
## Semana [N] — [data início] a [data fim]

### Feito
-

### Quem fez o quê
- Membro 1:
- Membro 2:
- Membro 3:

### Issues
- Abertas:
- Fechadas:

### Pull Requests
- Criados:
- Fundidos (merged):

### Problemas
-

### Próximas tarefas
-
```

---

## Semana 1 — [DATA A PREENCHER]

### Feito
- Análise inicial do brief e da documentação de suporte.
- Criação da estrutura de documentação do projeto (`docs/`).
- Proposta inicial de arquitetura, stack tecnológica e modelo de dados (a validar pela
  equipa — ver [10_decisoes_tecnicas.md](10_decisoes_tecnicas.md)).
- Protótipo clicável inicial dos 3 painéis (Aluno/Professor/Admin).
- **Correção de âmbito:** recebido o enunciado oficial ("Enunciado do Projeto Integrador"),
  que substitui o documento "Prompt Mestre" usado inicialmente. Principal correção: resposta
  curta, resposta aberta e submissão de ficheiros são requisitos **mínimos obrigatórios**,
  não funcionalidades futuras — RF/modelo de dados/backlog atualizados em conformidade.

### Quem fez o quê
- Aldir, José, Dinis — a detalhar por tarefa pela equipa.

### Issues
- A preencher assim que o repositório GitHub e o Kanban forem configurados.

### Pull Requests
- A preencher.

### Problemas
- Nenhum registado ainda.

### Próximas tarefas
- Validar com a equipa a proposta de arquitetura/stack (ADRs em
  [10_decisoes_tecnicas.md](10_decisoes_tecnicas.md)).
- Responder às perguntas ao cliente/professor listadas em
  [01_analise_problema.md](01_analise_problema.md).
- Avançar para o setup do projeto (FASE 8) após validação.

## Semana 1 (continuação) — 2026-09-19/20

### Feito
- Página inicial reformulada: destaque só com etiquetas, "Quem somos", "Como funciona" resumido, cursos com fotografias,
  eventos por ramo (3 por ramo, cada um com foto própria), números em tempo real com animações.
- Plataforma funcional: login por conta/perfil, painéis de aluno, professor e administração ligados a dados persistentes;
  criar/publicar atividades, responder, submeter, correção automática e manual, resultados e feedback.
- Testes automatizados (28) e auditoria de funcionalidades ([13_auditoria_funcionalidades.md](13_auditoria_funcionalidades.md)).

### Próximas tarefas
- Confirmar com o professor se o armazenamento no browser cumpre "base de dados" (ver [DECISÃO PENDENTE] na auditoria).
