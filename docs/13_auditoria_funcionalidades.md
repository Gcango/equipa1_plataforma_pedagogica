# 13 — Auditoria de funcionalidades

Data: 2026-09-20 · Estado: protótipo **funcional** (sem servidor) · Autor: equipa Aldijos

Pergunta que orientou esta fase: *o que falta para isto deixar de ser apenas um protótipo visual?*

**Decisão do utilizador (2026-09-20):** não é necessário um backend real; o objetivo é ter a plataforma
assíncrona **funcional** (responder, submeter, corrigir, ver resultados). Por isso a camada
"backend + API + base de dados" foi implementada como uma **camada de serviços no browser**
(`public/js/store.js`), com persistência em `localStorage`, contas com palavras-passe cifradas e
permissões verificadas por perfil e por posse do recurso. Ver ADR-007 em
[10_decisoes_tecnicas.md](10_decisoes_tecnicas.md).

Legenda: ✔ feito · ◐ parcial / equivalente local · ✘ em falta

## 1. Matriz por funcionalidade

Nas colunas **Backend**, **API** e **BD**, "◐" significa que existe o equivalente na camada local
(`store.js`): as mesmas regras e a mesma separação de responsabilidades, mas sem servidor nem rede.

| Funcionalidade | 1 Visual | 2 Frontend | 3 Backend | 4 API | 5 BD | 6 Ligada à BD | 7 Autent. | 8 Autoriz. | 9 Testada | 10 Doc. |
|---|---|---|---|---|---|---|---|---|---|---|
| Login / logout / sessão | ✔ | ✔ | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Criar conta de aluno (registo) | ✔ | ✔ | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Gestão de utilizadores (admin) | ✔ | ✔ | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Cursos, turmas, módulos e associações | ✔ | ✔ | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Criar/editar/publicar atividades (MC, V/F, curta, aberta) | ✔ | ✔ | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Realizar e submeter (respostas + ficheiros) | ✔ | ✔ | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Correção automática (objetivas) | ✔ | ✔ | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Correção manual + feedback (professor) | ✔ | ✔ | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Resultados e feedback (aluno) | ✔ | ✔ | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Dashboards e avisos por perfil | ✔ | ✔ | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Eventos (público + gestão admin) | ✔ | ✔ | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Página inicial (cursos, eventos, números) | ✔ | ✔ | ◐ | ◐ | ◐ | ✔ | n/a | n/a | ✔ | ✔ |
| Sincronização em tempo real (entre separadores) | ✔ | ✔ | ◐ | ◐ | ◐ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Rodapé (financiadores, parceiros, políticas de ensino profissional e legais) | ✔ | ✔ | ✘ | ✘ | ✘ | ✘ | n/a | n/a | ✔ | ✔ |
| Armazenamento de ficheiros separado da BD | ✔ | ✔ | ✘ | ✘ | ✘ | ✘ | ✔ | ✔ | ✔ | ✔ |
| Recuperação de palavra-passe (self-service) | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✔ |
| Apoio de IA à correção (opcional, RF25) | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✔ |
| Calendário, pesquisa global, página "Sobre", ajuda | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✔ |

Notas sobre os "✘":
- **Ficheiros:** ficam no mesmo documento local (data URL, máx. 300 KB, 3 por atividade). O File Storage
  separado (ficheiro fora da base de dados, só metadados na BD) **[EM FALTA]** — depende de haver servidor.
- **Recuperação de palavra-passe:** hoje a administração repõe a palavra-passe. **[DECISÃO PENDENTE]**.
- **IA (RF25):** opcional no enunciado; não iniciada.
- **Calendário, pesquisa, "Sobre", ajuda:** sugestões 1, 3, 9 e 12 do pedido anterior; ficam para depois
  do núcleo (atividades → submissões → classificações → feedback), como recomendado.

## 2. As perguntas que a Aldijos deve conseguir responder

| Pergunta | Resposta hoje | Estado |
|---|---|---|
| O que é / para quem / objetivo? | Secção "Quem somos" da página inicial. | ✔ |
| O que faz cada perfil? | "Como funciona" e painéis de cada perfil. | ✔ |
| Que cursos, turmas, módulos existem? Que professores e alunos estão associados? | Administração → Cursos, Turmas, Módulos (chips de associação). | ✔ |
| Quem criou a atividade? A que módulo/turma pertence? Prazo? Perguntas e tipos? | Lista e página da atividade (professor, módulo, turma, prazo, nº e tipos de perguntas). | ✔ |
| O aluno já respondeu? Submeteu? Foi corrigida? | Estado por atividade (pendente, prazo próximo, submetida, corrigida, em atraso). | ✔ |
| Classificação, quem corrigiu, quando, feedback? | Página de resultado (corretor: "Correção automática" ou nome do professor; data; feedback). | ✔ |
| Quem está autenticado? Que role? A que áreas acede? | Barra superior (nome + perfil); cada perfil só tem as suas páginas. | ✔ |
| O backend verifica as permissões? | A **camada de serviços** verifica perfil e posse do recurso (testado). Não existe servidor. | ◐ **[EM FALTA]** servidor real |
| Onde estão os dados? São persistentes? E se reiniciar? | `localStorage` do browser; persistem entre visitas e reinícios. | ◐ |
| Os dados são partilhados entre utilizadores/máquinas? | **Não.** Cada browser tem a sua própria cópia. Um professor e um aluno só se "veem" no mesmo browser. | ✘ **[EM FALTA]** |
| Passwords protegidas? | Sim: PBKDF2-SHA-256 com sal; nunca em texto simples (testado). | ✔ (no cliente) |
| Um aluno acede a dados de outro? Um professor faz ações de admin? Um não autenticado entra em áreas privadas? | Bloqueados pela camada de serviços (testes de IDOR e de perfil). | ✔ (no cliente) |
| É possível demonstrar o fluxo completo? | Login → criar atividade → realizar → submeter → corrigir → consultar resultado: sim, validado pela interface. | ✔ |

- **Rodapé:** os logótipos institucionais (Portugal 2030, UE, PRR, EQAVET, EduQA, AGSE) foram pedidos pela equipa como formato de referência e estão
  identificados na própria faixa como exemplo de layout. **[DECISÃO PENDENTE]** confirmar se se mantêm ou se se substituem pelos apoios reais da escola.
  As políticas (EQAVET, regulamento interno, avaliação, FCT/PAP, oferta formativa, privacidade, cookies, termos, acessibilidade) são textos de
  demonstração que a escola tem de rever.

## 3. [DECISÃO PENDENTE] a confirmar com o professor

1. **Base de dados real:** o enunciado lista "base de dados" entre os requisitos do protótipo. O armazenamento no browser
   é suficiente para a demonstração? Se não, migrar `store.js` para um servidor (ver plano).
2. Escala de classificação (0–20 assumida), tentativas (uma), prazo (bloqueia submissão), edição após submissões
   (bloqueada), alunos verem respostas corretas depois de submeter (sim). Todas estas regras estão isoladas em
   `store.js` e são fáceis de mudar.
3. Registo aberto de alunos (assumido: sim, sem turma até a administração associar).
4. Tamanho e tipos de ficheiro (300 KB; pdf, png, jpg, txt, docx, zip nesta demonstração).

## 4. Plano de desenvolvimento

1. **Já feito:** camada de dados com permissões, autenticação por conta, correção automática/manual, eventos,
   sincronização, 30 testes automatizados (`npm test`).
2. **Próximo (se o professor exigir BD real):** servidor Node + SQLite mantendo a interface `store.as(user).<método>()`
   — a interface passa a chamar a API em vez de `store.js`, sem reescrever os ecrãs; File Storage em disco/bucket;
   sessões por cookie `httpOnly`; testes de API.
3. Recuperação de palavra-passe, calendário, pesquisa global, "Sobre" e ajuda.
4. Endurecimento de segurança (CSP, limites de tentativas no servidor, auditoria).

## 5. Riscos conhecidos

- Segurança apenas de demonstração: quem abrir as ferramentas de programador do browser lê/edita os dados locais.
- Sem partilha de dados entre máquinas (ver acima).
- O limite de armazenamento do browser (~5 MB) restringe ficheiros anexados e imagens de eventos.
