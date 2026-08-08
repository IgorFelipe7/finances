import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { useAccountBalances } from '@/features/accounts/hooks/useAccountBalances'
import { useMoneyFormatter } from '@/hooks/useMoneyFormatter'

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: index * 0.05 },
  }),
}

function MetricLabel({ children }: { children: string }) {
  return (
    <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </CardDescription>
  )
}

export function MetricsRibbon() {
  const { accountBalances, netWorth, projectedNetWorth, monthlyIncome, monthlyExpenses } = useAccountBalances()
  const { formatMoney } = useMoneyFormatter()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
        <Card className="glass-panel">
          <CardHeader>
            <MetricLabel>Patrimônio Total</MetricLabel>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatMoney(netWorth)}</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
        <Card className="glass-panel">
          <CardHeader>
            <MetricLabel>Contas</MetricLabel>
          </CardHeader>
          <CardContent className="space-y-1">
            {accountBalances.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada ainda.</p>
            ) : (
              accountBalances.map(({ account, balance }) => (
                <button
                  key={account.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left transition-colors hover:bg-accent/60"
                >
                  <span className="flex items-center gap-2 text-sm text-foreground">
                    <span className="size-2 rounded-full" style={{ backgroundColor: account.color }} />
                    {account.name}
                  </span>
                  <span className="text-sm font-medium text-foreground">{formatMoney(balance)}</span>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
        <Card className="glass-panel">
          <CardHeader>
            <MetricLabel>Receitas vs Despesas do Mês</MetricLabel>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="text-lg font-bold text-positive">{formatMoney(monthlyIncome)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Despesas</p>
              <p className="text-lg font-bold text-destructive">{formatMoney(monthlyExpenses)}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
        <Card className="glass-panel">
          <CardHeader>
            <MetricLabel>Saldo Projetado (Fim do Mês)</MetricLabel>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatMoney(projectedNetWorth)}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
