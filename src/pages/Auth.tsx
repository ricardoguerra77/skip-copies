import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Mail, Moon, PenTool, Sun } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import SkipCopiesLogo from '@/components/SkipCopiesLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type Mode = 'login' | 'signup' | 'forgot' | 'reset' | 'verify' | 'email-change'
const copy: Record<Mode, [string, string]> = {
  login: ['Entre na sala de revisão.', 'As melhores copies começam com um olhar mais exigente.'],
  signup: ['Crie sua central.', 'Organize críticas, decisões e próximos passos em um só lugar.'],
  forgot: ['Recupere seu acesso.', 'Enviaremos um link seguro para o seu e-mail.'],
  reset: ['Defina uma nova senha.', 'Escolha uma senha com pelo menos oito caracteres.'],
  verify: ['Confirme seu e-mail.', 'Só falta validar o endereço para abrir a central.'],
  'email-change': ['Confirme a alteração.', 'Valide o novo endereço de e-mail da sua conta.'],
}
export default function Auth({ mode }: { mode: Mode }) {
  const { user } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const token = new URLSearchParams(location.search).get('token') || ''
  if (user && (mode === 'login' || mode === 'signup'))
    return <Navigate to="/nova-revisao" replace />
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await pb.collection('users').authWithPassword(email, password)
        navigate('/nova-revisao')
      }
      if (mode === 'signup') {
        await pb.collection('users').create({ name, email, password, passwordConfirm: confirm })
        await pb.collection('users').requestVerification(email)
        toast.success('Conta criada. Verifique seu e-mail.')
        navigate('/login')
      }
      if (mode === 'forgot') {
        await pb.collection('users').requestPasswordReset(email)
        toast.success('Link de recuperação enviado.')
      }
      if (mode === 'reset') {
        await pb.collection('users').confirmPasswordReset(token, password, confirm)
        toast.success('Senha atualizada.')
        navigate('/login')
      }
      if (mode === 'verify') {
        await pb.collection('users').confirmVerification(token)
        toast.success('E-mail confirmado.')
        navigate('/login')
      }
      if (mode === 'email-change') {
        await pb.collection('users').confirmEmailChange(token, password)
        toast.success('E-mail alterado.')
        navigate('/login')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível concluir a ação.')
    } finally {
      setLoading(false)
    }
  }
  const [title, subtitle] = copy[mode]
  const tokenMode = mode === 'verify' || mode === 'email-change'
  return (
    <main className="auth-page">
      <section className="auth-manifesto">
        <SkipCopiesLogo tone="on-dark" className="auth-logo" />

        <h1>
          Critério antes
          <br />
          <em>da campanha.</em>
        </h1>
        <p>Três agentes leem a copy — hook, coerência e fluidez — e devolvem uma direção clara.</p>
        <div className="auth-quote">
          “Não é sobre escrever mais. É sobre remover tudo o que não merece atenção.”
        </div>
      </section>
      <section className="auth-panel">
        <form onSubmit={submit} className="auth-card reveal">
          <div>
            <div className="auth-panel-brand">
              <SkipCopiesLogo tone={theme === 'dark' ? 'on-dark' : 'on-light'} />
              <button
                type="button"
                className="theme-toggle"
                onClick={toggle}
                aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
            <p className="eyebrow">Acesso</p>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          {mode === 'signup' && (
            <label>
              Seu nome
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Nome completo"
              />
            </label>
          )}
          {!tokenMode && mode !== 'reset' && (
            <label>
              E-mail
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="voce@empresa.com"
              />
            </label>
          )}
          {(mode === 'login' ||
            mode === 'signup' ||
            mode === 'reset' ||
            mode === 'email-change') && (
            <label>
              {mode === 'email-change' ? 'Senha atual' : 'Senha'}
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
              />
            </label>
          )}
          {(mode === 'signup' || mode === 'reset') && (
            <label>
              Confirmar senha
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
              />
            </label>
          )}
          <Button disabled={loading} className="skip-btn" type="submit">
            {loading
              ? 'Processando…'
              : tokenMode
                ? 'Confirmar agora'
                : mode === 'login'
                  ? 'Entrar na central'
                  : mode === 'signup'
                    ? 'Criar conta'
                    : mode === 'forgot'
                      ? 'Enviar link'
                      : 'Salvar nova senha'}{' '}
            <ArrowRight size={16} />
          </Button>
          {mode === 'login' && (
            <div className="auth-links">
              <Link to="/forgot-password">Esqueci minha senha</Link>
              <Link to="/signup">Criar uma conta</Link>
            </div>
          )}
          {mode !== 'login' && (
            <Link className="back-link" to="/login">
              <Mail size={15} /> Voltar ao login
            </Link>
          )}
        </form>
        <div className="auth-signature">
          <PenTool size={16} /> Skip Copies — análise crítica, sem feedback genérico.
        </div>
      </section>
    </main>
  )
}
