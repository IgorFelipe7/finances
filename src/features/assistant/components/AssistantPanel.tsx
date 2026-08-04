import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Eraser, MessageCircleQuestion, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useFinancialSnapshot } from '@/features/dashboard/hooks/useFinancialSnapshot'
import { streamAssistantReply } from '@/features/assistant/services/chat.service'
import { useAssistantStore } from '@/features/assistant/store/useAssistantStore'
import type { ChatMessage } from '@/features/assistant/types'
import { hasOpenAIKey } from '@/lib/openai'
import { cn } from '@/lib/utils'

const SUGGESTED_PROMPTS = [
  'Quanto posso gastar hoje?',
  'Tem conta pra pagar essa semana?',
  'Como tá meu mês até agora?',
  'Vou estourar o orçamento?',
]

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-zinc-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming: boolean }) {
  const isUser = message.role === 'user'
  const isEmpty = !isUser && message.content.length === 0

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm break-words whitespace-pre-wrap',
          isUser
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm border border-white/10 bg-white/[0.04] text-zinc-200',
        )}
      >
        {isEmpty && isStreaming ? <TypingDots /> : message.content}
      </div>
    </div>
  )
}

export function AssistantPanel() {
  const isOpen = useAssistantStore((state) => state.isOpen)
  const close = useAssistantStore((state) => state.close)
  const clear = useAssistantStore((state) => state.clear)
  const messages = useAssistantStore((state) => state.messages)
  const isStreaming = useAssistantStore((state) => state.isStreaming)
  const addMessage = useAssistantStore((state) => state.addMessage)
  const updateLastMessage = useAssistantStore((state) => state.updateLastMessage)
  const setStreaming = useAssistantStore((state) => state.setStreaming)

  const { snapshot } = useFinancialSnapshot()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const keyConfigured = hasOpenAIKey()

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isOpen])

  async function handleSend(rawText?: string) {
    const content = (rawText ?? input).trim()
    if (!content || isStreaming || !keyConfigured) return

    const priorMessages = useAssistantStore.getState().messages
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content }
    const history = [...priorMessages, userMessage]

    addMessage(userMessage)
    addMessage({ id: crypto.randomUUID(), role: 'assistant', content: '' })
    setInput('')
    setStreaming(true)

    try {
      let accumulated = ''
      for await (const delta of streamAssistantReply(history, snapshot)) {
        accumulated += delta
        updateLastMessage(accumulated)
      }
      if (!accumulated) updateLastMessage('Não consegui pensar em nada agora — tenta reformular a pergunta?')
    } catch (error) {
      updateLastMessage(
        error instanceof Error ? `Não consegui responder: ${error.message}` : 'Não consegui responder agora.',
      )
    } finally {
      setStreaming(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          className="glass-panel fixed inset-0 z-40 flex flex-col overflow-hidden sm:inset-auto sm:right-6 sm:bottom-24 sm:h-[600px] sm:w-[400px] sm:rounded-2xl"
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-5 shadow-lg shadow-primary/30">
              <Sparkles className="size-4 text-primary-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">Assistente Financeiro</p>
              <p className="truncate text-xs text-zinc-400">sabe seus números em tempo real</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-zinc-500 hover:text-foreground"
              onClick={clear}
              disabled={messages.length === 0 || isStreaming}
              aria-label="Limpar conversa"
            >
              <Eraser className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-zinc-500 hover:text-foreground"
              onClick={close}
              aria-label="Fechar assistente"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircleQuestion className="size-6 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Pergunte o que quiser</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Já sei suas contas, gastos e cobranças fixas. Pode perguntar direto.
                  </p>
                </div>
                <div className="grid w-full grid-cols-1 gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      disabled={!keyConfigured}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} isStreaming={isStreaming} />
              ))
            )}
          </div>

          <div className="shrink-0 border-t border-white/10 p-3">
            {!keyConfigured ? (
              <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-xs text-zinc-400">
                Configure <code className="text-zinc-300">VITE_OPENAI_API_KEY</code> no seu .env para conversar com o
                assistente.
              </p>
            ) : (
              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Ex: quanto posso gastar hoje?"
                  disabled={isStreaming}
                  className="max-h-28 min-h-10 flex-1 resize-none py-2"
                  rows={1}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={isStreaming || !input.trim()}
                  aria-label="Enviar mensagem"
                >
                  <ArrowUp className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
