export type Priority = 'alta' | 'media' | 'baixa'
export type Criterion = 'hook' | 'argumento' | 'fluidez' | 'curiosidade' | 'cta'
export type ReviewStatus = 'pronta' | 'pequenos_ajustes' | 'ajustes_relevantes' | 'refazer'

export interface ComparisonNote {
  resumo?: string
  melhorou?: string[]
  persistiu?: string[]
  ainda_falta?: string[]
}
export interface HookAnalysis {
  nota: number
  veredito: string
  diagnostico: string
  captura_atencao?: boolean
  categoria?: string
  problemas: Array<{
    titulo: string
    explicacao: string
    trecho: string
    impacto: string
    sugestao: string
  }>
  variacoes_hook: string[]
  comparacao?: ComparisonNote
}
export interface ArgumentAnalysis {
  nota: number
  veredito: string
  diagnostico: string
  cumprimento_hook?: { veredito: string; explicacao: string }
  falhas: Array<{ titulo: string; explicacao: string; trecho: string; impacto: string }>
  ajustes: Array<{
    titulo: string
    sugestao: string
    prioridade: Priority
    criterio: 'argumento' | 'cta'
  }>
  comparacoes: Array<{ antes: string; depois: string; motivo: string }>
  cta: { veredito: string; diagnostico: string; trecho: string; sugestoes: string[] }
  comparacao?: ComparisonNote
}
export interface FluencyAnalysis {
  nota: number
  veredito: string
  diagnostico: string
  problemas?: Array<{
    titulo: string
    explicacao: string
    trecho: string
    tipo: 'prolixo' | 'cliche' | 'indireto' | 'vazio' | string
    sugestao: string
  }>
  cortes?: Array<{ antes: string; depois: string; motivo: string }>
  versao_enxuta?: string
  curva?: Array<{ segmento: string; valor: number; trecho: string }>
  pontos_queda?: Array<{ segmento: string; trecho: string; por_que_caiu: string; ajuste: string }>
  ajustes?: Array<{ titulo: string; sugestao: string; prioridade: Priority }>
  comparacao?: ComparisonNote
}
export type CuriosityAnalysis = FluencyAnalysis
export interface Insight {
  id: string
  title: string
  description: string
  why: string
  original: string
  suggestion: string
  priority: Priority
  criterion: Criterion
}
export interface Consolidation {
  summary: string
  insights: Insight[]
}
export interface ReviewComparison {
  changed: boolean
  previous_scores: {
    hook: number
    argument: number
    fluency: number
    overall: number
  }
  current_scores: {
    hook: number
    argument: number
    fluency: number
    overall: number
  }
  tasks: Array<{ title: string; status: string; criterion: string }>
  hook?: ComparisonNote
  argumento?: ComparisonNote
  fluidez?: ComparisonNote
  resumo: string
}
export interface ReviewRound {
  round: number
  at: string
  scores: { hook: number; argument: number; fluency: number; overall: number }
  status: ReviewStatus
  summary: string
}
export interface ReviewRecord {
  id: string
  user_id: string
  title: string
  source: 'google_docs' | 'manual'
  source_doc_id?: string
  source_doc_name?: string
  source_doc_link?: string
  copywriter: string
  copy_text: string
  copy_text_previous?: string
  round?: number
  comparison?: ReviewComparison | null
  rounds?: ReviewRound[]
  score_hook: number
  score_argument: number
  score_curiosity: number
  score_overall: number
  status: ReviewStatus
  analysis_hook: HookAnalysis
  analysis_argument: ArgumentAnalysis
  analysis_curiosity: FluencyAnalysis
  consolidation: Consolidation
  created: string
  updated: string
  expand?: { tasks_via_review_id?: TaskRecord[] }
}
export interface TaskRecord {
  id: string
  user_id: string
  review_id: string
  title: string
  description: string
  original_text: string
  suggestion: string
  priority: Priority
  criterion: Criterion
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
  copywriter: string
  source_doc_name?: string
  source_doc_link?: string
  created: string
  updated: string
  expand?: { review_id?: ReviewRecord }
}
export interface AgentContext {
  previousCopy?: string
  previousDiagnosis?: string
  previousNota?: number
  previousVeredito?: string
  tasks?: Array<{ title: string; status: string; suggestion: string; criterion: string }>
  round?: number
}
