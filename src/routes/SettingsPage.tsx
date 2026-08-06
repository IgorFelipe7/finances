import { Bell, LogOut, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import {
  useDisablePushNotifications,
  useEnablePushNotifications,
  usePushSubscriptionStatus,
} from '@/features/settings/hooks/usePushSubscription'
import { useUIPreferencesStore } from '@/features/settings/store/useUIPreferencesStore'
import { isPushSupported } from '@/lib/pushNotifications'

function initialsFor(email: string) {
  return email.slice(0, 2).toUpperCase()
}

function formatMemberSince(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const reduceMotion = useUIPreferencesStore((state) => state.reduceMotion)
  const setReduceMotion = useUIPreferencesStore((state) => state.setReduceMotion)
  const confirmAiTransactions = useUIPreferencesStore((state) => state.confirmAiTransactions)
  const setConfirmAiTransactions = useUIPreferencesStore((state) => state.setConfirmAiTransactions)
  const { data: pushEnabled = false, isLoading: pushStatusLoading } = usePushSubscriptionStatus()
  const enablePush = useEnablePushNotifications()
  const disablePush = useDisablePushNotifications()
  const pushSupported = isPushSupported()

  const email = user?.email ?? ''

  function handlePushToggle(checked: boolean) {
    if (checked) enablePush.mutate()
    else disablePush.mutate()
  }

  return (
    <AppLayout title="Configurações">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border border-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Dados da sua conta, gerenciados pelo Supabase Auth.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary ring-1 ring-primary/20">
                {email ? initialsFor(email) : '?'}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                  <Mail className="size-3.5 shrink-0 text-zinc-400" />
                  {email}
                </p>
                {user?.created_at && (
                  <Badge variant="outline" className="text-xs text-zinc-400">
                    Membro desde {formatMemberSince(user.created_at)}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Preferências
            </CardTitle>
            <CardDescription>Ajustes de interface, salvos neste dispositivo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">Reduzir animações</p>
                <p className="text-xs text-muted-foreground">
                  Desativa as transições e efeitos de movimento em toda a interface.
                </p>
              </div>
              <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">Confirmar transações da IA</p>
                  <p className="text-xs text-muted-foreground">
                    {confirmAiTransactions
                      ? 'Mostra uma tela de revisão antes de salvar o que a IA entendeu do texto ou recibo.'
                      : 'Salva direto, sem revisão — mais rápido, mas confie no que a IA entendeu.'}
                  </p>
                </div>
              </div>
              <Switch checked={confirmAiTransactions} onCheckedChange={setConfirmAiTransactions} />
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <Bell className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">Notificações de contas</p>
                  <p className="text-xs text-muted-foreground">
                    {pushSupported
                      ? 'Receba um aviso quando uma conta fixa ou parcela vencer hoje.'
                      : 'Seu navegador não suporta notificações push.'}
                  </p>
                </div>
              </div>
              <Switch
                checked={pushEnabled}
                onCheckedChange={handlePushToggle}
                disabled={!pushSupported || pushStatusLoading || enablePush.isPending || disablePush.isPending}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-black/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Sessão</CardTitle>
            <CardDescription>Encerre sua sessão neste dispositivo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="gap-1.5" onClick={() => supabase.auth.signOut()}>
              <LogOut className="size-4" />
              Sair da conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
