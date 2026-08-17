import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { COMMANDS, type Command } from '@/features/command-palette/commands'
import { useCommandPaletteStore } from '@/features/command-palette/store/useCommandPaletteStore'
import { useAssistantStore } from '@/features/assistant/store/useAssistantStore'
import { cn } from '@/lib/utils'

export function CommandPalette() {
  const isOpen = useCommandPaletteStore((state) => state.isOpen)
  const closePalette = useCommandPaletteStore((state) => state.close)
  const toggle = useCommandPaletteStore((state) => state.toggle)

  const openAssistant = useAssistantStore((state) => state.open)

  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COMMANDS
    return COMMANDS.filter((command) => command.label.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    function handleGlobalKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [toggle])

  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setHighlighted(0)
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [isOpen])

  useEffect(() => {
    setHighlighted(0)
  }, [query])

  function runCommand(command: Command) {
    closePalette()
    switch (command.action.type) {
      case 'navigate':
        navigate(command.action.href)
        break
      case 'open-assistant':
        openAssistant()
        break
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      closePalette()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((prev) => Math.max(prev - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const command = filtered[highlighted]
      if (command) runCommand(command)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-background/70 p-4 pt-[15vh] backdrop-blur-sm"
          onClick={closePalette}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={(event) => event.stopPropagation()}
            className="glass-panel w-full max-w-lg overflow-hidden rounded-xl"
          >
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <MagnifyingGlass className="size-4 shrink-0 text-muted-foreground" weight="bold" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar ou navegar..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">Esc</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">Nada encontrado.</p>
              ) : (
                filtered.map((command, index) => (
                  <button
                    key={command.id}
                    type="button"
                    onClick={() => runCommand(command)}
                    onMouseEnter={() => setHighlighted(index)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                      index === highlighted ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <command.icon className="size-4 shrink-0" />
                    {command.label}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
