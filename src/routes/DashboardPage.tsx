import { ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { BudgetsPanel } from '@/features/budgets/components/BudgetsPanel'
import { CashFlowAreaChart } from '@/features/dashboard/components/CashFlowAreaChart'
import { CategoryDonutChart } from '@/features/dashboard/components/CategoryDonutChart'
import { InsightsPanel } from '@/features/dashboard/components/InsightsPanel'
import { MetricsRibbon } from '@/features/dashboard/components/MetricsRibbon'
import { NetWorthHistoryChart } from '@/features/dashboard/components/NetWorthHistoryChart'
import { SavingsWidget } from '@/features/dashboard/components/SavingsWidget'
import { SmartInput } from '@/features/transactions/components/SmartInput'
import { TransactionFormDialog } from '@/features/transactions/components/TransactionFormDialog'

export function DashboardPage() {
  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SmartInput />
          </div>
          <TransactionFormDialog />
        </div>

        <InsightsPanel />

        <MetricsRibbon />

        <NetWorthHistoryChart />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CashFlowAreaChart />
          </div>
          <div className="space-y-4">
            <CategoryDonutChart />
            <SavingsWidget />
          </div>
        </div>

        <BudgetsPanel />

        <Link
          to="/retrospectiva"
          className="glass-panel group flex items-center gap-3 rounded-xl px-5 py-4 transition-colors hover:bg-white/5"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Sua retrospectiva está pronta</p>
            <p className="text-xs text-zinc-400">Veja o resumo do mês e do ano — maior categoria, maior gasto, e mais.</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </AppLayout>
  )
}
