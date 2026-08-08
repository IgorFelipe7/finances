import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Bot, Landmark, Sparkles, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccountFormDialog } from '@/features/accounts/components/AccountFormDialog'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore'
import { cn } from '@/lib/utils'

// AppLayout (and this component with it) remounts on every route navigation, so open/step state
// lives in the store rather than local useState. This guard makes the auto-open check itself run
// only once per page load instead of re-evaluating — and potentially reopening — on every nav.
let hasEvaluatedAutoOpen = false

/** Shown once for a brand-new user (no accounts yet) — stays open through all steps even after
 * they create their first account mid-flow, and never triggers again once dismissed/finished. */
export function OnboardingWizard() {
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding)
  const active = useOnboardingStore((state) => state.active)
  const step = useOnboardingStore((state) => state.step)
  const open = useOnboardingStore((state) => state.open)
  const setStep = useOnboardingStore((state) => state.setStep)
  const finish = useOnboardingStore((state) => state.finish)
  const { data: accounts = [], isLoading } = useAccounts()

  useEffect(() => {
    if (hasEvaluatedAutoOpen || isLoading) return
    hasEvaluatedAutoOpen = true
    if (!hasSeenOnboarding && accounts.length === 0) open()
  }, [isLoading, hasSeenOnboarding, accounts.length, open])

  useEffect(() => {
    if (active && step === 1 && accounts.length > 0) setStep(2)
  }, [accounts.length, active, step, setStep])

  if (!active) return null

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
    // Between BottomNav/AssistantPanel (z-40) and Dialog (z-50) on purpose — Step 2 opens
    // AccountFormDialog on top of this backdrop, and it must render above the wizard, not be
    // trapped underneath it; still covers the rest of the app's chrome while onboarding is active.
    <div className="fixed inset-0 z-[45] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
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
                className={cn('h-1.5 rounded-full transition-all', index === step ? 'w-5 bg-primary' : 'w-1.5 bg-muted')}
              />
            ))}
          </div>

          {step < steps.length - 1 && (
            <button type="button" onClick={finish} className="mt-4 text-xs text-muted-foreground hover:text-foreground">
              Pular apresentação
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
