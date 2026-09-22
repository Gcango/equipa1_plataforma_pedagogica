# 04 — Arquitetura

> **[DECISÃO PENDENTE — ADR-001 a ADR-005]** A stack abaixo é uma **proposta** a validar
> pela equipa antes do setup do projeto (FASE 8). Ver comparação de alternativas e
> justificação em [10_decisoes_tecnicas.md](10_decisoes_tecnicas.md).

## Visão geral da arquitetura

```
                    ┌──────────────┐
                    │  Utilizador  │
                    │ (Admin/Prof/ │
                    │    Aluno)    │
                    └──────┬───────┘
                           │ HTTPS
                           ▼
              ┌────────────────────────┐
              │        Frontend         │
              │  (Next.js App Router,   │
              │   3 dashboards por role)│
              └───────────┬─────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │      Backend / API      │
              │ (Next.js Route Handlers │
              │  + camada de serviços)  │
              │  - Autenticação (JWT)   │
              │  - Autorização (role)   │
              │  - Regras de negócio    │
              │  - Correção automática  │
              └─────┬──────────────┬────┘
                     │              │
                     ▼              ▼
          ┌────────────────┐  ┌──────────────────┐
          │    Database     │  │   File Storage    │
          │  (PostgreSQL    │  │  (ex.: Supabase    │
          │  via Prisma ORM)│  │  Storage / S3)     │
          │                 │  │  — só metadados     │
          │                 │  │  ficam na DB        │
          └────────────────┘  └──────────────────┘
```

Aplicação **única** (não três apps separadas), com routing e autorização por `role` a
controlar o que cada perfil vê e pode fazer — tal como exigido na secção 15 do brief.

## Stack recomendada (proposta)

| Camada | Proposta | Alternativas consideradas | Porquê a proposta |
|---|---|---|---|
| Frontend | **Next.js 14+ (App Router) + TypeScript + TailwindCSS** | React (SPA) + Vite; Vue/Nuxt | Permite frontend + backend no mesmo projeto (menos peças móveis para 3 pessoas), tipagem partilhada, ótima documentação, muito comum em contexto académico. |
| Backend | **Next.js Route Handlers (API dentro da mesma app)** | Node.js + Express separado; NestJS | Um único deploy, sem CORS a gerir, sem duplicar tipos entre frontend/backend. NestJS/Express dão mais "separação de conceitos" clássica mas mais complexidade de infraestrutura para o mesmo resultado académico. |
| ORM / Acesso a dados | **Prisma** | Drizzle ORM; SQL puro | Schema declarativo, migrações automáticas, type-safety, muito bem documentado — reduz erros de integridade referencial (RNF11). |
| Base de dados | **PostgreSQL** (hospedado em Supabase ou Neon, tier gratuito) | MySQL; SQLite | Postgres tem melhor suporte a constraints/relações complexas e é o "companheiro natural" do Prisma; hospedagem gratuita facilita demonstração sem custos. |
| Autenticação | **JWT em cookie `httpOnly` + `secure`, com hash de password (bcrypt)**, gerido por uma camada própria (ou Auth.js/NextAuth como acelerador) | Firebase Auth; Clerk; Auth0 | Controlo total sobre roles/autorização (RNF02, RNF03) e maior valor pedagógico (a equipa explica o próprio mecanismo de auth); serviços externos escondem detalhes que a equipa precisa de defender na apresentação. |
| File Storage | **Supabase Storage (S3-compatible)**, com metadados na tabela `Submission`/`Answer` | Cloudflare R2; AWS S3 direto; disco local | Separado da base de dados (secção 13 do brief); gratuito para volume académico; integração simples com o mesmo projeto Supabase da DB, se essa opção for escolhida. Disco local é desaconselhado por não sobreviver a deployments serverless. |
| Deployment | **Vercel** (frontend+API) + **Supabase** (DB + Storage) | Render; Railway | Tiers gratuitos generosos, deploy trivial a partir do GitHub, adequado para demonstração académica sem custos. |

### Critérios usados na escolha

- Facilidade de aprendizagem e de desenvolvimento para uma equipa de 3 estudantes.
- Boa documentação e comunidade ativa.
- Segurança adequada por definição (hash de passwords, cookies httpOnly, validação no
  backend).
- Custo zero/baixo para um projeto académico.
- Facilidade de demonstração ao professor (deploy público, sem infraestrutura complexa).
- Manutenibilidade por uma equipa pequena (poucas peças móveis, uma única aplicação).

## Estrutura inicial de pastas (proposta, para a FASE 8)

```
aldijos/
├── docs/                        # documentação do projeto (este diretório)
├── prisma/
│   └── schema.prisma             # modelo de dados (ver 05_modelo_dados.md)
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── registo/          # se aplicável, conforme decisão pendente
│   │   ├── (admin)/
│   │   │   ├── dashboard/
│   │   │   ├── utilizadores/
│   │   │   ├── cursos/
│   │   │   ├── turmas/
│   │   │   └── modulos/
│   │   ├── (professor)/
│   │   │   ├── dashboard/
│   │   │   ├── modulos/
│   │   │   ├── atividades/
│   │   │   └── submissoes/
│   │   ├── (aluno)/
│   │   │   ├── dashboard/
│   │   │   ├── modulos/
│   │   │   ├── atividades/
│   │   │   └── resultados/
│   │   └── api/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── courses/
│   │       ├── classes/
│   │       ├── modules/
│   │       ├── activities/
│   │       ├── questions/
│   │       └── submissions/
│   ├── components/                # design system (ver secção 16 do brief)
│   ├── lib/                       # auth, db client, validação, autorização
│   ├── services/                  # regras de negócio (ex.: correção automática)
│   └── types/
├── tests/
├── .env.example
├── README.md
└── package.json
```

## Autenticação e autorização (visão de arquitetura)

- Password nunca em texto simples (RNF01) — hash com bcrypt/argon2.
- Login gera um JWT (ou sessão equivalente) guardado em cookie `httpOnly` + `secure`.
- Middleware de backend valida, em **cada pedido**, o token e o `role` do utilizador antes
  de executar qualquer ação (RNF02) — nunca confiar apenas em esconder botões no frontend.
- Verificação de posse do recurso (ex.: um aluno só acede às suas próprias submissões) é
  feita comparando o `id` autenticado com o `owner`/`student_id` do recurso pedido (RF21).

## File Storage (visão de arquitetura)

Submissão de ficheiros é `RF23` — **requisito mínimo obrigatório** do enunciado oficial, não
uma funcionalidade futura. O ficheiro em si nunca é guardado na base de dados: fica no
serviço de File Storage, e a base de dados guarda apenas os metadados:

```
Database (metadados)                    File Storage
--------------------------------        /submissions/
submission_id                              /{activity_id}/
student_id                                     /{student_id}/
activity_id                                        ficheiro.pdf
file_name
file_url
uploaded_at
mime_type
file_size
```

Decisões de tamanho máximo, tipos permitidos, nomenclatura e permissões de acesso ficam
registadas como ADR em [10_decisoes_tecnicas.md](10_decisoes_tecnicas.md) quando forem
tomadas — não são assumidas aqui.

## Riscos técnicos da arquitetura proposta

Ver lista consolidada de riscos em [10_decisoes_tecnicas.md](10_decisoes_tecnicas.md)
(secção de riscos) e no resumo entregue à equipa (ponto K da primeira tarefa).
