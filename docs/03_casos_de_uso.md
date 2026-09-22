# 03 — Casos de Utilização

## Atores

- **Administrador** — gere a estrutura institucional (utilizadores, cursos, turmas, módulos, associações).
- **Professor** — gere atividades, perguntas, correção e feedback dentro dos seus módulos/turmas.
- **Aluno** — realiza atividades e consulta resultados/feedback dos seus próprios módulos/turmas.

## Lista de Casos de Utilização

| ID | Nome | Ator(es) principal(is) | Requisitos relacionados |
|---|---|---|---|
| UC01 | Iniciar sessão | Administrador, Professor, Aluno | RF01, RF02, RNF01–RNF03 |
| UC02 | Gerir utilizadores | Administrador | RF03 |
| UC03 | Gerir cursos | Administrador | RF04 |
| UC04 | Gerir turmas | Administrador | RF05 |
| UC05 | Gerir módulos | Administrador | RF06 |
| UC06 | Associar professor a módulo/turma | Administrador | RF07 |
| UC07 | Associar aluno a turma | Administrador | RF08 |
| UC08 | Consultar módulos/turmas próprias | Professor | RF09 |
| UC09 | Criar atividade | Professor | RF10 |
| UC10 | Adicionar perguntas (escolha múltipla / V-F) | Professor | RF11, RF12 |
| UC11 | Publicar atividade | Professor | RF13 |
| UC12 | Consultar módulos associados | Aluno | RF14 |
| UC13 | Visualizar atividades disponíveis | Aluno | RF15 |
| UC14 | Realizar e submeter atividade | Aluno | RF16 |
| UC15 | Corrigir atividade (automática) | Sistema | RF17 |
| UC16 | Consultar submissões de uma atividade | Professor | RF18 |
| UC17 | Validar classificação e dar feedback | Professor | RF19 |
| UC18 | Consultar resultado e feedback | Aluno | RF20 |

## Descrição detalhada dos casos principais

### UC01 — Iniciar sessão

- **Ator:** Administrador, Professor, Aluno
- **Pré-condições:** Utilizador já existe no sistema (criado pelo Administrador — ver
  `[DECISÃO PENDENTE]` em 02_requisitos.md sobre autorregisto).
- **Fluxo principal:**
  1. Utilizador introduz email/username e password.
  2. Sistema valida credenciais no backend.
  3. Sistema cria sessão/token e redireciona para o dashboard correspondente ao role.
- **Fluxo alternativo:** Credenciais inválidas → mensagem de erro genérica, sem sessão criada.
- **Pós-condições:** Utilizador autenticado, com acesso apenas às funcionalidades do seu perfil.

### UC09 — Criar atividade

- **Ator:** Professor
- **Pré-condições:** Professor autenticado e associado a pelo menos um módulo/turma.
- **Fluxo principal:**
  1. Professor seleciona o módulo/turma.
  2. Professor preenche título, descrição e prazo da atividade.
  3. Atividade é criada em estado "Rascunho" (ver estados em [10_decisoes_tecnicas.md](10_decisoes_tecnicas.md)).
- **Pós-condições:** Atividade disponível para adicionar perguntas (UC10), ainda não visível
  para alunos até ser publicada (UC11).

### UC14 — Realizar e submeter atividade

- **Ator:** Aluno
- **Pré-condições:** Atividade publicada, dentro do prazo, aluno pertence à turma associada.
- **Fluxo principal:**
  1. Aluno abre a atividade e responde às perguntas.
  2. Aluno submete a atividade.
  3. Sistema regista a submissão com data/hora.
  4. Sistema despoleta a correção automática (UC15).
- **Fluxo alternativo:** Prazo expirado → comportamento definido conforme
  `[DECISÃO PENDENTE]` (ver 01_analise_problema.md, pergunta 4).
- **Pós-condições:** Submissão registada; resultado disponível assim que a correção
  automática/validação do professor for concluída.

### UC15 — Corrigir atividade (correção automática)

- **Ator:** Sistema (despoletado por UC14)
- **Fluxo principal:**
  1. Sistema percorre as respostas da submissão.
  2. Para cada pergunta objetiva, compara a resposta do aluno com a resposta correta
     definida pelo professor.
  3. Sistema calcula a pontuação da submissão.
- **Pós-condições:** Pontuação calculada e disponível para o Professor validar (UC17) e,
  após validação, para o Aluno consultar (UC18).

## Diagrama de casos de utilização

```
                 ┌───────────────────────────────────────────────┐
                 │                    Sistema ALDIJOS             │
                 │                                                │
   Administrador │  UC02 Gerir utilizadores                       │
       ●─────────┼─ UC03 Gerir cursos                             │
       │         │  UC04 Gerir turmas                             │
       │         │  UC05 Gerir módulos                            │
       │         │  UC06 Associar professor                       │
       │         │  UC07 Associar aluno                           │
       │         │                                                │
       │         │  UC01 Iniciar sessão  ◄────────────────────────┼──● Professor
       │         │                                                │  │
       └─────────┼─►(comum aos 3 atores)                          │  ├─ UC08 Consultar módulos/turmas
                 │                                                │  ├─ UC09 Criar atividade
                 │                                                │  ├─ UC10 Adicionar perguntas
                 │                                                │  ├─ UC11 Publicar atividade
                 │                                                │  ├─ UC16 Consultar submissões
                 │                                                │  └─ UC17 Validar nota / feedback
                 │                                                │
                 │  UC15 Corrigir atividade (automática) ◄────────┼── (despoletado por UC14)
                 │                                                │
                 └────────────────────────────────────────────────┘
                                                                   │
                                                            Aluno ●┤
                                                                   ├─ UC12 Consultar módulos
                                                                   ├─ UC13 Ver atividades disponíveis
                                                                   ├─ UC14 Realizar/submeter atividade
                                                                   └─ UC18 Consultar resultado/feedback
```

*(Diagrama ASCII de apoio; recomenda-se refazer em ferramenta de diagramação — ex. FigJam/
draw.io — junto com os mockups em [06_mockups.md](06_mockups.md).)*
