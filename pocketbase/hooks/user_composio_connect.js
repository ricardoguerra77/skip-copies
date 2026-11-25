routerAdd(
  'POST',
  '/backend/v1/composio/connectors/googledocs/connect',
  (e) => {
    const userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('Autenticação necessária')
    const apiKey = $secrets.get('COMPOSIO_API_KEY')
    if (!apiKey) {
      return e.json(503, {
        error: 'Composio não configurado. Adicione COMPOSIO_API_KEY nos secrets do Skip Cloud.',
      })
    }
    let authConfigId = $secrets.get('COMPOSIO_GOOGLEDOCS_AUTH_CONFIG_ID')
    if (!authConfigId) {
      const ac = $http.send({
        url: 'https://backend.composio.dev/api/v3.1/auth_configs?toolkit_slug=GOOGLEDOCS&limit=1',
        method: 'GET',
        headers: { 'x-api-key': apiKey },
        timeout: 20,
      })
      if (
        ac.statusCode >= 200 &&
        ac.statusCode < 300 &&
        ac.json &&
        ac.json.items &&
        ac.json.items.length > 0
      ) {
        authConfigId = String(ac.json.items[0].id || '')
      }
    }
    if (!authConfigId) {
      return e.json(503, {
        error:
          'Crie um Auth Config do Google Docs no Composio ou defina COMPOSIO_GOOGLEDOCS_AUTH_CONFIG_ID.',
      })
    }
    const body = e.requestInfo().body || {}
    const returnUrl =
      typeof body.returnUrl === 'string' && body.returnUrl.trim()
        ? body.returnUrl.trim()
        : $secrets.get('SITE_URL') || ''
    const res = $http.send({
      url: 'https://backend.composio.dev/api/v3.1/connected_accounts/link',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({
        user_id: userId,
        auth_config_id: authConfigId,
        callback_url: returnUrl,
      }),
      timeout: 30,
    })
    if (res.statusCode < 200 || res.statusCode >= 300) {
      const msg =
        (res.json && (res.json.message || res.json.error)) ||
        'Não foi possível iniciar a conexão com o Google Docs.'
      return e.json(res.statusCode >= 400 && res.statusCode < 600 ? res.statusCode : 502, {
        error: String(msg),
      })
    }
    const url = (res.json && (res.json.redirect_url || res.json.redirectUrl || res.json.url)) || ''
    if (!url || !/^https?:/i.test(url)) {
      return e.internalServerError('Resposta inválida do Composio ao conectar.')
    }
    return e.json(200, { url: url })
  },
  $apis.requireAuth(),
)
