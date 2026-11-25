import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ConnectorButton } from '@/components/skip/ConnectorButton'

export default function Integrations() {
  const { user } = useAuth()
  return (
    <div className="page-stack">
      <header className="list-hero reveal">
        <div>
          <p className="eyebrow">Conta pessoal</p>
          <h1>Integrações</h1>
          <p>
            Cada pessoa conecta o próprio Google Docs — o login acontece na tela do Google, com a
            sua conta ({user?.email || 'logado'}). A conexão é individual: ninguém acessa os
            documentos de outra conta do time.
          </p>
        </div>
      </header>
      <section className="integration-card reveal delay-1">
        <FileText />
        <div>
          <h2>Google Docs</h2>
          <p>Importar copies e reavaliar documentos atualizados direto da sua conta Google.</p>
          <ConnectorButton toolkit="googledocs" name="Google Docs" />
        </div>
      </section>
      <section className="integration-card reveal delay-2">
        <FileText />
        <div>
          <h2>Como funciona</h2>
          <p>
            Depois de conectar, o Skip Copies importa o texto dos seus Google Docs para revisão — e
            relê o mesmo documento quando você reavalia uma copy. Antes de criar uma revisão com
            documento do Google, conecte sua conta aqui.
          </p>
          <p style={{ marginTop: 8 }}>
            Precisa revisar agora? <Link to="/nova-revisao">Criar uma nova revisão</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
