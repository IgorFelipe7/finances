import type { ReactNode } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopNav } from '@/components/layout/TopNav'
import { AssistantLauncher } from '@/features/assistant/components/AssistantLauncher'
import { AssistantPanel } from '@/features/assistant/components/AssistantPanel'
import { CommandPalette } from '@/features/command-palette/components/CommandPalette'
import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard'

interface AppLayoutProps {
  title: string
  /** Pages that open with their own headline (the dashboard greeting) suppress the h1. */
  hideTitle?: boolean
  children: ReactNode
}

export function AppLayout({ title, hideTitle = false, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <TopNav />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-24 md:px-6 md:pb-8">
        {!hideTitle && <h1 className="mb-5 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>}
        {children}
      </main>

      <BottomNav />
      <AssistantLauncher />
      <AssistantPanel />
      <OnboardingWizard />
      <CommandPalette />
    </div>
  )
}
