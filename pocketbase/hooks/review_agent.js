routerAdd(
  'POST',
  '/backend/v1/review-agent/{slug}',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')
      const slug = e.request.pathValue('slug')
      if (
        slug !== 'hook-revisor' &&
        slug !== 'argumento-revisor' &&
        slug !== 'curiosidade-revisor'
      ) {
        return e.badRequestError('Agente inválido')
      }
      const body = e.requestInfo().body || {}
      const copy = String(body.copy || '').trim()
      if (!copy) return e.badRequestError('A copy é obrigatória')
      if (copy.length > 100000)
        return e.badRequestError('A copy excede o limite de 100.000 caracteres')
      const previousCopy = String(body.previous_copy || '').trim()
      const previousDiagnosis = String(body.previous_diagnosis || '').trim()
      const previousNota = body.previous_nota
      const previousVeredito = String(body.previous_veredito || '').trim()
      const round = Number(body.round || 1)
      const clip = (text, max) => {
        const value = String(text || '')
        return value.length > max ? value.slice(0, max) + '\n[texto cortado]' : value
      }
      let taskLines = 'Nenhuma tarefa registrada.'
      if (Array.isArray(body.tasks) && body.tasks.length > 0) {
        taskLines = body.tasks
          .slice(0, 20)
          .map((task) => {
            const row = task && typeof task === 'object' ? task : {}
            const status = String(row.status || 'pendente')
            const title = String(row.title || 'Sem título')
            const criterion = String(row.criterion || '')
            const suggestion = String(row.suggestion || '')
            const clipped = suggestion.length > 240 ? suggestion.slice(0, 240) + '…' : suggestion
            return `- [${status}] ${title}${criterion ? ' (' + criterion + ')' : ''}${clipped ? ' — direção: ' + clipped : ''}`
          })
          .join('\n')
      }
      let message =
        'Analise esta copy conforme suas instruções e retorne somente JSON estrito.\n\nCOPY ATUAL:\n' +
        clip(copy, 40000)
      if (previousCopy) {
        message =
          'Esta é uma REAVALIAÇÃO (rodada ' +
          (Number.isFinite(round) ? round : 2) +
          '). Compare o que a copy era, o que mudou e como está agora. O julgamento (nota, problemas, veredito) é da COPY ATUAL. Preencha comparacao com fatos do texto, não com suposições.\n\n' +
          'TAREFAS DO TIME (o que pedimos e o que o copywriter marcou):\n' +
          taskLines +
          '\n\nCOPY ANTERIOR:\n' +
          clip(previousCopy, 40000) +
          '\n\nCOPY ATUAL:\n' +
          clip(copy, 40000) +
          '\n\nANÁLISE ANTERIOR DESTE CRITÉRIO:\n' +
          'nota: ' +
          (previousNota == null ? 'n/d' : previousNota) +
          '\nveredito: ' +
          (previousVeredito || 'n/d') +
          '\ndiagnóstico: ' +
          (previousDiagnosis || 'n/d') +
          '\n\nRetorne somente JSON estrito.'
      }
      const result = $ai.agent(slug).chat({
        user_id: userId,
        conversation_id: null,
        message,
      })
      return e.json(200, { content: result.content })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'Análise temporariamente indisponível' })
      if (err instanceof SkipAiAgentsError || err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, {
          error: status >= 500 ? 'Não foi possível concluir a análise' : err.message,
        })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)
