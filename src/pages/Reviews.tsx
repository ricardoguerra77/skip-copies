import { useEffect, useState } from 'react'
import { ArrowRight, FileText, PenLine, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { listReviews } from '@/services/reviews'
import type { ReviewRecord } from '@/types/review'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
const status = {
  pronta: 'Pronta',
  pequenos_ajustes: 'Pequenos ajustes',
  ajustes_relevantes: 'Ajustes relevantes',
  refazer: 'Refazer',
}
export default function Reviews() {
  const [items, setItems] = useState<ReviewRecord[]>([])
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  useEffect(() => {
    listReviews()
      .then(setItems)
      .catch((e) => toast.error(e.message))
  }, [])
  const visible = items.filter((x) =>
    `${x.title} ${x.copywriter}`.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <div className="page-stack">
      <header className="list-hero reveal">
        <div>
          <p className="eyebrow">Skip Copies</p>
          <h1>Revisões</h1>
          <p>Decisões passadas, com todo o contexto preservado.</p>
        </div>
        <div className="search-field">
          <Search />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título ou copywriter"
          />
        </div>
      </header>
      <section className="review-list reveal delay-1">
        {visible.length === 0 ? (
          <div className="empty-state">
            <FileText />
            <h2>Nenhuma revisão ainda</h2>
            <p>Comece revisando uma copy.</p>
          </div>
        ) : (
          visible.map((item) => (
            <button
              key={item.id}
              className="review-row"
              onClick={() => navigate(`/revisoes/${item.id}`)}
            >
              <div className="review-source-icon">
                {item.source === 'google_docs' ? <FileText /> : <PenLine />}
              </div>
              <div className="review-title">
                <span>{item.source === 'google_docs' ? 'Google Docs' : 'Manual'}</span>
                <h3>{item.title}</h3>
                <p>
                  {item.copywriter} •{' '}
                  {new Date(item.created).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {item.round && item.round > 1 ? ` • Rodada ${item.round}` : ''}
                </p>
              </div>
              <div className="row-scores">
                <Score label="Geral" value={item.score_overall} />
                <Score label="Hook" value={item.score_hook} />
                <Score label="Coerência" value={item.score_argument} />
                <Score label="Fluidez" value={item.score_curiosity} />
              </div>
              <div className="review-meta">
                <Badge className={`status-${item.status}`}>{status[item.status]}</Badge>
                <span>{item.expand?.tasks_via_review_id?.length || 0} tarefa(s)</span>
              </div>
              <ArrowRight />
            </button>
          ))
        )}
      </section>
    </div>
  )
}
function Score({ label, value }: { label: string; value: number }) {
  return (
    <span
      className={`score-pill score-${value >= 8 ? 'good' : value >= 6 ? 'medium' : value >= 4 ? 'low' : 'bad'}`}
      title={`${label}: ${value.toFixed(1)} de 10`}
    >
      <small>{label}</small>
      <b>{value.toFixed(1)}</b>
    </span>
  )
}
