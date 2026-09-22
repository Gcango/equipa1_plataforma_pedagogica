# 08 — Testes

## Plano de testes

Testes funcionais e técnicos a implementar progressivamente à medida que cada
funcionalidade é desenvolvida (não escritos antecipadamente para código que ainda não
existe). A tabela abaixo lista os testes previstos, com base na lista sugerida no brief
(secção 30) e nos requisitos em [02_requisitos.md](02_requisitos.md).

| ID | Teste | Entrada | Resultado esperado | Resultado obtido | Estado |
|---|---|---|---|---|---|
| TEST01 | Login válido | Credenciais corretas de um utilizador ativo | Sessão criada, redirecionamento para dashboard do role | — | ⏳ Por implementar |
| TEST02 | Login inválido | Credenciais incorretas | Erro genérico, sem sessão criada | — | ⏳ Por implementar |
| TEST03 | Aluno não consegue aceder ao dashboard de administrador | Aluno autenticado tenta aceder a rota `/admin/*` | Acesso bloqueado (403/redirect), verificado no backend | — | ⏳ Por implementar |
| TEST04 | Professor consegue criar atividade | Professor autenticado submete formulário de criação | Atividade criada em estado "Rascunho", associada ao módulo/turma | — | ⏳ Por implementar |
| TEST05 | Aluno consegue visualizar atividade | Atividade publicada, aluno pertence à turma | Atividade visível na lista do aluno | — | ⏳ Por implementar |
| TEST06 | Aluno consegue submeter atividade | Aluno responde e submete dentro do prazo | Submissão registada com data/hora | — | ⏳ Por implementar |
| TEST07 | Correção automática de escolha múltipla | Submissão com respostas certas/erradas conhecidas | Pontuação calculada coincide com o esperado | — | ⏳ Por implementar |
| TEST08 | Correção automática de verdadeiro/falso | Submissão com respostas certas/erradas conhecidas | Pontuação calculada coincide com o esperado | — | ⏳ Por implementar |
| TEST09 | Resultado fica disponível após correção | Submissão corrigida automaticamente | Aluno consegue consultar nota (pelo menos a componente automática) | — | ⏳ Por implementar |
| TEST10 | Upload de ficheiro válido | Ficheiro dentro do tamanho/tipo permitido | Ficheiro armazenado no File Storage, metadados gravados na DB (RF23) | — | ⏳ Por implementar |
| TEST11 | Upload de ficheiro inválido | Ficheiro acima do limite ou tipo não permitido | Upload rejeitado com mensagem clara | — | ⏳ Por implementar |
| TEST13 | Correção manual de resposta curta/aberta | Professor atribui nota e feedback a uma resposta aberta | Nota manual combinada com a nota automática das objetivas na classificação final (RF24) | — | ⏳ Por implementar |
| TEST12 | Aluno não consegue consultar submissão de outro aluno | Aluno A tenta aceder a `submission_id` do Aluno B via URL | Acesso bloqueado (403), verificado no backend (RF21) | — | ⏳ Por implementar |

## Registo de bugs encontrados

_Nenhum registado ainda — a preencher à medida que forem encontrados durante os testes._

| ID | Descrição | Severidade | Encontrado em | Estado |
|---|---|---|---|---|
| — | — | — | — | — |

## Resultados automatizados (2026-09-20)

`npm test` — **30 testes, 30 aprovados** (`tests/store.test.js`, a camada de dados que faz de backend):

- Autenticação: login por perfil, mesma mensagem para email inexistente e palavra-passe errada, bloqueio após 5 falhas,
  palavras-passe nunca em texto simples (TEST01, TEST02), conta desativada, registo (validação e duplicados), sessão.
- Autorização: cada perfil só tem os seus métodos (TEST03); aluno não lê submissão de outro aluno (TEST12, IDOR);
  aluno só vê atividades publicadas da sua turma e sem respostas corretas; professor só vê e classifica o que é seu;
  ficheiros só acessíveis ao dono, ao professor da atividade e à administração.
- Correção: escolha múltipla e verdadeiro/falso (TEST07, TEST08), notas 0 e 20, perguntas abertas por avaliar e classificação
  do professor (TEST13), limites da nota final, prazo terminado e submissão duplicada.
- Ficheiros: tipo, tamanho, número máximo e bloqueio depois de submeter (TEST10, TEST11).
- Atividades: criar, publicar, editar, eliminar rascunho e regras com submissões (TEST04, TEST05, TEST06).
- Administração, eventos (≥ 3 por ramo), estatísticas em tempo real, avisos, persistência e sincronização entre separadores.

Também validado manualmente no browser: fluxo completo professor → aluno → correção → resultado; páginas de todos os perfis sem erros;
enquadramento das fotografias em telemóvel, tablet e desktop.
