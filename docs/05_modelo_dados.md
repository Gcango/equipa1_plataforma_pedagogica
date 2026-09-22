# 05 — Modelo de Dados

> **[DECISÃO PENDENTE]** Modelo relacional inicial proposto, a validar com a arquitetura
> ([04_arquitetura.md](04_arquitetura.md)) e a evoluir à medida que as decisões pendentes de
> negócio (ver [01_analise_problema.md](01_analise_problema.md)) forem esclarecidas.

## Entidades

### User
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| name | string | |
| email | string, único | usado no login |
| password_hash | string | nunca em texto simples (RNF01) |
| role | enum (`ADMIN`, `PROFESSOR`, `ALUNO`) | ver nota sobre entidade `Role` abaixo |
| active | boolean | permite desativar sem apagar (RF03) |
| created_at | datetime | |

> `[DECISÃO PENDENTE]`: `role` como enum simples no `User` (mais simples, suficiente para
> 3 perfis fixos) vs. entidade `Role` separada com tabela de permissões (mais flexível, mas
> complexidade desnecessária para o MVP). **Recomendação:** enum simples — os 3 perfis são
> fixos e conhecidos, não há necessidade de roles configuráveis pelo Admin.

### Course (Curso)
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| name | string | |
| description | text | |
| created_at | datetime | |

### Class (Turma)
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| course_id | FK → Course | |
| name | string | ex.: "Turma A — 2026" |
| year | string/int | |

### Module (Módulo)
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| course_id | FK → Course | módulo pertence ao currículo de um curso |
| name | string | |
| description | text | |
| order | int | ordem no currículo |

### ClassEnrollment (associação Aluno ↔ Turma)
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| student_id | FK → User (role=ALUNO) | |
| class_id | FK → Class | |
| enrolled_at | datetime | |

### ModuleTeacher (associação Professor ↔ Módulo/Turma)
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| teacher_id | FK → User (role=PROFESSOR) | |
| module_id | FK → Module | |
| class_id | FK → Class | permite o mesmo módulo ser lecionado por professores diferentes em turmas diferentes |

### Activity (Atividade)
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| module_id | FK → Module | |
| class_id | FK → Class | turma-alvo da atividade |
| teacher_id | FK → User (role=PROFESSOR) | autor |
| title | string | |
| description | text | |
| deadline | datetime | |
| status | enum | ver secção "Estados da atividade" |
| created_at | datetime | |

### Question (Pergunta)
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| activity_id | FK → Activity | |
| type | enum (`MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER`, `OPEN_ANSWER`) | os 4 tipos são suporte mínimo obrigatório (RF11, RF12, RF22) — não é uma extensão futura |
| statement | text | enunciado |
| correct_boolean | boolean, nullable | usado quando `type = TRUE_FALSE` |
| order | int | |

### QuestionOption (Opção — só para escolha múltipla)
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| question_id | FK → Question | |
| text | string | |
| is_correct | boolean | definida pelo professor |

### Submission (Submissão)
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| activity_id | FK → Activity | |
| student_id | FK → User (role=ALUNO) | |
| submitted_at | datetime | |
| status | enum (`EM_CURSO`, `SUBMETIDA`, `CORRIGIDA`) | |
| file_url | string, nullable | metadado do ficheiro submetido (RF23); o ficheiro em si fica no File Storage, nunca na base de dados |

### Answer (Resposta a uma pergunta, dentro de uma submissão)
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| submission_id | FK → Submission | |
| question_id | FK → Question | |
| selected_option_id | FK → QuestionOption, nullable | para escolha múltipla |
| boolean_answer | boolean, nullable | para verdadeiro/falso |
| text_answer | text, nullable | para resposta curta/aberta (RF22) |
| is_correct | boolean, nullable | calculado pela correção automática — só se aplica a perguntas objetivas |
| score | decimal, nullable | pontuação desta resposta (automática para objetivas, manual para curta/aberta — RF24) |
| graded_manually_by | FK → User (role=PROFESSOR), nullable | preenchido quando a pontuação desta resposta foi atribuída manualmente |

### Grade (Classificação final da submissão)
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| submission_id | FK → Submission, único | |
| auto_score | decimal | soma calculada automaticamente (RF17) |
| final_score | decimal, nullable | validada/ajustada pelo professor (RF19) |
| graded_by | FK → User (role=PROFESSOR), nullable | |
| graded_at | datetime, nullable | |

### Feedback
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| submission_id | FK → Submission | |
| teacher_id | FK → User (role=PROFESSOR) | |
| text | text | |
| created_at | datetime | |

## Relações e cardinalidades

```
Course        1 ── N   Class
Course        1 ── N   Module
Class         1 ── N   ClassEnrollment   N ── 1   User (aluno)
Module + Class 1 ── N  ModuleTeacher     N ── 1   User (professor)
Module        1 ── N   Activity
Class         1 ── N   Activity
User(prof.)   1 ── N   Activity
Activity      1 ── N   Question
Question      1 ── N   QuestionOption        (só quando type = MULTIPLE_CHOICE)
Activity      1 ── N   Submission
User(aluno)   1 ── N   Submission
Submission    1 ── N   Answer
Question      1 ── N   Answer
Submission    1 ── 1   Grade
Submission    1 ── N   Feedback
```

## DER (diagrama entidade-relação, simplificado)

```
 User (role=ALUNO) 1───N ClassEnrollment N───1 Class N───1 Course
                                                  │
 User (role=PROFESSOR) 1───N ModuleTeacher N──────┘
                                  │
                                  N
                                Module N───1 Course
                                  │1
                                  N
                              Activity N───1 Class
                                  │1        │1
                                  N         │
                              Question      │
                              │1   │        │
                              N    N        │
                    QuestionOption Answer N─┴─1 Submission N───1 User(ALUNO)
                                              │1
                                       ┌──────┼──────┐
                                       N      1       N
                                   (via Q)  Grade   Feedback
```

## Regras de integridade

- Um `Answer` só pode referenciar uma `Question` que pertença à mesma `Activity` da
  `Submission` a que está associado.
- `selected_option_id` só é válido quando `Question.type = MULTIPLE_CHOICE`;
  `boolean_answer` só é válido quando `Question.type = TRUE_FALSE`; `text_answer` só é
  válido quando `Question.type` é `SHORT_ANSWER` ou `OPEN_ANSWER` (regra aplicada na
  camada de serviço, não apenas na base de dados).
- `Answer.is_correct`/`score` de perguntas `SHORT_ANSWER`/`OPEN_ANSWER` só são preenchidos
  depois de correção manual do professor (RF24) — ficam `null` enquanto pendentes.
- Não é possível apagar um `Module`/`Course` com `Activity`/`Class` associadas sem
  tratamento explícito (soft delete ou bloqueio) — `[DECISÃO PENDENTE]`.
- `Grade.submission_id` é único — uma submissão tem exatamente uma classificação final.
- `Submission` é única por par (`activity_id`, `student_id`) **se** não houver múltiplas
  tentativas — `[DECISÃO PENDENTE]` (ver pergunta 5 em 01_analise_problema.md); se
  múltiplas tentativas vierem a ser permitidas, adicionar campo `attempt_number`.

## Estados da atividade (proposta, a validar pela equipa)

```
Rascunho → Publicada → (prazo a decorrer) → Encerrada
```

Não se assume um fluxo mais complexo (ex.: "Em curso", "Submetida", "Corrigida" ao nível da
*atividade* em vez da *submissão*) sem confirmação da equipa — ver secção 18 do brief.

## Implementação atual (2026-09-20)

O modelo acima está implementado como um documento JSON persistido no browser (`store.js`), com as mesmas entidades e relações.
Diferenças assumidas: `Grade` e `Feedback` foram fundidos em `Submission` (`autoScore`, `finalScore`, `gradedBy`, `gradedAt`, `feedback`),
como sugerido pela equipa; os ficheiros anexos vivem em `Submission.files[]` (ainda não num File Storage separado).

### Event (Evento) — novo
| Campo | Tipo | Notas |
|---|---|---|
| id | PK | |
| courseId | FK → Course, nullable | ramo; `null` = toda a escola |
| title, category, description | string | descrição curta (≤ 300) |
| date, dateEnd | date | `dateEnd` opcional |
| time / timeNote | string | hora opcional ou nota ("horário no programa") |
| place, audience | string | local vazio = "Online" |
| image | caminho ou data URL | ≤ 300 KB; sem imagem usa a foto do ramo |
| published | boolean | visível na página inicial e nos painéis |
