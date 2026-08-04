import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Topbar } from '@/components/layout/Topbar'
import { AssistantLauncher } from '@/features/assistant/components/AssistantLauncher'
import { AssistantPanel } from '@/features/assistant/components/AssistantPanel'
import { CommandPalette } from '@/features/command-palette/components/CommandPalette'
import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard'

interface AppLayoutProps {
  title: string
  children: ReactNode
}

export function AppLayout({ title, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">{children}</main>
      </div>

      <BottomNav />
      <AssistantLauncher />
      <AssistantPanel />
      <OnboardingWizard />
      <CommandPalette />
    </div>
  )
}
