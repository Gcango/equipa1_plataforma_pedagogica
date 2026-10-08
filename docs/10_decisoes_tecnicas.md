# 10 — Decisões Técnicas (ADRs)

> Todas as decisões abaixo estão marcadas como **[PROPOSTA — pendente de validação]** até
> a equipa (e, se aplicável, o professor/orientador) as confirmar. Nenhuma foi ainda
> implementada.

## Formato

```
ADR-XXX
Data:
Decisão:
Contexto:
Alternativas:
Justificação:
Consequências:
```

---

## ADR-001 — Frontend e Backend na mesma aplicação (Next.js)

- **Data:** 2026-09-18
- **Estado:** [PROPOSTA — pendente de validação]
- **Decisão:** Usar Next.js (App Router) com TypeScript para frontend e backend (API
  routes / route handlers) na mesma aplicação.
- **Contexto:** Equipa de 3 estudantes, prazo académico, necessidade de 3 dashboards
  distintos numa única aplicação (secção 15 do brief).
- **Alternativas:** (a) React SPA + backend Express/NestJS separado; (b) Next.js full-stack.
- **Justificação:** (b) reduz o número de peças de infraestrutura a manter e explicar na
  apresentação, partilha tipos entre frontend/backend, e é a opção com curva de
  aprendizagem mais direta para a equipa.
- **Consequências:** Menor separação clássica frontend/backend (aceitável para o contexto
  académico); acoplamento ao ecossistema Next.js/Vercel para deployment.

## ADR-002 — Base de dados relacional (PostgreSQL) via Prisma

- **Data:** 2026-09-18
- **Estado:** [PROPOSTA — pendente de validação]
- **Decisão:** PostgreSQL como base de dados, acedida via Prisma ORM.
- **Contexto:** Modelo de dados claramente relacional (secção 12 do brief; ver
  [05_modelo_dados.md](05_modelo_dados.md)), com várias relações e necessidade de
  integridade referencial (RNF11).
- **Alternativas:** MySQL + Prisma; SQLite (simples mas limitado para deployment
  multi-utilizador); Drizzle ORM em vez de Prisma.
- **Justificação:** Postgres tem suporte maduro a constraints e enums; Prisma tem melhor
  documentação e curva de aprendizagem para uma equipa académica, com migrações
  automáticas que reduzem erros manuais de schema.
- **Consequências:** Dependência de um serviço PostgreSQL gerido (ex.: Supabase/Neon) para
  deployment fora do ambiente local.

## ADR-003 — Autenticação própria com JWT + cookie httpOnly

- **Data:** 2026-09-18
- **Estado:** [PROPOSTA — pendente de validação]
- **Decisão:** Implementar autenticação própria: password com hash (bcrypt), sessão via
  JWT guardado em cookie `httpOnly` + `secure`, verificação de role no backend em cada
  pedido.
- **Contexto:** Requisito explícito de autorização real no backend (secção 14/31 do brief)
  e valor pedagógico de a equipa compreender e conseguir explicar o mecanismo de
  autenticação na defesa do projeto.
- **Alternativas:** Firebase Auth, Clerk, Auth0 (serviços geridos externos); NextAuth/Auth.js
  como acelerador sobre uma estratégia de credenciais própria.
- **Justificação:** Maior controlo e valor educativo; evita dependência de serviço externo
  cujos detalhes internos a equipa não domina para a apresentação.
- **Consequências:** Mais código próprio a implementar e testar (hashing, emissão/validação
  de token, refresh se aplicável) — mitigado por ser um mecanismo bem documentado e comum.

## ADR-004 — File Storage separado da base de dados

- **Data:** 2026-09-18
- **Estado:** [PROPOSTA — pendente de validação]
- **Decisão:** A submissão de ficheiros (RF23) é requisito mínimo obrigatório do enunciado
  oficial — usar desde já um serviço de File Storage compatível com S3 (ex.: Supabase
  Storage), guardando apenas metadados (nome, url, tipo, tamanho) na base de dados.
- **Contexto:** Requisito explícito do enunciado de separar ficheiro de metadados.
- **Alternativas:** Disco local do servidor; AWS S3 direto; Cloudflare R2.
- **Justificação:** Disco local não é viável em ambientes de deployment serverless (ex.:
  Vercel); Supabase Storage integra-se facilmente com a mesma infraestrutura da base de
  dados, se Supabase for a escolha para o Postgres (ADR-002).
- **Consequências:** Tamanho máximo, tipos permitidos e regras de acesso ficam por definir
  em `[DECISÃO PENDENTE]` (ver 01_analise_problema.md), mas a integração de storage entra
  já no planeamento inicial (FASE 8) e não é adiada para depois do mínimo obrigatório.

## ADR-005 — Deployment em Vercel + Supabase

- **Data:** 2026-09-18
- **Estado:** [PROPOSTA — pendente de validação]
- **Decisão:** Deploy do frontend/backend em Vercel; base de dados e storage em Supabase
  (ou Neon para a DB, caso a equipa prefira desacoplar de Supabase).
- **Contexto:** Necessidade de demonstração pública, estável e sem custos, para a
  apresentação académica (secção 39 do brief).
- **Alternativas:** Render, Railway, Fly.io.
- **Justificação:** Tiers gratuitos generosos, deploy direto a partir do GitHub, sem gestão
  de infraestrutura.
- **Consequências:** Limites do tier gratuito (ex.: "cold starts", limites de storage) a
  monitorizar antes da apresentação.

## ADR-006 — Estratégia de branches Git

- **Data:** 2026-09-18
- **Estado:** [PROPOSTA — pendente de validação]
- **Decisão:** `main` (estável) ← `develop` ← `feature/*` (por funcionalidade), conforme
  sugerido na secção 24 do brief. Nunca desenvolver diretamente em `main`.
- **Contexto:** Equipa de 3 pessoas, necessidade de Code Review antes de merge (secção 27).
- **Alternativas:** Trunk-based development com feature flags (mais adequado a equipas
  maiores/CI mais maduro — desnecessário aqui).
- **Justificação:** Estratégia simples de explicar e seguir por uma equipa pequena, com
  histórico de features isoladas e claras.
- **Consequências:** Overhead ligeiro de gestão de branches, mitigado pelo baixo número de
  features em paralelo.

## ADR-007 — Protótipo funcional com camada de dados no browser (supersede a proposta de stack por agora)

- **Data:** 2026-09-20
- **Estado:** Adotada para a fase atual; a migração para servidor fica como [DECISÃO PENDENTE]
- **Decisão:** Manter o frontend atual (HTML/CSS/JavaScript, sem framework) e implementar a lógica de "backend + API + base de dados"
  numa camada de serviços (`public/js/store.js`) com persistência em `localStorage`, contas com palavras-passe cifradas (PBKDF2),
  permissões por perfil e por posse do recurso, e sincronização entre separadores (`storage` + `BroadcastChannel`).
- **Contexto:** o utilizador pediu uma plataforma assíncrona **funcional**, sem necessidade de backend real. A stack Next.js/Prisma/PostgreSQL
  (ADR-001 a ADR-005) obrigaria a reescrever a interface já validada e a ter infraestrutura que a equipa não tem neste momento.
- **Alternativas:** (a) Next.js + Prisma + PostgreSQL (proposta original); (b) Node + Express + SQLite; (c) camada local (escolhida).
- **Justificação:** mantém a identidade, a navegação e os componentes existentes; é testável em Node (`npm test`); a interface
  `store.as(user).<método>()` é a mesma que uma API HTTP exporia, o que permite trocar a implementação por um servidor sem reescrever os ecrãs.
- **Consequências:** os dados não são partilhados entre máquinas; a segurança é apenas de demonstração; ficheiros limitados a 300 KB.
  Se o professor exigir base de dados real, migrar para a alternativa (b) — plano em [13_auditoria_funcionalidades.md](13_auditoria_funcionalidades.md).

## ADR-008 — Migração para Supabase (Postgres + Auth + Storage), resolve a [DECISÃO PENDENTE] da ADR-007

- **Data:** 2026-10-08
- **Estado:** Adotada
- **Decisão:** Substituir a camada local de `store.js` (localStorage) por uma base de dados Postgres real alojada no Supabase,
  com autenticação real (Supabase Auth), armazenamento de ficheiros (Supabase Storage) e permissões aplicadas diretamente na
  base de dados (Row Level Security), não apenas no cliente. O esquema, as políticas de segurança e as funções de negócio
  (submeter atividade, classificar) vivem em `supabase/migrations/`, como SQL versionado.
- **Contexto:** o problema concreto que motivou a mudança: eventos publicados pelo Admin só apareciam no browser que os criou,
  porque todos os dados viviam em `localStorage`, por máquina. Confirmámos em testes reais (sessão anónima, sem login) que
  a leitura pública de eventos, cursos e estatísticas, e a escrita por utilizadores autenticados, funcionam corretamente
  entre dispositivos diferentes.
- **Alternativas:** (a) manter só local (ADR-007, não resolve o problema); (b) Node + Express + PostgreSQL próprio (precisa de
  hospedar e manter um servidor); (c) Supabase (escolhida) — Postgres gerido + API REST automática + Auth + Storage, sem
  servidor próprio para manter, plano gratuito suficiente para o projeto.
- **Justificação:** resolve o problema relatado sem reescrever a interface — `teacher.js`/`student.js`/`admin.js` continuam
  iguais; só as ações que escrevem dados passaram a chamar o Supabase (`public/js/supabase-client.js`) em vez do `store.js`
  local. A camada local (`store.js`) mantém-se como referência/testada em `tests/` e como estrutura de leitura (o documento
  local é "espelhado" a partir do Supabase depois do login — ver `App.store.replaceDb()`).
- **Consequências:**
  - O login passa a ser uma conta Supabase real (mesmas credenciais de demonstração documentadas no ecrã de login,
    `admin@aldijos.pt`, etc. — uma tabela `login_aliases` traduz o email do projeto para o email real da conta).
  - "Repor palavra-passe" (Admin) deixou de definir a password diretamente — passou a enviar um email de recuperação,
    por não existir um servidor próprio para operações privilegiadas de autenticação.
  - A chave usada no cliente (`public/js/supabase-config.js`) é a chave pública ("publishable"), segura para expor — a
    segurança real está nas políticas SQL (`supabase/migrations/0002_policies.sql` e seguintes), não no segredo da chave.
  - Qualquer colega com acesso ao projeto Supabase (pedir acesso ao Aldir) pode ver/gerir os dados reais pelo painel.

---

## Riscos técnicos identificados

| Risco | Impacto | Mitigação proposta |
|---|---|---|
| Equipa sem experiência prévia numa das tecnologias propostas | Atraso no desenvolvimento | Validar a stack com a equipa antes de avançar (este documento); ajustar se necessário. |
| Regras de negócio não definidas (prazos, tentativas, edição pós-submissão) implementadas de forma inconsistente | Retrabalho, bugs de regra de negócio | Não assumir — seguir processo `[DECISÃO PENDENTE]` até serem esclarecidas (ver 01_analise_problema.md). |
| Autorização mal implementada permite acesso a dados de outro utilizador (IDOR) | Falha de segurança grave (RF21) | Testar explicitamente este cenário (TEST03, TEST12 em 08_testes.md); revisão de código dedicada a autorização. |
| Dependência de serviços gratuitos (Vercel/Supabase) com limites | Instabilidade na demonstração | Testar o deployment com antecedência à apresentação; ter plano B (ex.: correr localmente). |
| Escopo do MVP a crescer sem controlo ("scope creep") | Não terminar o MVP a tempo | Seguir rigoramente o MVP definido em [00_brief_cliente.md](00_brief_cliente.md); funcionalidades fora do MVP só avançam com decisão explícita da equipa. |
| Correção automática com erro de cálculo | Perda de confiança no sistema pelo professor/aluno | Cobertura de testes automatizados dedicada (RNF09, TEST07/TEST08). |
