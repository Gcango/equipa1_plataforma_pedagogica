# Frontend

Interface da aplicação: página inicial pública e os três painéis (Aluno, Professor,
Administração). HTML/CSS/JavaScript, sem framework nem dependências.

## Executar localmente

Qualquer servidor estático serve, por exemplo:

```bash
cd frontend
python3 -m http.server 5173
```

Depois abrir `http://localhost:5173`.

## Estrutura

```
frontend/
├── index.html
├── styles.css
├── js/
│   ├── store.js              # camada de dados local: persistência, permissões, correção (continua testada em tests/)
│   ├── supabase-client.js    # ponte para o Supabase (base de dados real, autenticação, ficheiros)
│   ├── supabase-config.js    # URL + chave pública (publishable) do projeto Supabase
│   ├── seed.js               # dados iniciais de demonstração
│   └── ui.js, home.js, auth.js, student.js, teacher.js, admin.js, legal.js, main.js
└── img/
```

## Nota importante

A plataforma passou a ter uma base de dados real (Postgres, no Supabase): autenticação,
cursos/turmas/módulos, atividades, submissões, notas e eventos ficam partilhados entre
dispositivos, não só no `localStorage` do browser. O esquema e as regras de segurança
estão em `supabase/migrations/` (SQL versionado). Ver `docs/10_decisoes_tecnicas.md`
(ADR-007 para o contexto original, ADR-008 para esta migração) e o estado de cada
funcionalidade em `docs/13_auditoria_funcionalidades.md`.

`js/store.js` mantém-se como camada local (ainda testada em `tests/`) e é a partir dela
que o site funciona enquanto `App.store.replaceDb()` não é chamado com os dados vindos
do Supabase (ver `js/supabase-client.js` e `js/main.js`).

Para ligar a um projeto Supabase próprio: criar o projeto, correr os ficheiros de
`supabase/migrations/` por ordem no SQL Editor do Supabase, e preencher
`js/supabase-config.js` com o URL e a chave pública ("publishable") desse projeto.
