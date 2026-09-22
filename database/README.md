# Base de Dados

Entidades iniciais: `users`, `courses`, `classes`, `modules`, `enrollments`, `activities`, `questions`, `answers`, `submissions`, `grades`

Validar o DER antes de criar o esquema final. Modelo detalhado (campos, chaves e
relações) em `docs/05_modelo_dados.md`.

## Estado atual

Nesta fase, os dados são guardados como um documento JSON no `localStorage` do
browser (ver `frontend/js/store.js` e `frontend/js/seed.js`), com a mesma estrutura de
entidades e relações descrita em `docs/05_modelo_dados.md`. `schema.sql` e `seed.sql`
ficam como referência para uma futura base de dados relacional real (ver ADR-007 em
`docs/10_decisoes_tecnicas.md`).
