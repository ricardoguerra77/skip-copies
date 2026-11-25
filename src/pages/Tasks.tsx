import { useEffect, useState } from 'react'
import { ArrowUpRight, CheckCircle2, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { listTasks, updateTaskStatus } from '@/services/tasks'
import type { TaskRecord } from '@/types/review'
import { toast } from 'sonner'
const statusLabels = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}
export default function Tasks() {
  const [items, setItems] = useState<TaskRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('todas')
  const [priority, setPriority] = useState('todas')
  useEffect(() => {
    listTasks()
      .then(setItems)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])
  const update = async (item: TaskRecord, value: TaskRecord['status']) => {
    try {
      const next = await updateTaskStatus(item.id, value)
      setItems(items.map((x) => (x.id === item.id ? { ...x, ...next } : x)))
      toast.success('Status da tarefa atualizado.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao atualizar.')
    }
  }
  const visible = items.filter(
    (x) =>
      (status === 'todas' || x.status === status) &&
      (priority === 'todas' || x.priority === priority),
  )
  return (
    <div className="page-stack">
      <header className="list-hero reveal">
        <div>
          <p className="eyebrow">Pauta do time</p>
          <h1>Tarefas</h1>
          <p>Ajustes editoriais organizados por impacto e andamento.</p>
        </div>
        <div className="task-filters">
          <div>
            {['todas', 'pendente', 'em_andamento', 'concluida', 'cancelada'].map((s) => (
              <button className={status === s ? 'active' : ''} onClick={() => setStatus(s)} key={s}>
                {s === 'todas' ? 'Todas' : statusLabels[s as keyof typeof statusLabels]}
              </button>
            ))}
          </div>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as prioridades</SelectItem>
              <SelectItem value="alta">Alta prioridade</SelectItem>
              <SelectItem value="media">Média prioridade</SelectItem>
              <SelectItem value="baixa">Baixa prioridade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>
      <section className="task-list reveal delay-1">
        {loading ? (
          <div className="page-loading">Carregando tarefas…</div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <ClipboardList />
            <h2>Nenhuma tarefa criada ainda</h2>
            <p>Os insights de uma revisão podem virar tarefas em um clique.</p>
          </div>
        ) : (
          visible.map((item) => (
            <article className="task-card" key={item.id}>
              <div className="task-card-top">
                <div>
                  <Badge className={`priority-${item.priority}`}>{item.priority}</Badge>
                  <Badge variant="outline">{item.criterion}</Badge>
                </div>
                <Select
                  value={item.status}
                  onValueChange={(v) => update(item, v as TaskRecord['status'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([v, l]) => (
                      <SelectItem value={v} key={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <div className="task-excerpts">
                <div>
                  <small>Trecho original</small>
                  <p>{item.original_text || '—'}</p>
                </div>
                <div>
                  <small>Direção sugerida</small>
                  <p>{item.suggestion}</p>
                </div>
              </div>
              <footer>
                <span>
                  {item.copywriter} • {new Date(item.created).toLocaleDateString('pt-BR')}
                </span>
                <Link to={`/revisoes/${item.review_id}`}>
                  {item.status === 'concluida'
                    ? 'Reavaliar a copy'
                    : item.expand?.review_id?.title || 'Ver revisão'}{' '}
                  <ArrowUpRight />
                </Link>
                {item.status === 'concluida' && <CheckCircle2 />}
              </footer>
            </article>
          ))
        )}
      </section>
    </div>
  )
}
