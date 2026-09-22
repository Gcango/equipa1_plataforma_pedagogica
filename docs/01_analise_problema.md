# 01 — Análise do Problema

## Cliente

Escola profissional (nome real da instituição — `[DECISÃO PENDENTE]`, ver secção
"Perguntas ao cliente"). Projeto/plataforma interna designada **ALDIJOS**.

## Problema atual

A escola distribui, recolhe e avalia atividades pedagógicas (fichas, exercícios, trabalhos,
avaliações) através de meios dispersos e não centralizados. Isto gera:

1. **Falta de centralização** — não existe um local único onde professores publiquem
   atividades e alunos as consultem.
2. **Dificuldade de acompanhamento** — professores não têm visão agregada de quem
   completou/não completou uma atividade.
3. **Registo de resultados disperso** — notas e feedback não ficam associados de forma
   consistente ao aluno e à atividade.
4. **Correção manual e lenta** — mesmo perguntas objetivas (escolha múltipla,
   verdadeiro/falso) são corrigidas manualmente.
5. **Falta de visibilidade do desempenho** — nem professores nem alunos conseguem consultar
   facilmente a evolução ao longo do tempo.

## Objetivo da solução

Construir uma plataforma web única, com autenticação e três perfis de acesso
(Administrador, Professor, Aluno), que suporte o fluxo assíncrono completo:

```
Login → aluno associado a módulo → professor cria atividade com perguntas →
aluno realiza e submete → sistema corrige questões objetivas →
professor valida/dá feedback → aluno consulta resultado e feedback
```

## Utilizadores e necessidades

| Perfil | Necessidade principal |
|---|---|
| Administrador | Configurar a estrutura institucional (utilizadores, cursos, turmas, módulos) e as associações entre eles, com o mínimo de fricção. |
| Professor | Criar e publicar atividades rapidamente, sem depender de outros meios (email, papel), e acompanhar quem respondeu e com que resultado. |
| Aluno | Saber, num único sítio, o que tem para fazer, até quando, e consultar os resultados e o feedback recebido. |

## Funcionalidades mínimas obrigatórias (definidas no enunciado oficial)

> **Correção (2026-09-18):** o enunciado oficial não separa estas funcionalidades em
> "MVP" vs. "fora do MVP" — define-as todas como suporte mínimo obrigatório da plataforma.
> A versão anterior deste documento (baseada num "Prompt Mestre" não oficial) empurrava
> resposta curta, resposta aberta e submissão de ficheiros para "fora do MVP" — isso estava
> incorreto e foi corrigido.

- Autenticação (login) com 3 perfis (Admin, Professor, Aluno) e diferentes níveis de acesso
- Gestão de utilizadores, cursos, turmas e módulos (Admin)
- Associação de professores a módulos/turmas e de alunos a turmas
- Criação de atividades associadas a um módulo, com prazo e estado
- Perguntas de escolha múltipla, verdadeiro/falso, resposta curta, resposta aberta
- Submissão de respostas pelo aluno, incluindo submissão de ficheiros quando aplicável
- Correção automática determinística das questões objetivas (escolha múltipla, V/F)
- Avaliação pelo professor das perguntas de resposta curta/aberta
- Consulta de resultados e feedback pelo aluno
- Consulta de submissões, correção/validação de nota e registo de feedback pelo professor
- Base de dados real, interface gráfica e proteção adequada dos dados

## Funcionalidade avançada e opcional (não obrigatória)

- Apoio de Inteligência Artificial à correção de perguntas abertas (analisar texto, sugerir
  feedback/classificação) — a decisão final da nota permanece **sempre** com o professor.
  Só deve ser estudada depois do mínimo obrigatório estar completo e só com decisão
  explícita da equipa.

## Perguntas ao cliente (a validar — não respondidas por nós)

Estas questões não devem ser assumidas; ficam registadas aqui e detalhadas com
opções/impacto em [02_requisitos.md](02_requisitos.md) e [10_decisoes_tecnicas.md](10_decisoes_tecnicas.md):

1. Qual o nome oficial da escola/instituição (para efeitos de identidade visual e textos)?
2. Qual a escala de classificação a usar (0–20, 0–100, percentagem)?
3. As atividades podem ser editadas depois de já existirem submissões?
4. O que acontece a uma atividade não submetida após o prazo (bloqueia, aceita com
   penalização, fica marcada como "em atraso")?
5. Existe limite de tentativas por atividade, ou é sempre uma única tentativa?
6. Quem pode criar novos utilizadores — apenas o Administrador, ou também autorregisto
   (com aprovação)? Como funciona a recuperação de password?
7. Os alunos podem ver as respostas corretas depois de corrigidos, ou só a nota/feedback?
8. Um módulo pode ser lecionado em várias turmas em simultâneo, por mais que um professor?
9. Quais os limites de tamanho e tipos de ficheiro permitidos, quando a submissão de
   ficheiros for implementada?
10. Que dados exatos deve o Administrador poder ver/editar sobre alunos e professores
    (proteção de dados pessoais)?

> Nota: estas perguntas não têm resposta assumida neste documento — ver processo de
> `[DECISÃO PENDENTE]` descrito em [00_brief_cliente.md](00_brief_cliente.md).
