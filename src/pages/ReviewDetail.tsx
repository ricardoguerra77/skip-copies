import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Check, ExternalLink, FilePlus2, RefreshCw, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import { listConnectors } from '@/lib/skipConnectors'
import { fetchGoogleDocText } from '@/lib/googleDocs'
import pb from '@/lib/pocketbase/client'
import {
  analyzeCopy,
  buildComparison,
  consolidate,
  getReview,
  plainCopy,
  snapshotRound,
  updateReview,
} from '@/services/reviews'
import type { ReviewRecord } from '@/types/review'
import ReviewAnalysis from '@/components/ReviewAnalysis'
import { toast } from 'sonner'

export default function ReviewDetail() {
  const { id } = useParams()
  const [review, setReview] = useState<ReviewRecord | null>(null)
  const [docsConnected, setDocsConnected] = useState(false)
  const [running, setRunning] = useState(false)
  const [importing, setImporting] = useState(false)
  const [steps, setSteps] = useState([false, false, false])
  const [manualOpen, setManualOpen] = useState(false)
  const [manualCopy, setManualCopy] = useState('')

  const load = useCallback(() => {
    if (!id) return
    return getReview(id)
      .then(setReview)
      .catch((e) => toast.error(e.message))
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!pb.authStore.isValid) return
    listConnectors()
      .then((items) => {
        setDocsConnected(items.find((x) => x.toolkit === 'googledocs')?.status === 'connected')
      })
      .catch(() => {
        // Falhou a verificação (ex.: sessão expirou): desliga o fluxo; a
        // ConnectorButton logo abaixo já mostra o estado real da conexão.
        setDocsConnected(false)
      })
  }, [])

  const reevaluate = async (nextCopy: string) => {
    if (!review) return
    const previous = plainCopy(review.copy_text || '')
    const current = plainCopy(nextCopy)
    const changed = previous !== current
    if (!current) {
      toast.error('A copy atual está vazia.')
      return
    }
    setRunning(true)
    setSteps([false, false, false])
    try {
      const nextRound = (review.round || 1) + 1
      const result = await analyzeCopy(
        current,
        (index) => setSteps((s) => s.map((done, i) => done || i === index)),
        {
          previousCopy: previous,
          previousHook: review.analysis_hook,
          previousArgument: review.analysis_argument,
          previousFluency: review.analysis_curiosity,
          tasks: review.expand?.tasks_via_review_id || [],
          round: nextRound,
        },
      )
      const history = [...(review.rounds || []), snapshotRound(review)].slice(-8)
      const updated = await updateReview(review.id, {
        copy_text_previous: previous,
        copy_text: current,
        round: nextRound,
        score_hook: result.hook.nota,
        score_argument: result.argument.nota,
        score_curiosity: result.fluency.nota,
        score_overall: result.overall,
        status: result.status,
        analysis_hook: result.hook,
        analysis_argument: result.argument,
        analysis_curiosity: result.fluency,
        consolidation: consolidate(result.hook, result.argument, result.fluency),
        comparison: buildComparison(
          review,
          result,
          changed,
          review.expand?.tasks_via_review_id || [],
        ),
        rounds: history,
      })
      setReview({ ...updated, expand: review.expand })
      toast.success(
        changed
          ? 'Reavaliação concluída com o texto atual do documento.'
          : 'Reavaliação concluída. O texto do documento não tinha mudado.',
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível reavaliar a copy.')
    } finally {
      setRunning(false)
    }
  }

  const reevaluateFromDocs = async () => {
    if (!review?.source_doc_id) {
      toast.error('Esta revisão não tem um Google Doc vinculado.')
      return
    }
    if (!docsConnected) {
      toast.info('Conecte o Google Docs para reler o documento.')
      return
    }
    setImporting(true)
    try {
      const nextCopy = await fetchGoogleDocText(review.source_doc_id)
      await reevaluate(nextCopy)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao reler o Google Docs.')
    } finally {
      setImporting(false)
    }
  }

  const startReevaluate = () => {
    if (!review) return
    if (review.source === 'google_docs' && review.source_doc_id) {
      void reevaluateFromDocs()
      return
    }
    setManualCopy(plainCopy(review.copy_text || ''))
    setManualOpen(true)
  }

  if (!review) return <div className="loading-page">Abrindo o arquivo editorial…</div>
  const tasks = review.expand?.tasks_via_review_id || []
  const done = tasks.filter((t) => t.status === 'concluida').length
  const pending = tasks.filter((t) => t.status === 'pendente' || t.status === 'em_andamento').length
  const busy = running || importing

  return (
    <div className="page-stack">
      <header className="detail-header reveal">
        <div>
          <Link to="/revisoes">
            <ArrowLeft /> Voltar ao arquivo
          </Link>
          <div className="detail-eyebrow-row">
            <span className="eyebrow">Revisão arquivada</span>
            {review.round && review.round > 1 ? (
              <span className="eyebrow-pill">Rodada {review.round}</span>
            ) : null}
          </div>
          <h1>{review.title}</h1>
          <p>
            {review.copywriter} • {new Date(review.created).toLocaleString('pt-BR')}
          </p>
        </div>
        <div>
          {review.source_doc_link && (
            <Button variant="outline" asChild>
              <a href={review.source_doc_link} target="_blank" rel="noreferrer">
                <ExternalLink /> Abrir documento original
              </a>
            </Button>
          )}
          <Button className="skip-btn" onClick={startReevaluate} disabled={busy}>
            {busy ? <RefreshCw className="spin" /> : <RefreshCw />}
            {busy ? 'Reavaliando…' : 'Reavaliar copy'}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/nova-revisao">
              <FilePlus2 /> Nova revisão
            </Link>
          </Button>
        </div>
      </header>

      <section className="reeval-bar reveal">
        <div>
          <p className="eyebrow">Depois das tarefas</p>
          <h2>Reler o documento e comparar com a rodada anterior.</h2>
          <p>
            {review.source === 'google_docs'
              ? 'Os agentes leem de novo o Google Doc: o que era, o que mudou e como está agora, à luz das tarefas do time.'
              : 'Cole a copy atualizada. Os agentes comparam com o texto e a análise anteriores.'}
          </p>
        </div>
        <div className="reeval-meta">
          <span>
            <b>{done}</b> tarefa(s) concluída(s)
          </span>
          <span>
            <b>{pending}</b> em aberto
          </span>
          <span>
            Rodada <b>{review.round || 1}</b>
          </span>
          {review.source === 'google_docs' && !docsConnected && (
            <ConnectorButton toolkit="googledocs" name="Google Docs" />
          )}
        </div>
      </section>

      {busy && (
        <section className="progress-section reveal">
          <p className="eyebrow">Reavaliação em andamento</p>
          <h2>{importing && !running ? 'Reler o documento…' : 'Comparando as duas versões.'}</h2>
          <div className="progress-grid">
            {['Hook — captura atenção?', 'Coerência do argumento', 'Fluidez da escrita'].map(
              (name, i) => (
                <article key={name} className={steps[i] ? 'done' : ''}>
                  <div>{steps[i] ? <Check /> : <Sparkles />}</div>
                  <span>Agente 0{i + 1}</span>
                  <h3>{name}</h3>
                  <p>
                    {steps[i]
                      ? 'Comparação concluída'
                      : importing && !running
                        ? 'Aguardando o texto atual…'
                        : 'Lendo o que era, o que mudou e como está…'}
                  </p>
                  <i />
                </article>
              ),
            )}
          </div>
        </section>
      )}

      <ReviewAnalysis review={review} />

      <Dialog
        open={manualOpen}
        onOpenChange={(open) => {
          setManualOpen(open)
          if (!open && !busy) setManualCopy(plainCopy(review.copy_text || ''))
        }}
      >
        <DialogContent className="task-dialog reeval-dialog">
          <div className="dialog-rule" />
          <DialogHeader>
            <p className="eyebrow">Reavaliação</p>
            <DialogTitle>Cole a copy atualizada</DialogTitle>
          </DialogHeader>
          <p className="reeval-hint">
            Os agentes vão comparar este texto com a versão anterior e com as tarefas desta revisão.
          </p>
          <Textarea
            value={manualCopy}
            onChange={(e) => setManualCopy(e.target.value)}
            className="reeval-textarea"
          />
          <Button
            className="skip-btn"
            disabled={busy || !manualCopy.trim()}
            onClick={() => {
              const next = manualCopy
              setManualOpen(false)
              window.setTimeout(() => void reevaluate(next), 0)
            }}
          >
            Reavaliar agora
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
