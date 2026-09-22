/*
 * Dados iniciais de demonstração da Aldijos (fictícios).
 * Todas as contas usam a mesma palavra-passe de demonstração (ver DEMO_PASSWORD).
 * As datas são relativas ao dia em que os dados são criados, para a demonstração nunca ficar "vencida".
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./store.js'));
  else root.Aldijos = Object.assign(root.Aldijos || {}, factory(root.Aldijos));
})(typeof self !== 'undefined' ? self : this, function (A) {
  'use strict';

  const DEMO_PASSWORD = 'Aldijos#2026';
  const SEED_VERSION = 3;   // aumentar sempre que os dados de demonstração mudarem
  const { nextId, applySubmission, applyGrade, isoDate, addDays } = A.core;

  const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.');

  const COURSES = [
    { key: 'dg', name: 'Técnico de Design Gráfico', area: 'Artes e Design', photo: 'img/cursos/design-grafico.jpg',
      short: 'Comunicação visual, tipografia e identidade de marca.', description: 'Aprende a criar peças gráficas para meios impressos e digitais: composição visual, tipografia, cor e identidade visual.',
      classes: ['DGR11'], modules: [['Design de Comunicação', 60], ['Tipografia e Composição', 50], ['Identidade Visual', 70]] },
    { key: 'mm', name: 'Técnico de Multimédia', area: 'Comunicação e Multimédia', photo: 'img/cursos/multimedia.jpg',
      short: 'Conteúdos digitais interativos, imagem, vídeo e web.', description: 'Produz conteúdos interativos, edita imagem e vídeo e desenvolve páginas web para diferentes plataformas.',
      classes: ['MUL11'], modules: [['Produção de Conteúdos Interativos', 80], ['Edição de Imagem e Vídeo', 70], ['Desenvolvimento Web', 60]] },
    { key: 'inf', name: 'Técnico de Informática', area: 'Informática e Tecnologia', photo: 'img/cursos/informatica.jpg',
      short: 'Programação, bases de dados, web e redes.', description: 'Aprende a programar, modelar bases de dados, criar aplicações web e instalar e gerir redes de computadores.',
      classes: ['INF11', 'INF12'], modules: [['Programação', 90], ['Bases de Dados', 70], ['Desenvolvimento Web', 80], ['Redes de Computadores', 60]] },
    { key: 'mod', name: 'Técnico de Moda', area: 'Moda e Têxtil', photo: 'img/cursos/moda.jpg',
      short: 'Desenho, modelação e confeção com sustentabilidade.', description: 'Desenha, modela e confeciona peças de vestuário, com atenção aos materiais e à sustentabilidade.',
      classes: ['MOD11'], modules: [['Desenho de Moda', 60], ['Modelação e Confeção', 80], ['Materiais e Sustentabilidade', 50]] },
    { key: 'est', name: 'Técnico de Estética', area: 'Estética e Bem-estar', photo: 'img/cursos/estetica.jpg',
      short: 'Maquilhagem, cuidados de imagem e atendimento.', description: 'Domina técnicas de maquilhagem e cuidados de imagem e aprende a atender e aconselhar clientes.',
      classes: ['EST11'], modules: [['Técnicas de Maquilhagem', 70], ['Cuidados de Imagem', 60], ['Atendimento ao Cliente', 40]] },
    { key: 'tur', name: 'Técnico de Turismo', area: 'Turismo e Hotelaria', photo: 'img/cursos/turismo.jpg',
      short: 'Informação turística, línguas e organização de eventos.', description: 'Prepara-te para receber, informar e orientar visitantes, comunicar em línguas estrangeiras e organizar eventos.',
      classes: ['TUR11'], modules: [['Informação Turística', 60], ['Comunicação em Língua Estrangeira', 80], ['Organização de Eventos', 50]] },
    { key: 'av', name: 'Técnico de Audiovisuais', area: 'Audiovisuais e Media', photo: 'img/cursos/audiovisuais.jpg',
      short: 'Fotografia, vídeo, som e pós-produção.', description: 'Capta e trabalha imagem, vídeo e som, da realização à pós-produção de conteúdos audiovisuais.',
      classes: ['AUD11'], modules: [['Fotografia', 60], ['Realização de Vídeo', 80], ['Som e Pós-produção', 60]] },
    { key: 'ele', name: 'Técnico de Eletrónica', area: 'Eletrónica e Automação', photo: 'img/cursos/eletronica.jpg',
      short: 'Circuitos, sistemas eletrónicos e automação.', description: 'Monta e testa circuitos e sistemas eletrónicos e aprende os fundamentos da automação e das instalações elétricas.',
      classes: ['ELE11'], modules: [['Circuitos e Sistemas Eletrónicos', 80], ['Automação', 70], ['Instalações Elétricas', 50]] },
    { key: 'mec', name: 'Técnico de Mecatrónica', area: 'Mecatrónica e Manutenção', photo: 'img/cursos/mecatronica.jpg',
      short: 'Mecânica, controlo e manutenção industrial.', description: 'Junta mecânica, eletricidade e controlo para instalar e manter equipamentos e sistemas industriais.',
      classes: ['MEC11'], modules: [['Sistemas Mecânicos', 70], ['Eletricidade e Controlo', 60], ['Manutenção Industrial', 60]] },
    { key: 'avi', name: 'Técnico da Área da Aviação', area: 'Aeronáutica e Aviação', photo: 'img/cursos/aviacao.jpg',
      short: 'Fundamentos da aviação, segurança e inglês técnico.', description: 'Conhece o setor da aviação, os procedimentos de segurança e o inglês técnico usado no meio aeronáutico.',
      classes: ['AVI11'], modules: [['Introdução à Aviação', 50], ['Segurança e Procedimentos', 60], ['Inglês Técnico', 50]] },
  ];

  const STUDENTS = {
    INF11: ['Beatriz Antunes', 'Diogo Ferreira', 'Inês Carvalho', 'Rui Sampaio', 'Sofia Martins'],
    INF12: ['André Silva', 'Leonor Pinto', 'Miguel Costa'],
    DGR11: ['Carolina Dias', 'Tomás Rocha', 'Mariana Lopes'],
    MUL11: ['Pedro Santos', 'Ana Teixeira', 'Gonçalo Ribeiro'],
    MOD11: ['Marta Oliveira', 'Lara Fernandes', 'Bruno Almeida'],
    EST11: ['Filipa Moreira', 'Daniela Cruz', 'Rafael Pires'],
    TUR11: ['Catarina Vaz', 'Hugo Mendes', 'Joana Barros'],
    AUD11: ['Vasco Neves', 'Inês Duarte', 'Duarte Gaspar'],
    ELE11: ['Tiago Monteiro', 'Rúben Faria', 'Sara Tavares'],
    MEC11: ['David Correia', 'Alexandre Rêgo', 'Bárbara Sá'],
    AVI11: ['Filipe Amaral', 'Núria Campos', 'Simão Marques'],
  };

  // professor -> [curso, [módulos] | 'todos']
  const TEACHERS = [
    ['Ricardo Lima', [['inf', ['Bases de Dados', 'Desenvolvimento Web']]]],
    ['Marta Pinheiro', [['inf', ['Programação', 'Redes de Computadores']]]],
    ['Helena Sousa', [['dg', 'todos'], ['mm', 'todos']]],
    ['Joana Ferraz', [['mod', 'todos'], ['est', 'todos']]],
    ['Paulo Nogueira', [['tur', 'todos'], ['avi', 'todos']]],
    ['Nuno Batista', [['ele', 'todos'], ['mec', 'todos']]],
    ['Rita Gomes', [['av', 'todos']]],
  ];

  const q = {
    mc: (statement, opts, ok) => ({ type: 'MC', statement, options: opts.map((t, i) => ({ text: t, correct: i === ok })) }),
    vf: (statement, v) => ({ type: 'VF', statement, correctBool: v }),
    curta: statement => ({ type: 'CURTA', statement }),
    aberta: statement => ({ type: 'ABERTA', statement }),
  };

  async function buildSeed(ctx) {
    const t0 = isoDate(ctx.now);
    const at = n => addDays(t0, n);
    const atISO = n => at(n) + 'T10:00:00.000Z';
    const wk = n => { let d = new Date(at(n) + 'T12:00:00'); const w = d.getDay(); if (w === 6) d.setDate(d.getDate() + 2); if (w === 0) d.setDate(d.getDate() + 1); return isoDate(d); };
    const db = { v: 1, seedVersion: SEED_VERSION, seq: {}, users: [], courses: [], classes: [], modules: [], enrollments: [], teaching: [], activities: [], submissions: [], events: [] };
    const ph = await ctx.hashPassword(DEMO_PASSWORD);
    const emails = new Set();
    const addUser = (name, role) => {
      let base = slug(name), email = `${base}@aldijos.pt`, n = 2;
      while (emails.has(email)) email = `${base}${n++}@aldijos.pt`;
      emails.add(email);
      const u = { id: nextId(db, 'u'), name, email, role, active: true, passwordHash: ph, createdAt: atISO(-60) };
      db.users.push(u); return u;
    };

    addUser('Coordenação Aldijos', 'ADMIN').email = 'admin@aldijos.pt';
    const teacher = {}; TEACHERS.forEach(([name]) => { teacher[name] = addUser(name, 'PROFESSOR'); });

    const courseByKey = {}, classByName = {}, moduleBy = {};
    COURSES.forEach(c => {
      const course = { id: nextId(db, 'c'), name: c.name, area: c.area, short: c.short, description: c.description, years: 3, photo: c.photo };
      db.courses.push(course); courseByKey[c.key] = course;
      c.classes.forEach(cn => { const cl = { id: nextId(db, 't'), courseId: course.id, name: cn, year: '2026/2027' }; db.classes.push(cl); classByName[cn] = cl; });
      c.modules.forEach(([name, hours]) => { const m = { id: nextId(db, 'm'), courseId: course.id, name, hours }; db.modules.push(m); moduleBy[c.key + ':' + name] = m; });
    });

    Object.keys(STUDENTS).forEach(cn => STUDENTS[cn].forEach(name => {
      const u = addUser(name, 'ALUNO'); db.enrollments.push({ studentId: u.id, classId: classByName[cn].id });
    }));

    TEACHERS.forEach(([name, assigns]) => assigns.forEach(([key, mods]) => {
      const course = COURSES.find(c => c.key === key);
      const names = mods === 'todos' ? course.modules.map(m => m[0]) : mods;
      names.forEach(mn => course.classes.forEach(cn => db.teaching.push({ teacherId: teacher[name].id, moduleId: moduleBy[key + ':' + mn].id, classId: classByName[cn].id })));
    }));

    /* ----- atividades ----- */
    const activity = (tName, key, moduleName, className, title, description, deadlineOffset, status, questions, publishedOffset) => {
      const a = {
        id: nextId(db, 'a'), teacherId: teacher[tName].id, moduleId: moduleBy[key + ':' + moduleName].id, classId: classByName[className].id,
        title, description, deadline: at(deadlineOffset), status, createdAt: atISO((publishedOffset || -3) - 1), publishedAt: status === 'PUBLICADA' ? atISO(publishedOffset || -3) : null,
        questions: questions.map(x => ({ id: nextId(db, 'q'), points: 1, ...x, options: x.options ? x.options.map(o => ({ id: nextId(db, 'o'), ...o })) : undefined })),
      };
      db.activities.push(a); return a;
    };
    const submit = (a, studentName, arr, whenOffset, files) => {
      const u = db.users.find(x => x.name === studentName);
      const input = {};
      a.questions.forEach((qq, i) => {
        const v = arr[i];
        if (qq.type === 'MC') input[qq.id] = qq.options[v] ? qq.options[v].id : undefined; else input[qq.id] = v;
      });
      const s = { id: nextId(db, 's'), activityId: a.id, studentId: u.id, status: 'EM_CURSO', files: files || [], feedback: '' };
      applySubmission(s, a, input, atISO(whenOffset)); db.submissions.push(s); return s;
    };
    const grade = (s, a, tName, scores, feedback, whenOffset) => {
      const scoreMap = {}; a.questions.forEach((qq, i) => { if (scores[i] !== undefined) scoreMap[qq.id] = scores[i]; });
      applyGrade(s, a, teacher[tName].id, { scores: scoreMap, feedback }, atISO(whenOffset));
    };

    const ficha1 = activity('Ricardo Lima', 'inf', 'Bases de Dados', 'INF11', 'Ficha 1 — Introdução a SQL', 'Consultas básicas em SQL: SELECT, WHERE e JOIN.', -9, 'PUBLICADA', [
      q.mc('Qual comando SQL devolve linhas de uma tabela?', ['SELECT', 'INSERT', 'UPDATE', 'DELETE'], 0),
      q.mc('Que cláusula filtra as linhas devolvidas?', ['ORDER BY', 'WHERE', 'GROUP BY', 'LIMIT'], 1),
      q.vf('A cláusula JOIN permite combinar linhas de tabelas relacionadas.', true),
      q.aberta('Explica, com um exemplo, a diferença entre INNER JOIN e LEFT JOIN.'),
    ], -20);
    const openAns = 'O INNER JOIN devolve só as linhas com correspondência nas duas tabelas; o LEFT JOIN devolve todas as da tabela da esquerda, mesmo sem correspondência.';
    grade(submit(ficha1, 'Beatriz Antunes', [0, 1, true, openAns], -11), ficha1, 'Ricardo Lima', { 3: 0.75 }, 'Bom domínio das consultas base. Reforça o uso de junções (JOIN) na próxima ficha.', -10);
    grade(submit(ficha1, 'Diogo Ferreira', [0, 1, true, openAns], -12), ficha1, 'Ricardo Lima', { 3: 1 }, 'Excelente trabalho, resposta completa e bem exemplificada.', -10);
    submit(ficha1, 'Inês Carvalho', [0, 0, true, 'Um junta tudo e o outro só alguns.'], -9);
    grade(submit(ficha1, 'Rui Sampaio', [0, 1, false, 'O LEFT JOIN mantém as linhas da esquerda.'], -10), ficha1, 'Ricardo Lima', { 3: 0.5 }, 'Revê o conceito de JOIN; falta o exemplo pedido.', -9);

    const teste = activity('Ricardo Lima', 'inf', 'Bases de Dados', 'INF11', 'Teste — Normalização', 'Teste sobre formas normais e boas práticas de modelação.', 2, 'PUBLICADA', [
      q.mc('Que forma normal elimina as dependências transitivas?', ['1ª Forma Normal', '2ª Forma Normal', '3ª Forma Normal', 'Forma Normal de Boyce-Codd'], 2),
      q.mc('Qual é uma vantagem da normalização?', ['Aumentar a redundância', 'Reduzir anomalias de atualização', 'Eliminar chaves primárias', 'Impedir relações N:N'], 1),
      q.vf('Uma chave estrangeira pode referenciar a chave primária de outra tabela.', true),
      q.curta('Indica o comando SQL que cria uma nova tabela.'),
    ], -5);
    submit(teste, 'Diogo Ferreira', [2, 1, true, 'CREATE TABLE'], -1);

    activity('Ricardo Lima', 'inf', 'Bases de Dados', 'INF11', 'Ficha 3 — Modelo Relacional', 'Chaves primárias, chaves estrangeiras e normalização.', 6, 'PUBLICADA', [
      q.mc('O que identifica de forma única uma linha numa tabela?', ['Chave estrangeira', 'Chave primária', 'Índice secundário', 'Atributo derivado'], 1),
      q.mc('Qual é uma vantagem da normalização?', ['Aumentar a redundância', 'Reduzir anomalias de atualização', 'Eliminar todas as chaves primárias', 'Impedir relações muitos-para-muitos'], 1),
      q.vf('Uma chave estrangeira pode referenciar a chave primária de outra tabela.', true),
      q.mc('Que forma normal elimina as dependências transitivas?', ['1ª Forma Normal', '2ª Forma Normal', '3ª Forma Normal', 'Boyce-Codd'], 2),
      q.curta('Indica o comando SQL que cria uma nova tabela.'),
      q.aberta('Explica, por palavras tuas, a diferença entre chave primária e chave estrangeira, com um exemplo.'),
    ], -1);
    activity('Ricardo Lima', 'inf', 'Desenvolvimento Web', 'INF12', 'Ficha 1 — HTML e CSS', 'Estrutura de uma página e estilos básicos.', 14, 'RASCUNHO', [
      q.mc('Qual atributo HTML torna um campo de formulário obrigatório?', ['required', 'mandatory', 'validate', 'must-fill'], 0),
      q.vf('O método POST expõe os dados do formulário diretamente na URL.', false),
    ]);
    activity('Marta Pinheiro', 'inf', 'Programação', 'INF11', 'Exercício prático de programação', 'Resolve o desafio e anexa o ficheiro com o código.', 4, 'PUBLICADA', [
      q.curta('Que estrutura de repetição usarias para percorrer todos os elementos de uma lista?'),
      q.aberta('Descreve o algoritmo que implementaste e como o testaste.'),
    ], -2);
    const dg = activity('Helena Sousa', 'dg', 'Design de Comunicação', 'DGR11', 'Ficha de avaliação — Design Digital', 'Conceitos de cor, composição e formatos digitais.', 8, 'PUBLICADA', [
      q.mc('Qual modelo de cor é usado em ecrãs?', ['CMYK', 'RGB', 'Pantone', 'Escala de cinza'], 1),
      q.mc('Que formato de imagem suporta transparência?', ['JPG', 'PNG', 'BMP', 'TXT'], 1),
      q.vf('A tipografia influencia a legibilidade de uma peça gráfica.', true),
    ], -2);
    submit(dg, 'Carolina Dias', [1, 1, true], -1);
    activity('Helena Sousa', 'dg', 'Identidade Visual', 'DGR11', 'Projeto de identidade visual', 'Cria a identidade visual de uma marca fictícia e anexa o ficheiro final.', 15, 'PUBLICADA', [
      q.aberta('Descreve o conceito da tua marca e as decisões de cor e tipografia.'),
    ], -1);
    activity('Joana Ferraz', 'mod', 'Materiais e Sustentabilidade', 'MOD11', 'Trabalho de pesquisa sobre sustentabilidade', 'Pesquisa sobre materiais sustentáveis na moda.', 10, 'PUBLICADA', [
      q.aberta('Apresenta três materiais sustentáveis e uma vantagem de cada um.'),
    ], -1);
    activity('Paulo Nogueira', 'tur', 'Informação Turística', 'TUR11', 'Questionário de preparação para estágio', 'Revê o essencial antes do estágio.', 5, 'PUBLICADA', [
      q.mc('Qual é o primeiro passo no atendimento a um visitante?', ['Ignorar o pedido', 'Cumprimentar e ouvir a necessidade', 'Entregar um folheto sem falar', 'Pedir que volte mais tarde'], 1),
      q.vf('Informar o visitante com clareza faz parte do serviço de turismo.', true),
      q.mc('O que deve fazer se não souber a resposta?', ['Inventar', 'Indicar que vai confirmar e responder depois', 'Mudar de assunto', 'Recusar atender'], 1),
    ], -1);
    activity('Paulo Nogueira', 'avi', 'Introdução à Aviação', 'AVI11', 'Relatório de visita de estudo', 'Relatório sobre a visita de estudo (a publicar depois da visita).', 46, 'RASCUNHO', [
      q.aberta('Descreve o que aprendeste na visita e as profissões que conheceste.'),
    ]);

    /* ----- eventos: 3 por ramo + 3 gerais ----- */
    let week = wk(48); while (new Date(week + 'T12:00:00').getDay() !== 1) week = addDays(week, 1);
    const ev = (key, category, title, description, offset, time, place, audience, extra) => db.events.push({
      id: nextId(db, 'e'), courseId: key ? courseByKey[key].id : null, category, title, description, date: wk(offset), dateEnd: '', time: time || '', timeNote: '', place, audience, image: '', published: true, ...(extra || {}),
    });
    ev('inf', 'Desenvolvimento e Tecnologia', 'Sessão de Programação em Grupo', 'Desafios de programação e pequenos projetos em equipa.', 4, '14:30', 'Laboratório de Informática', 'Alunos de Informática e áreas tecnológicas');
    ev('inf', 'Segurança Informática', 'Introdução à Cibersegurança', 'Boas práticas para proteger contas, dados e dispositivos.', 24, '10:00', 'Laboratório de Informática', 'Alunos de Informática');
    ev('inf', 'Competição', 'Maratona de Programação', 'Equipas resolvem problemas contra o relógio.', 66, '09:30', 'Auditório', 'Alunos de Informática e Multimédia');
    ev('dg', 'Design e Criatividade', 'Workshop de Design Gráfico', 'Composição visual, tipografia e cor na prática.', 10, '10:00', 'Sala de Design', 'Alunos de Design Gráfico e Multimédia');
    ev('dg', 'Identidade Visual', 'Oficina de Identidade Visual', 'Do conceito ao logótipo: construir uma marca.', 31, '14:00', 'Sala de Design', 'Alunos de Design Gráfico');
    ev('dg', 'Concurso', 'Concurso de Cartazes', 'Cartazes originais votados pela comunidade escolar.', 58, '15:00', 'Sala de Design', 'Alunos de Design e Multimédia');
    ev('mm', 'Multimédia', 'Semana da Multimédia e Audiovisuais', 'Fotografia, vídeo, edição, som e animação numa semana temática.', 48, '', 'Salas e estúdios multimédia', 'Alunos de Multimédia, Audiovisuais e Design', { date: week, dateEnd: addDays(week, 4), timeNote: 'horário no programa' });
    ev('mm', 'Web', 'Workshop de Criação de Websites', 'Constrói uma página web do zero, passo a passo.', 18, '10:30', 'Online', 'Alunos de Multimédia e Informática');
    ev('mm', 'Ferramentas Digitais', 'Sessão sobre Ferramentas Digitais', 'Ferramentas úteis para criar, colaborar e apresentar.', 72, '14:00', 'Online', 'Alunos de Multimédia');
    ev('mod', 'Moda e Sustentabilidade', 'Oficina de Moda e Sustentabilidade', 'Reaproveitamento de materiais e criação de peças.', 26, '09:30', 'Atelier de Moda', 'Alunos de Moda e áreas criativas');
    ev('mod', 'Confeção', 'Workshop de Modelação e Confeção', 'Do molde à peça final, com acompanhamento.', 40, '14:00', 'Atelier de Moda', 'Alunos de Moda');
    ev('mod', 'Desfile', 'Desfile de Moda dos Alunos', 'Apresentação das coleções criadas ao longo do período.', 69, '16:00', 'Auditório', 'Toda a comunidade escolar');
    ev('est', 'Estética e Bem-estar', 'Workshop de Maquilhagem e Estética', 'Técnicas básicas de maquilhagem e preparação de imagem.', 32, '14:00', 'Laboratório de Estética', 'Alunos de Estética');
    ev('est', 'Cuidados de Imagem', 'Sessão sobre Cuidados de Imagem', 'Cuidados de pele e imagem pessoal profissional.', 45, '10:00', 'Laboratório de Estética', 'Alunos de Estética');
    ev('est', 'Atendimento', 'Simulação de Atendimento ao Cliente', 'Treina o atendimento com casos reais simulados.', 75, '11:00', 'Laboratório de Estética', 'Alunos de Estética');
    ev('tur', 'Carreira', 'Encontro com Profissionais do Turismo', 'Conversa com profissionais sobre percursos e estágios.', 16, '10:00', 'Auditório', 'Alunos de Turismo');
    ev('tur', 'Visitas de Estudo', 'Visita de Estudo a Unidade Hoteleira', 'Conhecer o funcionamento de um hotel por dentro.', 60, '08:30', 'Local externo — a confirmar', 'Alunos de Turismo');
    ev('tur', 'Eventos', 'Workshop de Organização de Eventos', 'Planear um evento: orçamento, logística e comunicação.', 67, '14:30', 'Sala de Projetos', 'Alunos de Turismo');
    ev('av', 'Fotografia', 'Workshop de Fotografia', 'Luz, enquadramento e edição básica.', 12, '14:00', 'Estúdio de Fotografia', 'Alunos de Audiovisuais e Multimédia');
    ev('av', 'Som', 'Oficina de Som e Pós-produção', 'Captação de som e mistura em estúdio.', 38, '10:00', 'Estúdio de Som', 'Alunos de Audiovisuais');
    ev('av', 'Vídeo', 'Sessão de Realização de Vídeo', 'Da ideia ao guião e à rodagem.', 54, '15:00', 'Estúdio de Vídeo', 'Alunos de Audiovisuais');
    ev('ele', 'Eletrónica', 'Oficina de Circuitos e Sensores', 'Monta e testa um circuito com sensores.', 14, '09:30', 'Laboratório de Eletrónica', 'Alunos de Eletrónica');
    ev('ele', 'Automação', 'Introdução à Automação', 'Primeiros passos com automatismos e controlo.', 44, '14:00', 'Laboratório de Eletrónica', 'Alunos de Eletrónica e Mecatrónica');
    ev('ele', 'Concurso', 'Concurso de Projetos de Eletrónica', 'Apresenta o teu projeto a um júri de professores.', 70, '10:00', 'Oficina', 'Alunos de Eletrónica');
    ev('mec', 'Robótica', 'Oficina de Robótica', 'Programa e testa um braço robótico.', 22, '10:00', 'Oficina de Mecatrónica', 'Alunos de Mecatrónica e Eletrónica');
    ev('mec', 'Visitas de Estudo', 'Visita de Estudo a Unidade Industrial', 'Ver linhas de produção e manutenção em contexto real.', 51, '08:30', 'Local externo — a confirmar', 'Alunos de Mecatrónica');
    ev('mec', 'Manutenção', 'Sessão de Manutenção Industrial', 'Manutenção preventiva e diagnóstico de avarias.', 78, '14:00', 'Oficina de Mecatrónica', 'Alunos de Mecatrónica');
    ev('avi', 'Visitas de Estudo', 'Visita de Estudo à Área da Aviação', 'Conhecer profissões e tecnologias do setor da aviação.', 46, '08:30', 'Local externo — a confirmar', 'Alunos de Aviação, Turismo e Mecatrónica');
    ev('avi', 'Segurança', 'Sessão sobre Segurança e Procedimentos', 'Procedimentos de segurança em contexto aeronáutico.', 28, '11:00', 'Auditório', 'Alunos de Aviação');
    ev('avi', 'Carreira', 'Encontro com Profissionais da Aviação', 'Profissionais do setor falam do seu percurso.', 62, '10:00', 'Online', 'Alunos de Aviação');
    ev(null, 'Projetos Escolares', 'Mostra de Projetos dos Alunos', 'Trabalhos de design, programação, multimédia, moda e audiovisual.', 20, '15:00', 'Auditório da escola', 'Alunos, professores e comunidade escolar');
    ev(null, 'Carreira e Futuro', 'Encontro de Orientação Profissional', 'Estudos, estágio, mercado de trabalho e entrevistas.', 34, '11:00', 'Auditório', 'Alunos finalistas');
    ev(null, 'Formação e Carreira', 'Feira de Cursos e Profissões', 'Áreas profissionais e percursos formativos, para toda a comunidade.', 63, '09:00', 'Espaço multiusos', 'Alunos, encarregados de educação e comunidade escolar');


    const EVENT_IMAGES = {
      'Sessão de Programação em Grupo': 'inf-prog-grupo', 'Introdução à Cibersegurança': 'inf-ciber', 'Maratona de Programação': 'inf-maratona',
      'Workshop de Design Gráfico': 'dg-workshop', 'Oficina de Identidade Visual': 'dg-identidade', 'Concurso de Cartazes': 'dg-cartazes',
      'Semana da Multimédia e Audiovisuais': 'mm-semana', 'Workshop de Criação de Websites': 'mm-websites', 'Sessão sobre Ferramentas Digitais': 'mm-ferramentas',
      'Oficina de Moda e Sustentabilidade': 'mod-oficina', 'Workshop de Modelação e Confeção': 'mod-confecao', 'Desfile de Moda dos Alunos': 'mod-desfile',
      'Workshop de Maquilhagem e Estética': 'est-maquilhagem', 'Sessão sobre Cuidados de Imagem': 'est-cuidados', 'Simulação de Atendimento ao Cliente': 'est-atendimento',
      'Encontro com Profissionais do Turismo': 'tur-encontro', 'Visita de Estudo a Unidade Hoteleira': 'tur-visita', 'Workshop de Organização de Eventos': 'tur-eventos',
      'Workshop de Fotografia': 'av-foto', 'Oficina de Som e Pós-produção': 'av-som', 'Sessão de Realização de Vídeo': 'av-video',
      'Oficina de Circuitos e Sensores': 'ele-circuitos', 'Introdução à Automação': 'ele-automacao', 'Concurso de Projetos de Eletrónica': 'ele-concurso',
      'Oficina de Robótica': 'mec-robotica', 'Visita de Estudo a Unidade Industrial': 'mec-visita', 'Sessão de Manutenção Industrial': 'mec-manutencao',
      'Visita de Estudo à Área da Aviação': 'avi-visita', 'Sessão sobre Segurança e Procedimentos': 'avi-seguranca', 'Encontro com Profissionais da Aviação': 'avi-profissionais',
      'Mostra de Projetos dos Alunos': 'ger-mostra', 'Encontro de Orientação Profissional': 'ger-orientacao', 'Feira de Cursos e Profissões': 'ger-feira',
    };
    db.events.forEach(e => { e.image = 'img/eventos/' + EVENT_IMAGES[e.title] + '.jpg'; });

    return db;
  }

  return { buildSeed, DEMO_PASSWORD, SEED_VERSION };
});
