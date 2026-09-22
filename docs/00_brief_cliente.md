# 00 — Brief do Cliente

## Origem

> **Correção (2026-09-18):** este documento foi inicialmente escrito a partir de um
> documento longo ("Prompt Mestre") recebido por WhatsApp, que era uma **reformulação**
> não oficial do enunciado real e continha secções inventadas/expandidas que não constam
> do enunciado da equipa. Foi entretanto recebido o **enunciado oficial** — "Enunciado do
> Projeto Integrador" — que é a única fonte autoritativa a partir daqui. Este documento foi
> reescrito para refletir exclusivamente esse enunciado oficial.

## Equipa

**Aldir, José e Dinis.** Nome do projeto/plataforma: **ALDIJOS** — junção dos nomes dos 3
elementos da equipa ("Desde 2026").

## Cliente

Uma Escola Profissional (nome real não especificado no enunciado) que pretende modernizar
a forma como são disponibilizadas, realizadas e avaliadas atividades pedagógicas.

## Problema apresentado pelo cliente

Atualmente professores e alunos recorrem a diferentes meios para distribuir fichas,
exercícios, trabalhos e avaliações, o que dificulta:

- a centralização da informação;
- o acompanhamento das atividades;
- o registo dos resultados.

A Escola necessita de uma solução digital onde:

- professores possam disponibilizar atividades;
- alunos possam consultar e realizar essas atividades;
- os resultados possam ser registados;
- determinadas perguntas possam ser corrigidas automaticamente;
- professores possam acompanhar o desempenho dos alunos;
- atividades possam estar associadas a módulos, turmas e professores.

A plataforma deverá permitir que professores e alunos utilizem o sistema em momentos
diferentes, sem necessidade de estarem simultaneamente ligados (uso **assíncrono**).

## Utilizadores principais (definidos no enunciado)

**Administrador**
- gerir utilizadores;
- gerir cursos;
- gerir turmas;
- gerir módulos;
- associar professores e alunos.

**Professor**
- consultar módulos e turmas;
- criar atividades;
- definir prazos;
- criar perguntas;
- consultar respostas;
- atribuir ou validar classificações;
- fornecer feedback.

**Aluno**
- consultar módulos;
- visualizar atividades disponíveis;
- realizar atividades;
- consultar atividades concluídas;
- consultar classificações e feedback.

## Tipos de atividades — requisito mínimo obrigatório

> **Importante:** ao contrário do que constava na versão anterior deste documento, o
> enunciado oficial não separa estes tipos em "MVP" vs. "fora do MVP" — define-os todos
> como suporte **mínimo obrigatório** da plataforma:

- perguntas de escolha múltipla;
- perguntas de verdadeiro/falso;
- respostas curtas;
- respostas abertas;
- submissão de ficheiros.

## Correção das atividades

- Nas perguntas **objetivas** (escolha múltipla, verdadeiro/falso), o professor indica
  previamente a resposta correta e a plataforma corrige automaticamente.
- Nas perguntas de **resposta aberta** (e, por extensão, resposta curta quando não houver
  correspondência exata), a avaliação é feita pelo professor.
- **Funcionalidade avançada (opcional, a estudar, não obrigatória):** apoio de Inteligência
  Artificial à correção (analisar textos, sugerir feedback, identificar conceitos, sugerir
  classificação) — a decisão final da nota permanece **sempre** com o professor.

## Requisitos mínimos obrigatórios do protótipo

O protótipo deverá permitir demonstrar o processo:

```
Registo/Login → associação do aluno a um módulo → criação da atividade →
realização da atividade → submissão → correção → consulta do resultado
```

A aplicação deve ainda possuir:

- autenticação;
- diferentes níveis de acesso;
- base de dados;
- interface gráfica;
- registo das atividades;
- datas de submissão;
- estado da atividade;
- proteção adequada dos dados.

## O que o cliente não definiu (decisões da equipa)

O cliente não especificou: linguagem de programação, framework, sistema de base de dados,
arquitetura, design da interface, organização interna do sistema. Estas decisões devem ser
**propostas e justificadas pela equipa** — ver [04_arquitetura.md](04_arquitetura.md) e
[10_decisoes_tecnicas.md](10_decisoes_tecnicas.md).

## Regra fundamental

Este enunciado **não define** todas as regras de negócio (ex.: escala de classificação,
regras de prazo, tentativas). Decisões não especificadas não devem ser inventadas — devem
ser assinaladas como `[DECISÃO PENDENTE]` na documentação (ver
[01_analise_problema.md](01_analise_problema.md) e [02_requisitos.md](02_requisitos.md)).

## Regras de execução (processo, não só produto)

O enunciado é explícito: a equipa **não deve começar imediatamente a programar**. Antes da
implementação deve produzir: (1) análise do problema, (2) identificação dos utilizadores,
(3) requisitos funcionais, (4) requisitos não funcionais, (5) casos de utilização, (6)
modelo de dados, (7) protótipo das interfaces, (8) arquitetura proposta, (9) backlog
inicial, (10) planeamento das tarefas. Só depois se inicia o desenvolvimento. A forma como
a equipa organiza o trabalho, comunica, documenta decisões, usa controlo de versões, gere
tarefas e aplica práticas de segurança **também é avaliada** — o processo faz parte do
produto final.

## Entregáveis finais (lista oficial)

1. Documento de análise do problema
2. Requisitos funcionais e não funcionais
3. Casos de utilização
4. Diagrama/modelo da base de dados
5. Mockups ou protótipos das interfaces
6. Repositório GitHub
7. Código-fonte
8. README completo
9. Evidências de Issues, branches e Pull Requests
10. Aplicação/protótipo funcional
11. Relatório breve de testes
12. Apresentação final
13. Retrospetiva da equipa

Ferramentas mínimas obrigatórias: Git, GitHub, Issues, branches, commits, Pull Requests,
Code Review, README, quadro Kanban (ou equivalente).
