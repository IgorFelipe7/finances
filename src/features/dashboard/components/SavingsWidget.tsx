import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { PiggyBank, Plus, Sparkles } from 'lucide-react'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { AccountFormDialog } from '@/features/accounts/components/AccountFormDialog'
import { SavingsUpdateDialog } from '@/features/accounts/components/SavingsUpdateDialog'
import { useAccountBalances } from '@/features/accounts/hooks/useAccountBalances'
import { MetricTileSkeleton } from '@/features/dashboard/components/PanelSkeletons'
import { useFinancialSnapshot } from '@/features/dashboard/hooks/useFinancialSnapshot'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'

export function SavingsWidget() {
  const { accountBalances, isLoading } = useAccountBalances()
  const { snapshot } = useFinancialSnapshot()
  const { formatMoney } = useMoneyFormatter()

  const savings = useMemo(() => accountBalances.filter(({ account }) => account.type === 'savings'), [accountBalances])
  const totalSaved = savings.reduce((sum, { balance }) => sum + balance, 0)
  const balancesByAccountId = useMemo(() => new Map(savings.map(({ account, balance }) => [account.id, balance])), [savings])

  if (isLoading) return <MetricTileSkeleton lines={2} label="Carregando valores guardados" />

  return (
    <Card className="glass-panel h-full">
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <PiggyBank className="size-3.5 text-primary" />
          Guardado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatedNumber value={totalSaved} formatter={formatMoney} className="num text-2xl font-semibold text-foreground" />

        {savings.length > 1 && (
          <ul className="space-y-1">
            {savings.map(({ account, balance }) => (
              <li key={account.id} className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: account.color }} />
                  {account.name}
                </span>
                <span className="num text-foreground/80">{formatMoney(balance)}</span>
              </li>
            ))}
          </ul>
        )}

        {snapshot.recommendedSavings > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-1.5 rounded-lg bg-primary/10 px-2.5 py-2 text-xs text-primary"
          >
            <Sparkles className="mt-0.5 size-3 shrink-0" />
            Dá pra guardar ~{formatMoney(snapshot.recommendedSavings)} este mês sem apertar o orçamento.
          </motion.p>
        )}

        {savings.length === 0 ? (
          <AccountFormDialog
            defaultType="savings"
            trigger={
              <Button type="button" size="sm" variant="secondary" className="w-full gap-1.5">
                <Plus className="size-3.5" />
                Criar conta de poupança
              </Button>
            }
          />
        ) : (
          <SavingsUpdateDialog
            accounts={savings.map(({ account }) => account)}
            balancesByAccountId={balancesByAccountId}
            trigger={
              <Button type="button" size="sm" variant="secondary" className="w-full gap-1.5">
                <Plus className="size-3.5" />
                Guardar dinheiro
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  )
}
