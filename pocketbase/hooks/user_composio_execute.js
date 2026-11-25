routerAdd(
  'POST',
  '/backend/v1/composio/execute',
  (e) => {
    const userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('Autenticação necessária')
    const apiKey = $secrets.get('COMPOSIO_API_KEY')
    if (!apiKey) {
      return e.json(503, {
        successful: false,
        data: null,
        error: 'Composio não configurado. Adicione COMPOSIO_API_KEY nos secrets do Skip Cloud.',
      })
    }
    const body = e.requestInfo().body || {}
    const tool = String(body.tool || '').trim()
    const args = body.args && typeof body.args === 'object' ? body.args : {}
    if (!tool) return e.badRequestError('tool é obrigatório')
    const res = $http.send({
      url: 'https://backend.composio.dev/api/v3.1/tools/execute/' + encodeURIComponent(tool),
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ user_id: userId, version: 'latest', arguments: args }),
      timeout: 60,
    })
    const payload = res.json || {}
    if (res.statusCode < 200 || res.statusCode >= 300) {
      const err =
        (payload && (payload.message || payload.error)) ||
        'Falha ao executar ferramenta no Composio.'
      return e.json(200, { successful: false, data: payload.data || null, error: String(err) })
    }
    const successful = payload.successful !== false && !payload.error
    const data = payload.data !== undefined ? payload.data : payload
    const error =
      payload.error != null
        ? String(payload.error)
        : successful
          ? null
          : 'Ferramenta retornou sem sucesso.'
    return e.json(200, { successful: successful, data: data, error: error })
  },
  $apis.requireAuth(),
)
