import { Landmark, Link2, RefreshCw, Unlink } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useBankConnections } from '@/features/bank-sync/hooks/useBankConnections'
import { useConnectBank, useDisconnectBankConnection, useSyncBankConnection } from '@/features/bank-sync/hooks/useBankSync'

function formatSyncedAt(isoDate: string | null): string {
  if (!isoDate) return 'Nunca sincronizado'
  return `Sincronizado ${new Date(isoDate).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
}

export function BankConnectionsPanel() {
  const { data: connections = [], isLoading } = useBankConnections()
  const connectBank = useConnectBank()
  const syncConnection = useSyncBankConnection()
  const disconnectConnection = useDisconnectBankConnection()

  return (
    <Card className="border border-white/10 bg-black/40 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="size-4 text-primary" />
          Open Finance
        </CardTitle>
        <CardDescription>Conecte seus bancos para importar contas e transações automaticamente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isLoading &&
          connections.map((connection) => (
            <div
              key={connection.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                {connection.connector_image_url ? (
                  <img
                    src={connection.connector_image_url}
                    alt=""
                    className="size-8 shrink-0 rounded-full bg-white/5 object-contain p-1"
                  />
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Landmark className="size-4" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{connection.connector_name}</p>
                  <p className="text-xs text-zinc-400">{formatSyncedAt(connection.last_synced_at)}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Sincronizar agora"
                  disabled={syncConnection.isPending}
                  onClick={() => syncConnection.mutate(connection.pluggy_item_id)}
                >
                  <RefreshCw className={syncConnection.isPending ? 'size-4 animate-spin' : 'size-4'} />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Desconectar banco"
                      className="text-zinc-500 hover:text-destructive"
                    >
                      <Unlink className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Desconectar "{connection.connector_name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        As contas e transações já importadas continuam no histórico, mas param de ser atualizadas
                        automaticamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => disconnectConnection.mutate(connection.id)}>
                        Desconectar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}

        <Button
          type="button"
          variant="outline"
          className="w-full gap-1.5"
          disabled={connectBank.isPending}
          onClick={() => connectBank.mutate()}
        >
          <Link2 className="size-4" />
          {connectBank.isPending ? 'Conectando...' : 'Conectar banco'}
        </Button>
      </CardContent>
    </Card>
  )
}
