import { ArrowUpRight, Sparkle } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { BudgetsPanel } from '@/features/budgets/components/BudgetsPanel'
import { CashFlowAreaChart } from '@/features/dashboard/components/CashFlowAreaChart'
import { CategoryDonutChart } from '@/features/dashboard/components/CategoryDonutChart'
import { DistributionStrip } from '@/features/dashboard/components/DistributionStrip'
import { InsightsPanel } from '@/features/dashboard/components/InsightsPanel'
import { AccountsTile, IncomeExpenseTile } from '@/features/dashboard/components/MetricTiles'
import { NetWorthHistoryChart } from '@/features/dashboard/components/NetWorthHistoryChart'
import { RecentTransactionsCard } from '@/features/dashboard/components/RecentTransactionsCard'
import { RevenueHero } from '@/features/dashboard/components/RevenueHero'
import { SavingsWidget } from '@/features/dashboard/components/SavingsWidget'
import { SpendingHeatmap } from '@/features/dashboard/components/SpendingHeatmap'
import { SmartInput } from '@/features/transactions/components/SmartInput'

/*
 * Layout follows a masthead-then-grid rhythm: an unboxed hero (greeting, headline figure,
 * primary actions) paired with the category distribution strip, then everything else in a
 * 12-column grid.
 *
 * The hero is deliberately *not* in a panel — the page's most important number shouldn't
 * be visually equal to a chart card. Column spans tile exactly at each breakpoint:
 *   xl (12): 7+5 | 8+4 | 4+4+4 | 5+7
 *   md  (2): 2 | 2 | 2 | 2 | 1+1 | ...
 */
export function DashboardPage() {
  return (
    <AppLayout title="Dashboard" hideTitle>
      <div className="space-y-5 pt-1">
        <section className="grid grid-cols-1 gap-6 border-b border-border pb-6 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <RevenueHero />
          </div>
          <div className="xl:col-span-5">
            <DistributionStrip />
          </div>
        </section>

        <SmartInput />

        <InsightsPanel />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
          <div className="md:col-span-2 xl:col-span-8">
            <NetWorthHistoryChart />
          </div>
          <div className="md:col-span-2 xl:col-span-4">
            <SpendingHeatmap />
          </div>

          <div className="md:col-span-2 xl:col-span-8">
            <CashFlowAreaChart />
          </div>
          <div className="md:col-span-2 xl:col-span-4">
            <RecentTransactionsCard />
          </div>

          <div className="md:col-span-1 xl:col-span-4">
            <CategoryDonutChart />
          </div>
          <div className="md:col-span-1 xl:col-span-4">
            <IncomeExpenseTile index={0} />
          </div>
          <div className="md:col-span-1 xl:col-span-4">
            <AccountsTile index={1} />
          </div>

          <div className="md:col-span-1 xl:col-span-5">
            <SavingsWidget />
          </div>
          <div className="md:col-span-2 xl:col-span-7">
            <BudgetsPanel />
          </div>
        </div>

        <Link
          to="/retrospectiva"
          className="surface-panel group flex items-center gap-3 rounded-xl px-5 py-4 transition-colors hover:bg-accent/60"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkle className="size-4" weight="duotone" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Sua retrospectiva está pronta</p>
            <p className="text-xs text-muted-foreground">Veja o resumo do mês e do ano — maior categoria, maior gasto, e mais.</p>
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" weight="bold" />
        </Link>
      </div>
    </AppLayout>
  )
}
