import { useMemo, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { TransactionFormDialog } from '@/features/transactions/components/TransactionFormDialog'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { parseTransactionText } from '@/features/transactions/services/ai.service'
import type { TransactionFormInput } from '@/features/transactions/schemas/transaction.schema'

export function SmartInput() {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [initialValues, setInitialValues] = useState<Partial<TransactionFormInput>>()
  const { data: accounts = [] } = useAccounts()
  const { data: transactions = [] } = useTransactions()

  const existingCategories = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category).filter((c): c is string => !!c))).sort(),
    [transactions],
  )

  async function handleSubmit() {
    const text = value.trim()
    if (!text || isLoading) return

    setIsLoading(true)
    try {
      const result = await parseTransactionText(text, accounts, existingCategories)
      console.log('[SmartInput] Transação interpretada pela IA:', result)

      const isFixed = result.is_fixed && result.transaction_type !== 'transfer'

      setInitialValues({
        transaction_type: result.transaction_type,
        title: result.title,
        amount: result.amount,
        account_id: result.account_id,
        destination_account_id: result.destination_account_id,
        category: result.category,
        date: result.date,
        repeat_mode: isFixed ? 'fixed' : 'none',
      })
      setReviewOpen(true)
      setValue('')
    } catch (error) {
      console.error('[SmartInput] Falha ao processar transação:', error)
      toast.error(error instanceof Error ? error.message : 'Não consegui processar essa transação.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="glass-panel flex items-center gap-3 rounded-xl px-4 py-3">
        {isLoading ? (
          <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
        ) : (
          <Sparkles className="size-5 shrink-0 text-primary" />
        )}
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSubmit()
          }}
          disabled={isLoading}
          placeholder="Ex: Paguei 80 de pizza no Nubank..."
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-zinc-400 disabled:opacity-50"
        />
      </div>

      {initialValues && (
        <TransactionFormDialog
          trigger={null}
          open={reviewOpen}
          onOpenChange={(next) => {
            setReviewOpen(next)
            if (!next) setInitialValues(undefined)
          }}
          initialValues={initialValues}
        />
      )}
    </>
  )
}
