# Backend

Lógica de negócio, API/servidor e controlo de acesso.

## Estado atual

Nesta fase do projeto, esta camada está implementada do lado do cliente, em
`frontend/js/store.js` (autenticação com PBKDF2-SHA-256, permissões verificadas por
perfil e por posse do recurso, correção automática e manual, persistência em
`localStorage`). A decisão e as alternativas consideradas estão documentadas em
`docs/10_decisoes_tecnicas.md` (ADR-007).

Esta pasta fica pronta para receber um servidor real (Node.js, por exemplo), caso a
equipa decida migrar — a interface `store.as(utilizador).<método>()` foi desenhada para
poder ser substituída por chamadas a uma API sem reescrever o `frontend/`.
