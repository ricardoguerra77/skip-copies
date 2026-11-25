import pb from '@/lib/pocketbase/client'
import type {
  AgentContext,
  ArgumentAnalysis,
  ComparisonNote,
  Consolidation,
  FluencyAnalysis,
  HookAnalysis,
  ReviewComparison,
  ReviewRecord,
  ReviewRound,
  ReviewStatus,
  TaskRecord,
} from '@/types/review'

const collection = pb.collection('reviews')
export const listReviews = () =>
  collection.getFullList<ReviewRecord>({ sort: '-created', expand: 'tasks_via_review_id' })
export const getReview = (id: string) =>
  collection.getOne<ReviewRecord>(id, { expand: 'tasks_via_review_id' })
export const createReview = (data: Partial<ReviewRecord>) =>
  collection.create<ReviewRecord>({ ...data, user_id: pb.authStore.record?.id })
export const updateReview = (id: string, data: Partial<ReviewRecord>) =>
  collection.update<ReviewRecord>(id, data)

export async function runAgent(
  slug: string,
  copy: string,
  context: AgentContext = {},
): Promise<unknown> {
  const response = await fetch(
    `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/review-agent/${slug}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: pb.authStore.token },
      body: JSON.stringify({
        copy,
        previous_copy: context.previousCopy || '',
        previous_diagnosis: context.previousDiagnosis || '',
        previous_nota: context.previousNota,
        previous_veredito: context.previousVeredito || '',
        tasks: context.tasks || [],
        round: context.round || 1,
      }),
    },
  )
  const payload = (await response.json()) as { content?: string; error?: string; message?: string }
  if (!response.ok || !payload.content)
    throw new Error(payload.error || payload.message || 'Falha ao analisar a copy.')
  const clean = payload.content
    .replace(/^```json\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
  return JSON.parse(clean)
}

export function plainCopy(text = '') {
  return String(text)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function statusFromScore(score: number): ReviewStatus {
  if (score >= 8) return 'pronta'
  if (score >= 6) return 'pequenos_ajustes'
  if (score >= 4) return 'ajustes_relevantes'
  return 'refazer'
}

function noteList(items?: string[]) {
  return (items || []).map((x) => x.trim()).filter(Boolean)
}

function mergeNotes(...notes: Array<ComparisonNote | undefined>): ComparisonNote {
  return {
    resumo: notes
      .map((n) => n?.resumo?.trim())
      .filter(Boolean)
      .join(' '),
    melhorou: notes.flatMap((n) => noteList(n?.melhorou)),
    persistiu: notes.flatMap((n) => noteList(n?.persistiu)),
    ainda_falta: notes.flatMap((n) => noteList(n?.ainda_falta)),
  }
}

export function taskContext(tasks: TaskRecord[] = []) {
  return tasks.map((t) => ({
    title: t.title,
    status: t.status,
    suggestion: t.suggestion,
    criterion: t.criterion,
  }))
}

export function buildComparison(
  previous: ReviewRecord,
  current: {
    hook: HookAnalysis
    argument: ArgumentAnalysis
    fluency: FluencyAnalysis
    overall: number
  },
  changed: boolean,
  tasks: TaskRecord[] = [],
): ReviewComparison {
  const merged = mergeNotes(
    current.hook.comparacao,
    current.argument.comparacao,
    current.fluency.comparacao,
  )
  return {
    changed,
    previous_scores: {
      hook: previous.score_hook,
      argument: previous.score_argument,
      fluency: previous.score_curiosity,
      overall: previous.score_overall,
    },
    current_scores: {
      hook: current.hook.nota,
      argument: current.argument.nota,
      fluency: current.fluency.nota,
      overall: current.overall,
    },
    tasks: tasks.map((t) => ({ title: t.title, status: t.status, criterion: t.criterion })),
    hook: current.hook.comparacao,
    argumento: current.argument.comparacao,
    fluidez: current.fluency.comparacao,
    resumo:
      merged.resumo ||
      (changed
        ? 'O documento mudou desde a última leitura. Veja o que melhorou e o que ainda falta.'
        : 'O texto do documento não mudou. A reavaliação considera as tarefas e a leitura anterior.'),
  }
}

export function snapshotRound(review: ReviewRecord): ReviewRound {
  return {
    round: review.round || 1,
    at: review.updated || new Date().toISOString(),
    scores: {
      hook: review.score_hook,
      argument: review.score_argument,
      fluency: review.score_curiosity,
      overall: review.score_overall,
    },
    status: review.status,
    summary: review.consolidation?.summary || '',
  }
}

export function consolidate(
  hook: HookAnalysis,
  argument: ArgumentAnalysis,
  fluency: FluencyAnalysis,
): Consolidation {
  const fluencyProblems =
    fluency.problemas?.map((p, i) => ({
      id: `flu-${i}`,
      title: p.titulo,
      description: p.explicacao,
      why: `Tipo: ${p.tipo}. Deixa o texto mais lento ou menos crível.`,
      original: p.trecho,
      suggestion: p.sugestao,
      priority: i === 0 ? ('alta' as const) : ('media' as const),
      criterion: 'fluidez' as const,
    })) ||
    fluency.pontos_queda?.map((p, i) => ({
      id: `flu-${i}`,
      title: `Ajustar fluidez em ${p.segmento}`,
      description: p.por_que_caiu,
      why: 'O trecho perde o leitor antes do CTA.',
      original: p.trecho,
      suggestion: p.ajuste,
      priority: fluency.ajustes?.[i]?.prioridade || ('media' as const),
      criterion: 'fluidez' as const,
    })) ||
    []
  const insights = [
    ...hook.problemas.map((p, i) => ({
      id: `hook-${i}`,
      title: p.titulo,
      description: p.explicacao,
      why: p.impacto,
      original: p.trecho,
      suggestion: p.sugestao,
      priority: 'alta' as const,
      criterion: 'hook' as const,
    })),
    ...argument.falhas.map((p, i) => ({
      id: `arg-${i}`,
      title: p.titulo,
      description: p.explicacao,
      why: p.impacto,
      original: p.trecho,
      suggestion:
        argument.ajustes[i]?.sugestao || 'Reescrever o trecho preservando clareza e progressão.',
      priority: argument.ajustes[i]?.prioridade || ('media' as const),
      criterion: (argument.ajustes[i]?.criterio || 'argumento') as 'argumento' | 'cta',
    })),
    ...fluencyProblems,
  ]
  const unique = insights.filter(
    (item, index, all) =>
      all.findIndex(
        (x) => x.title.toLowerCase().slice(0, 28) === item.title.toLowerCase().slice(0, 28),
      ) === index,
  )
  return {
    summary: [hook.diagnostico, argument.diagnostico, fluency.diagnostico].join(' '),
    insights: unique,
  }
}

export async function analyzeCopy(
  copy: string,
  onStep: (index: number) => void,
  context: {
    previousCopy?: string
    previousHook?: HookAnalysis
    previousArgument?: ArgumentAnalysis
    previousFluency?: FluencyAnalysis
    tasks?: TaskRecord[]
    round?: number
  } = {},
) {
  const tasks = taskContext(context.tasks || [])
  const round = context.round || 1
  const shared = { tasks, round, previousCopy: context.previousCopy }
  const hookCall = runAgent('hook-revisor', copy, {
    ...shared,
    previousDiagnosis: context.previousHook?.diagnostico,
    previousNota: context.previousHook?.nota,
    previousVeredito: context.previousHook?.veredito,
  }).then((v) => {
    onStep(0)
    return v as HookAnalysis
  })
  const argumentCall = runAgent('argumento-revisor', copy, {
    ...shared,
    previousDiagnosis: context.previousArgument?.diagnostico,
    previousNota: context.previousArgument?.nota,
    previousVeredito: context.previousArgument?.veredito,
  }).then((v) => {
    onStep(1)
    return v as ArgumentAnalysis
  })
  const fluencyCall = runAgent('curiosidade-revisor', copy, {
    ...shared,
    previousDiagnosis: context.previousFluency?.diagnostico,
    previousNota: context.previousFluency?.nota,
    previousVeredito: context.previousFluency?.veredito,
  }).then((v) => {
    onStep(2)
    return v as FluencyAnalysis
  })
  const [hook, argument, fluency] = await Promise.all([hookCall, argumentCall, fluencyCall])
  const overall = Math.round(((hook.nota + argument.nota + fluency.nota) / 3) * 10) / 10
  return { hook, argument, fluency, overall, status: statusFromScore(overall) }
}
