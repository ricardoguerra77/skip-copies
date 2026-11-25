import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTask } from '@/services/tasks'
import type { Insight, ReviewRecord } from '@/types/review'
import { toast } from 'sonner'

export default function TaskModal({
  insight,
  review,
  open,
  onOpenChange,
  onCreated,
}: {
  insight: Insight | null
  review: ReviewRecord
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (id: string) => void
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    original_text: '',
    suggestion: '',
    priority: 'media',
    copywriter: '',
  })
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (insight)
      setForm({
        title: insight.title,
        description: insight.description,
        original_text: insight.original,
        suggestion: insight.suggestion,
        priority: insight.priority,
        copywriter: review.copywriter,
      })
  }, [insight, review.copywriter])
  const save = async () => {
    if (!insight) return
    setSaving(true)
    try {
      await createTask({
        ...form,
        priority: form.priority as 'alta' | 'media' | 'baixa',
        criterion: insight.criterion,
        review_id: review.id,
        source_doc_name: review.source_doc_name,
        source_doc_link: review.source_doc_link,
      })
      toast.success(`Tarefa criada para ${form.copywriter}.`)
      onCreated(insight.id)
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível criar a tarefa.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <Dialog open={open && !!insight} onOpenChange={onOpenChange}>
      {insight ? (
        <DialogContent className="task-dialog">
          <div className="dialog-rule" />
          <DialogHeader>
            <p className="eyebrow">Da crítica à ação</p>
            <DialogTitle>Criar tarefa</DialogTitle>
          </DialogHeader>
          <div className="task-form">
            <label>
              Título
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Descrição
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="form-pair">
              <label>
                Trecho original
                <Textarea
                  value={form.original_text}
                  onChange={(e) => setForm({ ...form, original_text: e.target.value })}
                />
              </label>
              <label>
                Sugestão de melhoria
                <Textarea
                  value={form.suggestion}
                  onChange={(e) => setForm({ ...form, suggestion: e.target.value })}
                />
              </label>
            </div>
            <div className="form-pair">
              <label>
                Prioridade
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label>
                Responsável
                <Input
                  value={form.copywriter}
                  onChange={(e) => setForm({ ...form, copywriter: e.target.value })}
                />
              </label>
            </div>
            <div className="task-meta">
              <span>
                Critério: <b>{insight.criterion}</b>
              </span>
              <span>
                Status: <b>Pendente</b>
              </span>
              <span>
                Origem: <b>{review.source === 'google_docs' ? review.source_doc_name : 'Manual'}</b>
              </span>
              {review.source_doc_link && (
                <a href={review.source_doc_link} target="_blank" rel="noreferrer">
                  Abrir original <ExternalLink size={13} />
                </a>
              )}
            </div>
            <Button
              className="skip-btn"
              disabled={saving || !form.title || !form.description}
              onClick={save}
            >
              {saving ? 'Salvando…' : 'Salvar tarefa'}
            </Button>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
