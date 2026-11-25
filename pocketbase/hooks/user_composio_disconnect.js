routerAdd(
  'DELETE',
  '/backend/v1/composio/connectors/googledocs',
  (e) => {
    const userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('Autenticação necessária')
    const apiKey = $secrets.get('COMPOSIO_API_KEY')
    if (!apiKey) return e.noContent(204)
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
    if (!authConfigId) return e.noContent(204)
    const q =
      'user_ids=' +
      encodeURIComponent(userId) +
      '&auth_config_ids=' +
      encodeURIComponent(authConfigId)
    const list = $http.send({
      url: 'https://backend.composio.dev/api/v3.1/connected_accounts?' + q,
      method: 'GET',
      headers: { 'x-api-key': apiKey },
      timeout: 20,
    })
    if (list.statusCode >= 200 && list.statusCode < 300 && list.json && list.json.items) {
      for (let i = 0; i < list.json.items.length; i++) {
        const id = String(list.json.items[i].id || '')
        if (!id) continue
        $http.send({
          url: 'https://backend.composio.dev/api/v3.1/connected_accounts/' + encodeURIComponent(id),
          method: 'DELETE',
          headers: { 'x-api-key': apiKey },
          timeout: 20,
        })
      }
    }
    return e.noContent(204)
  },
  $apis.requireAuth(),
)
