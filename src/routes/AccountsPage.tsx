import { Wallet } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { AccountCard } from '@/features/accounts/components/AccountCard'
import { AccountFormDialog } from '@/features/accounts/components/AccountFormDialog'
import { useAccountBalances } from '@/features/accounts/hooks/useAccountBalances'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { BankConnectionsPanel } from '@/features/bank-sync/components/BankConnectionsPanel'
import { formatCurrency } from '@/lib/currency'

export function AccountsPage() {
  const { isLoading } = useAccounts()
  const { accountBalances, netWorth } = useAccountBalances()

  return (
    <AppLayout title="Contas">
      <div className="space-y-6">
        <div className="glass-panel flex flex-col gap-4 rounded-xl p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">Patrimônio total</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{formatCurrency(netWorth)}</p>
          </div>
          <AccountFormDialog />
        </div>

        <BankConnectionsPanel />

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-panel h-32 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : accountBalances.length === 0 ? (
          <div className="glass-panel flex flex-col items-center justify-center gap-3 rounded-xl p-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="size-6 text-primary" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Nenhuma conta cadastrada</p>
              <p className="mt-1 text-sm text-zinc-400">
                Adicione seu primeiro banco, carteira ou cartão para começar a acompanhar seus saldos.
              </p>
            </div>
            <AccountFormDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accountBalances.map(({ account, balance }, index) => (
              <AccountCard key={account.id} account={account} balance={balance} index={index} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
