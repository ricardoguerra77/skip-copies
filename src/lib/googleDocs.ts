import { execute } from '@/lib/skipConnectors'

function objectValue(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
}

export function formatFriendlyConnectorError(rawError: string | null | undefined) {
  const text = (rawError || '').toLowerCase()
  if (
    text.includes('no connected account found') ||
    text.includes('not connected') ||
    text.includes('expired')
  ) {
    return 'Conecte sua conta do Google Docs em /integracoes para acessar seus documentos.'
  }
  if (text.includes('unauthorized') || text.includes('autenticação') || text.includes('auth')) {
    return 'Sua sessão expirou. Faça login novamente para acessar o Google Docs.'
  }
  return rawError || 'Falha na comunicação com o Google Docs.'
}

const isDisconnected = (rawError: string | null | undefined) =>
  /no connected account|not connected|expired/i.test(rawError || '')

/**
 * Lê o texto de um Google Doc com a conta conectada do próprio usuário
 * (conectores nativos do app — cada usuário conecta a sua conta em /integracoes).
 */
export async function fetchGoogleDocText(docId: string): Promise<string> {
  const r = await execute('GOOGLEDOCS_GET_DOCUMENT_PLAINTEXT', { document_id: docId })
  if (!r.successful) {
    const error = new Error(formatFriendlyConnectorError(r.error))
    if (isDisconnected(r.error)) error.name = 'DocsDisconnected'
    throw error
  }
  const data = objectValue(r.data)
  const text = data && typeof data.plain_text === 'string' ? data.plain_text : null
  if (text === null) {
    const keys = data ? Object.keys(data).join(', ') : typeof r.data
    throw new Error(`Resposta inesperada do Google Docs (campos recebidos: ${keys}).`)
  }
  // O texto vem pronto do Google: só limpamos marcadores de imagem e quebras
  // verticais (U+000B) que o Docs usa entre blocos.
  const verticalTab = String.fromCharCode(11)
  return text.split('[IMAGE]').join('').split(verticalTab).join('\n').trim()
}
