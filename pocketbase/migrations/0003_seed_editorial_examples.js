/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    if (!app.hasTable('reviews') || !app.hasTable('tasks')) return
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'romario@usecurling.com')
    } catch (_) {
      user = new Record(app.findCollectionByNameOrId('_pb_users_auth_'))
      user.setEmail('romario@usecurling.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Romário')
      app.save(user)
    }
    const reviews = app.findCollectionByNameOrId('reviews')
    const tasks = app.findCollectionByNameOrId('tasks')
    const samples = [
      {
        id: 'seedreview00001',
        title: 'Campanha Método Linha Clara',
        source: 'google_docs',
        copywriter: 'Marina Alves',
        score_hook: 8.4,
        score_argument: 7.2,
        score_curiosity: 6.8,
        score_overall: 7.5,
        status: 'pequenos_ajustes',
        doc: 'Copy — Método Linha Clara',
        link: 'https://docs.google.com/document/d/seed-example-1/edit',
        copy: 'Você não precisa de mais ideias. Precisa enxergar qual delas merece virar campanha.\n\nO Método Linha Clara organiza decisões criativas em três movimentos simples. Você identifica o ruído, encontra a promessa central e transforma direção em uma mensagem que o público entende.\n\nConheça o método e veja a próxima campanha tomar forma.',
        hook: {
          nota: 8.4,
          veredito: 'Aprovado',
          diagnostico: 'A abertura cria contraste e fala com uma dor reconhecível.',
          problemas: [
            {
              titulo: 'Falta uma cena concreta',
              explicacao: 'A tensão é boa, mas ainda abstrata.',
              trecho: 'Você não precisa de mais ideias.',
              impacto: 'Reduz a identificação imediata.',
              sugestao: 'Ancorar a frase em uma reunião ou briefing real.',
            },
          ],
          variacoes_hook: [
            'A reunião terminou com 14 ideias — e nenhuma decisão.',
            'Seu problema não é falta de ideias. É não saber qual delas merece orçamento.',
            'Toda campanha mediana começa com a mesma frase: vamos testar tudo.',
          ],
        },
        argument: {
          nota: 7.2,
          veredito: 'Ajustar',
          diagnostico: 'A promessa é clara, mas o mecanismo ainda parece genérico.',
          falhas: [
            {
              titulo: 'Mecanismo pouco demonstrado',
              explicacao: 'Os três movimentos são citados sem mostrar como funcionam.',
              trecho: 'três movimentos simples',
              impacto: 'A promessa perde credibilidade.',
            },
          ],
          ajustes: [
            {
              titulo: 'Demonstrar um movimento',
              sugestao: 'Inclua um microexemplo do antes e depois de uma decisão.',
              prioridade: 'alta',
              criterio: 'argumento',
            },
          ],
          comparacoes: [
            {
              antes: 'organiza decisões criativas',
              depois: 'reduz 14 caminhos a uma promessa que cabe em uma linha',
              motivo: 'Torna o benefício observável.',
            },
          ],
          cta: {
            veredito: 'Ajustar',
            diagnostico: 'O próximo passo não está explícito.',
            trecho: 'Conheça o método',
            sugestoes: ['Veja os três movimentos em ação', 'Abra o diagnóstico da sua campanha'],
          },
        },
        curiosity: {
          nota: 6.8,
          veredito: 'Ajustar',
          diagnostico: 'A curiosidade abre forte, mas cai quando o método é resumido cedo demais.',
          curva: [
            { segmento: 'Hook', valor: 84, trecho: 'Você não precisa...' },
            { segmento: 'Problema', valor: 78, trecho: 'organiza decisões' },
            { segmento: 'Mecanismo', valor: 55, trecho: 'três movimentos' },
            { segmento: 'CTA', valor: 66, trecho: 'Conheça o método' },
          ],
          pontos_queda: [
            {
              segmento: 'Mecanismo',
              trecho: 'identifica o ruído, encontra a promessa',
              por_que_caiu: 'A sequência entrega a estrutura sem criar uma pergunta nova.',
              ajuste:
                'Revele apenas o primeiro movimento e indique que o terceiro contraria o processo comum.',
            },
          ],
          ajustes: [
            {
              titulo: 'Segurar a estrutura completa',
              sugestao: 'Transforme o terceiro movimento em uma revelação.',
              prioridade: 'media',
            },
          ],
        },
      },
      {
        id: 'seedreview00002',
        title: 'Landing Page — Sprint de Posicionamento',
        source: 'manual',
        copywriter: 'Caio Nunes',
        score_hook: 5.3,
        score_argument: 4.8,
        score_curiosity: 4.2,
        score_overall: 4.8,
        status: 'ajustes_relevantes',
        doc: '',
        link: '',
        copy: 'Transforme sua marca hoje.\n\nNossa solução completa ajuda empresas a crescer com estratégia, criatividade e resultados. Um processo inovador feito para você.\n\nClique aqui e saiba mais.',
        hook: {
          nota: 5.3,
          veredito: 'Crítico',
          diagnostico: 'A abertura é publicitária e não cria uma imagem específica.',
          problemas: [
            {
              titulo: 'Hook genérico',
              explicacao: 'A frase poderia apresentar qualquer consultoria.',
              trecho: 'Transforme sua marca hoje.',
              impacto: 'Não interrompe o padrão nem cria curiosidade.',
              sugestao: 'Abrir com um sintoma concreto de posicionamento confuso.',
            },
          ],
          variacoes_hook: [
            'Se três pessoas descrevem sua marca de três jeitos, você não tem um posicionamento.',
            'Sua marca não precisa de outro slogan. Precisa de uma escolha difícil.',
            'O cliente abriu seu site. Em oito segundos, ainda não entendeu por que escolher você.',
          ],
        },
        argument: {
          nota: 4.8,
          veredito: 'Crítico',
          diagnostico: 'O body acumula abstrações sem demonstrar mecanismo ou resultado.',
          falhas: [
            {
              titulo: 'Promessa sem prova',
              explicacao: 'Crescer com estratégia não informa o que muda.',
              trecho: 'crescer com estratégia, criatividade e resultados',
              impacto: 'Aumenta a desconfiança e reduz intenção.',
            },
          ],
          ajustes: [
            {
              titulo: 'Especificar o resultado',
              sugestao: 'Declare qual decisão será concluída ao fim do sprint.',
              prioridade: 'alta',
              criterio: 'argumento',
            },
            {
              titulo: 'Tornar o CTA específico',
              sugestao: 'Diga o que o usuário verá depois do clique.',
              prioridade: 'alta',
              criterio: 'cta',
            },
          ],
          comparacoes: [
            {
              antes: 'solução completa',
              depois: 'um sprint de cinco dias para fechar promessa, público e território verbal',
              motivo: 'Expõe escopo e mecanismo.',
            },
          ],
          cta: {
            veredito: 'Crítico',
            diagnostico: 'O CTA é vago e não antecipa o próximo passo.',
            trecho: 'Clique aqui e saiba mais.',
            sugestoes: ['Ver o plano dos cinco dias', 'Agendar diagnóstico de posicionamento'],
          },
        },
        curiosity: {
          nota: 4.2,
          veredito: 'Crítico',
          diagnostico:
            'A copy não abre perguntas e entrega uma sequência previsível de abstrações.',
          curva: [
            { segmento: 'Hook', valor: 43, trecho: 'Transforme sua marca' },
            { segmento: 'Promessa', valor: 36, trecho: 'solução completa' },
            { segmento: 'Body', valor: 28, trecho: 'processo inovador' },
            { segmento: 'CTA', valor: 22, trecho: 'saiba mais' },
          ],
          pontos_queda: [
            {
              segmento: 'Body',
              trecho: 'estratégia, criatividade e resultados',
              por_que_caiu: 'A enumeração é previsível e não abre uma lacuna de informação.',
              ajuste: 'Substitua a lista pelo conflito específico que o sprint resolve.',
            },
          ],
          ajustes: [
            {
              titulo: 'Criar uma pergunta narrativa',
              sugestao: 'Apresente o custo de não escolher um posicionamento.',
              prioridade: 'alta',
            },
          ],
        },
      },
    ]
    for (const s of samples) {
      let exists = false
      try {
        app.findFirstRecordByData('reviews', 'id', s.id)
        exists = true
      } catch (_) {}
      if (exists) continue
      const r = new Record(reviews)
      r.set('id', s.id)
      r.set('user_id', user.id)
      r.set('title', s.title)
      r.set('source', s.source)
      r.set('source_doc_id', s.source === 'google_docs' ? 'seed-example-1' : '')
      r.set('source_doc_name', s.doc)
      r.set('source_doc_link', s.link)
      r.set('copywriter', s.copywriter)
      r.set('copy_text', s.copy)
      r.set('score_hook', s.score_hook)
      r.set('score_argument', s.score_argument)
      r.set('score_curiosity', s.score_curiosity)
      r.set('score_overall', s.score_overall)
      r.set('status', s.status)
      r.set('analysis_hook', s.hook)
      r.set('analysis_argument', s.argument)
      r.set('analysis_curiosity', s.curiosity)
      const insights = [
        {
          id: 'seed-insight',
          title: s.hook.problemas[0].titulo,
          description: s.hook.problemas[0].explicacao,
          why: s.hook.problemas[0].impacto,
          original: s.hook.problemas[0].trecho,
          suggestion: s.hook.problemas[0].sugestao,
          priority: 'alta',
          criterion: 'hook',
        },
      ]
      r.set('consolidation', {
        summary: s.hook.diagnostico + ' ' + s.argument.diagnostico,
        insights,
      })
      app.save(r)
      const t = new Record(tasks)
      t.set('id', s.id === 'seedreview00001' ? 'seedtask0000001' : 'seedtask0000002')
      t.set('user_id', user.id)
      t.set('review_id', r.id)
      t.set('title', s.hook.problemas[0].titulo)
      t.set('description', s.hook.problemas[0].explicacao)
      t.set('original_text', s.hook.problemas[0].trecho)
      t.set('suggestion', s.hook.problemas[0].sugestao)
      t.set('priority', 'alta')
      t.set('criterion', 'hook')
      t.set('status', s.id === 'seedreview00001' ? 'pendente' : 'em_andamento')
      t.set('copywriter', s.copywriter)
      t.set('source_doc_name', s.doc)
      t.set('source_doc_link', s.link)
      app.save(t)
    }
  },
  (app) => {
    if (!app.hasTable('reviews') || !app.hasTable('tasks')) return
    for (const id of ['seedtask0000001', 'seedtask0000002']) {
      try {
        app.delete(app.findFirstRecordByData('tasks', 'id', id))
      } catch (_) {}
    }
    for (const id of ['seedreview00001', 'seedreview00002']) {
      try {
        app.delete(app.findFirstRecordByData('reviews', 'id', id))
      } catch (_) {}
    }
  },
)
