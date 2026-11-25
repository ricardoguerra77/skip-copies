import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  ExternalLink,
  FileText,
  FolderOpen,
  PenLine,
  RefreshCw,
  Search,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import { execute, listConnectors } from '@/lib/skipConnectors'
import { fetchGoogleDocText, formatFriendlyConnectorError } from '@/lib/googleDocs'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { analyzeCopy, consolidate, createReview, updateReview } from '@/services/reviews'
import type { ReviewRecord } from '@/types/review'
import ReviewAnalysis from '@/components/ReviewAnalysis'
import { toast } from 'sonner'

type Doc = {
  id: string
  name: string
  modifiedTime?: string
  webViewLink?: string
  owners?: Array<{ displayName?: string }>
}
function objectValue(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
}
function parseDocs(data: unknown): Doc[] {
  const root = objectValue(data)
  const raw = Array.isArray(data)
    ? data
    : root &&
      (Array.isArray(root.documents)
        ? root.documents
        : Array.isArray(root.files)
          ? root.files
          : Array.isArray(root.results)
            ? root.results
            : Array.isArray(root.items)
              ? root.items
              : [])
  return (raw || [])
    .map((x) => objectValue(x))
    .filter(Boolean)
    .map((x) => {
      const id = String(x!.id || x!.documentId || x!.document_id || '')
      const name = String(x!.title || x!.name || 'Documento sem título')
      const modifiedTime =
        typeof x!.modifiedTime === 'string'
          ? x!.modifiedTime
          : typeof x!.modified_time === 'string'
            ? x!.modified_time
            : typeof x!.updateTime === 'string'
              ? x!.updateTime
              : undefined
      const webViewLink =
        typeof x!.webViewLink === 'string'
          ? x!.webViewLink
          : typeof x!.web_view_link === 'string'
            ? x!.web_view_link
            : id
              ? `https://docs.google.com/document/d/${id}/edit`
              : undefined
      const owners = Array.isArray(x!.owners) ? (x!.owners as Doc['owners']) : undefined
      return { id, name, modifiedTime, webViewLink, owners }
    })
    .filter((x) => x.id)
}

export default function Index() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [source, setSource] = useState<'google_docs' | 'manual'>('google_docs')
  const [checkingConnectors, setCheckingConnectors] = useState(true)
  const [docsConnected, setDocsConnected] = useState(false)
  const [docs, setDocs] = useState<Doc[]>([])
  const [query, setQuery] = useState('')
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [importingDocId, setImportingDocId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Doc | null>(null)
  const [copy, setCopy] = useState('')
  const [copywriter, setCopywriter] = useState('')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState([false, false, false])
  const [review, setReview] = useState<ReviewRecord | null>(null)

  const checkConnectors = useCallback(async () => {
    if (!pb.authStore.isValid || !pb.authStore.record) {
      setDocsConnected(false)
      setCheckingConnectors(false)
      return
    }
    try {
      const items = await listConnectors()
      const gdocs = items.find((x) => x.toolkit === 'googledocs')?.status === 'connected'
      setDocsConnected(Boolean(gdocs))
    } catch (e) {
      // Falha ao verificar (ex.: sessão expirou): só desliga o fluxo — a
      // ConnectorButton na tela já mostra o estado real da conexão.
      if (!pb.authStore.isValid) {
        setDocsConnected(false)
      } else {
        toast.error(
          e instanceof Error ? e.message : 'Falha ao verificar conexão com o Google Docs.',
        )
      }
    } finally {
      setCheckingConnectors(false)
    }
  }, [])

  useEffect(() => {
    void checkConnectors()
    const handleFocus = () => void checkConnectors()
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [checkConnectors])

  const loadDocs = async (searchFilter?: string) => {
    if (!pb.authStore.isValid || !user) {
      toast.error('Você precisa estar autenticado para buscar documentos do Google Docs.')
      navigate('/login')
      return
    }
    if (!docsConnected) {
      toast.info('Conecte sua conta do Google Docs para listar seus documentos.')
      return
    }
    setLoadingDocs(true)
    try {
      const args: Record<string, unknown> = {
        max_results: 30,
        include_trashed: false,
      }
      const trimmed = (searchFilter !== undefined ? searchFilter : query).trim()
      if (trimmed) {
        args.query = trimmed
      }
      const r = await execute('GOOGLEDOCS_SEARCH_DOCUMENTS', args)
      if (!r.successful) {
        const errorMsg = formatFriendlyConnectorError(r.error)
        if (r.error && r.error.toLowerCase().includes('no connected account')) {
          setDocsConnected(false)
        }
        throw new Error(errorMsg)
      }
      const parsed = parseDocs(r.data)
      setDocs(parsed)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao buscar documentos do Google Docs.')
    } finally {
      setLoadingDocs(false)
    }
  }

  useEffect(() => {
    if (docsConnected && source === 'google_docs' && docs.length === 0 && !loadingDocs) {
      void loadDocs()
    }
  }, [docsConnected, source])

  const importDoc = async (doc: Doc) => {
    if (!pb.authStore.isValid || !user) {
      toast.error('Sua sessão expirou. Faça login para continuar.')
      navigate('/login')
      return
    }
    if (!docsConnected) {
      setSelected(doc)
      toast.info('Conecte sua conta do Google Docs para importar este documento.')
      return
    }
    setSelected(doc)
    setCopy('')
    setImportingDocId(doc.id)
    try {
      try {
        setCopy(await fetchGoogleDocText(doc.id))
      } catch (err) {
        if (err instanceof Error && err.name === 'DocsDisconnected') setDocsConnected(false)
        throw err
      }
      setCopywriter(doc.owners?.[0]?.displayName || copywriter)
      toast.success('Conteúdo importado do Google Docs com sucesso.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao importar o documento.')
    } finally {
      setImportingDocId(null)
    }
  }
  const reviewCopy = async () => {
    if (!copy.trim()) {
      toast.error('Selecione ou cole uma copy primeiro.')
      return
    }
    if (!copywriter.trim()) {
      toast.error('Informe o copywriter responsável.')
      return
    }
    setRunning(true)
    setSteps([false, false, false])
    setReview(null)
    try {
      let rec = await createReview({
        title: selected?.name || `Copy manual — ${new Date().toLocaleDateString('pt-BR')}`,
        source,
        source_doc_id: selected?.id,
        source_doc_name: selected?.name,
        source_doc_link:
          selected?.webViewLink || selected
            ? `https://docs.google.com/document/d/${selected?.id}/edit`
            : undefined,
        copywriter,
        copy_text: copy,
        round: 1,
        status: 'refazer',
        score_hook: 0,
        score_argument: 0,
        score_curiosity: 0,
        score_overall: 0,
      })
      const result = await analyzeCopy(copy, (index) => {
        setSteps((s) => s.map((done, i) => done || i === index))
      })
      rec = await updateReview(rec.id, {
        score_hook: result.hook.nota,
        score_argument: result.argument.nota,
        score_curiosity: result.fluency.nota,
        score_overall: result.overall,
        status: result.status,
        analysis_hook: result.hook,
        analysis_argument: result.argument,
        analysis_curiosity: result.fluency,
        consolidation: consolidate(result.hook, result.argument, result.fluency),
        rounds: [
          {
            round: 1,
            at: new Date().toISOString(),
            scores: {
              hook: result.hook.nota,
              argument: result.argument.nota,
              fluency: result.fluency.nota,
              overall: result.overall,
            },
            status: result.status,
            summary: consolidate(result.hook, result.argument, result.fluency).summary,
          },
        ],
      })
      setReview(rec)
      toast.success('Revisão concluída pelos três agentes.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível concluir a revisão.')
    } finally {
      setRunning(false)
    }
  }
  const visible = docs.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="page-stack">
      <header className="page-hero reveal">
        <div>
          <p className="eyebrow">
            Skip Copies <span>01</span>
          </p>
          <h1>
            Uma copy melhor
            <br />
            <em>começa pelo corte.</em>
          </h1>
        </div>
        <p>
          Importe o texto, dê nome ao responsável e coloque três olhares sobre cada linha: o hook
          captura atenção, o desenvolvimento é coerente, a escrita está direta.
        </p>
      </header>
      <section className="source-section reveal delay-1">
        <div className="section-kicker">
          <span>01</span>
          <div>
            <h2>Escolha a origem</h2>
            <p>O documento original nunca será alterado.</p>
          </div>
        </div>
        <div className="source-cards">
          <button
            className={`source-card ${source === 'google_docs' ? 'selected' : ''}`}
            onClick={() => setSource('google_docs')}
          >
            <FolderOpen />
            <div>
              <strong>Importar do Google Docs</strong>
              <span>Busque as copies do time direto da sua conta</span>
            </div>
            <i>{source === 'google_docs' ? <Check /> : null}</i>
          </button>
          <button
            className={`source-card manual ${source === 'manual' ? 'selected' : ''}`}
            onClick={() => setSource('manual')}
          >
            <PenLine />
            <div>
              <strong>Colar manualmente</strong>
              <span>Cole ou escreva a copy completa</span>
            </div>
            <i>{source === 'manual' ? <Check /> : null}</i>
          </button>
        </div>
        {source === 'google_docs' ? (
          <div className="drive-picker">
            {checkingConnectors ? (
              <div className="muted-state" style={{ padding: '36px 16px', textAlign: 'center' }}>
                <RefreshCw className="spin" style={{ margin: '0 auto 8px' }} />
                <p>Verificando conexão com o Google Docs…</p>
              </div>
            ) : !docsConnected ? (
              <div className="connect-state">
                <div>
                  <FileText />
                  <h3>Seu arquivo, sem copiar e colar.</h3>
                  <p>
                    Conecte <strong>sua</strong> própria conta Google: o login acontece na tela do
                    Google e a conexão é só sua — ninguém vê nem importa os documentos de outra
                    conta do time.
                  </p>
                </div>
                <div className="connector-buttons">
                  <ConnectorButton toolkit="googledocs" name="Google Docs" />
                </div>
              </div>
            ) : (
              <>
                <div className="drive-toolbar">
                  <form
                    className="search-field"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void loadDocs(query)
                    }}
                  >
                    <Search />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar documento por nome (pressione Enter para buscar no Docs)"
                    />
                  </form>
                  <Badge>Google Docs</Badge>
                  <Button variant="ghost" onClick={() => void loadDocs()} disabled={loadingDocs}>
                    <RefreshCw className={loadingDocs ? 'spin' : ''} />
                    {loadingDocs ? 'Buscando…' : 'Recentes'}
                  </Button>
                </div>
                <div className="doc-list">
                  {visible.length === 0 && !loadingDocs ? (
                    <div
                      className="muted-state"
                      style={{ padding: '32px 18px', textAlign: 'center' }}
                    >
                      <p>
                        {query.trim()
                          ? `Nenhum documento encontrado para "${query}".`
                          : 'Nenhum Google Doc encontrado na sua conta.'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuery('')
                          void loadDocs('')
                        }}
                        style={{ marginTop: '10px' }}
                      >
                        <RefreshCw size={14} style={{ marginRight: '6px' }} /> Atualizar lista
                      </Button>
                    </div>
                  ) : (
                    visible.map((doc) => {
                      const isImportingThis = importingDocId === doc.id
                      return (
                        <button
                          key={doc.id}
                          className={selected?.id === doc.id ? 'active' : ''}
                          onClick={() => importDoc(doc)}
                          disabled={Boolean(importingDocId)}
                        >
                          {isImportingThis ? <RefreshCw className="spin" /> : <FileText />}
                          <div>
                            <strong>{doc.name}</strong>
                            <span>
                              {isImportingThis
                                ? 'Importando texto do documento…'
                                : doc.modifiedTime
                                  ? `Editado em ${new Date(doc.modifiedTime).toLocaleDateString('pt-BR')}`
                                  : 'Google Docs'}
                            </span>
                          </div>
                          <Badge variant="outline">
                            {isImportingThis ? 'Importando…' : 'Docs'}
                          </Badge>
                        </button>
                      )
                    })
                  )}
                </div>
                {selected && (
                  <div className="selected-doc">
                    <div>
                      <Check />
                      <div>
                        <small>Documento selecionado</small>
                        <strong>{selected.name}</strong>
                      </div>
                    </div>
                    <div>
                      <a
                        href={
                          selected.webViewLink ||
                          `https://docs.google.com/document/d/${selected.id}/edit`
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir no Google Docs <ExternalLink />
                      </a>
                      <Button
                        variant="outline"
                        onClick={() => importDoc(selected)}
                        disabled={Boolean(importingDocId)}
                      >
                        <RefreshCw className={importingDocId === selected.id ? 'spin' : ''} />{' '}
                        {importingDocId === selected.id ? 'Importando…' : 'Recarregar'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="manual-editor">
            <Textarea
              value={copy}
              onChange={(e) => setCopy(e.target.value)}
              placeholder="Cole aqui a copy completa — do hook ao CTA…"
            />
            <footer>
              <span>Texto em modo editorial</span>
              <b>{copy.length.toLocaleString('pt-BR')} caracteres</b>
            </footer>
          </div>
        )}
      </section>
      <section className="responsible-section reveal delay-2">
        <div className="section-kicker">
          <span>02</span>
          <div>
            <h2>Quem assina esta copy?</h2>
            <p>O responsável receberá as tarefas geradas.</p>
          </div>
        </div>
        <label>
          <UserRound />
          <Input
            value={copywriter}
            onChange={(e) => setCopywriter(e.target.value)}
            placeholder="Nome do copywriter responsável"
          />
        </label>
        <Button className="review-button" onClick={reviewCopy} disabled={running}>
          <Sparkles />
          {running ? 'Três agentes estão lendo…' : 'Revisar copy'}
          <ArrowRight />
        </Button>
      </section>
      {running && (
        <section className="progress-section reveal">
          <p className="eyebrow">Crítica em andamento</p>
          <h2>Três leituras. Uma direção.</h2>
          <div className="progress-grid">
            {['Hook — captura atenção?', 'Coerência do argumento', 'Fluidez da escrita'].map(
              (name, i) => (
                <article key={name} className={steps[i] ? 'done' : ''}>
                  <div>{steps[i] ? <Check /> : <Sparkles />}</div>
                  <span>Agente 0{i + 1}</span>
                  <h3>{name}</h3>
                  <p>{steps[i] ? 'Análise concluída' : 'Lendo e confrontando o texto…'}</p>
                  <i />
                </article>
              ),
            )}
          </div>
        </section>
      )}
      {review && (
        <>
          <div className="analysis-divider">
            <span>Resultado editorial</span>
            <Link to={`/revisoes/${review.id}`} className="analysis-divider-link">
              Ver análise completa <ArrowRight />
            </Link>
          </div>
          <ReviewAnalysis review={review} />
        </>
      )}
    </div>
  )
}
