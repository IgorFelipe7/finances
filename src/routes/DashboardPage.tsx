import { AppLayout } from '@/components/layout/AppLayout'
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
      </div>
    </AppLayout>
  )
}
