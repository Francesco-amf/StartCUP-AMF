'use client'

import { useState, useMemo } from 'react'

interface AccordionItemProps {
  id: string
  title: string
  icon: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

interface AccordionProps {
  items: AccordionItemProps[]
  allowMultipleOpen?: boolean
}

export function AccordionItem({ id, title, icon, children, defaultOpen = false, className = '' }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden ${className}`}>
      {/* Header do Accordion */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between hover:bg-[#0A1E47]/40 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl md:text-2xl">{icon}</span>
          <h3 className="text-base md:text-lg font-bold text-[#00E5FF] group-hover:text-[#00FF88] transition-colors">
            {title}
          </h3>
        </div>
        <div className={`transform transition-transform duration-300 text-[#00E5FF] text-xl md:text-2xl ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {/* Conteúdo do Accordion */}
      {isOpen && (
        <div className="px-4 md:px-6 py-4 md:py-5 border-t border-[#00E5FF]/20 bg-[#0A1E47]/30">
          {children}
        </div>
      )}
    </div>
  )
}

export function Accordion({ items, allowMultipleOpen = true }: AccordionProps) {
  // Usar useMemo para evitar que openItems seja recalculado a cada render
  const defaultOpenIds = useMemo(
    () => new Set(items.filter(item => item.defaultOpen).map(item => item.id)),
    [items]
  )

  const [openItems, setOpenItems] = useState<Set<string>>(defaultOpenIds)

  const handleToggle = (id: string) => {
    const newOpen = new Set(openItems)
    if (newOpen.has(id)) {
      newOpen.delete(id)
    } else {
      if (!allowMultipleOpen) {
        newOpen.clear()
      }
      newOpen.add(id)
    }
    setOpenItems(newOpen)
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={`bg-gradient-to-br from-[#0A1E47]/60 to-[#001A4D]/60 border-2 border-[#00E5FF]/40 rounded-lg overflow-hidden ${item.className || ''}`}
        >
          {/* Header do Accordion */}
          <button
            onClick={() => handleToggle(item.id)}
            className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between hover:bg-[#0A1E47]/40 transition-colors group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-xl md:text-2xl flex-shrink-0">{item.icon}</span>
              <h3 className="text-base md:text-lg font-bold text-[#00E5FF] group-hover:text-[#00FF88] transition-colors text-left truncate">
                {item.title}
              </h3>
            </div>
            <div className={`transform transition-transform duration-300 text-[#00E5FF] text-xl md:text-2xl flex-shrink-0 ml-2 ${openItems.has(item.id) ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </button>

          {/* Conteúdo do Accordion */}
          {openItems.has(item.id) && (
            <div className="px-4 md:px-6 py-4 md:py-5 border-t border-[#00E5FF]/20 bg-[#0A1E47]/30 animate-in slide-in-from-top-2 duration-300">
              {item.children}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
