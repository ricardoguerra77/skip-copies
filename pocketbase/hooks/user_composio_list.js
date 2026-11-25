routerAdd(
  'GET',
  '/backend/v1/composio/connectors',
  (e) => {
    const userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('Autenticação necessária')
    const apiKey = $secrets.get('COMPOSIO_API_KEY')
    if (!apiKey) {
      return e.json(503, {
        error:
          'Composio não configurado. Adicione COMPOSIO_API_KEY nos secrets do Skip Cloud (preview e produção).',
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
    const q =
      'user_ids=' +
      encodeURIComponent(userId) +
      '&auth_config_ids=' +
      encodeURIComponent(authConfigId)
    const res = $http.send({
      url: 'https://backend.composio.dev/api/v3.1/connected_accounts?' + q,
      method: 'GET',
      headers: { 'x-api-key': apiKey },
      timeout: 20,
    })
    let status = 'not_connected'
    if (res.statusCode >= 200 && res.statusCode < 300 && res.json && res.json.items) {
      for (let i = 0; i < res.json.items.length; i++) {
        const row = res.json.items[i]
        const st = String(row.status || '').toUpperCase()
        if (st === 'ACTIVE') {
          status = 'connected'
          break
        }
        if (st === 'EXPIRED' || st === 'FAILED' || st === 'INACTIVE') status = 'expired'
      }
    }
    return e.json(200, { connectors: [{ toolkit: 'googledocs', status: status }] })
  },
  $apis.requireAuth(),
)
