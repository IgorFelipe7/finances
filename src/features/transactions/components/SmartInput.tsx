import { useMemo, useRef, useState } from 'react'
import { Camera, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { TransactionFormDialog } from '@/features/transactions/components/TransactionFormDialog'
import { useTransactions } from '@/features/transactions/hooks/useTransactions'
import { parseTransactionText } from '@/features/transactions/services/ai.service'
import { scanReceiptImage } from '@/features/transactions/services/receiptScanner.service'
import type { AiTransactionResult } from '@/features/transactions/schemas/ai-transaction.schema'
import type { TransactionFormInput } from '@/features/transactions/schemas/transaction.schema'
import { resizeImageToDataUrl } from '@/lib/resizeImage'

export function SmartInput() {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [initialValues, setInitialValues] = useState<Partial<TransactionFormInput>>()
  const { data: accounts = [] } = useAccounts()
  const { data: transactions = [] } = useTransactions()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const existingCategories = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category).filter((c): c is string => !!c))).sort(),
    [transactions],
  )

  function openReviewFrom(result: AiTransactionResult) {
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
  }

  async function handleSubmit() {
    const text = value.trim()
    if (!text || isLoading) return

    setIsLoading(true)
    try {
      const result = await parseTransactionText(text, accounts, existingCategories)
      console.log('[SmartInput] Transação interpretada pela IA:', result)
      openReviewFrom(result)
      setValue('')
    } catch (error) {
      console.error('[SmartInput] Falha ao processar transação:', error)
      toast.error(error instanceof Error ? error.message : 'Não consegui processar essa transação.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReceiptSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || isScanning) return

    setIsScanning(true)
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      const result = await scanReceiptImage(dataUrl, accounts, existingCategories)
      console.log('[SmartInput] Recibo interpretado pela IA:', result)

      if (result.amount <= 0.5 && result.title.toLowerCase().includes('não consegui')) {
        toast.error('Não consegui ler esse recibo. Tenta uma foto mais nítida?')
        return
      }

      openReviewFrom(result)
    } catch (error) {
      console.error('[SmartInput] Falha ao escanear recibo:', error)
      toast.error(error instanceof Error ? error.message : 'Não consegui processar essa imagem.')
    } finally {
      setIsScanning(false)
    }
  }

  const busy = isLoading || isScanning

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
          disabled={busy}
          placeholder="Ex: Paguei 80 de pizza no Nubank..."
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-zinc-400 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          aria-label="Escanear recibo com a câmera"
          title="Escanear recibo"
          className="shrink-0 text-zinc-400 transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-50"
        >
          {isScanning ? <Loader2 className="size-5 animate-spin text-primary" /> : <Camera className="size-5" />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleReceiptSelected}
          className="hidden"
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
