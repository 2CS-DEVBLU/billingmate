"use client"

import { useChat } from "ai/react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BarChart3, X, Send, Loader2, Sparkles, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"

const SUGGESTED_PROMPTS_PT = [
  "Qual meu gasto total este mes?",
  "Quais recursos estao mais caros?",
  "Como posso reduzir meus custos?",
  "Compare meus provedores cloud",
]

const SUGGESTED_PROMPTS_EN = [
  "What's my total spend this month?",
  "Which resources cost the most?",
  "How can I reduce my costs?",
  "Compare my cloud providers",
]

const SUGGESTED_PROMPTS_ES = [
  "Cual es mi gasto total este mes?",
  "Que recursos cuestan mas?",
  "Como puedo reducir mis costos?",
  "Compara mis proveedores cloud",
]

export function AiChat() {
  const [open, setOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { locale } = useI18n()

  const suggestedPrompts = locale === "pt-BR" ? SUGGESTED_PROMPTS_PT : locale === "es" ? SUGGESTED_PROMPTS_ES : SUGGESTED_PROMPTS_EN

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: "/api/ai/chat",
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[560px] rounded-2xl border border-white/[0.08] bg-[#0e0e1a] shadow-2xl shadow-black/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">FinOps AI</span>
            <span className="text-[10px] text-slate-500 ml-2">by Grok</span>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="text-center py-4">
              <Sparkles className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                {locale === "pt-BR" ? "Pergunte sobre seus custos cloud" : locale === "es" ? "Pregunta sobre tus costos cloud" : "Ask about your cloud costs"}
              </p>
            </div>
            <div className="space-y-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt)
                  }}
                  className="w-full text-left text-xs text-slate-400 px-3 py-2 rounded-lg border border-white/[0.06] hover:border-indigo-500/30 hover:text-indigo-300 hover:bg-indigo-500/5 transition-all"
                >
                  <MessageSquare className="h-3 w-3 inline mr-2" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-indigo-500/20 text-indigo-100 border border-indigo-500/20"
                  : "bg-white/[0.03] text-slate-300 border border-white/[0.06]"
              )}
            >
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
              <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={locale === "pt-BR" ? "Pergunte algo..." : locale === "es" ? "Pregunta algo..." : "Ask something..."}
            className="flex-1 h-9 text-sm bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-indigo-500/50"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !input.trim()}
            className="h-9 w-9 p-0 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
