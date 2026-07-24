"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Loader2, Sparkles, TerminalSquare } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export function PromptGenerator({ projectId, token, initialPrompts }: { projectId: string, token: string, initialPrompts: any[] }) {
  const router = useRouter()
  const [prompts, setPrompts] = useState(initialPrompts)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isGenerating && (!prompts || prompts.length === 0)) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/projects/${projectId}/prompts`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            if (data && data.length > 0) {
              setPrompts(data)
              setIsGenerating(false)
              router.refresh()
            }
          }
        } catch (e) {
          // ignore
        }
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [isGenerating, prompts, projectId, token, router])

  const handleGenerate = async () => {
    setIsGenerating(true)
    await fetch(`${API_BASE_URL}/projects/${projectId}/prompts/generate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!prompts || prompts.length === 0) {
    return (
      <div className="relative rounded-2xl glass-card p-10 flex flex-col items-center text-center mt-12 overflow-hidden border-t-emerald-500/20 border-t-2">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
            <TerminalSquare className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">Generate Implementation Prompts</h3>
          <p className="text-sm text-zinc-300 mb-8 max-w-md leading-relaxed">
            Break this architecture down into actionable, phase-by-phase prompts for AI coding agents like Cursor, Windsurf, or Claude.
          </p>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="group relative flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            <div className="relative flex items-center gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Prompts...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Prompts
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-12 space-y-8 relative">
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-lg h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <TerminalSquare className="h-7 w-7 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          Implementation Prompts
        </h2>
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
          {prompts.length} Phases Generated
        </span>
      </div>

      <div className="space-y-8">
        {prompts.map((prompt: any, index: number) => (
          <div key={prompt.id} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative rounded-2xl glass-card overflow-hidden">
              <div className="flex items-center justify-between bg-zinc-900/80 backdrop-blur-md px-6 py-4 border-b border-zinc-800/50">
                <h3 className="font-semibold text-white flex items-center gap-3 text-lg">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-400 text-sm border border-emerald-500/20 shadow-inner">
                    {prompt.order}
                  </span>
                  {prompt.title}
                </h3>
                <button
                  onClick={() => handleCopy(prompt.id, prompt.content)}
                  className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-emerald-600 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]"
                >
                  {copiedId === prompt.id ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-300" />
                      <span className="text-emerald-50">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Prompt
                    </>
                  )}
                </button>
              </div>
              <div className="p-6 bg-zinc-950/80 overflow-x-auto custom-scrollbar relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMikiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>
                <pre className="relative z-10 text-sm text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {prompt.content}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
