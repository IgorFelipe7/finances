import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PluggyConnect } from 'pluggy-connect-sdk'
import { toast } from 'sonner'
import {
  disconnectBankConnection,
  getConnectToken,
  syncBankConnection,
} from '@/features/bank-sync/services/pluggyProxy.service'

function invalidateAfterSync(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['bank-connections'] })
  queryClient.invalidateQueries({ queryKey: ['accounts'] })
  queryClient.invalidateQueries({ queryKey: ['transactions'] })
}

/** Opens the Pluggy Connect widget, waits for the user to finish linking a bank, then imports it. */
export function useConnectBank() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { accessToken } = await getConnectToken()

      const itemId = await new Promise<string>((resolve, reject) => {
        let settled = false
        const connect = new PluggyConnect({
          connectToken: accessToken,
          includeSandbox: import.meta.env.DEV,
          onSuccess: ({ item }) => {
            if (settled) return
            settled = true
            resolve(item.id)
          },
          onError: (error) => {
            if (settled) return
            settled = true
            reject(new Error(error.message))
          },
          onClose: () => {
            if (settled) return
            settled = true
            reject(new Error('Conexão cancelada.'))
          },
        })
        connect.init()
      })

      return syncBankConnection(itemId)
    },
    onSuccess: (result) => {
      invalidateAfterSync(queryClient)
      toast.success(
        `Banco conectado! ${result.accountsImported} conta(s) e ${result.transactionsImported} transação(ões) importadas.`,
      )
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível conectar o banco.')
    },
  })
}

export function useSyncBankConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pluggyItemId: string) => syncBankConnection(pluggyItemId),
    onSuccess: (result) => {
      invalidateAfterSync(queryClient)
      toast.success(`Sincronizado! ${result.transactionsImported} transação(ões) atualizadas.`)
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível sincronizar.')
    },
  })
}

export function useDisconnectBankConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (connectionId: string) => disconnectBankConnection(connectionId),
    onSuccess: () => {
      invalidateAfterSync(queryClient)
      toast.success('Banco desconectado.')
    },
    onError: (error) => {
      toast.error(error.message || 'Não foi possível desconectar.')
    },
  })
}
