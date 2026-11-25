import { useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ClipboardPlus,
  Copy,
  ExternalLink,
  Lightbulb,
  Minus,
  Scissors,
  ShieldCheck,
  Target,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { FluencyAnalysis, Insight, ReviewRecord } from '@/types/review'
import TaskModal from '@/components/TaskModal'
import { FormattedAgentText, normalizeAgentText } from '@/lib/formatAgentText'
import { toast } from 'sonner'

const statusText = {
  pronta: 'Pronta para rodar',
  pequenos_ajustes: 'Boa, com pequenos ajustes',
  ajustes_relevantes: 'Necessita ajustes relevantes',
  refazer: 'Deve ser refeita',
}
const criterionIcon = {
  hook: Target,
  argumento: ShieldCheck,
  fluidez: Scissors,
  curiosidade: Scissors,
  cta: Lightbulb,
}
function ScoreRing({ score }: { score: number }) {
  const circumference = 314
  const offset = circumference - (circumference * score) / 10
  return (
    <div className="score-ring">
      <svg viewBox="0 0 120 120" aria-label={`Nota geral ${score.toFixed(1)} de 10`}>
        <defs>
          <linearGradient id="scoreGradient">
            <stop stopColor="#8B51FF" />
            <stop offset="1" stopColor="#C3B0FF" />
          </linearGradient>
        </defs>
        <circle className="ring-bg" cx="60" cy="60" r="50" />
        <circle
          className="ring-value"
          cx="60"
          cy="60"
          r="50"
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div>
        <strong>{score.toFixed(1)}</strong>
        <span>nota geral</span>
      </div>
    </div>
  )
}
function fluencyProblems(analysis: FluencyAnalysis) {
  if (analysis.problemas?.length) return analysis.problemas
  return (analysis.pontos_queda || []).map((p) => ({
    titulo: p.segmento,
    explicacao: p.por_que_caiu,
    trecho: p.trecho,
    tipo: 'prolixo',
    sugestao: p.ajuste,
  }))
}
export default function ReviewAnalysis({
  review,
  compact = false,
}: {
  review: ReviewRecord
  compact?: boolean
}) {
  const [selected, setSelected] = useState<Insight | null>(null)
  const [created, setCreated] = useState<string[]>([])
  const insights = review.consolidation?.insights || []
  const fluency = review.analysis_curiosity
  const problems = fluencyProblems(fluency)
  const cortes = fluency.cortes || []
  const priorities = useMemo(() => {
    const rank = { alta: 0, media: 1, baixa: 2 }
    return [...insights].sort((a, b) => rank[a.priority] - rank[b.priority])
  }, [insights])
  const TaskButton = ({ insight }: { insight: Insight }) => (
    <Button
      variant="outline"
      size="sm"
      disabled={created.includes(insight.id)}
      onClick={() => setSelected(insight)}
      aria-label={`Criar tarefa: ${insight.title}`}
    >
      {created.includes(insight.id) ? (
        <>
          <Check size={15} /> Tarefa criada
        </>
      ) : (
        <>
          <ClipboardPlus size={15} /> Criar tarefa
        </>
      )}
    </Button>
  )
  return (
    <section className="analysis-view reveal">
      <div className="executive-card">
        <div className="score-column">
          <ScoreRing score={review.score_overall} />
          <div className="score-chips">
            <span title="Nota de Hook">
              Hook <b>{review.score_hook.toFixed(1)}</b>
            </span>
            <span title="Nota de Coerência e argumentação">
              Coerência <b>{review.score_argument.toFixed(1)}</b>
            </span>
            <span title="Nota de Fluidez da escrita">
              Fluidez <b>{review.score_curiosity.toFixed(1)}</b>
            </span>
          </div>
        </div>
        <div className="summary-column">
          <p className="eyebrow">Resumo executivo</p>
          <h2>{statusText[review.status]}</h2>
          <p>{review.consolidation?.summary}</p>
          <div className="summary-foot">
            <Badge className={`status-${review.status}`}>{statusText[review.status]}</Badge>
            {review.round && review.round > 1 && (
              <Badge variant="outline">Rodada {review.round}</Badge>
            )}
            <span>
              {review.expand?.tasks_via_review_id?.length || created.length} tarefa(s) gerada(s)
            </span>
            {review.source_doc_link && (
              <a href={review.source_doc_link} target="_blank" rel="noreferrer">
                Abrir documento <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
      {review.comparison && <ComparisonCard review={review} />}
      {!compact && (
        <>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Leitura por critério</p>
              <h2>A anatomia da copy</h2>
            </div>
            <span>Diagnóstico → impacto → direção</span>
          </div>
          <Tabs defaultValue="hook" className="analysis-tabs">
            <TabsList>
              <TabsTrigger value="hook">Hook</TabsTrigger>
              <TabsTrigger value="argumento">Coerência</TabsTrigger>
              <TabsTrigger value="fluidez">Fluidez</TabsTrigger>
              <TabsTrigger value="cta">CTA</TabsTrigger>
              <TabsTrigger value="recomendacoes">Recomendações finais</TabsTrigger>
            </TabsList>
            <TabsContent value="hook" className="analysis-panel">
              <AnalysisHeader
                title="Hook"
                score={review.score_hook}
                verdict={review.analysis_hook.veredito}
                diagnosis={review.analysis_hook.diagnostico}
              />
              {(review.analysis_hook.categoria ||
                review.analysis_hook.captura_atencao !== undefined) && (
                <div className="score-chips" style={{ marginBottom: 16 }}>
                  {review.analysis_hook.captura_atencao !== undefined && (
                    <span>
                      Captura atenção? <b>{review.analysis_hook.captura_atencao ? 'Sim' : 'Não'}</b>
                    </span>
                  )}
                  {review.analysis_hook.categoria && (
                    <span>
                      Categoria <b>{review.analysis_hook.categoria}</b>
                    </span>
                  )}
                </div>
              )}
              <div className="problem-grid">
                {review.analysis_hook.problemas.map((p, i) => (
                  <article className="problem-card" key={i}>
                    <Target />
                    <h4>{p.titulo}</h4>
                    <p>{p.explicacao}</p>
                    <small>Impacto</small>
                    <p>{p.impacto}</p>
                  </article>
                ))}
              </div>
              <h3>3 variações alternativas</h3>
              <div className="quote-stack">
                {review.analysis_hook.variacoes_hook.map((q, i) => (
                  <blockquote key={i}>
                    <span>0{i + 1}</span>
                    <p>{q}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(q)
                        toast.success('Hook copiado.')
                      }}
                      aria-label="Copiar hook"
                    >
                      <Copy size={15} />
                    </button>
                  </blockquote>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="argumento" className="analysis-panel">
              <AnalysisHeader
                title="Coerência e argumentação"
                score={review.score_argument}
                verdict={review.analysis_argument.veredito}
                diagnosis={review.analysis_argument.diagnostico}
              />
              {review.analysis_argument.cumprimento_hook && (
                <div className="cta-box" style={{ marginBottom: 20 }}>
                  <small>O body paga o hook?</small>
                  <p>
                    <b>{review.analysis_argument.cumprimento_hook.veredito}.</b>{' '}
                    {review.analysis_argument.cumprimento_hook.explicacao}
                  </p>
                </div>
              )}
              <div className="problem-grid">
                {review.analysis_argument.falhas.map((p, i) => (
                  <article className="problem-card" key={i}>
                    <ShieldCheck />
                    <h4>{p.titulo}</h4>
                    <p>{p.explicacao}</p>
                    <small>Por que prejudica</small>
                    <p>{p.impacto}</p>
                  </article>
                ))}
              </div>
              <h3>Antes → Depois</h3>
              <div className="compare-stack">
                {review.analysis_argument.comparacoes.map((c, i) => (
                  <article key={i}>
                    <div>
                      <small>ANTES</small>
                      <p>{c.antes}</p>
                    </div>
                    <div>
                      <small>DEPOIS</small>
                      <p>{c.depois}</p>
                    </div>
                    <footer>{c.motivo}</footer>
                  </article>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="fluidez" className="analysis-panel">
              <AnalysisHeader
                title="Fluidez da escrita"
                score={review.score_curiosity}
                verdict={fluency.veredito}
                diagnosis={fluency.diagnostico}
              />
              <div className="problem-grid">
                {problems.map((p, i) => (
                  <article className="problem-card" key={i}>
                    <Scissors />
                    <h4>{p.titulo}</h4>
                    <p>{p.explicacao}</p>
                    <small>{p.tipo || 'Corte'}</small>
                    <p>{p.sugestao}</p>
                  </article>
                ))}
              </div>
              {cortes.length > 0 && (
                <>
                  <h3>Cortes concretos</h3>
                  <div className="compare-stack">
                    {cortes.map((c, i) => (
                      <article key={i}>
                        <div>
                          <small>ANTES</small>
                          <p>{c.antes}</p>
                        </div>
                        <div>
                          <small>DEPOIS</small>
                          <p>{c.depois}</p>
                        </div>
                        <footer>{c.motivo}</footer>
                      </article>
                    ))}
                  </div>
                </>
              )}
              {fluency.versao_enxuta && (
                <>
                  <h3>Versão mais direta</h3>
                  <div className="direct-version-box">
                    <header>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            normalizeAgentText(fluency.versao_enxuta || ''),
                          )
                          toast.success('Versão enxuta copiada.')
                        }}
                      >
                        <Copy size={15} /> Copiar
                      </Button>
                    </header>
                    <FormattedAgentText text={fluency.versao_enxuta} />
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="cta" className="analysis-panel">
              <AnalysisHeader
                title="Chamada para ação"
                score={review.score_argument}
                verdict={review.analysis_argument.cta.veredito}
                diagnosis={review.analysis_argument.cta.diagnostico}
              />
              <div className="cta-box">
                <p className="mono">“{review.analysis_argument.cta.trecho}”</p>
                <div>
                  {review.analysis_argument.cta.sugestoes.map((s, i) => (
                    <blockquote key={i}>{s}</blockquote>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="recomendacoes" className="analysis-panel">
              <AnalysisHeader
                title="Recomendações finais"
                verdict="Plano de ação"
                diagnosis="Ajustes consolidados sem duplicidade, em ordem de impacto."
              />
              <div className="recommendation-list">
                {priorities.map((item) => (
                  <article key={item.id}>
                    <Badge className={`priority-${item.priority}`}>{item.priority}</Badge>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.suggestion}</p>
                    </div>
                    <TaskButton insight={item} />
                  </article>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
      <div className="section-heading">
        <div>
          <p className="eyebrow">Da análise à pauta</p>
          <h2>Insights acionáveis</h2>
        </div>
        <span>{insights.length} decisões editoriais</span>
      </div>
      <div className="insight-grid">
        {insights.map((item) => {
          const Icon = criterionIcon[item.criterion] || Lightbulb
          return (
            <article className="insight-card" key={item.id}>
              <div className="insight-card__top">
                <Icon size={22} strokeWidth={1.75} aria-hidden />
                <Badge variant="outline">{item.criterion}</Badge>
              </div>
              <h3>{item.title}</h3>
              <p className="insight-card__description">{item.description}</p>
              <div className="insight-card__impact">
                <small>Por que prejudica</small>
                <p>{item.why}</p>
              </div>
              <footer>
                <Badge className={`priority-${item.priority}`}>{item.priority}</Badge>
                <TaskButton insight={item} />
              </footer>
            </article>
          )
        })}
      </div>
      <TaskModal
        insight={selected}
        review={review}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        onCreated={(id) => setCreated([...created, id])}
      />
    </section>
  )
}
function ScoreDelta({ label, from, to }: { label: string; from: number; to: number }) {
  const delta = Math.round((to - from) * 10) / 10
  const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus
  return (
    <span className={`delta-pill ${delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'}`}>
      <small>{label}</small>
      <b>
        {from.toFixed(1)} → {to.toFixed(1)}
      </b>
      <em>
        <Icon size={13} />
        {delta > 0 ? '+' : ''}
        {delta.toFixed(1)}
      </em>
    </span>
  )
}
function ComparisonCard({ review }: { review: ReviewRecord }) {
  const c = review.comparison
  if (!c) return null
  const lists = [
    {
      title: 'Melhorou',
      items: [c.hook, c.argumento, c.fluidez].flatMap((n) => n?.melhorou || []),
    },
    {
      title: 'Persistiu',
      items: [c.hook, c.argumento, c.fluidez].flatMap((n) => n?.persistiu || []),
    },
    {
      title: 'Ainda falta',
      items: [c.hook, c.argumento, c.fluidez].flatMap((n) => n?.ainda_falta || []),
    },
  ].map((block) => ({
    ...block,
    items: block.items.filter((item, i, all) => all.indexOf(item) === i),
  }))
  return (
    <section className="comparison-card">
      <div>
        <p className="eyebrow">Antes → agora</p>
        <h3>{c.changed ? 'O documento mudou.' : 'O texto não mudou.'}</h3>
        <p>{c.resumo}</p>
      </div>
      <div className="delta-row">
        <ScoreDelta label="Geral" from={c.previous_scores.overall} to={c.current_scores.overall} />
        <ScoreDelta label="Hook" from={c.previous_scores.hook} to={c.current_scores.hook} />
        <ScoreDelta
          label="Coerência"
          from={c.previous_scores.argument}
          to={c.current_scores.argument}
        />
        <ScoreDelta
          label="Fluidez"
          from={c.previous_scores.fluency}
          to={c.current_scores.fluency}
        />
      </div>
      <div className="comparison-grid">
        {lists.map((block) => (
          <article key={block.title}>
            <small>{block.title}</small>
            {block.items.length === 0 ? (
              <p>Nada marcado neste eixo.</p>
            ) : (
              <ul>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
function AnalysisHeader({
  title,
  score,
  verdict,
  diagnosis,
}: {
  title: string
  score?: number
  verdict: string
  diagnosis: string
}) {
  return (
    <header className="analysis-header">
      <div>
        <p className="eyebrow">Análise especializada</p>
        <h2>{title}</h2>
      </div>
      <div>
        <Badge
          className={
            verdict.toLowerCase().includes('crítico')
              ? 'verdict-critical'
              : verdict.toLowerCase().includes('ajust')
                ? 'verdict-adjust'
                : 'verdict-ok'
          }
        >
          {verdict}
        </Badge>
        {score !== undefined && <span className="section-score">{score.toFixed(1)}</span>}
      </div>
      <p>{diagnosis}</p>
    </header>
  )
}
