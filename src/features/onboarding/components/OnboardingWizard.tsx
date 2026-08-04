import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Bot, Landmark, Sparkles, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccountFormDialog } from '@/features/accounts/components/AccountFormDialog'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore'
import { cn } from '@/lib/utils'

/** Shown once for a brand-new user (no accounts yet) — stays open through all steps even after
 * they create their first account mid-flow, and never triggers again once dismissed/finished. */
export function OnboardingWizard() {
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding)
  const markSeen = useOnboardingStore((state) => state.markSeen)
  const { data: accounts = [], isLoading } = useAccounts()
  const [step, setStep] = useState(0)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!isLoading && !hasSeenOnboarding && accounts.length === 0) setActive(true)
    // Decide exactly once, right when the accounts query settles — never re-trigger afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  useEffect(() => {
    if (active && step === 1 && accounts.length > 0) setStep(2)
  }, [accounts.length, active, step])

  if (!active) return null

  function finish() {
    markSeen()
    setActive(false)
  }

  const steps = [
    {
      icon: Sparkles,
      title: 'Bem-vindo ao Finanças',
      description:
        'Um jeito rápido e inteligente de acompanhar suas contas, gastos fixos e economia — com uma IA que conhece seus números de verdade.',
      action: (
        <Button onClick={() => setStep(1)} className="gap-1.5">
          Vamos começar
          <ArrowRight className="size-4" />
        </Button>
      ),
    },
    {
      icon: Landmark,
      title: 'Crie sua primeira conta',
      description: 'Pode ser sua conta corrente, carteira ou cartão de crédito — é o ponto de partida pra tudo no app.',
      action: (
        <AccountFormDialog
          trigger={
            <Button className="gap-1.5">
              <Wallet className="size-4" />
              Adicionar conta
            </Button>
          }
        />
      ),
    },
    {
      icon: Sparkles,
      title: 'Digite do seu jeito',
      description:
        'No campo "Ex: Paguei 80 de pizza no Nubank..." no topo do dashboard, escreva a transação como você falaria. A IA organiza valor, categoria, conta e data — e te mostra pra revisar antes de salvar.',
      action: (
        <Button onClick={() => setStep(3)} className="gap-1.5">
          Entendi
          <ArrowRight className="size-4" />
        </Button>
      ),
    },
    {
      icon: Bot,
      title: 'Converse com o assistente',
      description:
        'O botão flutuante com a estrela, no canto da tela, abre um chat que já sabe suas contas e gastos. Pergunte "quanto posso gastar hoje?" quando quiser.',
      action: (
        <Button onClick={finish} className="gap-1.5">
          Começar a usar
        </Button>
      ),
    },
  ]

  const current = steps[step]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="glass-panel w-full max-w-sm rounded-xl p-8 text-center"
        >
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <current.icon className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-medium text-foreground">{current.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{current.description}</p>
          <div className="mt-6 flex justify-center">{current.action}</div>

          <div className="mt-6 flex items-center justify-center gap-1.5">
            {steps.map((_, index) => (
              <span
                key={index}
                className={cn('h-1.5 rounded-full transition-all', index === step ? 'w-5 bg-primary' : 'w-1.5 bg-white/15')}
              />
            ))}
          </div>

          {step < steps.length - 1 && (
            <button type="button" onClick={finish} className="mt-4 text-xs text-zinc-500 hover:text-zinc-300">
              Pular apresentação
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
