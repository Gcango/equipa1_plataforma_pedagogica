/* Aldijos — rodapé, faixa de parceiros e textos legais (privacidade, cookies, termos, acessibilidade, contactos) */

/*
 * Faixa de parceiros. Estes são parceiros FICTÍCIOS de demonstração.
 * Para uma escola real, substituir por logótipos oficiais (PNG/SVG branco sem fundo) em public/img/parceiros/:
 *   { name: 'Nome da entidade', logo: 'img/parceiros/entidade.svg' }
 * Só devem constar entidades que realmente financiam, certificam ou apoiam a escola.
 */

/*
 * Faixa de financiadores e certificações (formato de referência dado pela equipa).
 * IMPORTANTE: os logótipos institucionais são usados como EXEMPLO DE LAYOUT. Não implicam que a Aldijos seja financiada,
 * certificada ou apoiada por estas entidades. Para uma escola real, manter apenas as entidades que a apoiam de facto.
 * Ficheiros: PNG branco sem fundo em public/img/parceiros (w = largura natural do PNG, 2x).
 */
const FUNDERS = [
  [ { f: 'fin-01.png', w: 239, alt: 'Pessoas 2030 e Portugal 2030' }, { f: 'fin-02.png', w: 170, alt: 'Cofinanciado pela União Europeia' },
    { f: 'fin-03.png', w: 92, alt: 'República Portuguesa, Educação, Ciência e Inovação' }, { f: 'fin-04.png', w: 225, alt: 'EduQA' }, { f: 'fin-05.png', w: 187, alt: 'AGSE, Agência para a Gestão do Sistema Educativo' } ],
  [ { f: 'fin-06.png', w: 417, alt: 'PRR, República Portuguesa e Financiado pela União Europeia NextGenerationEU' } ],
  [ { f: 'fin-07.png', w: 92, alt: 'Selo de Conformidade EQAVET' } ],
];
const funderHtml = x => `<img src="${asset('img/parceiros/' + x.f)}" alt="${esc(x.alt)}" style="width:${Math.round(x.w * 0.55)}px">`;
const fundersBandHtml = () => FUNDERS.map((g, i) => `${i ? '<span class="band-sep" aria-hidden="true"></span>' : ''}<div class="funders">${g.map(funderHtml).join('')}</div>`).join('');

const PARTNERS = [
  { name: 'TecnoLab', sub: 'Soluções digitais', mark: '<polygon points="14,3 24,8.5 24,19.5 14,25 4,19.5 4,8.5"/><circle cx="14" cy="14" r="3.5"/>' },
  { name: 'Atelier Norte', sub: 'Moda e design', mark: '<path d="M4 23 14 5l10 18z"/><line x1="9" y1="17" x2="19" y2="17"/>' },
  { name: 'Horizonte Hotéis', sub: 'Turismo e hotelaria', mark: '<path d="M4 21h20"/><path d="M8 21a6 6 0 0 1 12 0"/><line x1="14" y1="5" x2="14" y2="9"/><line x1="5" y1="11" x2="8" y2="13"/><line x1="23" y1="11" x2="20" y2="13"/>' },
  { name: 'AeroServiços', sub: 'Aviação e manutenção', mark: '<polygon points="3,14 25,4 18,24 14,16"/>' },
  { name: 'MediaFábrica', sub: 'Audiovisuais', mark: '<rect x="4" y="6" width="20" height="16" rx="3"/><polygon points="12,10 19,14 12,18"/>' },
  { name: 'CasaVerde Têxtil', sub: 'Materiais sustentáveis', mark: '<path d="M14 4c7 4 9 11 0 20C5 15 7 8 14 4z"/><line x1="14" y1="9" x2="14" y2="22"/>' },
];
const partnerHtml = p => `<div class="partner" role="listitem">${p.logo
  ? `<img src="${esc(asset(p.logo))}" alt="${esc(p.name)}">`
  : `<svg viewBox="0 0 28 28" aria-hidden="true">${p.mark}</svg><span class="partner-name">${esc(p.name)}<small>${esc(p.sub || '')}</small></span>`}</div>`;

const CONTACTO = { email: 'geral@aldijos.pt', privacidade: 'privacidade@aldijos.pt', tel: '000 000 000', horario: 'Dias úteis, das 9h00 às 17h30' };
const LEGAL_LINKS = [['privacidade', 'Política de Privacidade'], ['cookies', 'Política de Cookies'], ['termos', 'Termos e Condições'], ['acessibilidade', 'Acessibilidade'], ['contactos', 'Contactos'], ['mapa', 'Mapa do site']];
const LEGAL_NOTE = 'Versão de demonstração do projeto escolar Aldijos, atualizada em 20 de setembro de 2026. Se a plataforma for usada por uma escola real, este texto tem de ser revisto e adaptado por essa escola.';

const POLICIES = {
  privacidade: { title: 'Política de Privacidade e Proteção de Dados', body: `
    <p class="helper">${LEGAL_NOTE}</p>
    <h3>1. Quem é o responsável</h3><p>A Aldijos é um projeto académico da equipa Aldir, José e Dinis. Numa utilização real, o responsável pelo tratamento dos dados seria a escola que operasse a plataforma.</p>
    <h3>2. Que dados tratamos</h3><ul><li>Identificação: nome e email.</li><li>Perfil (aluno, professor ou administração) e turma, curso e módulos associados.</li><li>Palavra-passe, guardada sempre cifrada (nunca em texto simples).</li><li>Atividades: respostas, ficheiros submetidos, classificações e feedback.</li><li>Eventos criados pela administração.</li></ul>
    <h3>3. Para que usamos</h3><p>Apenas para gerir atividades pedagógicas (publicar, realizar, submeter, corrigir e avaliar), mostrar avisos ao utilizador e apresentar números agregados na página inicial (sem dados pessoais).</p>
    <h3>4. Onde ficam guardados</h3><p>No armazenamento do próprio browser de quem usa a plataforma. Não são enviados para nenhum servidor da Aldijos nem partilhados com terceiros. O único pedido externo é o das fontes tipográficas (Google Fonts), pelo que o seu browser contacta a Google para as obter.</p>
    <h3>5. Durante quanto tempo</h3><p>Até o utilizador limpar os dados do site no browser ou a administração eliminar ou repor os dados.</p>
    <h3>6. Os seus direitos</h3><p>Pode pedir acesso, retificação, apagamento, limitação, portabilidade e opor-se ao tratamento dos seus dados. Pode ainda apresentar reclamação à Comissão Nacional de Proteção de Dados (<a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">cnpd.pt</a>). Contacto: ${CONTACTO.privacidade} (endereço de demonstração).</p>
    <h3>7. Segurança</h3><p>As palavras-passe usam PBKDF2-SHA-256 com sal; cada perfil só acede ao que lhe compete e há bloqueio temporário após tentativas falhadas. Como não há servidor, quem tiver acesso ao browser e às ferramentas de programador pode ler os dados locais.</p>
    <h3>8. Menores</h3><p>Grande parte dos utilizadores são alunos, incluindo menores. O tratamento dos seus dados deve ser autorizado e acompanhado pela escola e pelos encarregados de educação.</p>` },
  cookies: { title: 'Política de Cookies', body: `
    <p class="helper">${LEGAL_NOTE}</p>
    <h3>O que usamos</h3><p>A Aldijos <b>não usa cookies</b> de publicidade, de análise ou de rastreio. Usa apenas o armazenamento local do browser (<i>localStorage</i> e <i>sessionStorage</i>), estritamente necessário para funcionar: guardar os dados da plataforma e manter a sessão iniciada até fechar o separador.</p>
    <h3>Consentimento</h3><p>Por serem estritamente necessários ao serviço pedido, estes dados não exigem banner de consentimento.</p>
    <h3>Terceiros</h3><p>As fontes tipográficas são carregadas a partir do Google Fonts, o que implica um pedido do seu browser à Google. Não incorporamos redes sociais nem ferramentas de estatísticas.</p>
    <h3>Como gerir</h3><p>Pode apagar os dados nas definições do browser (dados do site). Isso remove as contas e os dados de demonstração guardados neste browser.</p>` },
  termos: { title: 'Termos e Condições de Utilização', body: `
    <p class="helper">${LEGAL_NOTE}</p>
    <h3>1. Objeto</h3><p>A Aldijos é uma plataforma de apoio ao ensino profissional e ao ensino secundário para organizar atividades pedagógicas, submissões, correção, resultados e feedback.</p>
    <h3>2. Contas</h3><p>As contas são pessoais e intransmissíveis. Não partilhe a palavra-passe. Qualquer pessoa pode criar uma conta de aluno; a administração associa depois o aluno a uma turma. Contas de professor e de administração só são criadas pela administração.</p>
    <h3>3. Utilização aceitável</h3><p>Não submeta conteúdos ilegais, ofensivos, com vírus ou que violem direitos de terceiros. Respeite os prazos e as regras definidas pelos professores. Os ficheiros anexados estão limitados em tipo e tamanho.</p>
    <h3>4. Conteúdos</h3><p>Os trabalhos submetidos pertencem aos seus autores. Ao submetê-los, o aluno autoriza a escola a usá-los para avaliação e feedback.</p>
    <h3>5. Propriedade intelectual</h3><p>A marca e o logótipo Aldijos pertencem à equipa do projeto. As fotografias de cursos e eventos são do Unsplash (licença Unsplash); as do destaque são da equipa.</p>
    <h3>6. Disponibilidade e responsabilidade</h3><p>Esta é uma versão de demonstração, sem garantias de disponibilidade nem de conservação dos dados, que ficam guardados apenas no browser de cada utilizador.</p>
    <h3>7. Alterações e lei aplicável</h3><p>Estes termos podem ser atualizados. Aplica-se a lei portuguesa.</p>` },
  acessibilidade: { title: 'Acessibilidade', body: `
    <p class="helper">${LEGAL_NOTE}</p>
    <h3>Compromisso</h3><p>Queremos que a Aldijos possa ser usada por todas as pessoas, em computador, tablet e telemóvel.</p>
    <h3>O que já fazemos</h3><ul><li>Navegação completa por teclado, com foco visível e ligação para saltar para o conteúdo.</li><li>Campos de formulário com etiquetas e mensagens de erro claras.</li><li>Textos alternativos nas imagens e botões com nomes compreensíveis.</li><li>Contraste adequado e tema claro/escuro conforme o dispositivo.</li><li>Respeito pela preferência de "reduzir movimento": sem animações nem rotação automática das fotografias.</li></ul>
    <h3>Limitações conhecidas</h3><p>A plataforma ainda não foi auditada formalmente. O carrossel de fotografias muda automaticamente e pode ser controlado pelos pontos.</p>
    <h3>Reportar um problema</h3><p>Escreva para ${CONTACTO.email} (endereço de demonstração) a descrever a página e a dificuldade encontrada.</p>` },
  qualidade: { title: 'Política de Qualidade (EQAVET)', body: `
    <p class="helper">${LEGAL_NOTE}</p>
    <p><b>Nota:</b> a Aldijos não é titular do Selo de Conformidade EQAVET. Esta política descreve o ciclo de qualidade que a plataforma apoia e os indicadores que consegue produzir. Numa escola real, deve integrar o processo próprio de garantia da qualidade da escola.</p>
    <h3>O que é o EQAVET</h3><p>É o Quadro Europeu de Referência para a Garantia da Qualidade no Ensino e Formação Profissionais. Assenta num ciclo de melhoria contínua: <b>planear, implementar, avaliar e rever</b>.</p>
    <h3>Como a Aldijos apoia esse ciclo</h3><ul><li><b>Planear:</b> os professores definem atividades, prazos e critérios de correção por módulo e turma.</li><li><b>Implementar:</b> os alunos realizam e submetem as atividades; a correção é automática nas perguntas objetivas e feita pelo professor nas restantes.</li><li><b>Avaliar:</b> a plataforma regista classificações, datas e feedback e calcula médias por módulo.</li><li><b>Rever:</b> os professores e a administração usam esses dados para ajustar atividades e apoiar os alunos.</li></ul>
    <h3>Indicadores que a plataforma consegue produzir</h3><ul><li>Atividades publicadas, submetidas e corrigidas.</li><li>Cumprimento de prazos.</li><li>Classificação média por módulo e por turma.</li></ul>
    <p>Indicadores como taxa de conclusão do curso, empregabilidade, prosseguimento de estudos e satisfação de alunos, empresas e encarregados de educação dependem de dados externos à plataforma.</p>
    <h3>Compromissos</h3><ul><li>Critérios de avaliação claros e feedback em tempo útil.</li><li>Tratamento igual para todos os alunos e proteção dos seus dados.</li><li>Participação de alunos, professores e empresas parceiras na melhoria contínua.</li></ul>` },
  regulamento: { title: 'Regulamento Interno (exemplo de estrutura)', body: `
    <p class="helper">${LEGAL_NOTE} Este documento é uma estrutura-tipo: o regulamento interno oficial é aprovado e publicado pela escola, em conformidade com a legislação em vigor.</p>
    <h3>1. Objeto e âmbito</h3><p>Define os direitos, deveres e regras de funcionamento da comunidade escolar, incluindo o uso da plataforma Aldijos.</p>
    <h3>2. Direitos e deveres dos alunos</h3><p>Frequentar as aulas com assiduidade e pontualidade, respeitar professores, colegas e funcionários, cumprir prazos e normas, cuidar dos equipamentos e usar a plataforma de forma responsável.</p>
    <h3>3. Assiduidade</h3><p>Os limites de faltas e as regras de justificação e de recuperação seguem a legislação aplicável aos cursos profissionais (por exemplo, a Portaria n.º 235-A/2018, na versão em vigor) e o regulamento da escola.</p>
    <h3>4. Avaliação</h3><p>A avaliação é modular, na escala de 0 a 20, com critérios divulgados pelos professores. Ver "Avaliação e Classificações". A recuperação de módulos e as provas de melhoria são as definidas pela escola.</p>
    <h3>5. Integridade académica</h3><p>Os trabalhos são individuais, salvo indicação em contrário. Copiar, plagiar ou usar ferramentas não autorizadas (incluindo inteligência artificial, quando o professor o proibir) é falta disciplinar.</p>
    <h3>6. Disciplina e apoio</h3><p>Os procedimentos disciplinares e as medidas de apoio seguem o estatuto do aluno e o regulamento da escola, com envolvimento do diretor de turma e do encarregado de educação.</p>
    <h3>7. Revisão</h3><p>O regulamento é revisto periodicamente e as alterações são comunicadas à comunidade escolar.</p>` },
  avaliacao: { title: 'Avaliação e Classificações', body: `
    <p class="helper">${LEGAL_NOTE}</p>
    <h3>Escala e critérios</h3><p>As classificações usam a escala de 0 a 20. Cada atividade tem um total de pontos; a nota final é proporcional aos pontos obtidos.</p>
    <h3>Como se corrige</h3><ul><li><b>Escolha múltipla e verdadeiro/falso:</b> correção automática, sempre igual para todos.</li><li><b>Resposta curta, resposta aberta e ficheiros:</b> avaliados pelo professor, que atribui pontos e feedback.</li><li>O professor pode validar ou ajustar a nota final. A decisão final é sempre do professor.</li></ul>
    <h3>Prazos e tentativas</h3><p>Só é possível submeter até ao fim do prazo e uma vez por atividade. Estas regras são definidas pela escola e podem ser alteradas.</p>
    <h3>Resultados e feedback</h3><p>O aluno consulta a classificação, quem corrigiu, a data e o feedback. Se discordar de uma classificação, deve falar primeiro com o professor e, se necessário, com o diretor de turma.</p>
    <h3>Conservação</h3><p>Os resultados ficam registados na plataforma enquanto a conta existir.</p>` },
  fct: { title: 'Formação em Contexto de Trabalho (FCT) e PAP', body: `
    <p class="helper">${LEGAL_NOTE}</p>
    <h3>FCT</h3><p>Nos cursos profissionais, os alunos realizam formação em empresas ou outras entidades. A escola e a entidade formalizam um protocolo, definem um plano individual, um tutor na entidade e um professor acompanhante, e a avaliação segue critérios previamente conhecidos.</p>
    <h3>PAP</h3><p>A Prova de Aptidão Profissional é um projeto final, demonstrado e defendido perante um júri, que mostra as competências adquiridas ao longo do curso.</p>
    <h3>Enquadramento</h3><p>Estas componentes são reguladas pela legislação dos cursos profissionais (por exemplo, a Portaria n.º 235-A/2018, na versão em vigor) e pelo regulamento da escola. Confirme sempre a versão atual no Diário da República.</p>
    <h3>O que a Aldijos apoia</h3><ul><li>Atividades de preparação (por exemplo, questionários de preparação para estágio).</li><li>Entrega de relatórios e ficheiros, com prazo, correção e feedback.</li><li>Registo e consulta de classificações.</li></ul>
    <p>As empresas parceiras apresentadas no rodapé são fictícias.</p>` },
  oferta: { title: 'Oferta formativa e certificação', body: `
    <p class="helper">${LEGAL_NOTE} Os cursos apresentados na Aldijos são fictícios.</p>
    <h3>Cursos profissionais</h3><p>São cursos de nível secundário (nível 4 do Quadro Nacional de Qualificações), com estrutura modular, formação em contexto de trabalho e prova final. Conferem certificação profissional e equivalência ao 12.º ano.</p>
    <h3>Catálogo Nacional de Qualificações</h3><p>As qualificações e os referenciais de formação constam do Catálogo Nacional de Qualificações, gerido pela ANQEP (Agência Nacional para a Qualificação e o Ensino Profissional). Uma escola real deve indicar a que qualificações do catálogo corresponde cada curso.</p>
    <h3>Informação por curso</h3><p>Na página inicial, cada curso indica a área, a duração e os módulos. Numa escola real deve também indicar saídas profissionais, condições de acesso e prosseguimento de estudos.</p>` },
  contactos: { title: 'Contactos', body: `
    <p class="helper">Contactos de demonstração: não correspondem a uma escola real.</p>
    <dl class="ev-meta" style="flex-direction:column; gap:8px; font-size:14px;">
      <div><dt style="flex-basis:110px;">Email</dt><dd>${CONTACTO.email}</dd></div>
      <div><dt style="flex-basis:110px;">Privacidade</dt><dd>${CONTACTO.privacidade}</dd></div>
      <div><dt style="flex-basis:110px;">Telefone</dt><dd>${CONTACTO.tel} (exemplo)</dd></div>
      <div><dt style="flex-basis:110px;">Horário</dt><dd>${CONTACTO.horario}</dd></div>
      <div><dt style="flex-basis:110px;">Morada</dt><dd>Escola fictícia, sem morada real</dd></div></dl>
    <h3>Apoio a alunos e professores</h3><p>Se não consegue entrar, peça à administração para repor a palavra-passe. Sobre problemas técnicos, use o email acima.</p>` },
  mapa: { title: 'Mapa do site', body: `
    <h3>Página inicial</h3><ul><li>Quem somos</li><li>Como funciona</li><li>Cursos</li><li>Eventos</li><li>Números</li></ul>
    <h3>Acesso</h3><ul><li>Entrar</li><li>Criar conta de aluno</li></ul>
    <h3>Aluno</h3><ul><li>Dashboard, Módulos, Atividades, Resultados, Eventos</li></ul>
    <h3>Professor</h3><ul><li>Dashboard, Turmas, Módulos, Atividades, Correções, Desempenho, Eventos</li></ul>
    <h3>Administração</h3><ul><li>Dashboard, Utilizadores, Cursos, Turmas, Módulos, Eventos</li></ul>
    <h3>Ensino profissional</h3><ul><li>Política de Qualidade (EQAVET), Regulamento Interno, Avaliação e Classificações, FCT e PAP, Oferta formativa</li></ul>
    <h3>Informação legal</h3><ul><li>Privacidade, Cookies, Termos e Condições, Acessibilidade, Contactos, Livro de Reclamações</li></ul>` },
};
ACTIONS.policy = el => {
  const p = POLICIES[el.dataset.p]; if (!p) return;
  openModal(`<div class="modal-body legal"><h2 id="modal-title">${esc(p.title)}</h2>${p.body}<div class="modal-actions"><button class="btn" data-action="close-modal">Fechar</button></div></div>`, { plain: true });
};
ACTIONS.top = () => { window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }); };

const legalLinksHtml = () => LEGAL_LINKS.map(([k, l]) => `<button class="link-btn" data-action="policy" data-p="${k}">${l}</button>`).join('');
const reclamacoesHtml = cls => `<a class="${cls}" href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer">Livro de Reclamações <span aria-hidden="true">↗</span><span class="sr-only"> (abre num novo separador)</span></a>`;

function footerHtml() {
  const pol = (k, l) => `<button class="link-btn" data-action="policy" data-p="${k}">${l}</button>`;
  return `<footer class="foot">
    <div class="foot-main"><div class="wrap"><div class="foot-grid">
      <div><img class="foot-logo" src="${asset('img/logo-aldijos-branco.png')}" alt="Aldijos, desde 2026">
        <p class="foot-desc">Plataforma de apoio ao ensino profissional e ao ensino secundário: atividades, submissões, correção e feedback num só lugar.</p>
        <address class="foot-contact"><span>${CONTACTO.email}</span><span>${CONTACTO.tel} (exemplo)</span><span>${CONTACTO.horario}</span></address></div>
      <div><h4>Plataforma</h4>
        <button class="link-btn" data-action="scroll" data-target="quem-somos">Quem somos</button><button class="link-btn" data-action="scroll" data-target="como-funciona">Como funciona</button>
        <button class="link-btn" data-action="scroll" data-target="cursos">Cursos</button><button class="link-btn" data-action="scroll" data-target="eventos">Eventos</button>
        <h4 style="margin-top:14px;">Acesso</h4><button class="link-btn" data-action="go-login">Entrar</button><button class="link-btn" data-action="go-register">Criar conta de aluno</button></div>
      <div><h4>Ensino profissional</h4>
        ${pol('qualidade', 'Política de Qualidade (EQAVET)')}${pol('regulamento', 'Regulamento Interno')}${pol('avaliacao', 'Avaliação e Classificações')}${pol('fct', 'FCT e PAP')}${pol('oferta', 'Oferta formativa')}</div>
      <div><h4>Informação legal</h4>
        ${pol('privacidade', 'Política de Privacidade')}${pol('cookies', 'Política de Cookies')}${pol('termos', 'Termos e Condições')}${pol('acessibilidade', 'Acessibilidade')}${pol('contactos', 'Contactos')}${pol('mapa', 'Mapa do site')}
        ${reclamacoesHtml('link-btn')}</div>
    </div></div></div>
    <div class="band" aria-label="Financiadores, certificações e parceiros"><div class="band-in">${fundersBandHtml()}</div>
      <div class="band-in band-partners-row"><span class="band-label">Empresas parceiras</span><div class="partners" role="list">${PARTNERS.map(partnerHtml).join('')}</div></div>
      <div class="band-in"><p class="band-note">Logótipos institucionais e selo apresentados como exemplo de layout: não implicam financiamento, certificação ou apoio à Aldijos. As empresas parceiras são fictícias.</p></div></div>
    <div class="foot-legal"><div class="wrap foot-legal-in">
      <span>© 2026 Aldijos · Projeto escolar · Desde 2026</span>
      <span class="foot-legal-links">${LEGAL_LINKS.slice(0, 3).map(([k, l]) => `<button data-action="policy" data-p="${k}">${l}</button>`).join('')}<button data-action="top">Voltar ao topo ↑</button></span>
      <p class="foot-note">Os cursos, eventos, empresas parceiras e contactos apresentados são fictícios e não representam uma escola específica.</p>
    </div></div>
  </footer>`;
}
const appFooterHtml = () => `<div class="app-foot"><span>© 2026 Aldijos</span>${LEGAL_LINKS.slice(0, 4).map(([k, l]) => `<button data-action="policy" data-p="${k}">${l}</button>`).join('')}${reclamacoesHtml('')}</div>`;
