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
│   ├── store.js     # camada de dados: persistência, autenticação, permissões, correção
│   ├── seed.js      # dados iniciais de demonstração
│   └── ui.js, home.js, auth.js, student.js, teacher.js, admin.js, legal.js, main.js
└── img/
```

## Nota importante

Nesta fase, a lógica que normalmente estaria no `backend/` (autenticação, permissões,
persistência, correção automática) está implementada em `js/store.js`, a correr no
browser, com persistência em `localStorage`. Ver a justificação em
`docs/10_decisoes_tecnicas.md` (ADR-007) e o estado de cada funcionalidade em
`docs/13_auditoria_funcionalidades.md`.
